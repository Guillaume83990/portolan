// Client Supabase « serveur seulement », avec la clé secrète : réservé aux webhooks Stripe, à la suppression
// d'un compte et aux documents. Il contourne les règles de la base : ne jamais l'importer dans un composant client.
import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  const cle = process.env.SUPABASE_SECRET_KEY;
  if (!cle) throw new Error('SUPABASE_SECRET_KEY manquante dans .env.local');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const adminDisponible = () => Boolean(process.env.SUPABASE_SECRET_KEY);
