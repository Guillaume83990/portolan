// Flotte et fiches des yachts rendues à la demande depuis la base (site public hybride, phase B).
// Même chaîne que la construction statique (tools/construire.cjs), mais au moment de la visite :
//   1. données : yachts publiés, réglages de la saison et dates prises, lus dans Supabase (clé publique) ;
//   2. page française : gabarit d'origine (gabarit.mjs, port de tools/build-flotte.cjs) ;
//   3. adresse publique, puis démonstration (noindex, pastille) comme tools/publication.cjs et demonstration.cjs ;
//   4. traduction EN/DE/IT (traduction.mjs) : dictionnaire du site + traductions saisies dans l'espace directeur.
// Le résultat est mis en cache (étiquette « flotte ») : une modification du directeur le vide aussitôt.
import 'server-only';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { creerGabarit } from './gabarit.mjs';
import { transform } from './traduction.mjs';
import { LOCALES, ROUTES, localize } from './routes.mjs';
import dicos from './dictionnaires.json';
import vitrines from '@/lib/site-statique.json';

export type Langue = 'fr' | 'en' | 'de' | 'it';
const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://portolan.sudwebproject.com').replace(/\/$/, '');
const STOCKAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/yachts`;
const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true';

// Même empreinte et même normalisation que traduction.mjs (et tools/traduire.cjs)
const norm = (s: string) => s.replace(/\u2011/g, '-').replace(/[\u202F\u00A0]/g, ' ').replace(/&nbsp;|&#160;|&#8239;|&#8209;/g, (m) => (m === '&#8209;' ? '-' : ' ')).replace(/’/g, "'").replace(/\s+/g, ' ').trim();

// Phrases de la flotte qui dépendent du nombre de yachts et de leurs longueurs : traduites ici, à trous
const CHIFFRES: Record<string, string> = { en: 'Six', de: 'Sechs', it: 'Sei' };
const A_TROUS: Record<string, (n: string, min: string, max: string) => [string, string, string]> = {
  en: (n, min, max) => [`${n} yachts we have inspected, sea\u2011trialled and chosen, from ${min} to ${max}&nbsp;metres, between Saint\u2011Tropez and Monaco.`, `${n} yachts from ${min} to ${max} m for sale and charter on the French Riviera: specifications, prices, availability. Every yacht has been inspected by our brokers.`, 'yachts'],
  de: (n, min, max) => [`${n} Yachten, die wir besichtigt, probegefahren und ausgewählt haben, von ${min} bis ${max}&nbsp;Metern, zwischen Saint\u2011Tropez und Monaco.`, `${n} Yachten von ${min} bis ${max} m zu verkaufen und zu chartern an der Côte d'Azur: Daten, Preise, Verfügbarkeit. Jede Yacht wurde von unseren Maklern besichtigt.`, 'Yachten'],
  it: (n, min, max) => [`${n} yacht che abbiamo visitato, provato e scelto, da ${min} a ${max}&nbsp;metri, tra Saint\u2011Tropez e Monaco.`, `${n} yacht da ${min} a ${max} m in vendita e a noleggio in Costa Azzurra: caratteristiche, prezzi, disponibilità. Ogni yacht è stato visitato dai nostri broker.`, 'yacht'],
};
// Textes ajoutés au gabarit depuis la construction statique (absents des dictionnaires de tools/i18n)
const COMPLEMENTS: Record<string, Record<string, string>> = {
  "J'accepte les conditions de location et le contrat qui en découle.": {
    en: "I accept the charter terms and the contract based on them.",
    de: "Ich akzeptiere die Charterbedingungen und den darauf beruhenden Vertrag.",
    it: "Accetto le condizioni di noleggio e il contratto che ne deriva.",
  },
};
const complements = (langue: string) => {
  const d: Record<string, string> = {};
  for (const [f, t] of Object.entries(COMPLEMENTS)) { d[empreinte(norm(f))] = t[langue]; d[empreinte(norm(esc(f)))] = esc(t[langue]); }
  return d;
};
// Mêmes phrases françaises que gabarit.mjs (pageFlotte), ajoutées au dictionnaire avec leur traduction
function phrasesFlotte(langue: string, longueurs: number[]) {
  const n = longueurs.length;
  const nb = (l: string) => (x: number) => new Intl.NumberFormat(l, { maximumFractionDigits: 1 }).format(x);
  const [min, max] = [Math.min(...longueurs), Math.max(...longueurs)];
  const [lead, description, mot] = A_TROUS[langue](n === 6 ? CHIFFRES[langue] : String(n), nb(langue)(min), nb(langue)(max));
  const fr = nb('fr-FR');
  const paires: [string, string][] = [
    [`${n === 6 ? 'Six' : n} yachts que nous avons visités, essayés et choisis, de ${fr(min)} à ${fr(max)}&nbsp;mètres, entre Saint&#8209;Tropez et Monaco.`, lead],
    [`${n} yachts de ${fr(min)} à ${fr(max)} m à vendre et à louer sur la Côte d'Azur : caractéristiques, prix, disponibilités. Chaque yacht a été visité par nos courtiers.`, description],
    [`<span>${n}</span> yachts`, `<span>${n}</span> ${mot}`],
  ];
  const d: Record<string, string> = {};
  for (const [f, t] of paires) { d[empreinte(norm(f))] = t; d[empreinte(norm(esc(f)))] = esc(t); }
  return d;
}
const empreinte = (s: string) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Ligne = Record<string, unknown> & {
  slug: string; nom: string; invites: number; port: string; vente: number | null; location_basse: number | null; location_haute: number | null;
  fiche: Record<string, unknown> & { visite?: { pieces?: { cle: string; nom: string }[] } | null };
  traductions?: Record<string, Record<string, string>>; textes?: Record<string, Record<string, { texte?: string; source?: string }>>;
};

const NUMERIQUES = ['longueur', 'largeur', 'tirant', 'equipage', 'autonomie'];

// 1. Données (même forme que data/flotte.json, comme tools/supabase/exporter.cjs)
async function lireDonnees() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const [reg, ys, dispo] = await Promise.all([
    sb.rpc('reglages_publics'),
    sb.from('yachts').select('*').eq('publie', true).eq('archive', false).order('ordre'),
    sb.rpc('disponibilites', {}),
  ]);
  if (reg.error || ys.error || dispo.error) throw new Error(reg.error?.message ?? ys.error?.message ?? dispo.error?.message);
  const r = reg.data;
  const derniere = new Date(`${r.haute_fin}T12:00:00Z`); derniere.setUTCDate(derniere.getUTCDate() - 7);
  const saison = {
    annee: r.annee, debut: r.saison_debut, fin: r.saison_fin,
    haute: [r.haute_debut, derniere.toISOString().slice(0, 10)], hauteFin: r.haute_fin,
    minNuits: { haute: r.min_nuits_haute, basse: r.min_nuits_basse },
    heures: [String(r.heure_min).slice(0, 5), String(r.heure_max).slice(0, 5)], ports: r.ports,
    paiement: { acompte: r.taux_acompte, apa: r.taux_apa, tva: Number(r.taux_tva), soldeJours: r.solde_jours },
  };
  const prises = (dispo.data ?? []) as { yacht: string; debut: string; fin: string; etat: string }[];
  const lignes = (ys.data ?? []) as Ligne[];
  const yachts = lignes.map((l) => {
    const v = l.fiche.visite;
    const brute = v ? { ...l.fiche, visite: { ...v, pieces: Object.fromEntries((v.pieces ?? []).map((p) => [p.cle, p.nom])) } } : l.fiche;
    // Champs numériques forcés en nombres : ils sont insérés tels quels dans la page (aucun texte ne peut s'y glisser)
    const vit = (brute as { vitesse?: { croisiere?: unknown; max?: unknown } }).vitesse;
    const fiche = { ...brute, ...Object.fromEntries(NUMERIQUES.filter((k) => k in brute).map((k) => [k, Number((brute as Record<string, unknown>)[k]) || 0])),
      ...(vit ? { vitesse: { croisiere: Number(vit.croisiere) || 0, max: Number(vit.max) || 0 } } : {}) };
    const dates = prises.filter((p) => p.yacht === l.slug).map(({ debut, fin, etat }) => ({ debut, fin, etat }));
    return {
      slug: l.slug, nom: l.nom, ...fiche, invites: l.invites, port: l.port, vente: l.vente,
      location: l.location_basse ? { basse: l.location_basse, haute: l.location_haute } : null,
      reserve: dates.filter((d) => d.etat !== 'option').map((d) => d.debut), option: dates.filter((d) => d.etat === 'option').map((d) => d.debut), prises: dates,
      galerie: (fiche as { galerie?: unknown[] }).galerie ?? [], ponts: (fiche as { ponts?: unknown[] }).ponts ?? [],
      points: (fiche as { points?: unknown[] }).points ?? [], description: (fiche as { description?: unknown[] }).description ?? [],
    };
  });
  // Traductions des yachts (anciennes « traductions » et champs de l'éditeur), forme échappée et non échappée
  const tradYachts: Record<string, Record<string, string>> = { en: {}, de: {}, it: {} };
  for (const l of lignes) for (const lang of ['en', 'de', 'it']) {
    const ajouter = (fr: string | undefined, t: string | undefined) => {
      if (!fr || !t || !t.trim()) return;
      const v = esc(t).replace(/\s*\n\s*/g, ' ').trim();
      tradYachts[lang][empreinte(norm(esc(fr)))] = v;
      tradYachts[lang][empreinte(norm(fr))] = v;
    };
    for (const [fr, t] of Object.entries(l.traductions?.[lang] ?? {})) ajouter(fr, t);
    for (const champ of Object.values(l.textes?.[lang] ?? {})) ajouter(champ.source, champ.texte);
  }
  return { saison, yachts, reglages: r, tradYachts };
}

// 3. Adresse publique et démonstration (tools/publication.cjs, tools/demonstration.cjs)
const PASTILLE: Record<Langue, [string, string]> = {
  fr: ['Projet de démonstration', 'Site de démonstration conçu par SudWebProject : société, yachts et coordonnées fictifs'],
  en: ['Demonstration project', 'Demonstration website designed by SudWebProject: company, yachts and contact details are fictitious'],
  de: ['Demonstrationsprojekt', 'Demonstrations-Website von SudWebProject: Unternehmen, Yachten und Kontaktdaten sind fiktiv'],
  it: ['Progetto dimostrativo', 'Sito dimostrativo realizzato da SudWebProject: società, yacht e recapiti sono fittizi'],
};
function finaliser(html: string, langue: Langue) {
  let s = html.replace(/\s*<!-- Site de démonstration : retirer noindex pour un vrai client -->/g, '').replace(/\s*<meta name="robots" content="noindex, nofollow">/g, '');
  if (!DEMO) return s;
  s = s.replace(/(<meta charset="[^"]*">)/i, '$1\n  <meta name="robots" content="noindex, follow">');
  const [texte, titre] = PASTILLE[langue];
  return s.replace('</body>', `  <a class="demo-pill" href="https://www.sudwebproject.com/" target="_blank" rel="noopener" title="${titre}"><span class="demo-pill__dot" aria-hidden="true"></span>${texte}<span class="demo-pill__by"> · SudWebProject</span></a>\n</body>`);
}

// Rendu d'une page (« null » : la flotte ; sinon le slug du yacht) ; null si le yacht n'existe pas ou n'est pas publié
async function rendre(langue: Langue, slug: string | null): Promise<string | null> {
  const d = await lireDonnees();
  const g = creerGabarit({ saison: d.saison, yachts: d.yachts, SITE, STOCKAGE });
  const i = slug ? d.yachts.findIndex((y) => y.slug === slug) : -1;
  if (slug && i < 0) return null;
  const fr = slug ? g.fiche(d.yachts[i], i) : g.pageFlotte();
  if (langue === 'fr') return finaliser(fr, 'fr');

  // 4. Traduction : table des adresses (toutes les pages françaises du site), puis dictionnaire de la langue
  const frPath = slug ? `/fr/flotte/${slug}/` : '/fr/flotte/';
  const pagesFr = [...(vitrines as string[]).filter((p) => p.startsWith('/fr/')), '/fr/espace/', '/fr/flotte/', ...d.yachts.map((y) => `/fr/flotte/${y.slug}/`)];
  const table: Record<string, Record<string, string>> = {};
  for (const l of ['fr', 'en', 'de', 'it']) { table[l] = {}; for (const p of pagesFr) table[l][p] = localize(p, l); }
  const dict = { ...(dicos as unknown as Record<string, Record<string, string>>)[langue], ...d.tradYachts[langue], ...complements(langue), ...(slug ? {} : phrasesFlotte(langue, d.yachts.map((y) => Number((y as { longueur?: number }).longueur)))) };
  const res = transform(fr, { lang: langue, dict, noms: (dicos as { noms: string[] }).noms, frPath, site: SITE, localize: table, locales: LOCALES });
  // Texte resté en français (nouveau texte saisi par le directeur et pas encore traduit) : signalé dans les journaux
  if (res.missing.length) console.warn(`[flotte] ${langue}${frPath} : ${res.missing.length} texte(s) sans traduction`, res.missing.map((m: string[]) => String(m[0]).slice(0, 120)));
  return finaliser(res.html, langue);
}

export const pageFlotte = unstable_cache(rendre, ['site-flotte-v4'], { tags: ['flotte'], revalidate: 600 });

// Le segment d'adresse de « La flotte » dans chaque langue (flotte, fleet, flotte, flotta)
export const segmentFlotte = (l: Langue) => (ROUTES as Record<string, Record<string, string>>)[l].flotte;
