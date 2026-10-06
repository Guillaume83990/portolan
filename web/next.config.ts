import type { NextConfig } from 'next';

// Mon espace garde les adresses du site actuel dans chaque langue :
// /fr/espace, /en/my-account, /de/mein-konto, /it/area-riservata (dossier interne : [locale]/espace).
const ESPACES: Record<string, string> = { en: 'my-account', de: 'mein-konto', it: 'area-riservata' };

// Site public hybride : les pages vitrines statiques sont dans public/ (scripts/site-statique.mjs) ; leurs médias
// lourds (photos, séquence et visites à bord, 190 Mo) restent sur l'hébergement statique et sont relayés ici.
const MEDIAS = process.env.SITE_MEDIAS_URL ?? 'https://portolan.sudwebproject.com';

const nextConfig: NextConfig = {
  // PDF (contrat, factures) produits côté serveur : bibliothèques Node et polices embarquées dans le déploiement
  serverExternalPackages: ['@react-pdf/renderer', 'sharp'],
  outputFileTracingIncludes: { '/**': ['./src/lib/pdf/polices/*.woff'] },
  // Les pages vitrines ont des adresses en « …/ » (liens relatifs) : proxy.ts gère la barre finale page par page
  skipTrailingSlashRedirect: true,
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
