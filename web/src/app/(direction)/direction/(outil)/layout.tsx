// L'outil du directeur : barre latérale, barre du bas sur téléphone, bandeau du mode démonstration
import { direction, tableau } from '@/lib/direction/donnees';
import { Notifications } from '@/components/Notifications';
import { DemoFournisseur } from '@/components/Demo';
import { Lateral, NavBas } from './Navigation';
import { BoutonsDemo } from '@/components/BoutonsDemo';
import { deconnexion } from '../actions';

export default async function Outil({ children }: { children: React.ReactNode }) {
  const { profil, demo } = await direction();
  const t = await tableau();
  const nom = `${profil.prenom} ${profil.nom}`.trim();
  return (
    <DemoFournisseur demo={demo}><Notifications>
      {demo && (
        <div className="bandeau-demo" role="note" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '.5rem 1.25rem' }}>
          <span>Démonstration en lecture seule&#8239;: les données des clients sont masquées</span>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center' }}>
            <BoutonsDemo comptes={[{ compte: 'client', libelle: 'Passer au compte client de démonstration' }]} destinationClient="/fr/espace"
              robotTexte="La vérification anti-robot n’a pas abouti. Réessayez." indisponible="La démonstration est momentanément indisponible." />
            <form action={deconnexion}><button className="btn btn--filet btn--petit" type="submit">Se déconnecter</button></form>
          </span>
        </div>
      )}
      <div className="dir2" {...(demo ? { 'data-demo': '' } : {})}>
        <Lateral nom={demo ? 'Visite de démonstration' : nom} titre={demo ? 'Lecture seule' : 'Directrice'}
          compteurs={{ reservations: t.a_traiter, demandes: t.demandes_nouvelles }} site={process.env.NEXT_PUBLIC_SITE_URL!} />
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
      <NavBas />
    </Notifications></DemoFournisseur>
  );
}
