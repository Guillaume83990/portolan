'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { cheminEspace, dico } from '@/lib/i18n';
import type { Langue } from '@/lib/format';
import { nouveauMotDePasse } from '../actions';

export function FormulaireNouveau({ langue }: { langue: Langue }) {
  const t = dico(langue);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [erreur, setErreur] = useState('');
  const [fait, setFait] = useState(false);
  const [envoi, demarrer] = useTransition();
  if (fait) return <><p className="bandeau-info" role="status" style={{ marginTop: '2rem' }}>{t.auth.nouveauMdp.fait}</p><p style={{ marginTop: '1.5rem' }}><Link className="btn btn--plein" href={cheminEspace(langue)}>{t.auth.confirme.bouton}</Link></p></>;
  return (
    <form className="champs" style={{ marginTop: '2rem' }} noValidate onSubmit={(e) => {
      e.preventDefault();
      if (a.length < 8) { setErreur(t.auth.erreurs.court); return; }
      if (a !== b) { setErreur(t.compte.differents); return; }
      setErreur('');
      demarrer(async () => { const r = await nouveauMotDePasse(a); if (r.ok) setFait(true); else setErreur(t.auth.nouveauMdp.lienInvalide); });
    }}>
      <div className="champ"><label htmlFor="n1">{t.auth.nouveauMdp.nouveau}</label><input id="n1" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} /><p className="champ__aide">{t.auth.regle}</p></div>
      <div className="champ"><label htmlFor="n2">{t.auth.nouveauMdp.confirmation}</label><input id="n2" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} aria-invalid={erreur ? true : undefined} /></div>
      {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
      <p><button className={`btn btn--plein${envoi ? ' is-envoi' : ''}`} type="submit" disabled={envoi}>{t.auth.nouveauMdp.valider}</button></p>
    </form>
  );
}
