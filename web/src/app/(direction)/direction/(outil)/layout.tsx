// L'outil du directeur : barre latérale, barre du bas sur téléphone, bandeau du mode démonstration
import { direction, tableau } from '@/lib/direction/donnees';
import { Notifications } from '@/components/Notifications';
import { DemoFournisseur } from '@/components/Demo';
import { Lateral, NavBas } from './Navigation';

export default async function Outil({ children }: { children: React.ReactNode }) {
  const { profil, demo } = await direction();
  const t = await tableau();
  const nom = `${profil.prenom} ${profil.nom}`.trim();
  return (
    <DemoFournisseur demo={demo}><Notifications>
      {demo && <p className="bandeau-demo" role="note">Démonstration en lecture seule&#8239;: les données des clients sont masquées</p>}
      <div className="dir2" {...(demo ? { 'data-demo': '' } : {})}>
        <Lateral nom={demo ? 'Visite de démonstration' : nom} titre={demo ? 'Lecture seule' : 'Directrice'}
          compteurs={{ reservations: t.a_traiter, demandes: t.demandes_nouvelles }} site={process.env.NEXT_PUBLIC_SITE_URL!} />
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
      <NavBas />
    </Notifications></DemoFournisseur>
  );
}
