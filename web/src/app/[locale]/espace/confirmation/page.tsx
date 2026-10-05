// Après le lien de confirmation de l'e-mail : « Adresse confirmée. »
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cheminEspace, dico, estLangue } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Bienvenue' };

export default async function Confirmation({ params }: PageProps<'/[locale]/espace/confirmation'>) {
  const { locale } = await params;
  if (!estLangue(locale)) notFound();
  const t = dico(locale).auth.confirme;
  return (
    <main className="esp" style={{ maxWidth: '68rem' }}>
      <svg className="rose-fete" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1v30M1 16h30M5.4 5.4l21.2 21.2M26.6 5.4L5.4 26.6" /><circle cx="16" cy="16" r="6.5" /></svg>
      <h1 className="esp__bonjour" style={{ marginTop: '1.5rem' }}>{t.titre}</h1>
      <p className="esp__sous">{t.texte}</p>
      <p style={{ marginTop: '2rem' }}><Link className="btn btn--plein" href={cheminEspace(locale)}>{t.bouton}</Link></p>
    </main>
  );
}
