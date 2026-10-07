// Demande de réservation envoyée depuis la fiche d'un yacht (js/reservation.js).
// Le serveur vérifie, dans l'ordre : même origine, session du client, case d'acceptation du contrat,
// protection anti-robot (Turnstile) ; puis la base vérifie tout le reste (dates libres, saison, durée minimale,
// capacité, deux demandes en attente au plus), recalcule le prix et bloque les dates.
// L'adresse IP est enregistrée avec la version du contrat et l'heure, comme preuve d'acceptation.
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifierTurnstile } from '@/lib/turnstile';
import { lancerTraitement } from '@/lib/evenements/lancer';

const JOUR = /^\d{4}-\d{2}-\d{2}$/;
// Codes renvoyés par la base (public.reserver), transmis tels quels à la page qui les traduit
const CODES = ['connexion_requise', 'mode_demo', 'yacht_non_louable', 'dates_invalides', 'date_trop_proche', 'hors_saison',
  'sejour_trop_court', 'invites_invalides', 'heure_invalide', 'port_invalide', 'trop_de_demandes', 'dates_indisponibles'];
const refus = (code: string, status = 400) => NextResponse.json({ ok: false, code }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  // Même origine uniquement (le corps JSON impose déjà une vérification préalable du navigateur)
  const origine = request.headers.get('origin');
  if (!origine || origine !== request.nextUrl.origin) return refus('origine', 403);

  let c: Record<string, unknown>;
  try { c = await request.json(); } catch { return refus('requete'); }
  const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const yacht = texte(c.yacht, 60);
  const debut = texte(c.debut, 10);
  const fin = texte(c.fin, 10);
  const heure = texte(c.heure, 5);
  const invites = Number(c.invites);
  if (!/^[a-z0-9-]+$/.test(yacht) || !JOUR.test(debut) || !JOUR.test(fin) || !/^\d{2}:\d{2}$/.test(heure) || !Number.isInteger(invites)) return refus('requete');

  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return refus('connexion_requise', 401);
  if (c.accepte !== true) return refus('contrat');

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
  if (!(await verifierTurnstile(texte(c.captcha, 4096) || null, ip))) return refus('robot');

  const { data, error } = await supabaseAdmin().rpc('reserver_serveur', {
    p_client: user.id, p_ip: ip ?? 'inconnue',
    p_yacht: yacht, p_debut: debut, p_fin: fin, p_heure: heure, p_port: texte(c.port, 60) || null, p_invites: invites,
    p_message: texte(c.message, 2000), p_langue: texte(c.langue, 2),
  });
  if (error) {
    const code = CODES.find((k) => error.message.includes(k));
    if (!code) console.error('[reservation]', error.message);
    return refus(code ?? 'erreur', code ? 400 : 500);
  }
  lancerTraitement(); // e-mail « demande reçue » au client et notification à la direction (après la réponse)
  const r = data as { reference: string; montant: number; nuits: number };
  return NextResponse.json({ ok: true, reference: r.reference, montant: r.montant, nuits: r.nuits }, { headers: { 'Cache-Control': 'no-store' } });
}
