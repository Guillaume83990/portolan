// Mon espace ouvert avec un compte de la direction (directeur ou démonstration) : pas d'espace client vide,
// mais un accès direct à l'espace directeur, le passage au compte client de démonstration et la déconnexion.
import Link from 'next/link';
import { BoutonsDemo } from '@/components/BoutonsDemo';
import { cheminEspace, dico } from '@/lib/i18n';
import type { Langue } from '@/lib/format';
import { deconnexion } from './actions';

export function SessionDirection({ langue }: { langue: Langue }) {
  const t = dico(langue);
  const p = t.auth.porte;
  const demo = process.env.NEXT_PUBLIC_DEMO === 'true';
  return (
    <main className="esp">
      <h1 className="esp__bonjour">{p.directionTitre}</h1>
      <p className="esp__sous" style={{ maxWidth: '48rem' }}>{p.directionTexte}</p>
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '2rem' }}>
        <Link className="btn btn--plein" href="/direction/tableau-de-bord">{p.directionOuvrir}</Link>
        {demo && <BoutonsDemo classe="btn btn--filet" comptes={[{ compte: 'client', libelle: p.versClient }]} destinationClient={cheminEspace(langue)}
          robotTexte={t.auth.erreurs.robot} indisponible={p.demo.indisponible} />}
        <form action={deconnexion.bind(null, langue)}><button className="btn btn--filet" type="submit">{t.compte.deconnecter}</button></form>
      </div>
    </main>
  );
}
