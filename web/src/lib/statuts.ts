// Statuts d'une réservation : libellé (4 langues) et classe du badge (espaces.css)
import type { Langue } from './format';

export type Statut = 'en_attente' | 'a_payer' | 'confirmee' | 'soldee' | 'terminee' | 'refusee' | 'expiree' | 'annulee';

export const BADGE: Record<Statut, string> = {
  en_attente: 'badge--attente', a_payer: 'badge--payer', confirmee: 'badge--confirmee', soldee: 'badge--soldee',
  terminee: 'badge--terminee', refusee: 'badge--refusee', expiree: 'badge--expiree', annulee: 'badge--annulee',
};

const LIBELLES: Record<Langue, Record<Statut, string>> = {
  fr: { en_attente: 'En attente', a_payer: 'À payer', confirmee: 'Confirmée', soldee: 'Soldée', terminee: 'Terminée', refusee: 'Refusée', expiree: 'Expirée', annulee: 'Annulée' },
  en: { en_attente: 'Pending', a_payer: 'To pay', confirmee: 'Confirmed', soldee: 'Paid in full', terminee: 'Completed', refusee: 'Declined', expiree: 'Expired', annulee: 'Cancelled' },
  de: { en_attente: 'Ausstehend', a_payer: 'Zu zahlen', confirmee: 'Bestätigt', soldee: 'Vollständig bezahlt', terminee: 'Abgeschlossen', refusee: 'Abgelehnt', expiree: 'Abgelaufen', annulee: 'Storniert' },
  it: { en_attente: 'In attesa', a_payer: 'Da pagare', confirmee: 'Confermata', soldee: 'Saldata', terminee: 'Conclusa', refusee: 'Rifiutata', expiree: 'Scaduta', annulee: 'Annullata' },
};
export const libelleStatut = (s: Statut, l: Langue = 'fr') => LIBELLES[l][s];

// Étapes de la frise (Demande, Validée, Acompte, Solde, Embarquement) : nombre d'étapes faites
export function etapesFaites(s: Statut): number {
  switch (s) {
    case 'en_attente': return 1;
    case 'a_payer': return 2;
    case 'confirmee': return 3;
    case 'soldee': return 4;
    case 'terminee': return 5;
    default: return 1;
  }
}
export const ACTIFS: Statut[] = ['en_attente', 'a_payer', 'confirmee', 'soldee'];
export const PASSES: Statut[] = ['terminee', 'refusee', 'expiree', 'annulee'];
