// Traitement des événements émis par la base (migration 11) : documents PDF, e-mails au client et à la direction.
// Chaque événement relit l'état réel de la réservation : un rappel devenu inutile (déjà payé, annulé…) n'est pas envoyé.
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { assurerDocuments, documentsDus, genererDocument, type Document } from '@/lib/pdf/generer';
import { envoyer } from '@/lib/emails/envoi';
import { citer, emailClient, emailDirection, type NomModele } from '@/lib/emails/modeles';
import { textesEmail, type V } from '@/lib/emails/textes';
import type { Courtier } from '@/lib/emails/Gabarit';
import { cheminEspace, estLangue, pageSite } from '@/lib/i18n';
import { capitale, dateHeure, dateLongue, euros, heure, jourSemaine, jourSemaineCourt, plage, type Langue } from '@/lib/format';
import type { Fiche } from '@/lib/yachts';

type Evenement = { id: number; type: string; reservation: string | null; demande: string | null; inscription: string | null; donnees: Record<string, unknown> | null };
type Reglages = { courtier: Courtier & { email?: string }; notif_email: string; notif: { demande?: boolean; paiement?: boolean; non_traitee?: boolean }; taux_acompte: number; taux_apa: number };

const BASE = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100';
const TYPES_FORMULAIRE: Record<string, string> = { dossier: 'Demande de dossier', visite: 'Demande de visite', brochure: 'Brochure', contact: 'Contact', 'projet-acheter': "Projet d'achat", 'projet-louer': 'Projet de location', 'projet-vendre': 'Vente' };
const METHODES: Record<string, string> = { carte: 'carte', virement: 'virement', manuel: 'saisie manuelle' };

async function reglages(): Promise<Reglages> {
  const { data } = await supabaseAdmin().from('reglages').select('courtier, notif_email, notif, taux_acompte, taux_apa').limit(1).single();
  return data as Reglages;
}
const adresseDirection = (g: Reglages) => g.notif_email || g.courtier?.email || '';

// Tout ce qu'il faut pour écrire au client d'une réservation
async function contexte(reservationId: string) {
  const admin = supabaseAdmin();
  const { data: r } = await admin.from('reservations').select('*').eq('id', reservationId).maybeSingle();
  if (!r) return null;
  const [profil, yacht, g] = await Promise.all([
    r.client ? admin.from('profils').select('prenom, nom, email, langue').eq('id', r.client).maybeSingle().then((x) => x.data) : null,
    admin.from('yachts').select('nom, fiche').eq('slug', r.yacht).maybeSingle().then((x) => x.data),
    reglages(),
  ]);
  const l: Langue = estLangue(r.langue) ? r.langue : profil && estLangue(profil.langue) ? profil.langue : 'fr';
  const t = textesEmail[l].communs;
  const nom = yacht?.nom ?? r.yacht;
  const fiche = (yacht?.fiche ?? {}) as Fiche;
  const prenom = profil?.prenom || String(r.client_nom ?? '').split(/\s+/)[0] || '';
  const v: V = { prenom, yacht: nom, ref: r.reference, dates: `${plage(r.debut, r.fin, l)} ${r.fin.slice(0, 4)}`, courtier: g.courtier?.prenom || 'Portolan' };
  const enUneFois = r.solde === 0;
  const recap: [string, string][] = [
    [t.yacht, nom],
    [t.dates, `${v.dates} · ${t.nuits(r.nuits)}`],
    [t.embarquement, `${capitale(jourSemaineCourt(r.debut, l))}, ${heure(r.heure)}, ${r.port}`],
    ...(r.invites ? [[t.invites, String(r.invites)] as [string, string]] : []),
    [t.location, euros(r.montant, l)],
  ];
  const echeancier: [string, string][] = enUneFois || !r.acompte ? [] : [
    [`${t.acompte} (${g.taux_acompte} %)`, euros(r.acompte, l)],
    [t.soldeApa, `${euros(r.solde + r.apa, l)}${r.solde_du_le ? `, ${dateLongue(r.solde_du_le, l)}` : ''}`],
  ];
  const url = (sous = '') => BASE() + cheminEspace(l, sous ? `reservations/${r.reference}/${sous}` : `reservations/${r.reference}`);
  return {
    r, l, t, g, v, recap, echeancier, url, nom,
    email: (profil?.email ?? r.client_email) as string,
    photo: fiche.image?.src ? { src: fiche.image.src, alt: fiche.image.alt ?? nom } : null,
    mot: r.note_directeur ? { texte: citer(r.note_directeur, l), auteur: g.courtier?.prenom || 'Portolan' } : undefined,
    clientNom: [profil?.prenom, profil?.nom].filter(Boolean).join(' ') || r.client_nom,
  };
}
type Ctx = NonNullable<Awaited<ReturnType<typeof contexte>>>;

async function auClient(c: Ctx, e: Evenement, nom: NomModele, o: { v?: Partial<V>; recap?: [string, string][]; url?: string; pieces?: Document[]; photo?: boolean; mot?: boolean; coordonnees?: [string, string][] }) {
  if (!c.email) return;
  const m = emailClient(nom, c.l, {
    v: { ...c.v, ...o.v }, recap: o.recap, url: o.url, mot: o.mot ? c.mot : undefined, coordonnees: o.coordonnees,
    pieces: o.pieces?.map((d) => textesEmail[c.l].communs.piecesNoms[d.type]), photo: o.photo ? c.photo : null, courtier: c.g.courtier,
  });
  await envoyer({ pour: 'client', destinataire: c.email, langue: c.l, modele: nom, ...m, reservation: c.r.id, evenement: e.id || null, pieces: o.pieces, repondreA: c.g.courtier?.email });
}

async function aLaDirection(g: Reglages, e: Evenement, reservation: string | null, o: Parameters<typeof emailDirection>[0]) {
  const a = adresseDirection(g);
  if (!a) return;
  const m = emailDirection(o);
  await envoyer({ pour: 'direction', destinataire: a, langue: 'fr', modele: e.type, ...m, reservation, evenement: e.id || null });
}

const recapDirection = (c: Ctx): [string, string][] => [
  ['Client', `${c.clientNom} · ${c.email}`], ['Yacht', c.nom], ['Dates', `${plage(c.r.debut, c.r.fin)} ${c.r.fin.slice(0, 4)} · ${c.r.nuits} nuits`],
  ['Embarquement', `${capitale(jourSemaineCourt(c.r.debut))}, ${heure(c.r.heure)}, ${c.r.port}`], ['Invités', String(c.r.invites ?? '—')], ['Location', euros(c.r.montant)],
];

async function traiterReservation(e: Evenement) {
  const c = await contexte(e.reservation!);
  if (!c) return;
  const { r, l, g } = c;
  const echeance = r.expire_le ? dateHeure(r.expire_le, l) : '';
  const aRegler = r.solde === 0 ? r.montant + r.apa : r.acompte;

  switch (e.type) {
    case 'demande_recue':
      await auClient(c, e, 'demande_recue', { recap: [...c.recap, ...c.echeancier], url: c.url() });
      if (g.notif?.demande !== false) await aLaDirection(g, e, r.id, {
        objet: `Nouvelle demande · ${c.nom} · ${plage(r.debut, r.fin)} · ${c.clientNom}`, kicker: `Demande ${r.reference}`, titre: 'Nouvelle demande de réservation',
        paragraphes: [r.expire_le ? `Expire automatiquement ${dateHeure(r.expire_le)} sans réponse.` : 'À traiter rapidement.', ...(r.message ? [`Message du client : « ${r.message} »`] : [])],
        recap: recapDirection(c),
        boutons: [{ libelle: 'Valider', chemin: `/direction/reservations?ref=${r.reference}&action=valider` }, { libelle: 'Ouvrir la réservation', chemin: `/direction/reservations?ref=${r.reference}&filtre=toutes` }],
      });
      return;
    case 'demande_validee':
      if (r.statut !== 'a_payer') return;
      await auClient(c, e, 'demande_validee', { v: { montant: euros(aRegler, l), echeance }, recap: [...c.recap, ...c.echeancier], url: c.url('payer'), mot: true, photo: true });
      return;
    case 'relance_paiement':
      if (r.statut !== 'a_payer') return;
      await auClient(c, e, 'relance_paiement', { v: { montant: euros(aRegler, l), echeance }, url: c.url('payer') });
      return;
    case 'option_expiree':
      if (e.donnees?.avant !== 'a_payer') return; // une demande restée sans réponse n'appelle pas ce message
      await auClient(c, e, 'option_expiree', { url: pageSite(l, 'flotte', `${r.yacht}/`) });
      return;
    case 'demande_refusee':
      await auClient(c, e, 'demande_refusee', { url: pageSite(l, 'flotte'), mot: true });
      return;
    case 'annulation':
      await auClient(c, e, 'annulation', { v: { motif: r.motif || undefined }, url: BASE() + cheminEspace(l) });
      return;
    case 'remboursement':
      await auClient(c, e, 'remboursement', { v: { montant: euros(Number(e.donnees?.montant ?? 0), l) }, url: BASE() + cheminEspace(l) });
      return;
    case 'acompte_recu': {
      const docs = await assurerDocuments(r.id);
      const enUneFois = r.statut === 'soldee';
      await auClient(c, e, 'acompte_recu', {
        v: enUneFois || !r.solde_du_le ? {} : { total: euros(r.solde + r.apa, l), echeance: dateLongue(r.solde_du_le, l) },
        recap: c.recap.slice(0, 3), url: c.url(), pieces: docs, photo: true,
      });
      return;
    }
    case 'solde_recu': {
      const docs = (await assurerDocuments(r.id)).filter((d) => d.type === 'facture_solde' || d.type === 'recu_apa');
      await auClient(c, e, 'solde_recu', { url: BASE() + cheminEspace(l, 'documents'), pieces: docs });
      return;
    }
    case 'appel_solde':
      if (r.statut !== 'confirmee' || !r.solde_du_le) return;
      await auClient(c, e, 'appel_solde', {
        v: { solde: euros(r.solde, l), apa: euros(r.apa, l), total: euros(r.solde + r.apa, l), echeance: dateLongue(r.solde_du_le, l) },
        url: c.url('payer'),
      });
      return;
    case 'embarquement':
      if (!['soldee', 'confirmee'].includes(r.statut)) return;
      await auClient(c, e, 'embarquement', { v: { jour: capitale(jourSemaine(r.debut, l)), heure: heure(r.heure), port: r.port }, url: c.url(), photo: true });
      return;
    case 'paiement_recu': {
      if (g.notif?.paiement === false) return;
      const montant = euros(Number(e.donnees?.montant ?? 0));
      const type = String(e.donnees?.type ?? 'paiement');
      const libelle = type === 'acompte' ? 'Acompte reçu' : type === 'total' ? 'Paiement reçu' : type === 'solde' ? 'Solde reçu' : 'APA reçue';
      await aLaDirection(g, e, r.id, {
        objet: `${libelle} · ${montant} · ${r.reference} (${METHODES[String(e.donnees?.methode)] ?? ''})`, kicker: `Réservation ${r.reference}`, titre: `${libelle} : ${montant}`,
        paragraphes: [`Par ${METHODES[String(e.donnees?.methode)] ?? 'paiement'}. Le contrat et la facture sont générés automatiquement et adressés au client.`],
        recap: recapDirection(c), boutons: [{ libelle: 'Ouvrir la réservation', chemin: `/direction/reservations?ref=${r.reference}&filtre=toutes` }],
      });
      return;
    }
    case 'rappel_directeur':
      if (r.statut !== 'en_attente' || g.notif?.non_traitee === false) return;
      await aLaDirection(g, e, r.id, {
        objet: `Demande sans réponse depuis 24 h · ${r.reference} · ${c.nom}`, kicker: `Demande ${r.reference}`, titre: 'Une demande attend votre réponse',
        paragraphes: [r.expire_le ? `Elle expire automatiquement ${dateHeure(r.expire_le)} : les dates seront alors libérées.` : 'Elle attend votre réponse.'],
        recap: recapDirection(c),
        boutons: [{ libelle: 'Valider', chemin: `/direction/reservations?ref=${r.reference}&action=valider` }, { libelle: 'Refuser', chemin: `/direction/reservations?ref=${r.reference}&action=refuser` }],
      });
      return;
  }
}

async function traiterFormulaire(e: Evenement) {
  const admin = supabaseAdmin();
  const g = await reglages();
  const { data: d } = await admin.from('demandes').select('*').eq('id', e.demande!).maybeSingle();
  if (!d) return;
  const l: Langue = estLangue(d.langue) ? d.langue : 'fr';
  const { data: y } = d.yacht ? await admin.from('yachts').select('nom').eq('slug', d.yacht).maybeSingle() : { data: null };
  if (d.email) {
    const m = emailClient('formulaire', l, {
      v: { prenom: String(d.nom ?? '').split(/\s+/)[0] ?? '', yacht: y?.nom ?? '', ref: '', dates: '', courtier: g.courtier?.prenom || 'Portolan', demande: d.message || undefined },
      courtier: g.courtier, sansReservation: true,
    });
    await envoyer({ pour: 'client', destinataire: d.email, langue: l, modele: 'formulaire', ...m, evenement: e.id, repondreA: g.courtier?.email });
  }
  if (g.notif?.demande !== false) {
    const details = Object.entries((d.details ?? {}) as Record<string, unknown>).filter(([, x]) => x != null && x !== '').map(([k, x]) => [capitale(k.replace(/_/g, ' ')), String(x)] as [string, string]);
    await aLaDirection(g, e, null, {
      objet: `Nouveau formulaire · ${TYPES_FORMULAIRE[d.type] ?? d.type}${y?.nom ? ` · ${y.nom}` : ''} · ${d.nom}`, kicker: TYPES_FORMULAIRE[d.type] ?? 'Formulaire', titre: 'Nouveau formulaire reçu',
      paragraphes: d.message ? [`« ${d.message} »`] : ['Sans message.'],
      recap: [['Nom', d.nom], ['E-mail', d.email], ...(d.telephone ? [['Téléphone', d.telephone] as [string, string]] : []), ...(y?.nom ? [['Yacht', y.nom] as [string, string]] : []), ['Langue', l.toUpperCase()], ...details],
      boutons: [{ libelle: 'Ouvrir la demande', chemin: `/direction/demandes?demande=${d.id}` }],
    });
  }
}

async function traiterInscription(e: Evenement) {
  const g = await reglages();
  const { data: i } = await supabaseAdmin().from('inscriptions').select('email, langue').eq('id', e.inscription!).maybeSingle();
  if (!i) return;
  const l: Langue = estLangue(i.langue) ? i.langue : 'fr';
  const m = emailClient('inscription', l, { v: { prenom: '', yacht: '', ref: '', dates: '', courtier: g.courtier?.prenom || 'Portolan' }, courtier: g.courtier, sansReservation: true });
  await envoyer({ pour: 'client', destinataire: i.email, langue: l, modele: 'inscription', ...m, evenement: e.id, repondreA: g.courtier?.email });
}

// Traite les événements en attente (appelé après chaque action, par le webhook Stripe et par la tâche planifiée)
export async function traiterEvenements(limite = 20) {
  const admin = supabaseAdmin();
  const { data: liste, error } = await admin.rpc('evenements_a_traiter', { p_limite: limite });
  if (error) throw error;
  let traites = 0, erreurs = 0;
  for (const e of (liste ?? []) as Evenement[]) {
    try {
      if (e.reservation) await traiterReservation(e);
      else if (e.demande) await traiterFormulaire(e);
      else if (e.inscription) await traiterInscription(e);
      await admin.from('evenements').update({ traite_le: new Date().toISOString(), erreur: null }).eq('id', e.id);
      traites++;
    } catch (x) {
      await admin.from('evenements').update({ erreur: x instanceof Error ? x.message : String(x) }).eq('id', e.id);
      erreurs++;
    }
  }
  return { traites, erreurs };
}

// Coordonnées bancaires d'un virement choisi (appelé par le webhook, une seule fois par session Stripe)
export async function envoyerCoordonneesVirement(reservationId: string, i: { iban: string; bic: string; titulaire: string; reference: string; montant: number }) {
  const c = await contexte(reservationId);
  if (!c) return;
  const t = textesEmail[c.l].communs.virement;
  const montant = euros(i.montant, c.l);
  await auClient(c, { id: 0, type: 'virement', reservation: reservationId, demande: null, inscription: null, donnees: null }, 'virement', {
    v: { montant }, url: c.url(),
    coordonnees: [[t.beneficiaire, i.titulaire], [t.iban, i.iban], [t.bic, i.bic], [t.reference, i.reference], [t.montant, montant]],
  });
}

// Rattrapage : documents des réservations payées qui n'en ont pas encore (données d'exemple, incident passé)
export async function rattraperDocuments(limite = 4) {
  const { data } = await supabaseAdmin().from('reservations')
    .select('id, statut, solde, apa, documents(type, taille), paiements(type, statut)')
    .eq('type', 'location').in('statut', ['confirmee', 'soldee', 'terminee']).limit(200);
  let n = 0;
  for (const r of data ?? []) {
    const payes = (r.paiements ?? []).filter((p: { statut: string }) => p.statut === 'paye');
    const manquants = documentsDus(r, payes).filter((t) => !(r.documents ?? []).some((d: { type: string; taille: number }) => d.type === t && d.taille > 0));
    for (const t of manquants) {
      if (n >= limite) return n;
      await genererDocument(r.id, t);
      n++;
    }
  }
  return n;
}

// Relance à la demande de la direction (bouton « Relancer ») : acompte attendu, ou solde et APA en retard
export async function relancerPaiement(reservationId: string) {
  const c = await contexte(reservationId);
  if (!c) return false;
  const { r, l } = c;
  const manuel: Evenement = { id: 0, type: 'relance_manuelle', reservation: r.id, demande: null, inscription: null, donnees: null };
  if (r.statut === 'a_payer') {
    const aRegler = r.solde === 0 ? r.montant + r.apa : r.acompte;
    await auClient(c, manuel, 'relance_paiement', { v: { montant: euros(aRegler, l), echeance: r.expire_le ? dateHeure(r.expire_le, l) : '' }, url: c.url('payer') });
    return true;
  }
  if (r.statut === 'confirmee' && r.solde_du_le) {
    await auClient(c, manuel, 'appel_solde', {
      v: { solde: euros(r.solde, l), apa: euros(r.apa, l), total: euros(r.solde + r.apa, l), echeance: dateLongue(r.solde_du_le, l) }, url: c.url('payer'),
    });
    return true;
  }
  return false;
}
