'use client';
import { useTransition } from 'react';
import { BoutonEcrit } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { relancerPaiement } from '../../actions';

// Relance d'un paiement : e-mail au client dans sa langue (acompte attendu, ou solde et APA), noté dans l'historique
export function BoutonRelance({ id }: { id: string }) {
  const notifier = useNotifier();
  const [envoi, demarrer] = useTransition();
  return (
    <BoutonEcrit className={`btn btn--filet btn--petit${envoi ? ' is-envoi' : ''}`} disabled={envoi}
      onClick={() => demarrer(async () => {
        const r = await relancerPaiement(id);
        notifier(r.ok ? 'Relance envoyée au client · visible dans la boîte d’envoi' : r.erreur);
      })}>Relancer</BoutonEcrit>
  );
}
