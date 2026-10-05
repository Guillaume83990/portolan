// Téléchargement d'un document (contrat, facture) : lien signé de 60 secondes vers le stockage privé.
// La lecture passe par la session : un client n'obtient que ses propres documents (règles de la base).
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { dico, estLangue } from '@/lib/i18n';

export async function GET(request: NextRequest, { params }: RouteContext<'/api/documents/[id]'>) {
  const { id } = await params;
  const l = request.nextUrl.searchParams.get('langue') ?? 'fr';
  const langue = estLangue(l) ? l : 'fr';
  const sb = await supabaseServeur();
  const { data: doc } = await sb.from('documents').select('chemin, numero').eq('id', id).maybeSingle();
  if (!doc) return new NextResponse('Document introuvable', { status: 404 });
  const { data } = await sb.storage.from('documents').createSignedUrl(doc.chemin, 60, { download: `${doc.numero}.pdf` });
  if (!data?.signedUrl) return new NextResponse(dico(langue).documents.enPreparation, { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  return NextResponse.redirect(data.signedUrl);
}
