'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Badge } from '../Haut';
import { Dialogue } from '@/components/Dialogue';
import { BoutonEcrit } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { bloquerDates, chevauchement } from '../../actions';
import { capitale, moisAnnee, plage } from '@/lib/format';
import type { Statut } from '@/lib/statuts';

type Ligne = { id: string; reference: string; yacht: string; client: string; plage: string; nuits: number; montant: string; statut: Statut; type: string; echeance: string };

function useParam() {
  const router = useRouter();
  const sp = useSearchParams();
  return (modif: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(modif)) { if (v) p.set(k, v); else p.delete(k); }
    p.delete('action'); p.delete('bloquer');
    router.push(`/direction/reservations?${p.toString()}`, { scroll: false });
  };
}

export function TableReservations({ lignes, choisie, desc }: { lignes: Ligne[]; choisie?: string; desc: boolean }) {
  const aller = useParam();
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="tab tab--mobile">
        <thead><tr>
          <th>Réf.</th><th>Yacht</th><th>Client</th>
          <th aria-sort={desc ? 'descending' : 'ascending'}><button type="button" onClick={() => aller({ tri: desc ? null : 'desc' })}>Embarquement → retour {desc ? '↓' : '↑'}</button></th>
          <th className="nb">Nuits</th><th className="nb">Montant</th><th>Statut</th><th>Échéance</th>
        </tr></thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.id} className={l.reference === choisie ? 'is-choisie' : ''} style={{ cursor: 'pointer' }}
              onClick={() => aller({ ref: l.reference })} tabIndex={0} aria-selected={l.reference === choisie}
              onKeyDown={(e) => { if (e.key === 'Enter') aller({ ref: l.reference }); }}>
              <td style={{ whiteSpace: 'nowrap' }}>{l.reference}</td>
              <td className="serif"><em>{l.yacht}</em></td>
              <td>{l.client}</td>
              <td className="cache-m">{l.plage}</td>
              <td className="nb cache-m">{l.nuits}</td>
              <td className="nb">{l.montant}</td>
              <td>{l.type === 'blocage' ? <span className="badge badge--neutre">Blocage</span> : <Badge statut={l.statut} />}</td>
              <td className="cache-m second">{l.echeance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FiltresReservations({ yacht, mois, yachts, moisSaison }: { yacht: string; mois: string; yachts: { slug: string; nom: string }[]; moisSaison: string[] }) {
  const aller = useParam();
  return (
    <>
      <div className="champ" style={{ minWidth: '11rem' }}>
        <label htmlFor="f-yacht">Yacht</label>
        <select id="f-yacht" value={yacht} onChange={(e) => aller({ yacht: e.target.value || null, ref: null })}>
          <option value="">Tous les yachts</option>
          {yachts.map((y) => <option key={y.slug} value={y.slug}>{y.nom}</option>)}
        </select>
      </div>
      <div className="champ" style={{ minWidth: '11rem' }}>
        <label htmlFor="f-mois">Embarquement</label>
        <select id="f-mois" value={mois} onChange={(e) => aller({ mois: e.target.value || null, ref: null })}>
          <option value="">Tous les mois</option>
          {moisSaison.map((m) => <option key={m} value={m}>{capitale(moisAnnee(m + '-15'))}</option>)}
        </select>
      </div>
    </>
  );
}

const MOTIFS = [['entretien', 'Entretien'], ['proprietaire', 'Propriétaire'], ['autre', 'Autre']] as const;

export function BoutonBloquer({ yachts, ouvert: ouvertInitial, prerempli }: {
  yachts: { slug: string; nom: string }[]; ouvert?: boolean; prerempli?: { yacht: string; debut: string; fin: string };
}) {
  const notifier = useNotifier();
  const router = useRouter();
  const [ouvert, setOuvert] = useState(!!ouvertInitial || !!prerempli);
  const [yacht, setYacht] = useState(prerempli?.yacht ?? yachts[0]?.slug ?? '');
  const [motif, setMotif] = useState('entretien');
  const [debut, setDebut] = useState(prerempli?.debut ?? '');
  const [fin, setFin] = useState(prerempli?.fin ?? '');
  const [note, setNote] = useState('');
  const [conflit, setConflit] = useState<{ reference: string; debut: string; fin: string } | null>(null);
  const [erreur, setErreur] = useState('');
  const [envoi, demarrer] = useTransition();

  useEffect(() => {
    let actif = true;
    chevauchement(yacht, debut, fin).then((c) => { if (actif) setConflit(c); });
    return () => { actif = false; };
  }, [yacht, debut, fin]);

  const fermer = () => { setOuvert(false); setErreur(''); };
  return (
    <>
      {!prerempli && <BoutonEcrit className="btn btn--filet btn--petit" style={{ marginLeft: 'auto' }} onClick={() => setOuvert(true)}>Bloquer des dates</BoutonEcrit>}
      <Dialogue ouvert={ouvert} onFermer={fermer} titre="Bloquer des dates" actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={fermer}>Retour</button>
        <BoutonEcrit className={`btn btn--plein btn--petit${envoi ? ' is-envoi' : ''}`} disabled={!!conflit || envoi || !debut || !fin}
          onClick={() => demarrer(async () => {
            const r = await bloquerDates(yacht, debut, fin, motif, note);
            if (!r.ok) { setErreur(r.erreur); return; }
            fermer(); notifier(`Dates bloquées sur ${yachts.find((y) => y.slug === yacht)?.nom} · ${plage(debut, fin)}`); router.refresh();
          })}>Bloquer</BoutonEcrit>
      </>}>
        <div className="champs">
          <div className="champ"><label htmlFor="b-yacht">Yacht</label>
            <select id="b-yacht" value={yacht} onChange={(e) => setYacht(e.target.value)}>{yachts.map((y) => <option key={y.slug} value={y.slug}>{y.nom}</option>)}</select></div>
          <fieldset className="champ" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="champ__label" style={{ fontSize: 'var(--t-xs)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Motif</legend>
            <p style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
              {MOTIFS.map(([v, l]) => <button key={v} type="button" className="chip" aria-pressed={motif === v} onClick={() => setMotif(v)}>{l}</button>)}
            </p>
          </fieldset>
          <div className="champs champs--2">
            <div className="champ"><label htmlFor="b-du">Du</label><input id="b-du" type="date" value={debut} onChange={(e) => setDebut(e.target.value)} /></div>
            <div className="champ"><label htmlFor="b-au">Au</label><input id="b-au" type="date" value={fin} min={debut} onChange={(e) => setFin(e.target.value)} aria-invalid={!!conflit || undefined} /></div>
          </div>
          <div className="champ"><label htmlFor="b-note">Note</label><input id="b-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Carénage au chantier, famille du propriétaire…" /></div>
        </div>
        {conflit && <p className="bandeau-info bandeau-info--alerte" role="alert">Ces dates chevauchent {conflit.reference.startsWith('PTL') ? 'la réservation' : ''} {conflit.reference} ({plage(conflit.debut, conflit.fin)}).</p>}
        {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
      </Dialogue>
    </>
  );
}
