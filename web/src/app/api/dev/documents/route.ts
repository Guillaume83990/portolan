// Développement uniquement : génère les documents dus d'une réservation et renvoie des liens signés (5 min)
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { assurerDocuments, genererDocument, type TypeDoc } from '@/lib/pdf/generer';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return new NextResponse('Introuvable', { status: 404 });
  const ref = request.nextUrl.searchParams.get('ref') ?? '';
  const refaire = request.nextUrl.searchParams.get('refaire') as TypeDoc | null;
  const admin = supabaseAdmin();
  const { data: r } = await admin.from('reservations').select('id').eq('reference', ref).maybeSingle();
  if (!r) return NextResponse.json({ erreur: 'reservation_introuvable' }, { status: 404 });
  try {
    if (refaire) await genererDocument(r.id, refaire);
    const docs = await assurerDocuments(r.id);
    const liens = await Promise.all(docs.map(async (d) => ({
      type: d.type, numero: d.numero, taille: d.taille,
      url: (await admin.storage.from('documents').createSignedUrl(d.chemin, 300)).data?.signedUrl,
    })));
    return NextResponse.json(liens);
  } catch (e) {
    return NextResponse.json({ erreur: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
