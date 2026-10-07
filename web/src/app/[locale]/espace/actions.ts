'use server';
// Actions de l'espace client : toujours avec la session du client (la base vérifie qu'il agit sur ses données)
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { adminDisponible, supabaseAdmin } from '@/lib/supabase/admin';
import { cheminEspace, estLangue } from '@/lib/i18n';
import { lancerTraitement } from '@/lib/evenements/lancer';
import { estClientDemo } from '@/lib/demo/comptes';

// Compte client de démonstration (partagé) : adresse, mot de passe et existence non modifiables
async function clientDemo() {
  const { data: { user } } = await (await supabaseServeur()).auth.getUser();
  return estClientDemo(user?.email);
}

type R = { ok: true } | { ok: false; code: string };
const CHAMPS_PROFIL = new Set(['prenom', 'nom', 'telephone', 'langue', 'societe', 'adresse', 'code_postal', 'ville', 'pays', 'tva']);
const rafraichir = () => revalidatePath('/', 'layout');

export async function annulerDemande(id: string): Promise<R> {
  const sb = await supabaseServeur();
  const { error } = await sb.rpc('annuler_reservation', { p_id: id });
  if (error) return { ok: false, code: error.message.includes('annulation_impossible') ? 'impossible' : 'reseau' };
  rafraichir();
  lancerTraitement();
  return { ok: true };
}

export async function enregistrerProfil(modif: Partial<Record<'prenom' | 'nom' | 'telephone' | 'langue' | 'societe' | 'adresse' | 'code_postal' | 'ville' | 'pays' | 'tva', string>>): Promise<R> {
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, code: 'connexion' };
  if (estClientDemo(user.email)) return { ok: false, code: 'demo' };
  if (modif.langue && !estLangue(modif.langue)) return { ok: false, code: 'invalide' };
  // Seuls ces champs sont modifiables par le client (la base refuse aussi tout autre champ, dont le rôle)
  const propre = Object.fromEntries(Object.entries(modif).filter(([k]) => CHAMPS_PROFIL.has(k)).map(([k, v]) => [k, String(v ?? '').trim().slice(0, k === 'adresse' ? 200 : 120)]));
  if (!Object.keys(propre).length) return { ok: false, code: 'invalide' };
  const { error } = await sb.from('profils').update(propre).eq('id', user.id);
  if (error) return { ok: false, code: 'reseau' };
  rafraichir();
  return { ok: true };
}

export async function changerEmail(email: string, langue: string): Promise<R> {
  if (await clientDemo()) return { ok: false, code: 'demo' };
  const sb = await supabaseServeur();
  const { error } = await sb.auth.updateUser({ email }, { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}${cheminEspace(estLangue(langue) ? langue : 'fr', 'auth')}?suite=compte` });
  return error ? { ok: false, code: /rate/i.test(error.message) ? 'trop' : /registered|exists/i.test(error.message) ? 'existe' : 'reseau' } : { ok: true };
}

// captchaToken : jeton Turnstile du formulaire (Supabase l'exige pour toute connexion quand la protection est activée)
export async function changerMotDePasse(actuel: string, nouveau: string, captchaToken?: string): Promise<R> {
  if (nouveau.length < 10) return { ok: false, code: 'court' };
  if (await clientDemo()) return { ok: false, code: 'demo' };
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return { ok: false, code: 'connexion' };
  // Vérifie le mot de passe actuel avant de le remplacer
  const { createClient } = await import('@supabase/supabase-js');
  const verif = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { error: faux } = await verif.auth.signInWithPassword({ email: user.email, password: actuel, options: { captchaToken } });
  if (faux) return { ok: false, code: /captcha/i.test(faux.message) ? 'robot' : 'actuel' };
  const { error } = await sb.auth.updateUser({ password: nouveau });
  return error ? { ok: false, code: 'reseau' } : { ok: true };
}

export async function nouveauMotDePasse(nouveau: string): Promise<R> {
  if (nouveau.length < 8) return { ok: false, code: 'court' };
  if (await clientDemo()) return { ok: false, code: 'demo' };
  const sb = await supabaseServeur();
  const { error } = await sb.auth.updateUser({ password: nouveau });
  return error ? { ok: false, code: 'lien' } : { ok: true };
}

export async function deconnexion(langue: string) {
  const sb = await supabaseServeur();
  await sb.auth.signOut();
  redirect(cheminEspace(estLangue(langue) ? langue : 'fr'));
}

// Suppression du compte : impossible si une croisière est à venir ; les réservations passées restent, anonymisées
export async function supprimerCompte(langue: string): Promise<R> {
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, code: 'connexion' };
  if (estClientDemo(user.email)) return { ok: false, code: 'demo' };
  const { data: avenir } = await sb.rpc('croisiere_a_venir');
  if (avenir) return { ok: false, code: 'avenir' };
  if (!adminDisponible()) return { ok: false, code: 'indisponible' };
  const admin = supabaseAdmin();
  await admin.from('reservations').update({ client_nom: 'Client supprimé', client_email: '', client_telephone: '', message: '' }).eq('client', user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, code: 'reseau' };
  await sb.auth.signOut();
  redirect(cheminEspace(estLangue(langue) ? langue : 'fr'));
}
