// Téléphone : les entrées de la direction qui ne tiennent pas dans la barre du bas
import type { Metadata } from 'next';
import Link from 'next/link';
import { Haut } from '../Haut';
import { deconnexion } from '../../actions';

export const metadata: Metadata = { title: 'Plus' };

export default function Plus() {
  const entrees = [['demandes', '04', 'Demandes'], ['clients', '05', 'Clients'], ['yachts', '06', 'Yachts'], ['boite-envoi', '07', 'Boîte d’envoi'], ['reglages', '08', 'Réglages']];
  return (
    <>
      <Haut titre="Plus" />
      <div className="contenu">
        <nav className="carte" style={{ display: 'grid' }} aria-label="Autres sections">
          {entrees.map(([seg, num, libelle]) => (
            <Link key={seg} href={`/direction/${seg}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center', minHeight: '3.4rem', padding: '0 1.25rem', borderBottom: '1px solid var(--filet)', textDecoration: 'none', fontSize: 'var(--t-m)' }}>
              <span style={{ fontSize: '.7rem', color: 'var(--accent)', letterSpacing: '.1em' }}>{num}</span>{libelle}
            </Link>
          ))}
        </nav>
        <p style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
          <a className="lien" href={process.env.NEXT_PUBLIC_SITE_URL} target="_blank" rel="noopener">Voir le site</a>
          <form action={deconnexion}><button className="lien" type="submit">Se déconnecter</button></form>
        </p>
      </div>
    </>
  );
}
