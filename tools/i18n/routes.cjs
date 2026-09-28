// Adresses des pages dans chaque langue (le français est la langue source).
// Clé : le premier dossier sous /fr/ ; valeur : le dossier dans la langue cible. Les fiches yachts gardent leur nom.
const ROUTES = {
  fr: { '': '', flotte: 'flotte', acheter: 'acheter', louer: 'louer', methode: 'methode', 'nos-eaux': 'nos-eaux', contact: 'contact', espace: 'espace', 'mentions-legales': 'mentions-legales', confidentialite: 'confidentialite', conditions: 'conditions' },
  en: { '': '', flotte: 'fleet', acheter: 'buy', louer: 'charter', methode: 'method', 'nos-eaux': 'our-waters', contact: 'contact', espace: 'my-account', 'mentions-legales': 'legal-notice', confidentialite: 'privacy', conditions: 'terms' },
  de: { '': '', flotte: 'flotte', acheter: 'kaufen', louer: 'chartern', methode: 'methode', 'nos-eaux': 'reviere', contact: 'kontakt', espace: 'mein-konto', 'mentions-legales': 'impressum', confidentialite: 'datenschutz', conditions: 'agb' },
  it: { '': '', flotte: 'flotta', acheter: 'acquistare', louer: 'noleggio', methode: 'metodo', 'nos-eaux': 'le-nostre-acque', contact: 'contatti', espace: 'area-riservata', 'mentions-legales': 'note-legali', confidentialite: 'privacy', conditions: 'condizioni' },
};
const LANGS = ['fr', 'en', 'de', 'it'];
const LOCALES = { fr: 'fr_FR', en: 'en_GB', de: 'de_DE', it: 'it_IT' };

// '/fr/acheter/' → '/en/buy/' ; '/fr/flotte/camarat/' → '/it/flotta/camarat/'
function localize(frPath, lang) {
  const m = frPath.match(/^\/fr\/(?:([^/]+)\/)?(.*)$/);
  if (!m) return frPath;
  const [, first = '', rest] = m;
  const mapped = first in ROUTES[lang] ? ROUTES[lang][first] : first;
  return `/${lang}/${mapped ? `${mapped}/` : ''}${rest}`;
}

module.exports = { ROUTES, LANGS, LOCALES, localize };
