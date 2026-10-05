'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { BoutonEcrit } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { changerStatutDemande, desinscrire } from '../../actions';
import { dateMoyenne } from '@/lib/format';

const STATUTS = [['nouvelle', 'Nouvelle'], ['en_cours', 'En cours'], ['gagnee', 'Gagnée'], ['perdue', 'Perdue']] as const;

export function StatutDemande({ id, statut }: { id: string; statut: string }) {
  const router = useRouter();
  const notifier = useNotifier();
  const [, demarrer] = useTransition();
  return (
    <p style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }} role="group" aria-label="Statut de la demande">
      {STATUTS.map(([s, l]) => (
        <BoutonEcrit key={s} className="chip" aria-pressed={statut === s} onClick={() => demarrer(async () => {
          const r = await changerStatutDemande(id, s); notifier(r.ok ? `Demande passée en « ${l} »` : r.erreur); router.refresh();
        })}>{l}</BoutonEcrit>
      ))}
    </p>
  );
}

export function FiltreType({ type, types }: { type: string; types: [string, string][] }) {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <div className="champ" style={{ marginLeft: 'auto', minWidth: '11rem' }}>
      <label htmlFor="f-type">Type</label>
      <select id="f-type" value={type} onChange={(e) => {
        const p = new URLSearchParams(sp.toString()); p.delete('demande');
        if (e.target.value) p.set('type', e.target.value); else p.delete('type');
        router.push(`/direction/demandes?${p}`);
      }}>
        <option value="">Tous les types</option>
        {types.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </div>
  );
}

const LANGUES: Record<string, string> = { fr: 'Français', en: 'Anglais', de: 'Allemand', it: 'Italien' };

export function HorsMarche({ inscrits, demo }: { inscrits: { id: string; email: string; langue: string; cree_le: string }[]; demo: boolean }) {
  const router = useRouter();
  const notifier = useNotifier();
  const [, demarrer] = useTransition();
  const exporter = () => {
    const csv = ['email;langue;inscription', ...inscrits.map((i) => `${i.email};${i.langue};${i.cree_le.slice(0, 10)}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `portolan-hors-marche-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', alignItems: 'center', margin: '1.25rem 0' }}>
        <p className="second" style={{ fontSize: 'var(--t-s)' }}>{inscrits.length} personne{inscrits.length > 1 ? 's' : ''} attendent d&apos;être prévenues, en confidence, des yachts hors marché.</p>
        {!demo && inscrits.length > 0 && <button className="btn btn--filet btn--petit" type="button" style={{ marginLeft: 'auto' }} onClick={exporter}>Exporter (CSV)</button>}
      </div>
      <table className="tab tab--mobile">
        <thead><tr><th>E-mail</th><th>Langue</th><th>Inscription</th><th /></tr></thead>
        <tbody>{inscrits.map((i) => (
          <tr key={i.id}>
            <td>{i.email}</td><td className="cache-m">{LANGUES[i.langue] ?? i.langue}</td><td className="second">{dateMoyenne(i.cree_le)}</td>
            <td><BoutonEcrit className="lien lien--discret" style={{ fontSize: 'var(--t-xs)' }} onClick={() => demarrer(async () => {
              const r = await desinscrire(i.id); notifier(r.ok ? 'Désinscription enregistrée' : r.erreur); router.refresh();
            })}>Désinscrire</BoutonEcrit></td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}
