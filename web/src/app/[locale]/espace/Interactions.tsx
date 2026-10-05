'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Dialogue } from '@/components/Dialogue';
import { useNotifier } from '@/components/Notifications';
import { dico } from '@/lib/i18n';
import { reste, type Langue } from '@/lib/format';
import { annulerDemande } from './actions';

// « Acompte de 20 570 € · reste 2 j 04 h 12 min », mis à jour chaque minute
export function Decompte({ langue, montant, expire }: { langue: Langue; montant: string; expire: string | null }) {
  const [, battre] = useState(0);
  useEffect(() => { const x = setInterval(() => battre((n) => n + 1), 60_000); return () => clearInterval(x); }, []);
  return <p className="decompte" suppressHydrationWarning>{dico(langue).espace.acompteReste(montant, reste(expire, langue))}</p>;
}

// Annuler une demande en attente : boîte de dialogue au style du site, puis confirmation
export function AnnulerDemande({ langue, id, yacht, dates }: { langue: Langue; id: string; yacht: string; dates: string }) {
  const t = dico(langue).espace.annuler;
  const router = useRouter();
  const notifier = useNotifier();
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoi, demarrer] = useTransition();
  return (
    <>
      <button className="lien lien--discret" type="button" onClick={() => setOuvert(true)}>{dico(langue).espace.annulerDemande}</button>
      <Dialogue ouvert={ouvert} onFermer={() => { setOuvert(false); setErreur(''); }} titre={t.titre(yacht)} actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={() => setOuvert(false)}>{t.garder}</button>
        <button className={`btn btn--danger btn--petit${envoi ? ' is-envoi' : ''}`} type="button" disabled={envoi} onClick={() => demarrer(async () => {
          const r = await annulerDemande(id);
          if (!r.ok) { setErreur(r.code === 'impossible' ? dico(langue).detail.annulationTexte.apres : dico(langue).espace.erreur.texte); return; }
          setOuvert(false); notifier(t.fait(yacht)); router.refresh();
        })}>{t.confirmer}</button></>}>
        <p className="second">{t.texte(dates)}</p>
        {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
      </Dialogue>
    </>
  );
}
