import type { Metadata } from 'next';
import { Haut } from '../Haut';
import { reservations, yachts } from '@/lib/direction/donnees';
import { dateMoyenne, euros } from '@/lib/format';
import { photoPrincipale, traductionsARevoir, urlPhoto } from '@/lib/yachts';
import { ListeYachts } from './ListeYachts';

export const metadata: Metadata = { title: 'Yachts' };

export default async function Yachts({ searchParams }: PageProps<'/direction/yachts'>) {
  const sp = await searchParams;
  const [flotte, resas] = await Promise.all([yachts(), reservations()]);
  const filtre = sp.filtre === 'brouillons' || sp.filtre === 'archives' ? sp.filtre : 'publies';
  const garde = { publies: (a: boolean, p: boolean) => !a && p, brouillons: (a: boolean, p: boolean) => !a && !p, archives: (a: boolean) => a };
  const lignes = flotte.map((y) => ({
    slug: y.slug, nom: y.nom, photo: urlPhoto(photoPrincipale(y)),
    sous: [y.fiche.exclusivite ? 'Exclusivité Portolan' : y.fiche.chantier, y.fiche.annee, y.fiche.longueur ? `${String(y.fiche.longueur).replace('.', ',')} m` : null].filter(Boolean).join(' · '),
    vente: y.vente != null, location: y.location_basse != null, avant: y.mis_en_avant, publie: y.publie, archive: y.archive,
    prix: [y.vente ? euros(y.vente) : null, y.location_basse ? `dès ${euros(Math.min(y.location_basse, y.location_haute ?? y.location_basse))}/sem.` : null].filter(Boolean).join(' · '),
    modifie: dateMoyenne(y.modifie_le), revoir: traductionsARevoir(y).map((l) => l.toUpperCase()),
    reservations: resas.filter((r) => r.yacht === y.slug).length,
  }));
  const compte = (f: keyof typeof garde) => flotte.filter((y) => garde[f](y.archive, y.publie)).length;
  return (
    <>
      <Haut titre="Yachts" />
      <div className="contenu" style={{ position: 'relative' }}>
        <ListeYachts key={lignes.map((l) => `${l.slug}${l.modifie}${l.publie}${l.archive}`).join('|') + filtre} filtre={filtre} ajouter={sp.ajouter === '1'} site={process.env.NEXT_PUBLIC_SITE_URL!}
          compteurs={{ publies: compte('publies'), brouillons: compte('brouillons'), archives: compte('archives') }}
          lignes={lignes.filter((l) => garde[filtre](l.archive, l.publie))} />
      </div>
    </>
  );
}
