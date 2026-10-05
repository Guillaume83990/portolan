// Données d'un document PDF, lues dans la base par generer.ts (clé secrète, côté serveur)
import type { Langue } from '@/lib/format';
import type { Societe } from './commun';

export type Paiement = { type: string; montant: number; methode: 'carte' | 'virement' | 'manuel'; paye_le: string | null };

export type DonneesDoc = {
  langue: Langue;
  numero: string;
  emisLe: string;
  reservation: {
    reference: string; debut: string; fin: string; nuits: number; heure: string | null; port: string; invites: number | null;
    montant: number; acompte: number; solde: number; apa: number; solde_du_le: string | null;
    contrat_version: string | null; accepte_le: string | null; accepte_ip: string | null;
  };
  client: { nom: string; email: string; telephone: string; societe: string; adresse: string[]; tva: string };
  yacht: { nom: string; chantier?: string; annee?: number; longueur?: number; pavillon?: string; port: string; capacite: number; equipage?: number };
  photo: Buffer | null;
  societe: Societe;
  conditions: string;
  taux: { acompte: number; apa: number; tva: number };
  paiements: Paiement[];
  factureAcompte: string | null;
};
