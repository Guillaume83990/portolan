// Client Supabase dans le navigateur (connexion, création de compte, envoi de photos).
// La clé est la clé PUBLIQUE : la sécurité repose sur les règles de la base, jamais sur cette clé.
import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseNavigateur() {
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  return client;
}
