'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rose } from '@/components/Rose';
import { deconnexion } from '../actions';

const ENTREES = [
  ['tableau-de-bord', 'Tableau de bord'], ['reservations', 'Réservations'], ['calendrier', 'Calendrier'],
  ['demandes', 'Demandes'], ['clients', 'Clients'], ['yachts', 'Yachts'], ['boite-envoi', 'Boîte d’envoi'], ['reglages', 'Réglages'],
] as const;
const num = { fontSize: '.7rem', color: 'var(--laiton)', letterSpacing: '.1em', width: '1.2rem' } as const;

export function Lateral({ nom, titre, compteurs, site }: {
  nom: string; titre: string; compteurs: { reservations: number; demandes: number }; site: string;
}) {
  const chemin = usePathname();
  return (
    <aside className="lat" aria-label="Navigation de la direction">
      <Link className="brand" href="/direction/tableau-de-bord"><Rose /><span>Portolan<small>Direction</small></span></Link>
      <nav>
        {ENTREES.map(([seg, libelle], i) => {
          const n = seg === 'reservations' ? compteurs.reservations : seg === 'demandes' ? compteurs.demandes : 0;
          return (
            <Link key={seg} href={`/direction/${seg}`} aria-current={chemin.startsWith(`/direction/${seg}`) ? 'page' : undefined}>
              <span style={num}>{String(i + 1).padStart(2, '0')}</span>{libelle}
              {n > 0 && <span className="compteur" aria-label={`${n} à traiter`}>{n}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="lat__pied">
        <b>{nom}</b>
        <span className="second" style={{ color: 'var(--brume)' }}>{titre}</span>
        <a href={site} target="_blank" rel="noopener">Voir le site</a>
        <form action={deconnexion}><button type="submit" className="lien" style={{ color: 'var(--brume)', textDecoration: 'underline', fontSize: 'inherit' }}>Se déconnecter</button></form>
      </div>
    </aside>
  );
}

export function NavBas() {
  const chemin = usePathname();
  const actif = (s: string) => (chemin.startsWith(`/direction/${s}`) ? 'page' : undefined);
  const plus = ['demandes', 'clients', 'yachts', 'boite-envoi', 'reglages', 'plus'].some((s) => chemin.startsWith(`/direction/${s}`));
  return (
    <nav className="nav-bas" aria-label="Navigation">
      <Link href="/direction/tableau-de-bord" aria-current={actif('tableau-de-bord')}><span style={{ fontSize: '.7rem', color: 'var(--laiton)' }}>01</span>Tableau</Link>
      <Link href="/direction/reservations" aria-current={actif('reservations')}><span style={{ fontSize: '.7rem', color: 'var(--laiton)' }}>02</span>Réservations</Link>
      <Link href="/direction/calendrier" aria-current={actif('calendrier')}><span style={{ fontSize: '.7rem', color: 'var(--laiton)' }}>03</span>Calendrier</Link>
      <Link href="/direction/plus" aria-current={plus ? 'page' : undefined}><span style={{ fontSize: '.7rem', color: 'var(--laiton)' }}>04</span>Plus</Link>
    </nav>
  );
}
