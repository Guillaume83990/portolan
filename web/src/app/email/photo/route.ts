// Photo d'un yacht pour les e-mails : JPEG 1200 × 600 (Outlook et d'anciens clients ne lisent pas le WebP du site).
// Seules les photos de la flotte sont servies (chemin vérifié), avec un cache long.
import sharp from 'sharp';
import { urlPhoto } from '@/lib/yachts';

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get('src') ?? '';
  if (!/^(supabase:)?[a-z0-9/_-]{1,120}$/i.test(src) || src.includes('..')) return new Response('Introuvable', { status: 404 });
  const r = await fetch(urlPhoto(src, 1600));
  if (!r.ok) return new Response('Introuvable', { status: 404 });
  const jpeg = await sharp(Buffer.from(await r.arrayBuffer())).resize(1200, 600, { fit: 'cover' }).jpeg({ quality: 76, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
}
