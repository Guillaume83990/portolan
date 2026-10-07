'use client';
// Mon espace sans session : présentation et accès à la fenêtre de compte.
// Site de démonstration : un bouton ouvre le compte client fictif partagé (session ouverte par le serveur).
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { FenetreCompte } from '@/components/espace/FenetreCompte';
import { Turnstile, type TurnstileApi } from '@/components/Turnstile';
import { entrerDemo } from '@/lib/demo/entrer';
import { dico } from '@/lib/i18n';
import type { Langue } from '@/lib/format';

const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true';

// retour : fiche d'un yacht où le visiteur reprend sa réservation une fois connecté (validée par la page)
export function Porte({ langue, lienInvalide, retour }: { langue: Langue; lienInvalide?: boolean; retour?: string | null }) {
  const t = dico(langue).auth;
  const router = useRouter();
  const [vue, setVue] = useState<null | 'connexion' | 'creation'>(retour ? 'connexion' : null);
  const [erreur, setErreur] = useState('');
  const [envoi, demarrer] = useTransition();
  const robot = useRef<TurnstileApi>(null);

  // Compte client : on reste dans Mon espace ; compte directeur (lecture seule) : on ouvre l'espace directeur
  const essayer = (compte: 'client' | 'directeur') => demarrer(async () => {
    setErreur('');
    const r = await entrerDemo(compte, async () => { const j = await robot.current?.jeton(); robot.current?.reinitialiser(); return j; });
    if (!r.ok) { setErreur(r.code === 'robot' ? t.erreurs.robot : t.porte.demo.indisponible); return; }
    if (compte === 'directeur') router.push('/direction/tableau-de-bord'); else if (retour) location.assign(retour); else router.refresh();
  });

  return (
    <main className="esp">
      <h1 className="esp__bonjour">{t.porte.titre}</h1>
      <p className="esp__sous">{t.porte.texte}</p>
      {retour && (
        <div className="bandeau-info" style={{ marginTop: '1.5rem', maxWidth: '40rem' }}>
          <strong>{t.porte.reserver.titre}</strong> {t.porte.reserver.texte} <a href={retour}>{t.porte.reserver.annuler}</a>
        </div>
      )}
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
      <FenetreCompte key={vue ?? 'ferme'} langue={langue} ouvert={vue !== null} vueInitiale={vue ?? 'connexion'} onFermer={() => setVue(null)} apres={retour}
        raison={retour ? t.porte.reserver.texte : undefined} />
    </main>
  );
}
