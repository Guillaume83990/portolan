// Tâche planifiée de la démonstration (chaque nuit) : comptes de démonstration rétablis, données du client fictif recréées.
// Protégée par CRON_SECRET (en local, ouverte en développement). Sans effet hors du mode démonstration.
import { NextResponse, type NextRequest } from 'next/server';
import { adminDisponible } from '@/lib/supabase/admin';
import { demoActive } from '@/lib/demo/comptes';
import { reinitialiserDemo } from '@/lib/demo/reinitialiser';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const autorise = secret ? request.headers.get('authorization') === `Bearer ${secret}` : process.env.NODE_ENV === 'development';
  if (!autorise) return new NextResponse('Non autorisé', { status: 401 });
  if (!demoActive()) return NextResponse.json({ ignore: 'mode démonstration désactivé' });
  if (!adminDisponible()) return NextResponse.json({ erreur: 'SUPABASE_SECRET_KEY manquante' }, { status: 503 });
  try {
    return NextResponse.json(await reinitialiserDemo());
  } catch (e) {
    return NextResponse.json({ erreur: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
