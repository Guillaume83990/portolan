// Codes d'erreur renvoyés par la base (raise exception '<code>') → phrase claire pour l'écran
const MESSAGES: Record<string, string> = {
  reserve_au_directeur: 'Action réservée à la direction.',
  mode_demo: 'Lecture seule en démonstration.',
  decision_impossible: "Cette action n'est plus possible : la réservation a changé de statut entre-temps.",
  decision_invalide: 'Action inconnue.',
  motif_obligatoire: 'Le motif est obligatoire.',
  duree_invalide: 'Durée invalide.',
  paiement_invalide: 'Paiement invalide.',
  dates_indisponibles: 'Ces dates chevauchent une autre réservation.',
  annulation_impossible: "Cette demande ne peut plus être annulée depuis votre espace : écrivez à votre courtier.",
  connexion_requise: 'Votre session a expiré : reconnectez-vous.',
};

// Erreur dont le texte est déjà écrit pour l'écran
export class ErreurAffichable extends Error {}

export function messageErreur(e: unknown): string {
  if (e instanceof ErreurAffichable) return e.message;
  const brut = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  for (const [code, texte] of Object.entries(MESSAGES)) if (brut.includes(code)) return texte;
  if (/row-level security|permission denied/i.test(brut)) return 'Action non autorisée pour ce compte.';
  if (/duplicate key/i.test(brut)) return 'Cette valeur existe déjà.';
  if (/fetch failed|network/i.test(brut)) return 'Connexion perdue. Réessayez dans un instant.';
  return "L'enregistrement a échoué. Vos modifications sont conservées sur cette page.";
}

export type Resultat<T = undefined> = { ok: true; donnees?: T; message?: string } | { ok: false; erreur: string };
