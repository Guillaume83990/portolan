// Entrée dans un compte de démonstration depuis le navigateur : si le serveur vient de rétablir le compte
// (sabotage par un visiteur), une seconde tentative part aussitôt avec un nouveau jeton anti-robot.
import { connexionDemo } from './actions';
import type { CompteDemo } from './comptes';

export async function entrerDemo(compte: CompteDemo, jeton: () => Promise<string | undefined>) {
  const r = await connexionDemo(compte, await jeton());
  return !r.ok && r.code === 'retabli' ? connexionDemo(compte, await jeton()) : r;
}
