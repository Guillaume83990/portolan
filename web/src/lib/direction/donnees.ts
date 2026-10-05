// Lectures de l'espace directeur : toujours par les fonctions de la base (dir_*), qui vérifient le rôle
// et masquent les données personnelles pour le compte de démonstration.
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { profilConnecte, supabaseServeur } from '@/lib/supabase/serveur';
import type { Statut } from '@/lib/statuts';
import type { Yacht } from '@/lib/yachts';

export type ResaDir = {
  id: string; reference: string; yacht: string; yacht_nom: string; type: 'location' | 'blocage'; client: string | null;
  client_nom: string; client_email: string; client_telephone: string; langue: string; debut: string; fin: string;
  heure: string | null; port: string | null; invites: number | null; nuits: number; montant: number; acompte: number;
  solde: number; apa: number; solde_du_le: string | null; statut: Statut; expire_le: string | null; message: string;
  note_directeur: string; note_interne: string; motif: 'entretien' | 'proprietaire' | 'autre' | null; regle: number;
  rembourse: number; cree_le: string; decide_le: string | null;
};
export type DemandeDir = {
  id: string; type: string; yacht: string | null; yacht_nom: string | null; nom: string; email: string; telephone: string;
  message: string; details: Record<string, string>; langue: string; page: string;
  statut: 'nouvelle' | 'en_cours' | 'gagnee' | 'perdue'; brochure_envoyee_le: string | null; cree_le: string;
};
export type ClientDir = {
  id: string; prenom: string; nom: string; email: string; telephone: string; langue: string; cree_le: string;
  societe: string; adresse: string; code_postal: string; ville: string; pays: string;
  reservations: number; regle: number; derniere: string | null;
};
export type PaiementDir = { id: string; reservation: string; reference: string; client: string | null; type: string; montant: number; methode: string | null; statut: string; paye_le: string | null; rembourse: number };
export type DocumentDir = { id: string; reservation: string; reference: string; client: string | null; type: string; numero: string; cree_le: string };
export type Reglages = {
  annee: number; saison_debut: string; saison_fin: string; haute_debut: string; haute_fin: string;
  min_nuits_haute: number; min_nuits_basse: number; heure_min: string; heure_max: string; ports: string[];
  taux_acompte: number; taux_apa: number; delai_reponse_h: number; delai_paiement_h: number; solde_jours: number;
  relance_h: number; tva_location: string; taux_tva: number; paiement_carte: boolean; paiement_virement: boolean;
  societe: Record<string, string>; contrat_version: string; contrat_conditions: string; notif_email: string;
  notif: { demande: boolean; paiement: boolean; non_traitee: boolean };
  courtier: { prenom?: string; nom?: string; titre?: string; telephone?: string; whatsapp?: string; email?: string; photo?: string };
};

// La personne connectée, si elle a accès à la direction (directeur ou démonstration) ; sinon, retour à la connexion
export const direction = cache(async () => {
  const { user, profil } = await profilConnecte();
  if (!user || !profil || (profil.role !== 'directeur' && profil.role !== 'demo')) redirect('/direction/connexion?refus=1');
  return { profil, demo: profil.role === 'demo' };
});

async function rpc<T>(nom: string, args?: Record<string, unknown>): Promise<T> {
  const sb = await supabaseServeur();
  const { data, error } = await sb.rpc(nom, args);
  if (error) throw new Error(`${nom} : ${error.message}`);
  return data as T;
}

export const reservations = cache(() => rpc<ResaDir[]>('dir_reservations'));
export const demandes = cache(() => rpc<DemandeDir[]>('dir_demandes'));
export const clients = cache(() => rpc<ClientDir[]>('dir_clients'));
export const paiements = cache(() => rpc<PaiementDir[]>('dir_paiements'));
export const documents = cache(() => rpc<DocumentDir[]>('dir_documents'));
export const inscriptions = cache(() => rpc<{ id: string; email: string; langue: string; cree_le: string }[]>('dir_inscriptions'));
export const tableau = cache(() => rpc<Tableau>('dir_tableau'));
export const journal = (reservation: string) => rpc<{ cree_le: string; texte: string; auteur: string }[]>('dir_journal', { p_reservation: reservation });
export const notes = (cible: 'client' | 'demande' | 'reservation', id: string) =>
  rpc<{ id: number; texte: string; auteur: string; cree_le: string }[]>('dir_notes', { p_cible: cible, p_id: id });

export const reglages = cache(async () => {
  const sb = await supabaseServeur();
  const { data } = await sb.from('reglages').select('*').single<Reglages>();
  return data!;
});
export const versionsContrat = cache(async () => {
  const sb = await supabaseServeur();
  const { data } = await sb.from('versions_contrat').select('*').order('du', { ascending: false });
  return (data ?? []) as { version: string; du: string; conditions: string }[];
});
export const yachts = cache(async () => {
  const sb = await supabaseServeur();
  const { data } = await sb.from('yachts').select('*').order('ordre');
  return (data ?? []) as Yacht[];
});

export type Tableau = {
  annee: number; saison_debut: string; encaisse: number; a_encaisser: number; a_traiter: number; a_traiter_24h: number;
  a_payer: number; demandes_nouvelles: number; nouveaux_clients: number; occupation_totale: number;
  occupation: { slug: string; nom: string; nuits: number; total: number }[];
  par_mois: { mois: string; confirme: number; attente: number }[];
};
