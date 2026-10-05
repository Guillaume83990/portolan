// Retour des liens envoyés par e-mail (confirmation d'adresse, mot de passe oublié, lien de connexion) :
// la session est ouverte à partir du code, puis le client arrive sur la bonne page de son espace.
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { cheminEspace, estLangue } from '@/lib/i18n';

const SUITES = ['confirmation', 'nouveau-mot-de-passe', ''];

export async function GET(request: NextRequest, { params }: RouteContext<'/[locale]/espace/auth'>) {
  const { locale } = await params;
  const langue = estLangue(locale) ? locale : 'fr';
  const url = request.nextUrl;
  const suite = SUITES.includes(url.searchParams.get('suite') ?? '') ? url.searchParams.get('suite')! : '';
  const sb = await supabaseServeur();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  let ok = false;
  if (code) ok = !(await sb.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await sb.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  const cible = new URL(cheminEspace(langue, ok ? suite : suite === 'nouveau-mot-de-passe' ? 'nouveau-mot-de-passe' : ''), url.origin);
  if (!ok) cible.searchParams.set('lien', 'invalide');
  return NextResponse.redirect(cible);
}
