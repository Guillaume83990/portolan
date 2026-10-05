import type { Metadata } from 'next';
import { Haut } from '../Haut';
import { reglages, reservations, yachts } from '@/lib/direction/donnees';
import { Planning } from './Planning';

export const metadata: Metadata = { title: 'Calendrier' };

export default async function Calendrier({ searchParams }: PageProps<'/direction/calendrier'>) {
  const sp = await searchParams;
  const [r, resas, flotte] = await Promise.all([reglages(), reservations(), yachts()]);
  const annee = Number(sp.annee) || r.annee;
  const louables = flotte.filter((y) => y.location_basse != null && !y.archive).map((y) => ({ slug: y.slug, nom: y.nom }));
  const barres = resas.filter((x) => ['en_attente', 'a_payer', 'confirmee', 'soldee', 'terminee'].includes(x.statut))
    .map((x) => ({
      id: x.id, reference: x.reference, yacht: x.yacht, yacht_nom: x.yacht_nom, type: x.type, statut: x.statut, debut: x.debut, fin: x.fin,
      nuits: x.nuits, client: x.client_nom, montant: x.montant, motif: x.motif,
    }));
  return (
    <>
      <Haut titre="Calendrier de la flotte" />
      <div className="contenu">
        <Planning annee={annee} anneeReglages={r.annee} yachts={louables} barres={barres}
          haute={annee === r.annee ? { debut: r.haute_debut, fin: r.haute_fin } : { debut: `${annee}-07-03`, fin: `${annee}-09-04` }}
          zoom={sp.zoom === 'mois' || sp.zoom === 'semaine' ? sp.zoom : 'saison'} mois={Number(sp.mois) || 7} semaine={typeof sp.semaine === 'string' ? sp.semaine : ''} />
      </div>
    </>
  );
}
