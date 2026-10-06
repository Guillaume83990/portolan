// Langues de l'espace client et adresses localisées (mêmes adresses que le site public, tools/i18n/routes.cjs)
import { fr, type Dico } from './fr';
import { en } from './en';
import { de } from './de';
import { it } from './it';
import type { Langue } from '@/lib/format';

export const LANGUES: Langue[] = ['fr', 'en', 'de', 'it'];
export const estLangue = (l: string): l is Langue => (LANGUES as string[]).includes(l);
export const dico = (l: Langue): Dico => ({ fr, en, de, it })[l];

// Dossier de « Mon espace » dans chaque langue (réécrit vers /<langue>/espace par next.config.ts)
const ESPACE: Record<Langue, string> = { fr: 'espace', en: 'my-account', de: 'mein-konto', it: 'area-riservata' };
export const cheminEspace = (l: Langue, sous = '') => `/${l}/${ESPACE[l]}${sous ? `/${sous}` : ''}`;

// Pages du site public
const ROUTES: Record<Langue, Record<string, string>> = {
  fr: { flotte: 'flotte', acheter: 'acheter', louer: 'louer', methode: 'methode', eaux: 'nos-eaux', contact: 'contact', mentions: 'mentions-legales', confidentialite: 'confidentialite', conditions: 'conditions' },
  en: { flotte: 'fleet', acheter: 'buy', louer: 'charter', methode: 'method', eaux: 'our-waters', contact: 'contact', mentions: 'legal-notice', confidentialite: 'privacy', conditions: 'terms' },
  de: { flotte: 'flotte', acheter: 'kaufen', louer: 'chartern', methode: 'methode', eaux: 'reviere', contact: 'kontakt', mentions: 'impressum', confidentialite: 'datenschutz', conditions: 'agb' },
  it: { flotte: 'flotta', acheter: 'acquistare', louer: 'noleggio', methode: 'metodo', eaux: 'le-nostre-acque', contact: 'contatti', mentions: 'note-legali', confidentialite: 'privacy', conditions: 'condizioni' },
};
// Les pages vitrines sont servies par l'application (méthode hybride) : liens vers sa propre adresse (absolue, pour les e-mails)
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portolan.sudwebproject.com';
export const pageSite = (l: Langue, page = '', suite = '') => `${SITE}/${l}/${page ? `${ROUTES[l][page] ?? page}/` : ''}${suite}`;
export const ficheYacht = (l: Langue, slug: string) => pageSite(l, 'flotte', `${slug}/`);
// Fonction du courtier dans la langue du client (saisie en français, traductions facultatives dans Réglages)
export const titreCourtier = (c: { titre?: string; titre_en?: string; titre_de?: string; titre_it?: string }, l: Langue) =>
  (l !== 'fr' ? c[`titre_${l}`] : '') || c.titre || '';
export type { Dico };
