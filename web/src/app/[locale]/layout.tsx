// Espace client (Mon espace, paiements) : en français, anglais, allemand ou italien, jamais indexé
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '@/styles/fonts.css';
import '@/styles/main.css';
import '@/styles/compte.css';
import '@/styles/flotte.css';
import '@/styles/ajouts.css';
import '@/styles/espaces.css';
import '@/styles/app.css';
import { dico, estLangue, LANGUES } from '@/lib/i18n';
import { Notifications } from '@/components/Notifications';
import { EnTete, Pied } from '@/components/espace/Cadre';
import { session } from '@/lib/espace/donnees';

export const metadata: Metadata = {
  title: { default: 'Portolan', template: '%s · Portolan' },
  robots: { index: false, follow: false },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon-32.png', sizes: '32x32' }], apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = { themeColor: '#0B1513' };
export const generateStaticParams = () => LANGUES.map((locale) => ({ locale }));

export default async function MiseEnPageClient({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!estLangue(locale)) notFound();
  const { user } = await session();
  return (
    <html lang={locale}>
      <body className="clair">
        <Notifications libelleFermer={dico(locale).compte.fermer}>
          <EnTete langue={locale} connecte={!!user} />
          {children}
          <Pied langue={locale} />
        </Notifications>
      </body>
    </html>
  );
}
