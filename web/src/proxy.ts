// Avant chaque page : la session Supabase est rafraîchie (cookies), et l'espace directeur exige une connexion.
// Le rôle (directeur ou démonstration) est vérifié ensuite par la mise en page de la direction et par la base.
// Site public hybride : les pages vitrines statiques (public/, liste dans lib/site-statique.json) sont servies
// à leurs adresses habituelles en « …/ » ; ailleurs, la barre finale est retirée (adresses de l'application).
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import pagesVitrines from '@/lib/site-statique.json';

const VITRINES = new Set<string>(pagesVitrines);

export async function proxy(request: NextRequest) {
  const p = request.nextUrl.pathname;
  if (VITRINES.has(p)) return NextResponse.rewrite(new URL(`${p}index.html`, request.url));
  if (!p.endsWith('/') && VITRINES.has(`${p}/`)) return NextResponse.redirect(new URL(`${p}/${request.nextUrl.search}`, request.url), 308);
  if (p.length > 1 && p.endsWith('/') && !p.startsWith('/api/')) {
    return NextResponse.redirect(new URL(`${p.replace(/\/+$/, '')}${request.nextUrl.search}`, request.url), 308);
  }

  let reponse = NextResponse.next({ request });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (liste) => {
        liste.forEach(({ name, value }) => request.cookies.set(name, value));
        reponse = NextResponse.next({ request });
        liste.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();

  const chemin = request.nextUrl.pathname;
  if (chemin.startsWith('/direction') && !chemin.startsWith('/direction/connexion') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/direction/connexion';
    return NextResponse.redirect(url);
  }
  return reponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/stripe/webhook|api/cron|email/|fonts/|assets/|css/|js/|vendor/|favicon|apple-touch-icon|robots.txt|.*\\.(?:svg|png|jpg|webp|woff2|css|js|html|txt)$).*)'],
};
