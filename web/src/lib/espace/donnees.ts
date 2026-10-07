// Lectures de l'espace client : toujours avec la session du client, sous les règles de la base
// (il ne lit que ses réservations, ses paiements et ses documents).
import 'server-only';
import { cache } from 'react';
import { profilConnecte, supabaseServeur } from '@/lib/supabase/serveur';
import type { Statut } from '@/lib/statuts';
import type { Fiche } from '@/lib/yachts';

export type ResaClient = {
  id: string; reference: string; yacht: string; type: string; debut: string; fin: string; heure: string | null; port: string | null;
  invites: number | null; nuits: number; montant: number; acompte: number; solde: number; apa: number; solde_du_le: string | null;
  statut: Statut; expire_le: string | null; message: string; note_directeur: string; cree_le: string; valide_le: string | null; decide_le: string | null;
  langue: string; rembourse: number;
};
export type PaiementClient = { id: string; reservation: string; type: string; montant: number; methode: string | null; statut: string; paye_le: string | null; rembourse: number; stripe_session: string | null };
export type DocumentClient = { id: string; reservation: string; type: string; numero: string; chemin: string; taille: number; cree_le: string };
export type YachtResume = { slug: string; nom: string; fiche: Pick<Fiche, 'image' | 'galerie'> };
export type ReglagesPublics = {
  annee: number; taux_acompte: number; taux_apa: number; solde_jours: number; delai_paiement_h: number;
  paiement_carte: boolean; paiement_virement: boolean; societe: Record<string, string>; contrat_version: string;
  courtier: { prenom?: string; nom?: string; titre?: string; titre_en?: string; titre_de?: string; titre_it?: string; telephone?: string; whatsapp?: string; email?: string; photo?: string };
};

export const session = cache(profilConnecte);

export const mesReservations = cache(async () => {
  const sb = await supabaseServeur();
  const { data, error } = await sb.from('reservations')
    .select('id, reference, yacht, type, debut, fin, heure, port, invites, nuits, montant, acompte, solde, apa, solde_du_le, statut, expire_le, message, note_directeur, cree_le, valide_le, decide_le, langue, rembourse')
    .eq('type', 'location').order('debut');
  if (error) throw error;
  return (data ?? []) as ResaClient[];
});

export const mesPaiements = cache(async () => {
  const sb = await supabaseServeur();
  const { data } = await sb.from('paiements').select('id, reservation, type, montant, methode, statut, paye_le, rembourse, stripe_session').order('paye_le');
  return (data ?? []) as PaiementClient[];
});

export const mesDocuments = cache(async () => {
  const sb = await supabaseServeur();
  const { data } = await sb.from('documents').select('id, reservation, type, numero, chemin, taille, cree_le').order('cree_le', { ascending: false });
  return (data ?? []) as DocumentClient[];
});

// Noms et photos des yachts (un yacht retiré du site reste affiché par son nom d'origine)
export const yachtsDe = cache(async (slugs: string) => {
  const liste = slugs.split(',').filter(Boolean);
  if (!liste.length) return {} as Record<string, YachtResume>;
  const sb = await supabaseServeur();
  const { data } = await sb.from('yachts').select('slug, nom, fiche').in('slug', liste);
  return Object.fromEntries((data ?? []).map((y) => [y.slug, y as YachtResume])) as Record<string, YachtResume>;
});
export const nomYacht = (y: Record<string, YachtResume>, slug: string) =>
  y[slug]?.nom ?? slug.split('-').map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(' ');

export const reglagesPublics = cache(async () => {
  const sb = await supabaseServeur();
  // Réglages visibles des clients (sans IBAN ni e-mails internes) : la table complète est réservée à la direction
  const { data } = await sb.rpc('reglages_publics');
  return data as ReglagesPublics;
});
