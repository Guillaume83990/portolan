'use server';
// Actions de l'espace directeur. Toutes passent par la session de la personne connectée : la base vérifie
// le rôle (directeur) et refuse tout au compte de démonstration. Après chaque écriture, les pages se rechargent.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { ErreurAffichable, messageErreur, type Resultat } from '@/lib/erreurs';
import type { Fiche, Yacht } from '@/lib/yachts';
import { stripe, stripeDisponible } from '@/lib/paiement/stripe';
import { adminDisponible, supabaseAdmin } from '@/lib/supabase/admin';
import { lancerTraitement } from '@/lib/evenements/lancer';

const rafraichir = () => revalidatePath('/direction', 'layout');

type Session = Awaited<ReturnType<typeof supabaseServeur>>;

// Toute action qui écrit, appelle Stripe, envoie un e-mail ou utilise la clé secrète exige le rôle « directeur »,
// vérifié ici avant tout le reste (les actions serveur sont appelables directement : la page ne protège rien).
async function exigerDirecteur(sb: Session) {
  const { data: { user } } = await sb.auth.getUser();
  const { data: p } = user ? await sb.from('profils').select('role').eq('id', user.id).maybeSingle() : { data: null };
  if (p?.role === 'demo') throw new ErreurAffichable('Lecture seule en démonstration.');
  if (p?.role !== 'directeur') throw new ErreurAffichable('Action réservée à la direction.');
}

async function executer<T = undefined>(fn: (sb: Session) => Promise<T>, message?: string): Promise<Resultat<T>> {
  try {
    const sb = await supabaseServeur();
    await exigerDirecteur(sb);
    const donnees = await fn(sb);
    rafraichir();
    lancerTraitement(); // e-mails et documents des étapes franchies (après la réponse)
    return { ok: true, donnees, message };
  } catch (e) {
    return { ok: false, erreur: messageErreur(e) };
  }
}
const verifier = <T,>({ data, error }: { data: T; error: unknown }) => { if (error) throw error; return data; };

export async function deconnexion() {
  const sb = await supabaseServeur();
  await sb.auth.signOut();
  redirect('/direction/connexion');
}

// ------------------------------------------------------------------------------------------
// Recherche globale : clients, réservations, yachts
// ------------------------------------------------------------------------------------------
export async function rechercher(q: string) {
  const t = q.trim().toLowerCase();
  if (t.length < 2) return { clients: [], reservations: [], yachts: [] };
  const sb = await supabaseServeur();
  const [{ data: c }, { data: r }, { data: y }] = await Promise.all([
    sb.rpc('dir_clients'), sb.rpc('dir_reservations'), sb.from('yachts').select('slug, nom, fiche').order('ordre'),
  ]);
  const has = (...v: (string | null | undefined)[]) => v.some((x) => (x ?? '').toLowerCase().includes(t));
  return {
    clients: ((c ?? []) as { id: string; prenom: string; nom: string; email: string; reservations: number }[])
      .filter((x) => has(x.prenom, x.nom, `${x.prenom} ${x.nom}`, x.email)).slice(0, 5),
    reservations: ((r ?? []) as { id: string; reference: string; yacht_nom: string; client_nom: string; debut: string; fin: string; statut: string; type: string }[])
      .filter((x) => has(x.reference, x.client_nom, x.yacht_nom)).slice(0, 6),
    yachts: ((y ?? []) as { slug: string; nom: string; fiche: Fiche }[]).filter((x) => has(x.nom, x.fiche?.chantier)).slice(0, 4),
  };
}

// ------------------------------------------------------------------------------------------
// Réservations
// ------------------------------------------------------------------------------------------
export const validerReservation = async (id: string, mot: string) =>
  executer(async (sb) => verifier(await sb.rpc('valider_reservation', { p_id: id, p_mot: mot })));

export const refuserReservation = async (id: string, motif: string) =>
  executer(async (sb) => { if (!motif.trim()) throw new Error('motif_obligatoire'); verifier(await sb.rpc('decider_reservation', { p_id: id, p_decision: 'refusee', p_note: motif })); });

export const prolongerOption = async (id: string, heures: number) =>
  executer(async (sb) => verifier(await sb.rpc('prolonger_option', { p_id: id, p_heures: heures })));

export const noterReservation = async (id: string, texte: string) =>
  executer(async (sb) => verifier(await sb.rpc('noter_reservation', { p_id: id, p_texte: texte })));

export const marquerPaiement = async (id: string, type: string, montant: number, methode: string, date: string, justificatif: string) =>
  executer(async (sb) => verifier(await sb.rpc('marquer_paiement', {
    p_id: id, p_type: type, p_montant: Math.round(montant), p_methode: methode, p_le: date || null, p_justificatif: justificatif,
  })));

// Annuler (et rembourser) : le remboursement par carte ou virement Stripe passe par Stripe (mode test en démonstration).
// « Prévenir le client » décide de l'envoi des e-mails d'annulation et de remboursement.
export async function annulerReservation(id: string, motif: string, rembourser: number, prevenir: boolean) {
  return executer(async (sb) => {
    if (rembourser > 0) {
      const { data: pay } = await sb.from('paiements').select('id, montant, rembourse, methode, stripe_payment_intent')
        .eq('reservation', id).eq('statut', 'paye').order('paye_le', { ascending: false });
      let reste = rembourser;
      for (const p of pay ?? []) {
        if (reste <= 0) break;
        const part = Math.min(reste, p.montant - p.rembourse);
        if (p.stripe_payment_intent && stripeDisponible()) await stripe().refunds.create({ payment_intent: p.stripe_payment_intent, amount: part * 100 });
        reste -= part;
      }
      verifier(await sb.rpc('enregistrer_remboursement', { p_id: id, p_montant: Math.round(rembourser) }));
    }
    verifier(await sb.rpc('decider_reservation', { p_id: id, p_decision: 'annulee', p_note: motif }));
    if (!prevenir && adminDisponible()) {
      await supabaseAdmin().from('evenements').update({ traite_le: new Date().toISOString(), erreur: 'Client non prévenu (choix de la direction)' })
        .eq('reservation', id).in('type', ['annulation', 'remboursement']).is('traite_le', null);
      verifier(await sb.rpc('noter_reservation', { p_id: id, p_texte: 'Annulation sans e-mail au client (choix de la direction)' }));
    }
  });
}

export const enregistrerNotes = async (id: string, noteInterne: string, mot: string) =>
  executer(async (sb) => verifier(await sb.from('reservations').update({ note_interne: noteInterne, note_directeur: mot }).eq('id', id)), 'Notes enregistrées');

export async function bloquerDates(yacht: string, debut: string, fin: string, motif: string, note: string) {
  return executer(async (sb) => {
    if (!debut || !fin || fin <= debut) throw new ErreurAffichable('Choisissez une date de fin après la date de début.');
    const nuits = Math.round((Date.parse(fin) - Date.parse(debut)) / 86_400_000);
    verifier(await sb.from('reservations').insert({ yacht, type: 'blocage', debut, fin, statut: 'confirmee', motif, note_interne: note, nuits }));
  });
}
export const libererBlocage = async (id: string) =>
  executer(async (sb) => verifier(await sb.from('reservations').delete().eq('id', id).eq('type', 'blocage')));

// Chevauchement avant d'enregistrer un blocage (pour prévenir dans la boîte de dialogue)
export async function chevauchement(yacht: string, debut: string, fin: string) {
  if (!debut || !fin || fin <= debut) return null;
  const sb = await supabaseServeur();
  const { data } = await sb.from('reservations').select('reference, debut, fin, type')
    .eq('yacht', yacht).in('statut', ['en_attente', 'a_payer', 'confirmee', 'soldee']).lt('debut', fin).gt('fin', debut).limit(1);
  return data?.[0] ?? null;
}

// ------------------------------------------------------------------------------------------
// Demandes et notes
// ------------------------------------------------------------------------------------------
export const changerStatutDemande = async (id: string, statut: string) =>
  executer(async (sb) => verifier(await sb.from('demandes').update({ statut, traitee: statut !== 'nouvelle' }).eq('id', id)));

export async function ajouterNote(cible: 'client' | 'demande' | 'reservation', id: string, texte: string) {
  return executer(async (sb) => {
    if (!texte.trim()) throw new ErreurAffichable('Note vide');
    const { data: { user } } = await sb.auth.getUser();
    const { data: p } = await sb.from('profils').select('prenom').eq('id', user!.id).single();
    verifier(await sb.from('notes').insert({ cible, cible_id: id, texte: texte.trim(), auteur: p?.prenom ?? '' }));
  });
}

export const desinscrire = async (id: string) => executer(async (sb) => verifier(await sb.from('inscriptions').delete().eq('id', id)));

// ------------------------------------------------------------------------------------------
// Yachts
// ------------------------------------------------------------------------------------------
const slugifier = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function creerYacht(nom: string, chantier: string, longueur: number, vente: boolean, location: boolean) {
  const r = await executer(async (sb) => {
    if (!nom.trim()) throw new ErreurAffichable('Indiquez le nom du yacht.');
    const slug = slugifier(nom);
    const { data: dernier } = await sb.from('yachts').select('ordre').order('ordre', { ascending: false }).limit(1);
    verifier(await sb.from('yachts').insert({
      slug, nom: nom.trim(), ordre: (dernier?.[0]?.ordre ?? 0) + 1, publie: false, invites: 8, port: 'Saint-Tropez',
      vente: vente ? 1_000_000 : null, location_basse: location ? 50_000 : null, location_haute: location ? 60_000 : null,
      fiche: { chantier, chantierCourt: chantier, longueur, type: 'moteur', description: [''], points: [], ponts: [], galerie: [] },
    }));
    return slug;
  });
  if (r.ok) redirect(`/direction/yachts/${r.donnees}?nouveau=1`);
  return r;
}

export async function dupliquerYacht(slug: string) {
  return executer(async (sb) => {
    const { data: y } = await sb.from('yachts').select('*').eq('slug', slug).single<Yacht>();
    if (!y) throw new ErreurAffichable('Yacht introuvable');
    let nouveau = `${slug}-copie`, i = 2;
    while ((await sb.from('yachts').select('slug').eq('slug', nouveau)).data?.length) nouveau = `${slug}-copie-${i++}`;
    const reste: Partial<Yacht> = { ...y };
    delete reste.modifie_le;
    verifier(await sb.from('yachts').insert({ ...reste, slug: nouveau, nom: `${y.nom} (copie)`.slice(0, 60), publie: false, mis_en_avant: false, ordre: y.ordre + 1 }));
  }, 'Yacht dupliqué en brouillon');
}

export const archiverYacht = async (slug: string, archive: boolean) =>
  executer(async (sb) => verifier(await sb.from('yachts').update({ archive, publie: archive ? false : undefined }).eq('slug', slug)));

export async function supprimerYacht(slug: string) {
  return executer(async (sb) => {
    const { count } = await sb.from('reservations').select('id', { count: 'exact', head: true }).eq('yacht', slug);
    if (count) throw new ErreurAffichable(`Impossible : ce yacht a ${count} réservation${count > 1 ? 's' : ''}. Archivez-le plutôt.`);
    const { data: fichiers } = await sb.storage.from('yachts').list(slug);
    if (fichiers?.length) await sb.storage.from('yachts').remove(fichiers.map((f) => `${slug}/${f.name}`));
    verifier(await sb.from('yachts').delete().eq('slug', slug));
  });
}

export const reordonnerYachts = async (slugs: string[]) =>
  executer(async (sb) => { for (const [i, slug] of slugs.entries()) verifier(await sb.from('yachts').update({ ordre: i + 1 }).eq('slug', slug)); });

// Enregistrer un yacht : refus si quelqu'un l'a modifié depuis l'ouverture de l'éditeur (sauf « Écraser »)
export async function enregistrerYacht(slug: string, modif: Partial<Yacht>, ouvertLe: string, ecraser = false, photosRetirees: string[] = []) {
  try {
    const sb = await supabaseServeur();
    await exigerDirecteur(sb);
    const { data: actuel } = await sb.from('yachts').select('modifie_le').eq('slug', slug).single();
    if (!ecraser && actuel && new Date(actuel.modifie_le).getTime() > new Date(ouvertLe).getTime() + 1000) {
      return { ok: false as const, erreur: 'conflit', modifieLe: actuel.modifie_le as string };
    }
    const { data, error } = await sb.from('yachts').update(modif).eq('slug', slug).select('slug, modifie_le').single();
    if (error) throw error;
    // Suppression réelle des fichiers des photos retirées
    if (photosRetirees.length) {
      const chemins = photosRetirees.filter((s) => s.startsWith('supabase:')).flatMap((s) => [`${s.slice(9)}-900.webp`, `${s.slice(9)}-1600.webp`]);
      if (chemins.length) await sb.storage.from('yachts').remove(chemins);
    }
    rafraichir();
    return { ok: true as const, slug: data.slug as string, modifieLe: data.modifie_le as string };
  } catch (e) {
    return { ok: false as const, erreur: messageErreur(e) };
  }
}

// ------------------------------------------------------------------------------------------
// Réglages
// ------------------------------------------------------------------------------------------
export const enregistrerReglages = async (modif: Record<string, unknown>) =>
  executer(async (sb) => verifier(await sb.from('reglages').update(modif).eq('id', true)), 'Réglages enregistrés');

export async function nouvelleVersionContrat(version: string, conditions: string) {
  return executer(async (sb) => {
    if (!/^v\d+(\.\d+)?$/.test(version)) throw new ErreurAffichable('Version au format v1.3');
    const du = new Date().toISOString().slice(0, 10);
    verifier(await sb.from('versions_contrat').insert({ version, du, conditions }));
    verifier(await sb.from('reglages').update({ contrat_version: version, contrat_conditions: conditions }).eq('id', true));
  }, 'Nouvelle version du contrat en vigueur');
}

// ------------------------------------------------------------------------------------------
// Traduction par l'IA (proposition à relire, jamais enregistrée directement)
// ------------------------------------------------------------------------------------------
export async function traduireIA(langue: 'en' | 'de' | 'it', champs: Record<string, string>) {
  try { await exigerDirecteur(await supabaseServeur()); } catch (e) { return { ok: false as const, erreur: messageErreur(e) }; }
  try {
    const { traduireChamps } = await import('@/lib/direction/traduction');
    return { ok: true as const, traductions: await traduireChamps(langue, champs) };
  } catch (e) {
    const m = e instanceof Error ? e.message : '';
    return { ok: false as const, erreur: m === 'cle_ia_manquante' ? 'Traduction par l’IA indisponible : ajoutez ANTHROPIC_API_KEY dans .env.local.' : 'La traduction n’a pas abouti. Réessayez dans un instant.' };
  }
}

// Lien de connexion envoyé au client (lien magique Supabase, sans créer de compte)
export async function renvoyerLienConnexion(email: string, captchaToken?: string) {
  try { await exigerDirecteur(await supabaseServeur()); } catch (e) { return { ok: false as const, erreur: messageErreur(e) }; }
  const { createClient } = await import('@supabase/supabase-js');
  const anonyme = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { error } = await anonyme.auth.signInWithOtp({ email, options: { captchaToken, shouldCreateUser: false, emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/fr/espace` } });
  return error ? { ok: false as const, erreur: /captcha/i.test(error.message) ? 'La vérification anti-robot n’a pas abouti. Réessayez.' : /rate|limit/i.test(error.message) ? 'Trop d’envois récents : réessayez dans une heure.' : 'Le lien n’a pas pu partir.' } : { ok: true as const };
}

// ------------------------------------------------------------------------------------------
// E-mails : relance de paiement à la demande, traitement immédiat de la file (boîte d'envoi)
// ------------------------------------------------------------------------------------------
export const relancerPaiement = async (id: string) =>
  executer(async (sb) => {
    verifier(await sb.rpc('noter_reservation', { p_id: id, p_texte: 'Relance de paiement demandée par la direction' }));
    const { relancerPaiement: relancer } = await import('@/lib/evenements/traiter');
    if (!(await relancer(id))) throw new ErreurAffichable('Aucun paiement à relancer pour cette réservation.');
  }, 'Relance envoyée au client');

export const traiterMaintenant = async () =>
  executer(async (sb) => {
    void sb; // rôle déjà vérifié par executer
    const { traiterEvenements, rattraperDocuments } = await import('@/lib/evenements/traiter');
    const r = await traiterEvenements(50);
    const d = await rattraperDocuments(6);
    return { ...r, documents: d };
  });
