'use client';
// Barre du haut : titre de la page, recherche globale (résultats groupés dès la 2e lettre, Entrée ouvre le premier)
// et menu « + Nouveau » (bloquer des dates, ajouter un yacht).
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { rechercher } from '../actions';
import { BoutonEcrit } from '@/components/Demo';
import { BADGE, libelleStatut, type Statut } from '@/lib/statuts';
import { plage } from '@/lib/format';

type Res = Awaited<ReturnType<typeof rechercher>>;

export function Haut({ titre }: { titre: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [brut, setRes] = useState<Res | null>(null);
  const res = q.trim().length >= 2 ? brut : null;
  const [nouveau, setNouveau] = useState(false);
  const [, demarrer] = useTransition();
  const champ = useRef<HTMLInputElement>(null);

  // « / » place le curseur dans la recherche
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName)) { e.preventDefault(); champ.current?.focus(); }
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(() => demarrer(async () => setRes(await rechercher(q))), 180);
    return () => clearTimeout(t);
  }, [q]);

  const liens = res ? [
    ...res.clients.map((c) => `/direction/clients?client=${c.id}`),
    ...res.reservations.map((r) => `/direction/reservations?ref=${r.reference}&filtre=toutes`),
    ...res.yachts.map((y) => `/direction/yachts/${y.slug}`),
  ] : [];
  const fermer = () => { setQ(''); setRes(null); };

  return (
    <header className="haut">
      <h1>{titre}</h1>
      <div className="recherche" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setTimeout(() => setRes(null), 150); }}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
        <input ref={champ} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher : PTL-, client, e-mail, yacht"
          aria-label="Recherche globale" role="combobox" aria-expanded={!!res} aria-controls="resultats-recherche"
          onKeyDown={(e) => { if (e.key === 'Enter' && liens[0]) { router.push(liens[0]); fermer(); } if (e.key === 'Escape') fermer(); }} />
        <kbd>/</kbd>
        {res && (
          <div className="menu-d" id="resultats-recherche" role="listbox">
            {!res.clients.length && !res.reservations.length && !res.yachts.length && <p className="menu-d__titre" style={{ paddingBottom: '.75rem' }}>Aucun résultat</p>}
            {res.clients.length > 0 && <p className="menu-d__titre">Clients</p>}
            {res.clients.map((c) => (
              <Link key={c.id} href={`/direction/clients?client=${c.id}`} onClick={fermer}>
                <b style={{ fontWeight: 500 }}>{c.prenom} {c.nom}</b><span className="second">{c.email} · {c.reservations} réservation{c.reservations > 1 ? 's' : ''}</span>
              </Link>
            ))}
            {res.reservations.length > 0 && <p className="menu-d__titre">Réservations</p>}
            {res.reservations.map((r) => (
              <Link key={r.id} href={`/direction/reservations?ref=${r.reference}&filtre=toutes`} onClick={fermer}>
                {r.reference} · <em style={{ marginLeft: '.3rem' }}>{r.yacht_nom}</em>
                <span className="second">{plage(r.debut, r.fin)} · {r.type === 'blocage' ? 'Blocage' : libelleStatut(r.statut as Statut)}</span>
              </Link>
            ))}
            {res.yachts.length > 0 && <p className="menu-d__titre">Yachts</p>}
            {res.yachts.map((y) => (
              <Link key={y.slug} href={`/direction/yachts/${y.slug}`} onClick={fermer}><em>{y.nom}</em><span className="second">{y.fiche?.chantier}</span></Link>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: 'relative' }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setNouveau(false); }}>
        <BoutonEcrit className="btn btn--plein btn--petit" aria-expanded={nouveau} onClick={() => setNouveau((v) => !v)}>+ Nouveau</BoutonEcrit>
        {nouveau && (
          <div className="menu-d">
            <Link href="/direction/reservations?bloquer=1" onClick={() => setNouveau(false)}>Bloquer des dates</Link>
            <Link href="/direction/yachts?ajouter=1" onClick={() => setNouveau(false)}>Ajouter un yacht</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function Badge({ statut }: { statut: Statut }) {
  return <span className={`badge ${BADGE[statut]}`}>{libelleStatut(statut)}</span>;
}
