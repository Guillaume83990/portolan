'use server';
// Connexion aux comptes de démonstration : le serveur ouvre la session (cookies) avec les identifiants de l'environnement.
// Le jeton Turnstile du visiteur est transmis à Supabase (protection anti-robot activée sur l'authentification).
import { supabaseServeur } from '@/lib/supabase/serveur';
import { identifiantsDemo, type CompteDemo } from './comptes';

export async function connexionDemo(compte: CompteDemo, captchaToken?: string) {
  const id = identifiantsDemo(compte === 'client' ? 'client' : 'directeur');
  if (!id) return { ok: false as const, code: 'indisponible' };
  const sb = await supabaseServeur();
  const { error } = await sb.auth.signInWithPassword({ email: id.email, password: id.mdp, options: { captchaToken } });
  if (error) return { ok: false as const, code: /captcha/i.test(error.message) ? 'robot' : 'indisponible' };
  return { ok: true as const };
}
