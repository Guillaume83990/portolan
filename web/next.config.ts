import type { NextConfig } from 'next';

// Mon espace garde les adresses du site actuel dans chaque langue :
// /fr/espace, /en/my-account, /de/mein-konto, /it/area-riservata (dossier interne : [locale]/espace).
const ESPACES: Record<string, string> = { en: 'my-account', de: 'mein-konto', it: 'area-riservata' };

const nextConfig: NextConfig = {
  // PDF (contrat, factures) produits côté serveur : bibliothèques Node et polices embarquées dans le déploiement
  serverExternalPackages: ['@react-pdf/renderer', 'sharp'],
  outputFileTracingIncludes: { '/**': ['./src/lib/pdf/polices/*.woff'] },
  async rewrites() {
    return Object.entries(ESPACES).flatMap(([langue, dossier]) => [
      { source: `/${langue}/${dossier}`, destination: `/${langue}/espace` },
      { source: `/${langue}/${dossier}/:chemin*`, destination: `/${langue}/espace/:chemin*` },
    ]);
  },
  async redirects() {
    return [{ source: '/', destination: '/fr/espace', permanent: false }];
  },
};

export default nextConfig;
