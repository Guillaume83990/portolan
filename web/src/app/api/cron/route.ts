// Tâche planifiée (Vercel Cron, toutes les heures ; en local : à la demande) : événements restés en attente,
// rappels datés planifiés par la base (pg_cron) et documents manquants. Protégée par CRON_SECRET.
import { NextResponse, type NextRequest } from 'next/server';
import { adminDisponible } from '@/lib/supabase/admin';
import { rattraperDocuments, traiterEvenements } from '@/lib/evenements/traiter';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const autorise = secret ? request.headers.get('authorization') === `Bearer ${secret}` : process.env.NODE_ENV === 'development';
  if (!autorise) return new NextResponse('Non autorisé', { status: 401 });
  if (!adminDisponible()) return NextResponse.json({ erreur: 'SUPABASE_SECRET_KEY manquante' }, { status: 503 });
  const evenements = await traiterEvenements(50);
  const documents = await rattraperDocuments(6);
  return NextResponse.json({ ...evenements, documents });
}
