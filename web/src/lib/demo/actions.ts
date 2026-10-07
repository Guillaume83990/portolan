'use server';
// Connexion aux comptes de démonstration : le serveur ouvre la session (cookies) avec les identifiants de l'environnement.
// Le jeton Turnstile du visiteur est transmis à Supabase (protection anti-robot activée sur l'authentification).
// Si un visiteur a saboté le compte partagé (mot de passe ou adresse changés directement auprès de Supabase), le serveur
// le rétablit et demande au navigateur de réessayer avec un nouveau jeton anti-robot (code « retabli »).
import { supabaseServeur } from '@/lib/supabase/serveur';
import { identifiantsDemo, type CompteDemo } from './comptes';
import { retablirCompte } from './reinitialiser';

export async function connexionDemo(compte: CompteDemo, captchaToken?: string) {
  const cle: CompteDemo = compte === 'client' ? 'client' : 'directeur';
  const id = identifiantsDemo(cle);
  if (!id) return { ok: false as const, code: 'indisponible' };
  const sb = await supabaseServeur();
  const { error } = await sb.auth.signInWithPassword({ email: id.email, password: id.mdp, options: { captchaToken } });
  if (!error) return { ok: true as const };
  if (/captcha/i.test(error.message)) return { ok: false as const, code: 'robot' };
  if (/invalid login credentials/i.test(error.message)) {
    try { await retablirCompte(cle); return { ok: false as const, code: 'retabli' }; } catch { /* indisponible */ }
  }
  return { ok: false as const, code: 'indisponible' };
}
