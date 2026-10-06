// Comptes de démonstration (site de démonstration uniquement, NEXT_PUBLIC_DEMO=true).
// Les identifiants restent sur le serveur (variables d'environnement) : ils ne sont jamais envoyés au navigateur
// ni écrits dans le dépôt. Le visiteur se connecte par un bouton ; le serveur ouvre la session à sa place.
// - « directeur » : rôle « demo », lecture seule de l'espace directeur (la base refuse toute écriture) ;
// - « client »    : vrai compte client fictif (réserver, payer avec la carte de test, télécharger ses documents),
//                   remis à zéro chaque nuit.
import 'server-only';

export type CompteDemo = 'directeur' | 'client';

export const demoActive = () => process.env.NEXT_PUBLIC_DEMO === 'true';

export function identifiantsDemo(compte: CompteDemo) {
  const email = compte === 'directeur' ? process.env.DEMO_DIRECTEUR_EMAIL : process.env.DEMO_CLIENT_EMAIL;
  const mdp = compte === 'directeur' ? process.env.DEMO_DIRECTEUR_MDP : process.env.DEMO_CLIENT_MDP;
  return demoActive() && email && mdp ? { email, mdp } : null;
}

// Le compte client de démonstration est partagé : ni son adresse, ni son mot de passe, ni son existence ne se modifient
export const estClientDemo = (email: string | null | undefined) =>
  Boolean(email && process.env.DEMO_CLIENT_EMAIL && email.toLowerCase() === process.env.DEMO_CLIENT_EMAIL.toLowerCase());
