// Réponse HTML d'une page de la flotte : page rendue (et mise en cache), ou page 404 sobre.
import 'server-only';
import { pageFlotte, segmentFlotte, type Langue } from './pages';

const LANGUES = ['fr', 'en', 'de', 'it'];
const ENTETES = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' };
const TEXTES: Record<Langue, [string, string]> = {
  fr: ['Ce yacht n’est plus présenté.', 'Voir la flotte'],
  en: ['This yacht is no longer listed.', 'View the fleet'],
  de: ['Diese Yacht wird nicht mehr angeboten.', 'Zur Flotte'],
  it: ['Questo yacht non è più presentato.', 'Vedi la flotta'],
};

export async function reponsePage(langue: string, slug: string | null) {
  if (!LANGUES.includes(langue) || (slug !== null && !/^[a-z0-9-]{1,60}$/.test(slug))) return introuvable('fr');
  const html = await pageFlotte(langue as Langue, slug);
  return html ? new Response(html, { headers: ENTETES }) : introuvable(langue as Langue);
}

function introuvable(l: Langue) {
  const [texte, lien] = TEXTES[l];
  const page = `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Portolan</title><link rel="stylesheet" href="/css/main.css"></head><body style="min-height:100vh;display:grid;place-items:center;text-align:center;padding:2rem"><main><p style="font-family:var(--serif, serif);font-size:1.6rem;margin-bottom:1.5rem">${texte}</p><a class="btn" href="/${l}/${segmentFlotte(l)}/">${lien}</a></main></body></html>`;
  return new Response(page, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
