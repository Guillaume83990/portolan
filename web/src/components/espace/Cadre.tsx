// En-tête et pied du site, repris de la maquette (lot 3) : liens vers le site public dans la langue de la page
import Link from 'next/link';
import { Suspense } from 'react';
import { Rose } from '@/components/Rose';
import { cheminEspace, dico, pageSite } from '@/lib/i18n';
import type { Langue } from '@/lib/format';
import { ChoixLangue } from './ChoixLangue';

export function EnTete({ langue, connecte }: { langue: Langue; connecte: boolean }) {
  const t = dico(langue).nav;
  const liens = [['flotte', t.flotte], ['acheter', t.acheter], ['louer', t.louer], ['methode', t.methode], ['eaux', t.eaux], ['contact', t.contact]];
  return (
    <header className="header is-solid">
      <a className="brand" href={pageSite(langue)} aria-label={t.accueil}><Rose /><span>Portolan</span></a>
      <nav className="header__nav" aria-label={t.navigation}>
        {liens.map(([page, libelle]) => <a key={page} href={pageSite(langue, page)}>{libelle}</a>)}
      </nav>
      <Link className={`compte-lien${connecte ? ' is-connecte' : ''}`} href={cheminEspace(langue)} aria-current="page">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" /></svg>
        <span>{t.espace}</span>
      </Link>
      <Suspense><ChoixLangue langue={langue} libelle={t.langue} /></Suspense>
    </header>
  );
}

export function Pied({ langue }: { langue: Langue }) {
  const t = dico(langue).pied;
  const demo = process.env.NEXT_PUBLIC_DEMO === 'true';
  return (
    <footer className="footer">
      <p className="footer__mark" aria-hidden="true">Portolan</p>
      <div className="footer__row">
        <p>{t.baseline}</p>
        {demo && <p className="footer__credit">{t.credit} <a href="https://www.sudwebproject.com/">SudWebProject</a>{t.creditFin}</p>}
      </div>
      <nav className="footer__legal" aria-label={t.legal}>
        <a href={pageSite(langue, 'mentions')}>{t.mentions}</a>
        <a href={pageSite(langue, 'confidentialite')}>{t.confidentialite}</a>
        <a href={pageSite(langue, 'conditions')}>{t.conditions}</a>
      </nav>
    </footer>
  );
}
