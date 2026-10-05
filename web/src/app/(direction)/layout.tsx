// Espace directeur : en français uniquement, jamais indexé
import type { Metadata, Viewport } from 'next';
import '@/styles/fonts.css';
import '@/styles/main.css';
import '@/styles/compte.css';
import '@/styles/flotte.css';
import '@/styles/ajouts.css';
import '@/styles/espaces.css';
import '@/styles/app.css';

export const metadata: Metadata = {
  title: { default: 'Portolan · Direction', template: '%s · Portolan Direction' },
  robots: { index: false, follow: false },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon-32.png', sizes: '32x32' }], apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = { themeColor: '#0B1513' };

export default function MiseEnPageDirection({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="clair">{children}</body>
    </html>
  );
}
