// Formulaires du site (contact, dossier, visite, brochure, projet, hors marché) envoyés par js/demandes.js.
// La base n'accepte plus d'écriture anonyme (migration 15) : le serveur vérifie l'origine, l'anti-robot (Turnstile),
// chaque champ et le nombre d'envois récents pour la même adresse, puis enregistre avec la clé secrète.
// L'accusé de réception au visiteur et la notification à la direction suivent (file d'événements).
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifierTurnstile } from '@/lib/turnstile';
import { lancerTraitement } from '@/lib/evenements/lancer';

const EMAIL = /^[^@\s<>"']{1,64}@[^@\s<>"']{1,190}\.[a-z]{2,24}$/i;
const LANGUES = ['fr', 'en', 'de', 'it'];
const MAX_PAR_HEURE = 3; // envois pour une même adresse e-mail
const refus = (code: string, status = 400) => NextResponse.json({ ok: false, code }, { status, headers: { 'Cache-Control': 'no-store' } });
const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Champs libres du formulaire (critères, budget, période…) : 30 au plus, textes courts
function details(v: unknown) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).slice(0, 30)
    .filter(([k]) => /^[a-z0-9_-]{1,40}$/i.test(k))
    .map(([k, x]) => [k, texte(typeof x === 'number' ? String(x) : x, 500)]));
}

export async function POST(request: NextRequest) {
  const origine = request.headers.get('origin');
  if (!origine || origine !== request.nextUrl.origin) return refus('origine', 403);
  let c: Record<string, unknown>;
  try { c = await request.json(); } catch { return refus('requete'); }

  const email = texte(c.email, 254).toLowerCase();
  const type = texte(c.type, 40);
  const yacht = texte(c.yacht, 60) || null;
  const langue = texte(c.langue, 2);
  const page = texte(c.page, 300);
  if (!EMAIL.test(email) || !/^[a-z-]{1,40}$/.test(type) || (yacht && !/^[a-z0-9-]+$/.test(yacht))) return refus('invalide');

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
  if (!(await verifierTurnstile(texte(c.captcha, 4096) || null, ip))) return refus('robot');

  const admin = supabaseAdmin();
  const depuis = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin.from('demandes').select('id', { count: 'exact', head: true }).eq('email', email).gte('cree_le', depuis);
  if ((count ?? 0) >= MAX_PAR_HEURE) return refus('trop', 429);

  const { error } = await admin.from('demandes').insert({
    type, yacht, email,
    nom: texte(c.nom, 120) || email,
    telephone: texte(c.telephone, 40),
    message: texte(c.message, 4000),
    details: details(c.details),
    langue: LANGUES.includes(langue) ? langue : 'fr',
    page: page.startsWith('/') ? page : '',
  });
  if (error) {
    console.error('[demandes]', error.message);
    return refus('erreur', 500);
  }
  lancerTraitement();
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
