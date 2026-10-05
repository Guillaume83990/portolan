'use client';
// Traite tout de suite les événements en attente (sinon : après chaque action, et par la tâche planifiée)
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { BoutonEcrit } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { traiterMaintenant } from '../../actions';

export function TraiterMaintenant() {
  const router = useRouter();
  const notifier = useNotifier();
  const [envoi, demarrer] = useTransition();
  return (
    <BoutonEcrit className={`btn btn--filet btn--petit${envoi ? ' is-envoi' : ''}`} disabled={envoi}
      onClick={() => demarrer(async () => {
        const r = await traiterMaintenant();
        if (!r.ok) return notifier(r.erreur);
        const d = r.donnees!;
        notifier(`${d.traites} événement${d.traites > 1 ? 's' : ''} traité${d.traites > 1 ? 's' : ''}${d.erreurs ? `, ${d.erreurs} en erreur` : ''}${d.documents ? ` · ${d.documents} document${d.documents > 1 ? 's' : ''} généré${d.documents > 1 ? 's' : ''}` : ''}`);
        router.refresh();
      })}>Traiter maintenant</BoutonEcrit>
  );
}
