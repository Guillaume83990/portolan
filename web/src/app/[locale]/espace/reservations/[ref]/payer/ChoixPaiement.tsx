'use client';
// Choix du moyen de paiement (cartes de choix de la maquette) puis départ vers la page sécurisée de Stripe
import { useState, useTransition } from 'react';
import { dico } from '@/lib/i18n';
import type { Langue } from '@/lib/format';
import { payer } from './actions';

export function ChoixPaiement({ langue, reference, montant, carte, virement, initial }: {
  langue: Langue; reference: string; montant: string; carte: boolean; virement: boolean; initial?: 'carte' | 'virement';
}) {
  const t = dico(langue).paiement;
  const [moyen, setMoyen] = useState<'carte' | 'virement'>(initial ?? (carte ? 'carte' : 'virement'));
  const [erreur, setErreur] = useState(false);
  const [envoi, demarrer] = useTransition();
  const options = ([['carte', t.carte, t.carteTexte, carte], ['virement', t.virement, t.virementTexte, virement]] as const).filter(([, , , ok]) => ok);
  return (
    <>
      <fieldset style={{ border: 0, padding: 0, margin: '2.25rem 0 0', display: 'grid', gap: '1rem' }}>
        <legend className="titre-xs" style={{ marginBottom: '1rem' }}>{t.moyen}</legend>
        <div className="lead__cards" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 18rem), 1fr))` }}>
          {options.map(([cle, titre, texte]) => (
            <label key={cle} className="lead__card carte" style={{ borderColor: moyen === cle ? 'var(--texte)' : 'var(--filet-fort)', background: moyen === cle ? 'var(--surface)' : undefined, color: 'var(--texte)' }}>
              <input type="radio" name="moyen" checked={moyen === cle} onChange={() => setMoyen(cle)} />
              <span className="lead__card-t">{titre}</span>
              <span className="lead__card-d" style={{ color: 'var(--second)' }}>{texte}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div style={{ display: 'grid', gap: '.75rem', justifyItems: 'start', marginTop: '2rem' }}>
        <button className={`btn btn--plein${envoi ? ' is-envoi' : ''}`} type="button" disabled={envoi}
          onClick={() => demarrer(async () => { setErreur(false); const r = await payer(reference, moyen, langue); if (r && !r.ok) setErreur(true); })}>{t.payer(montant)}</button>
        <p className="second" style={{ fontSize: 'var(--t-xs)' }}>{t.securise}</p>
        {erreur && <p className="note is-erreur" role="alert">{t.erreur}</p>}
      </div>
    </>
  );
}
