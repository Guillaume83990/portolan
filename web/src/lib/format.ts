// Montants, dates et durées, écrits comme sur le site (espaces fines, « 2 → 6 juin », « il y a 3 h »)
export type Langue = 'fr' | 'en' | 'de' | 'it';
const LOCALES: Record<Langue, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', it: 'it-IT' };
const NBSP = ' ';

export function euros(n: number | null | undefined, langue: Langue = 'fr') {
  if (n == null) return '—';
  return new Intl.NumberFormat(LOCALES[langue], { maximumFractionDigits: 0 }).format(n) + NBSP + '€';
}
export const eurosCentimes = (n: number, langue: Langue = 'fr') =>
  new Intl.NumberFormat(LOCALES[langue], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + NBSP + '€';

// Les dates de la base (« 2027-07-10 ») sont des jours : on les lit à midi UTC pour éviter tout décalage de fuseau.
export const jour = (d: string | Date) => (typeof d === 'string' && d.length === 10 ? new Date(d + 'T12:00:00Z') : new Date(d));
const fmt = (d: string | Date, o: Intl.DateTimeFormatOptions, langue: Langue = 'fr') =>
  new Intl.DateTimeFormat(LOCALES[langue], { timeZone: 'Europe/Paris', ...o }).format(jour(d));

export const dateLongue = (d: string | Date, l: Langue = 'fr') => fmt(d, { day: 'numeric', month: 'long', year: 'numeric' }, l);
export const dateCourte = (d: string | Date, l: Langue = 'fr') => fmt(d, { day: 'numeric', month: 'short' }, l);
export const dateMoyenne = (d: string | Date, l: Langue = 'fr') => fmt(d, { day: 'numeric', month: 'short', year: 'numeric' }, l);
export const jourSemaine = (d: string | Date, l: Langue = 'fr') => fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, l);
export const jourSemaineCourt = (d: string | Date, l: Langue = 'fr') => fmt(d, { weekday: 'short', day: 'numeric', month: 'long' }, l);
export const heureMinute = (d: string | Date, l: Langue = 'fr') => fmt(d, { hour: '2-digit', minute: '2-digit' }, l);
export const moisAnnee = (d: string | Date, l: Langue = 'fr') => capitale(fmt(d, { month: 'short', year: 'numeric' }, l));
export const capitale = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const heure = (h: string | null | undefined) => (h ? h.slice(0, 5) : '');

// « 2 → 6 juin », « 29 mai → 3 juin », « 28 déc. 2026 → 4 janv. 2027 »
export function plage(debut: string, fin: string, l: Langue = 'fr') {
  const a = jour(debut), b = jour(fin);
  const memeMois = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
  const memeAnnee = a.getUTCFullYear() === b.getUTCFullYear();
  if (memeMois) return `${fmt(a, { day: 'numeric' }, l)} → ${dateCourte(b, l)}`;
  if (memeAnnee) return `${dateCourte(a, l)} → ${dateCourte(b, l)}`;
  return `${dateMoyenne(a, l)} → ${dateMoyenne(b, l)}`;
}

// Durées relatives
export function heuresRestantes(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000);
}
export function ilYa(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 60) return `il y a ${Math.max(1, min)}${NBSP}min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h}${NBSP}h`;
  const j = Math.round(h / 24);
  return j === 1 ? 'il y a 1 jour' : `il y a ${j}${NBSP}jours`;
}
export function dans(iso: string | null | undefined) {
  const h = heuresRestantes(iso);
  if (h == null) return '';
  if (h <= 0) return 'dépassée';
  return h < 48 ? `dans ${h}${NBSP}h` : `dans ${Math.round(h / 24)}${NBSP}jours`;
}
export const initiales = (nom: string) =>
  nom.split(/\s+/).filter(Boolean).map((m) => m[0]).join('').slice(0, 2).toUpperCase();
// « Charlotte Delaunay » → « Charlotte D. »
export const prenomInitiale = (nom: string) => {
  const m = nom.trim().split(/\s+/);
  return m.length > 1 ? `${m[0]} ${m[m.length - 1][0]}.` : nom;
};
// « Charlotte Delaunay » → « C. Delaunay »
export const initialeNom = (nom: string) => {
  const m = nom.trim().split(/\s+/);
  return m.length > 1 ? `${m[0][0]}. ${m.slice(1).join(' ')}` : nom;
};
export const nuitsEntre = (debut: string, fin: string) => Math.round((jour(fin).getTime() - jour(debut).getTime()) / 86_400_000);

// Durées relatives dans la langue de l'espace client (« il y a 3 h », « 3 hr. ago », « vor 3 Std. »)
export function relatif(iso: string, langue: Langue = 'fr') {
  const rtf = new Intl.RelativeTimeFormat(LOCALES[langue], { numeric: 'auto', style: 'short' });
  const min = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(min) < 60) return rtf.format(min, 'minute');
  const h = Math.round(min / 60);
  if (Math.abs(h) < 24) return rtf.format(h, 'hour');
  return rtf.format(Math.round(h / 24), 'day');
}
// Compte à rebours compact : « 2 j 04 h 12 min »
const UNITES: Record<Langue, [string, string, string]> = { fr: ['j', 'h', 'min'], en: ['d', 'h', 'min'], de: ['T', 'Std', 'Min'], it: ['g', 'h', 'min'] };
export function reste(iso: string | null | undefined, langue: Langue = 'fr') {
  if (!iso) return '';
  const total = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60_000));
  const [uj, uh, um] = UNITES[langue];
  const j = Math.floor(total / 1440), h = Math.floor((total % 1440) / 60), m = total % 60;
  return `${j ? `${j}${NBSP}${uj} ` : ''}${String(h).padStart(2, '0')}${NBSP}${uh} ${String(m).padStart(2, '0')}${NBSP}${um}`;
}
export const dateHeure = (iso: string, l: Langue = 'fr') =>
  new Intl.DateTimeFormat(LOCALES[l], { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

// Instant présent, pour les composants serveur (rendus une seule fois par requête)
export const maintenant = () => Date.now();
