// Yachts : forme d'une fiche (colonne « fiche » de la base) et adresse des photos.
// Photos d'origine : sur le site public (assets/img/<src>-900.webp). Photos envoyées par le directeur :
// dans le stockage Supabase, « supabase:<slug>/<id> » → bucket yachts, <slug>/<id>-900.webp.
export type Photo = { src: string; w?: number; h?: number; alt: string; pont?: string };
export type Fiche = {
  type?: 'moteur' | 'voilier'; annee?: number; refit?: number | null; longueur?: number; largeur?: number; tirant?: number;
  coque?: string; architecte?: string; cabines?: string; equipage?: number; moteurs?: string; stabilisateurs?: string;
  pavillon?: string; autonomie?: number; vitesse?: { croisiere?: number; max?: number };
  chantier?: string; chantierCourt?: string; accroche?: string; exclusivite?: boolean; selection?: boolean;
  description?: string[]; points?: [string, string][]; ponts?: [string, string][];
  image?: Photo; galerie?: Photo[];
  visite?: { dir?: string; affiche?: string; duree?: number; pieces?: unknown[]; active?: boolean } | null;
  nbCabines?: number;
};
export type Traduction = { texte: string; source: string };
export type Yacht = {
  slug: string; ordre: number; nom: string; publie: boolean; archive: boolean; mis_en_avant: boolean;
  invites: number; port: string; vente: number | null; location_basse: number | null; location_haute: number | null;
  fiche: Fiche; textes: Partial<Record<'en' | 'de' | 'it', Record<string, Traduction>>>; modifie_le: string;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portolan.sudwebproject.com';
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function urlPhoto(src: string | undefined, taille: 900 | 1600 = 900) {
  if (!src) return '';
  if (src.startsWith('supabase:')) return `${SB}/storage/v1/object/public/yachts/${src.slice(9)}-${taille}.webp`;
  return `${SITE}/assets/img/${src}-${taille}.webp`;
}
export const photoPrincipale = (y: Pick<Yacht, 'fiche'>) => y.fiche.image?.src ?? y.fiche.galerie?.[0]?.src;

// Champs traduisibles d'une fiche : clé du champ → texte français actuel (même découpage que la base)
export function champsTraduisibles(f: Fiche): Record<string, string> {
  const c: Record<string, string> = {};
  if (f.accroche) c['accroche'] = f.accroche;
  (f.description ?? []).forEach((t, i) => (c[`description.${i}`] = t));
  (f.points ?? []).forEach(([t, x], i) => { c[`points.${i}.titre`] = t; c[`points.${i}.texte`] = x; });
  (f.ponts ?? []).forEach(([n, a], i) => { c[`ponts.${i}.nom`] = n; c[`ponts.${i}.amenagement`] = a; });
  if (f.cabines) c['cabines'] = f.cabines;
  (f.galerie ?? []).forEach((p, i) => (c[`galerie.${i}.alt`] = p.alt));
  return c;
}

// Langues dont une traduction manque ou est « à revoir » (le français a changé depuis)
export function traductionsARevoir(y: Pick<Yacht, 'fiche' | 'textes'>) {
  const champs = champsTraduisibles(y.fiche);
  return (['en', 'de', 'it'] as const).filter((l) =>
    Object.entries(champs).some(([k, fr]) => { const t = y.textes?.[l]?.[k]; return !t || !t.texte || t.source !== fr; }));
}
