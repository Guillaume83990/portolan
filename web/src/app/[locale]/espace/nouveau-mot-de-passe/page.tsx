import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dico, estLangue } from '@/lib/i18n';
import { session } from '@/lib/espace/donnees';
import { FormulaireNouveau } from './Formulaire';

export const metadata: Metadata = { title: 'Mot de passe' };

export default async function NouveauMotDePasse({ params }: PageProps<'/[locale]/espace/nouveau-mot-de-passe'>) {
  const { locale } = await params;
  if (!estLangue(locale)) notFound();
  const { user } = await session();
  const t = dico(locale).auth.nouveauMdp;
  return (
    <main className="esp" style={{ maxWidth: '44rem' }}>
      <h1 className="esp__bonjour" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}>{t.titre}</h1>
      {user ? <FormulaireNouveau langue={locale} /> : <p className="bandeau-info bandeau-info--alerte" style={{ marginTop: '2rem' }}>{t.lienInvalide}</p>}
    </main>
  );
}
