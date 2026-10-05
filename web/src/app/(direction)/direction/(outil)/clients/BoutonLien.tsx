'use client';
import { useRef, useTransition } from 'react';
import { useNotifier } from '@/components/Notifications';
import { Turnstile, type TurnstileApi } from '@/components/Turnstile';
import { renvoyerLienConnexion } from '../../actions';

// Lien de connexion envoyé au client : Supabase exige un jeton anti-robot (Turnstile) pour tout envoi de lien
export function BoutonLien({ email }: { email: string }) {
  const notifier = useNotifier();
  const [envoi, demarrer] = useTransition();
  const robot = useRef<TurnstileApi>(null);
  return (
    <>
      <button className={`btn btn--filet btn--petit${envoi ? ' is-envoi' : ''}`} type="button" disabled={envoi} style={{ marginTop: '.9rem' }}
        onClick={() => demarrer(async () => {
          const j = await robot.current?.jeton(); robot.current?.reinitialiser();
          const r = await renvoyerLienConnexion(email, j);
          notifier(r.ok ? `Lien de connexion envoyé à ${email}` : r.erreur);
        })}>
        Renvoyer le lien de connexion
      </button>
      <Turnstile ref={robot} />
    </>
  );
}
