// Vérification d'un jeton Turnstile côté serveur (formulaires du site, réservation). Sans clé secrète : vérification désactivée.
import 'server-only';

export async function verifierTurnstile(jeton: string | undefined | null, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!jeton) return false;
  try {
    const corps = new URLSearchParams({ secret, response: jeton, ...(ip ? { remoteip: ip } : {}) });
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: corps });
    const d = (await r.json()) as { success?: boolean };
    return d.success === true;
  } catch {
    return false;
  }
}
