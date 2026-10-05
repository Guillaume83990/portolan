// Avant chaque page : la session Supabase est rafraîchie (cookies), et l'espace directeur exige une connexion.
// Le rôle (directeur ou démonstration) est vérifié ensuite par la mise en page de la direction et par la base.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
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
  matcher: ['/((?!_next/static|_next/image|api/stripe/webhook|api/cron|email/|fonts/|favicon|apple-touch-icon|.*\\.(?:svg|png|jpg|webp|woff2)$).*)'],
};
