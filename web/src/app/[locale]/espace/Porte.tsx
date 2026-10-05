'use client';
// Mon espace sans session : présentation et accès à la fenêtre de compte
import { useState } from 'react';
import { FenetreCompte } from '@/components/espace/FenetreCompte';
import { dico } from '@/lib/i18n';
import type { Langue } from '@/lib/format';

export function Porte({ langue, lienInvalide }: { langue: Langue; lienInvalide?: boolean }) {
  const t = dico(langue).auth;
  const [vue, setVue] = useState<null | 'connexion' | 'creation'>(null);
  return (
    <main className="esp">
      <h1 className="esp__bonjour">{t.porte.titre}</h1>
      <p className="esp__sous">{t.porte.texte}</p>
      {lienInvalide && <p className="bandeau-info bandeau-info--alerte" role="alert" style={{ marginTop: '1.5rem', maxWidth: '40rem' }}>{t.nouveauMdp.lienInvalide}</p>}
      <p style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        <button className="btn btn--plein" type="button" onClick={() => setVue('connexion')}>{t.porte.connecter}</button>
        <button className="btn btn--filet" type="button" onClick={() => setVue('creation')}>{t.porte.creer}</button>
      </p>
      <FenetreCompte key={vue ?? 'ferme'} langue={langue} ouvert={vue !== null} vueInitiale={vue ?? 'connexion'} onFermer={() => setVue(null)} />
    </main>
  );
}
