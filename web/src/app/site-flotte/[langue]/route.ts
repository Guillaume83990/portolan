// La flotte (/fr/flotte/, /en/fleet/, /de/flotte/, /it/flotta/), rendue depuis la base : proxy.ts réécrit ces
// adresses vers cette route interne. Voir lib/site/pages.ts.
import { reponsePage } from '@/lib/site/reponse';

export async function GET(_: Request, { params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params;
  return reponsePage(langue, null);
}
