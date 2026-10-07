// Adresse de retour après connexion (fiche d'un yacht, module de réservation) : seules les fiches du site sont
// acceptées, pour qu'un lien piégé ne puisse pas renvoyer le visiteur ailleurs.
export const RETOUR = /^\/(?:(?:fr|de)\/flotte|en\/fleet|it\/flotta)\/[a-z0-9-]{1,60}\/$/;
export const retourValide = (s: string | null | undefined): string | null => (s && RETOUR.test(s) ? s : null);
