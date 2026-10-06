'use client';
// Mon espace sans session : présentation et accès à la fenêtre de compte.
// Site de démonstration : un bouton ouvre le compte client fictif partagé (session ouverte par le serveur).
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { FenetreCompte } from '@/components/espace/FenetreCompte';
import { Turnstile, type TurnstileApi } from '@/components/Turnstile';
import { connexionDemo } from '@/lib/demo/actions';
import { dico } from '@/lib/i18n';
import type { Langue } from '@/lib/format';

const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true';

export function Porte({ langue, lienInvalide }: { langue: Langue; lienInvalide?: boolean }) {
  const t = dico(langue).auth;
  const router = useRouter();
  const [vue, setVue] = useState<null | 'connexion' | 'creation'>(null);
  const [erreur, setErreur] = useState('');
  const [envoi, demarrer] = useTransition();
  const robot = useRef<TurnstileApi>(null);

  // Compte client : on reste dans Mon espace ; compte directeur (lecture seule) : on ouvre l'espace directeur
  const essayer = (compte: 'client' | 'directeur') => demarrer(async () => {
    setErreur('');
    const j = await robot.current?.jeton(); robot.current?.reinitialiser();
    const r = await connexionDemo(compte, j);
    if (!r.ok) { setErreur(r.code === 'robot' ? t.erreurs.robot : t.porte.demo.indisponible); return; }
    if (compte === 'directeur') router.push('/direction/tableau-de-bord'); else router.refresh();
  });

  return (
    <main className="esp">
      <h1 className="esp__bonjour">{t.porte.titre}</h1>
      <p className="esp__sous">{t.porte.texte}</p>
      {lienInvalide && <p className="bandeau-info bandeau-info--alerte" role="alert" style={{ marginTop: '1.5rem', maxWidth: '40rem' }}>{t.nouveauMdp.lienInvalide}</p>}
      <p style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        <button className="btn btn--plein" type="button" onClick={() => setVue('connexion')}>{t.porte.connecter}</button>
        <button className="btn btn--filet" type="button" onClick={() => setVue('creation')}>{t.porte.creer}</button>
      </p>
      {DEMO && (
        <section className="carte" style={{ marginTop: '2.5rem', padding: '1.5rem', maxWidth: '64rem' }} aria-labelledby="porte-demo">
          <p className="titre-xs" id="porte-demo">{t.porte.demo.titre}</p>
          <p className="second" style={{ marginTop: '.5rem' }}>{t.porte.demo.texte}</p>
          <p style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
            <button className={`btn btn--filet${envoi ? ' is-envoi' : ''}`} type="button" onClick={() => essayer('client')} disabled={envoi}>{t.porte.demo.bouton}</button>
            <button className={`btn btn--filet${envoi ? ' is-envoi' : ''}`} type="button" onClick={() => essayer('directeur')} disabled={envoi}>{t.porte.demo.boutonDirecteur}</button>
          </p>
          {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
          <Turnstile ref={robot} langue={langue} />
        </section>
      )}
      <FenetreCompte key={vue ?? 'ferme'} langue={langue} ouvert={vue !== null} vueInitiale={vue ?? 'connexion'} onFermer={() => setVue(null)} />
    </main>
  );
}
