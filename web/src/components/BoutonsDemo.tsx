'use client';
// Passage d'un compte de démonstration à l'autre (site de démonstration) : le serveur ouvre la nouvelle session,
// qui remplace la précédente. Client → Mon espace ; directeur → tableau de bord (lecture seule).
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Turnstile, type TurnstileApi } from '@/components/Turnstile';
import { connexionDemo } from '@/lib/demo/actions';

type Compte = 'client' | 'directeur';

export function BoutonsDemo({ comptes, destinationClient, robotTexte, indisponible, classe = 'btn btn--filet btn--petit' }: {
  comptes: { compte: Compte; libelle: string }[]; destinationClient: string; robotTexte: string; indisponible: string; classe?: string;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState('');
  const [envoi, demarrer] = useTransition();
  const robot = useRef<TurnstileApi>(null);
  const essayer = (compte: Compte) => demarrer(async () => {
    setErreur('');
    const j = await robot.current?.jeton(); robot.current?.reinitialiser();
    const r = await connexionDemo(compte, j);
    if (!r.ok) { setErreur(r.code === 'robot' ? robotTexte : indisponible); return; }
    router.push(compte === 'directeur' ? '/direction/tableau-de-bord' : destinationClient);
    router.refresh();
  });
  return (
    <>
      {comptes.map(({ compte, libelle }) => (
        <button key={compte} className={`${classe}${envoi ? ' is-envoi' : ''}`} type="button" disabled={envoi} onClick={() => essayer(compte)}>{libelle}</button>
      ))}
      {/* Message et défi anti-robot (invisible sauf doute) placés après tous les boutons du conteneur */}
      {erreur && <span className="note is-erreur" role="alert" style={{ order: 98, flexBasis: '100%' }}>{erreur}</span>}
      <span style={{ order: 99, flexBasis: '100%' }}><Turnstile ref={robot} marge={false} /></span>
    </>
  );
}
