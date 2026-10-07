// État de la session pour les pages vitrines (module de réservation) : connecté ou non, rôle, et clé publique
// Turnstile (la clé de site est publique par nature).
// Aucune donnée personnelle : la page n'en a pas besoin.
import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

export async function GET() {
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  const { data: p } = user ? await sb.from('profils').select('role').eq('id', user.id).maybeSingle() : { data: null };
  return NextResponse.json({ connecte: Boolean(user), role: p?.role ?? null, turnstile: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}
