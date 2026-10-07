// Données d'un yacht : contrôle des saisies du directeur (zod) et normalisation pour les pages publiques.
// - verifierYacht : refuse une saisie incohérente avec un message clair (dans l'éditeur, jamais sur le site public) ;
// - manquesPourPublier : ce qu'il faut compléter avant de mettre un yacht en ligne ;
// - normaliserFiche : valeurs de secours pour le rendu public, ne lève jamais d'erreur.
import { z } from 'zod';
import type { Fiche, Yacht } from './yachts';

// Photo : chemin du site (« flotte/camarat ») ou du stockage (« supabase:<slug>/<id> »)
const SRC = /^(supabase:[a-z0-9-]+\/[A-Za-z0-9_-]+|[a-z0-9/_-]+)$/;
const texte = (max: number, nom: string) => z.string({ error: `${nom} : texte attendu.` }).max(max, `${nom} : ${max} caractères au plus.`);
const nombre = (min: number, max: number, nom: string) =>
  z.number({ error: `${nom} : nombre attendu.` }).finite().min(min, `${nom} : ${min} au moins.`).max(max, `${nom} : ${max} au plus.`);
const photo = z.object({
  src: z.string().regex(SRC, 'Photo : adresse invalide.'),
  alt: texte(300, 'Description de photo').optional().default(''),
  w: z.number().int().positive().optional(), h: z.number().int().positive().optional(),
  pont: texte(60, 'Pont de la photo').optional(),
}).loose();

const ficheSchema = z.object({
  type: z.enum(['moteur', 'voile'], { error: 'Type : moteur ou voile.' }).optional(),
  annee: nombre(1900, 2100, 'Année').int('Année : nombre entier.').nullish(),
  refit: nombre(1900, 2100, 'Refit').int('Refit : nombre entier.').nullish(),
  longueur: nombre(5, 200, 'Longueur (m)').nullish(),
  largeur: nombre(1, 50, 'Largeur (m)').nullish(),
  tirant: nombre(0, 20, "Tirant d'eau (m)").nullish(),
  equipage: nombre(0, 100, 'Équipage').int('Équipage : nombre entier.').nullish(),
  autonomie: nombre(0, 20000, 'Autonomie (milles)').nullish(),
  nbCabines: nombre(0, 50, 'Cabines').int('Cabines : nombre entier.').nullish(),
  vitesse: z.object({ croisiere: nombre(0, 80, 'Vitesse de croisière').nullish(), max: nombre(0, 80, 'Vitesse maximale').nullish() }).nullish(),
  chantier: texte(120, 'Chantier').nullish(), chantierCourt: texte(60, 'Chantier (court)').nullish(),
  coque: texte(200, 'Coque').nullish(), architecte: texte(200, 'Architecture').nullish(), cabines: texte(300, 'Description des cabines').nullish(),
  moteurs: texte(200, 'Motorisation').nullish(), stabilisateurs: texte(200, 'Stabilité').nullish(), pavillon: texte(80, 'Pavillon').nullish(),
  accroche: texte(400, 'Accroche').nullish(),
  description: z.array(texte(3000, 'Paragraphe de description')).max(20, 'Description : 20 paragraphes au plus.').optional(),
  points: z.array(z.tuple([texte(120, 'Titre de point fort'), texte(600, 'Texte de point fort')])).max(12, 'Points forts : 12 au plus.').optional(),
  ponts: z.array(z.tuple([texte(80, 'Nom de pont'), texte(600, 'Aménagement de pont')])).max(10, 'Ponts : 10 au plus.').optional(),
  image: photo.nullish(),
  galerie: z.array(photo).max(60, 'Galerie : 60 photos au plus.').optional(),
}).loose();

const yachtSchema = z.object({
  nom: z.string().trim().min(1, 'Nom : obligatoire.').max(60, 'Nom : 60 caractères au plus.'),
  slug: z.string().regex(/^[a-z0-9-]{1,60}$/, 'Adresse de la fiche : lettres minuscules, chiffres et tirets.'),
  port: z.string().trim().min(1, "Port d'attache : obligatoire.").max(60),
  invites: nombre(1, 100, 'Invités').int('Invités : nombre entier.'),
  vente: nombre(1, 2_000_000_000, 'Prix de vente').int().nullable(),
  location_basse: nombre(1, 10_000_000, 'Location basse saison').int().nullable(),
  location_haute: nombre(1, 10_000_000, 'Location haute saison').int().nullable(),
  publie: z.boolean(), mis_en_avant: z.boolean(), ordre: z.number().int(),
  fiche: ficheSchema,
  textes: z.record(z.string(), z.unknown()),
}).partial();

// Saisie du directeur : null si tout va bien, sinon le premier problème, en clair
export function verifierYacht(modif: Partial<Yacht>): string | null {
  // (la cohérence des deux tarifs se vérifie sur le yacht complet, dans l'action serveur : l'éditeur n'envoie que les champs modifiés)
  const r = yachtSchema.safeParse(modif);
  return r.success ? null : (r.error.issues[0]?.message ?? 'Saisie invalide.');
}

// Avant publication : ce dont les pages publiques ont besoin pour présenter le yacht dignement
export function manquesPourPublier(y: Pick<Yacht, 'nom' | 'vente' | 'location_basse' | 'fiche'>): string[] {
  const f = y.fiche ?? {};
  const m: string[] = [];
  if (!f.image?.src && !f.galerie?.[0]?.src) m.push('une photo principale');
  if (!(Number(f.longueur) > 0)) m.push('la longueur');
  if (!(Number(f.annee) > 0)) m.push("l'année");
  if (!f.accroche?.trim()) m.push("l'accroche");
  if (!(f.description ?? []).some((p) => p?.trim())) m.push('un paragraphe de description');
  if (y.vente == null && y.location_basse == null) m.push('un prix de vente ou des tarifs de location');
  return m;
}

// ---------------------------------------------------------------------------------------------
// Rendu public : chaque champ a une valeur sûre, quoi qu'il y ait dans la base
// ---------------------------------------------------------------------------------------------
const nb = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : d);
const tx = (v: unknown, d = '') => (typeof v === 'string' ? v : v == null ? d : String(v));
const photoSure = (p: unknown, alt: string) => {
  const o = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
  return typeof o.src === 'string' && SRC.test(o.src)
    ? { ...o, src: o.src, alt: tx(o.alt, alt), w: nb(o.w, 1600) || 1600, h: nb(o.h, 900) || 900, pont: tx(o.pont, 'Pont principal') }
    : null;
};

export function normaliserFiche(fiche: unknown, nom: string): Fiche & Record<string, unknown> {
  const f = (fiche && typeof fiche === 'object' ? fiche : {}) as Record<string, unknown>;
  const galerie = (Array.isArray(f.galerie) ? f.galerie : []).map((p) => photoSure(p, nom)).filter((p) => p !== null);
  const image = photoSure(f.image, nom) ?? galerie[0] ?? { src: 'flotte/baie', alt: nom, w: 1536, h: 1024, pont: 'Pont principal' };
  const paires = (v: unknown) => (Array.isArray(v) ? v : []).filter((x) => Array.isArray(x)).map((x) => [tx(x[0]), tx(x[1])] as [string, string]);
  const vit = (f.vitesse && typeof f.vitesse === 'object' ? f.vitesse : {}) as Record<string, unknown>;
  const cabines = tx(f.cabines);
  const nbCab = nb(f.nbCabines, NaN);
  const v = f.visite as Record<string, unknown> | null | undefined;
  const visite = v && typeof v === 'object' && typeof v.dir === 'string' && /^[a-z0-9/_-]+$/.test(v.dir) && typeof v.affiche === 'string' && SRC.test(v.affiche) ? v : null;
  return {
    ...f,
    type: f.type === 'voile' ? 'voile' : 'moteur',
    annee: nb(f.annee) || undefined, refit: nb(f.refit) || null,
    longueur: nb(f.longueur), largeur: nb(f.largeur), tirant: nb(f.tirant), equipage: nb(f.equipage), autonomie: nb(f.autonomie),
    vitesse: { croisiere: nb(vit.croisiere), max: nb(vit.max) },
    nbCabines: Number.isFinite(nbCab) ? nbCab : nb(cabines.match(/^\d+/)?.[0]),
    chantier: tx(f.chantier), chantierCourt: tx(f.chantierCourt, tx(f.chantier)), coque: tx(f.coque), architecte: tx(f.architecte),
    cabines, moteurs: tx(f.moteurs), stabilisateurs: tx(f.stabilisateurs), pavillon: tx(f.pavillon), accroche: tx(f.accroche),
    exclusivite: f.exclusivite === true,
    description: (Array.isArray(f.description) ? f.description : []).map((p) => tx(p)).filter((p) => p.trim()),
    points: paires(f.points), ponts: paires(f.ponts),
    image, galerie,
    visite: visite as Fiche['visite'],
  };
}
