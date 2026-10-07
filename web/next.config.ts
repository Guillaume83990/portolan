import type { NextConfig } from 'next';

// Mon espace garde les adresses du site actuel dans chaque langue :
// /fr/espace, /en/my-account, /de/mein-konto, /it/area-riservata (dossier interne : [locale]/espace).
const ESPACES: Record<string, string> = { en: 'my-account', de: 'mein-konto', it: 'area-riservata' };

// Site public hybride : les pages vitrines statiques sont dans public/ (scripts/site-statique.mjs) ; leurs médias
// lourds (photos, séquence et visites à bord, 190 Mo, au-delà de la limite d'envoi de Vercel Hobby) sont servis par
// GitHub Pages depuis le dépôt « portolan-medias » et relayés ici, sous /assets, à la même adresse que le site.
const MEDIAS = process.env.SITE_MEDIAS_URL ?? 'https://guillaume83990.github.io/portolan-medias';

const nextConfig: NextConfig = {
  // PDF (contrat, factures) produits côté serveur : bibliothèques Node et polices embarquées dans le déploiement
  serverExternalPackages: ['@react-pdf/renderer', 'sharp'],
  outputFileTracingIncludes: { '/**': ['./src/lib/pdf/polices/*.woff'] },
  // Les pages vitrines ont des adresses en « …/ » (liens relatifs) : proxy.ts gère la barre finale page par page
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // En-têtes de sécurité sur toutes les réponses (pages, API, fichiers de public/) :
  // - aucune page ne s'affiche dans le cadre d'un autre site (anti « clickjacking ») ;
  // - pas de balise <base> ni de plug-in injectables, types de fichiers respectés, adresse d'origine réduite ;
  // - caméra, micro, géolocalisation et paiement intégré désactivés (Stripe s'ouvre sur sa propre page).
  async headers() {
    return [{
      source: '/:chemin*',
      headers: [
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
      ],
    }];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: Object.entries(ESPACES).flatMap(([langue, dossier]) => [
        { source: `/${langue}/${dossier}`, destination: `/${langue}/espace` },
        { source: `/${langue}/${dossier}/:chemin*`, destination: `/${langue}/espace/:chemin*` },
      ]),
      // Médias absents de public/ (polices et icônes y sont) : relayés depuis l'hébergement statique
      fallback: [{ source: '/assets/:chemin*', destination: `${MEDIAS}/assets/:chemin*` }],
    };
  },
  async redirects() {
    // Ancien espace directeur du site statique → espace directeur de l'application
    return [{ source: '/:langue(fr|en|de|it)/direction/:reste*', destination: '/direction', permanent: true }];
  },
};

export default nextConfig;
