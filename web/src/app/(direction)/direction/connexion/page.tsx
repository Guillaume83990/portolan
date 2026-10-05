import type { Metadata } from 'next';
import { Rose } from '@/components/Rose';
import { FormulaireConnexion } from './FormulaireConnexion';

export const metadata: Metadata = { title: 'Connexion' };

export default async function Connexion({ searchParams }: PageProps<'/direction/connexion'>) {
  const { refus } = await searchParams;
  const demo = process.env.NEXT_PUBLIC_DEMO === 'true';
  return (
    <main className="connexion">
      <div className="connexion__boite">
        <div className="connexion__logo"><Rose className="" /><p>Portolan<br /><small>Direction</small></p></div>
        <FormulaireConnexion refus={refus === '1'} />
        {demo && (
          <div className="connexion__demo">
            <p className="kicker" style={{ margin: 0 }}>Visiter en démonstration</p>
            <p>Lecture seule, données des clients masquées.</p>
            <FormulaireConnexion demo />
          </div>
        )}
      </div>
    </main>
  );
}
