// Fiche d'un yacht (/fr/flotte/camarat/…), rendue depuis la base ; 404 si le yacht n'est pas publié.
import { reponsePage } from '@/lib/site/reponse';

export async function GET(_: Request, { params }: { params: Promise<{ langue: string; slug: string }> }) {
  const { langue, slug } = await params;
  return reponsePage(langue, slug);
}
