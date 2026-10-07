// Réponse HTML d'une page de la flotte : page rendue (et mise en cache), page 404 sobre, ou page d'attente (503)
// si la base est momentanément injoignable : jamais d'erreur brute.
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
const INDISPONIBLE: Record<Langue, [string, string]> = {
  fr: ['La flotte est momentanément indisponible. Réessayez dans un instant.', 'Retour à l’accueil'],
  en: ['The fleet is temporarily unavailable. Please try again in a moment.', 'Back to home'],
  de: ['Die Flotte ist vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich noch einmal.', 'Zur Startseite'],
  it: ['La flotta è momentaneamente non disponibile. Riprovi tra un istante.', 'Torna alla home'],
};

export async function reponsePage(langue: string, slug: string | null) {
  if (!LANGUES.includes(langue) || (slug !== null && !/^[a-z0-9-]{1,60}$/.test(slug))) return page('fr', TEXTES, 404);
  try {
    const html = await pageFlotte(langue as Langue, slug);
    return html ? new Response(html, { headers: ENTETES }) : page(langue as Langue, TEXTES, 404);
  } catch (e) {
    console.error('[flotte] rendu impossible :', e instanceof Error ? e.message : e);
    return page(langue as Langue, INDISPONIBLE, 503);
  }
}

function page(l: Langue, textes: Record<Langue, [string, string]>, status: number) {
  const [texte, lien] = textes[l];
  const cible = status === 404 ? `/${l}/${segmentFlotte(l)}/` : `/${l}/`;
  const html = `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Portolan</title><link rel="stylesheet" href="/css/main.css"></head><body style="min-height:100vh;display:grid;place-items:center;text-align:center;padding:2rem"><main><p style="font-family:var(--serif, serif);font-size:1.6rem;margin-bottom:1.5rem">${texte}</p><a class="btn" href="${cible}">${lien}</a></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
