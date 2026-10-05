'use client';
// Actions sur une réservation, selon son statut, avec les boîtes de dialogue des maquettes (lot 4, états).
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Dialogue } from '@/components/Dialogue';
import { BoutonEcrit, useDemo } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { euros } from '@/lib/format';
import type { Statut } from '@/lib/statuts';
import {
  annulerReservation, enregistrerNotes, libererBlocage, marquerPaiement, prolongerOption, refuserReservation, relancerPaiement, validerReservation,
} from '../../actions';

type R = { id: string; reference: string; type: string; statut: Statut; client: string; acompte: number; solde: number; apa: number; montant: number; regle: number; debut: string };
type Boite = null | 'valider' | 'refuser' | 'paiement' | 'annuler' | 'liberer';

function B({ c, onClick, envoi, children }: { c: string; onClick: () => void; envoi: boolean; children: React.ReactNode }) {
  return <BoutonEcrit className={`btn ${c} btn--petit`} onClick={onClick} disabled={envoi}>{children}</BoutonEcrit>;
}

export function ActionsReservation({ r, demo, auto }: { r: R; demo: boolean; auto: string }) {
  const router = useRouter();
  const notifier = useNotifier();
  const [boite, setBoite] = useState<Boite>(!demo && (auto === 'valider' || auto === 'refuser') ? auto : null);
  const [envoi, demarrer] = useTransition();
  const [erreur, setErreur] = useState('');
  const fermer = () => { setBoite(null); setErreur(''); };


  const agir = (fn: () => Promise<{ ok: boolean; erreur?: string }>, succes: string) => demarrer(async () => {
    const res = await fn();
    if (!res.ok) { setErreur(res.erreur ?? ''); if (!boite) notifier(res.erreur ?? ''); return; }
    fermer(); notifier(succes); router.refresh();
  });

  // Valider / refuser
  const acompte = r.acompte || Math.round(r.montant / 2);
  const [mot, setMot] = useState('');
  const [motif, setMotif] = useState('');
  const [motifTouche, setMotifTouche] = useState(false);
  // Paiement manuel
  const resteAcompte = Math.max(0, acompte - r.regle);
  const typeDefaut = r.statut === 'a_payer' ? 'acompte' : 'solde';
  const [pType, setPType] = useState(typeDefaut);
  const [pMontant, setPMontant] = useState(String(r.statut === 'a_payer' ? resteAcompte : Math.max(0, r.montant + r.apa - r.regle)));
  const [pMethode, setPMethode] = useState('virement');
  const [pDate, setPDate] = useState(new Date().toISOString().slice(0, 10));
  const [pJustif, setPJustif] = useState('');
  // Annulation
  const [aMontant, setAMontant] = useState('0');
  const [aMotif, setAMotif] = useState('');
  const [aPrevenir, setAPrevenir] = useState(true);
  const [aConfirm, setAConfirm] = useState('');

  if (r.type === 'blocage') {
    return (
      <div className="barre-actions">
        <B envoi={envoi} c="btn--danger" onClick={() => setBoite('liberer')}>Libérer les dates</B>
        <Dialogue ouvert={boite === 'liberer'} onFermer={fermer} titre={`Libérer ${r.reference} ?`} actions={<>
          <button className="btn btn--filet btn--petit" type="button" onClick={fermer}>Retour</button>
          <B envoi={envoi} c="btn--danger" onClick={() => agir(() => libererBlocage(r.id), `Dates libérées · ${r.reference}`)}>Libérer</B></>}>
          <p className="second">Les dates redeviennent disponibles à la réservation sur le site.</p>
          {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
        </Dialogue>
      </div>
    );
  }

  return (
    <>
      <div className="barre-actions">
        {r.statut === 'en_attente' && <>
          <B envoi={envoi} c="btn--plein" onClick={() => setBoite('valider')}>Valider la demande</B>
          <B envoi={envoi} c="btn--danger" onClick={() => setBoite('refuser')}>Refuser</B>
        </>}
        {r.statut === 'a_payer' && <>
          <B envoi={envoi} c="btn--filet" onClick={() => agir(() => relancerPaiement(r.id), `Lien de paiement renvoyé à ${r.client} · voir la boîte d’envoi`)}>Renvoyer le lien de paiement</B>
          <B envoi={envoi} c="btn--filet" onClick={() => agir(() => prolongerOption(r.id, 24), `Délai prolongé de 24 h · ${r.reference}`)}>Prolonger +24&nbsp;h</B>
          <B envoi={envoi} c="btn--filet" onClick={() => agir(() => prolongerOption(r.id, 48), `Délai prolongé de 48 h · ${r.reference}`)}>Prolonger +48&nbsp;h</B>
          <B envoi={envoi} c="btn--filet" onClick={() => setBoite('paiement')}>Marquer l&apos;acompte comme reçu</B>
          <B envoi={envoi} c="btn--danger" onClick={() => setBoite('annuler')}>Annuler</B>
        </>}
        {(r.statut === 'confirmee' || r.statut === 'soldee') && <>
          {r.statut === 'confirmee' && <B envoi={envoi} c="btn--filet" onClick={() => agir(() => relancerPaiement(r.id), `Appel de solde envoyé à ${r.client} · voir la boîte d’envoi`)}>Envoyer l&apos;appel de solde maintenant</B>}
          {r.statut === 'confirmee' && <B envoi={envoi} c="btn--filet" onClick={() => setBoite('paiement')}>Marquer un paiement reçu</B>}
          <B envoi={envoi} c="btn--danger" onClick={() => setBoite('annuler')}>Annuler et rembourser</B>
        </>}
      </div>

      <Dialogue ouvert={boite === 'valider'} onFermer={fermer} titre={<>Valider {r.reference}&#8239;?</>} actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={fermer}>Retour</button>
        <B envoi={envoi} c={`btn--plein${envoi ? ' is-envoi' : ''}`} onClick={() => agir(() => validerReservation(r.id, mot), `Réservation ${r.reference} validée · lien d’acompte envoyé à ${r.client}`)}>Valider</B></>}>
        <p className="second">{r.client} reçoit un e-mail et peut régler l&apos;acompte de <b style={{ color: 'var(--texte)', fontWeight: 500 }}>{euros(acompte)}</b> sous 72&nbsp;h depuis son espace&#8239;; les dates lui restent réservées pendant ce délai.</p>
        <div className="champ"><label htmlFor="v-mot">Mot au client <small>(facultatif)</small></label><textarea id="v-mot" rows={2} value={mot} onChange={(e) => setMot(e.target.value)} /></div>
        {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
      </Dialogue>

      <Dialogue ouvert={boite === 'refuser'} onFermer={fermer} titre={<>Refuser {r.reference}&#8239;?</>} actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={fermer}>Retour</button>
        <B envoi={envoi} c={`btn--danger${envoi ? ' is-envoi' : ''}`} onClick={() => { setMotifTouche(true); if (motif.trim()) agir(() => refuserReservation(r.id, motif), `Réservation ${r.reference} refusée · dates libérées`); }}>Refuser</B></>}>
        <p className="second">Les dates seront libérées et le motif sera visible par le client dans son espace.</p>
        <div className="champ"><label htmlFor="r-motif">Motif</label>
          <textarea id="r-motif" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} onBlur={() => setMotifTouche(true)} aria-invalid={motifTouche && !motif.trim() ? true : undefined} aria-describedby="r-motif-err" />
          {motifTouche && !motif.trim() && <p className="champ__erreur" id="r-motif-err">Le motif est obligatoire.</p>}
        </div>
        {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
      </Dialogue>

      <Dialogue ouvert={boite === 'paiement'} onFermer={fermer} titre={r.statut === 'a_payer' ? `Acompte reçu pour ${r.reference}` : `Paiement reçu pour ${r.reference}`} actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={fermer}>Retour</button>
        <B envoi={envoi} c={`btn--plein${envoi ? ' is-envoi' : ''}`} onClick={() => agir(() => marquerPaiement(r.id, pType, Number(pMontant.replace(/\D/g, '')), pMethode, pDate, pJustif), `Paiement de ${euros(Number(pMontant.replace(/\D/g, '')))} enregistré · ${r.reference}`)}>Enregistrer le paiement</B></>}>
        <div className="champs champs--2">
          {r.statut !== 'a_payer' && <div className="champ"><label htmlFor="p-type">Échéance</label>
            <select id="p-type" value={pType} onChange={(e) => setPType(e.target.value)}><option value="solde">Solde</option><option value="apa">APA</option><option value="total">Solde et APA</option></select></div>}
          <div className="champ"><label htmlFor="p-montant">Montant (€)</label><input id="p-montant" inputMode="numeric" value={pMontant} onChange={(e) => setPMontant(e.target.value)} /></div>
          <div className="champ"><label htmlFor="p-moyen">Moyen</label>
            <select id="p-moyen" value={pMethode} onChange={(e) => setPMethode(e.target.value)}><option value="virement">Virement</option><option value="carte">Carte (terminal)</option><option value="manuel">Autre</option></select></div>
          <div className="champ"><label htmlFor="p-date">Date</label><input id="p-date" type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} /></div>
          <div className="champ"><label htmlFor="p-justif">Justificatif <small>(facultatif)</small></label><input id="p-justif" value={pJustif} onChange={(e) => setPJustif(e.target.value)} placeholder="avis-virement.pdf" /></div>
        </div>
        {r.statut === 'a_payer' && <p className="bandeau-info">La réservation passera en « Confirmée » : le contrat et la facture sont générés et envoyés au client automatiquement.</p>}
        {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
      </Dialogue>

      <Dialogue ouvert={boite === 'annuler'} onFermer={fermer} titre={r.regle > 0 ? `Annuler et rembourser ${r.reference}` : `Annuler ${r.reference}`} actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={fermer}>Retour</button>
        <B envoi={envoi} c={`btn--danger${envoi ? ' is-envoi' : ''}`} onClick={() => { if (aConfirm.trim().toUpperCase() === r.reference) agir(() => annulerReservation(r.id, aMotif, Math.min(r.regle, Number(aMontant.replace(/\D/g, '')) || 0), aPrevenir), `Réservation ${r.reference} annulée`); else setErreur(`Tapez ${r.reference} pour confirmer.`); }}>Annuler la réservation</B></>}>
        <dl className="paires"><div><dt>Encaissé</dt><dd>{r.regle > 0 ? euros(r.regle) : 'Rien n’a été encaissé'}</dd></div></dl>
        {r.regle > 0 && (
          <div className="champ"><label htmlFor="a-montant">Montant à rembourser (0 à {euros(r.regle)})</label>
            <input id="a-montant" inputMode="numeric" value={aMontant} onChange={(e) => setAMontant(e.target.value)} />
            <p className="champ__aide">Contrat MYBA&#8239;: l&apos;acompte reste acquis sauf relocation.</p></div>
        )}
        <div className="champ"><label htmlFor="a-motif">Motif</label><input id="a-motif" value={aMotif} onChange={(e) => setAMotif(e.target.value)} /></div>
        <label className="inter" style={{ marginTop: '.25rem' }}><input type="checkbox" checked={aPrevenir} onChange={(e) => setAPrevenir(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem' }} /> Prévenir le client par e-mail</label>
        <div className="champ"><label htmlFor="a-conf">Tapez {r.reference} pour confirmer</label><input id="a-conf" value={aConfirm} onChange={(e) => setAConfirm(e.target.value)} autoComplete="off" /></div>
        {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
      </Dialogue>
    </>
  );
}

export function NotesReservation({ id, interne, mot }: { id: string; interne: string; mot: string }) {
  const demo = useDemo();
  const notifier = useNotifier();
  const [a, setA] = useState(interne);
  const [b, setB] = useState(mot);
  const [, demarrer] = useTransition();
  const sauver = () => {
    if (demo || (a === interne && b === mot)) return;
    demarrer(async () => { const r = await enregistrerNotes(id, a, b); notifier(r.ok ? 'Notes enregistrées' : r.erreur); });
  };
  return (
    <div className="champs">
      <div className="champ"><label htmlFor="n-int">Note interne <small>(direction seulement)</small></label>
        <textarea id="n-int" rows={2} value={a} onChange={(e) => setA(e.target.value)} onBlur={sauver} readOnly={demo} /></div>
      <div className="champ"><label htmlFor="n-mot">Mot au client <small>(visible dans son espace)</small></label>
        <textarea id="n-mot" rows={2} value={b} onChange={(e) => setB(e.target.value)} onBlur={sauver} readOnly={demo} /></div>
    </div>
  );
}

export function ContactClient({ telephone, email, reference, yacht, demo }: { telephone: string; email: string; reference: string; yacht: string; demo: boolean }) {
  if (demo) return null;
  const chiffres = telephone.replace(/[^\d+]/g, '');
  const sujet = encodeURIComponent(`Votre réservation ${reference} · ${yacht}`);
  return (
    <p style={{ display: 'flex', gap: '.5rem', marginTop: '.9rem', flexWrap: 'wrap' }}>
      {telephone && <a className="btn btn--filet btn--petit" href={`tel:${chiffres}`}>Appeler</a>}
      {telephone && <a className="btn btn--filet btn--petit" href={`https://wa.me/${chiffres.replace('+', '')}`} target="_blank" rel="noopener">WhatsApp</a>}
      <a className="btn btn--filet btn--petit" href={`mailto:${email}?subject=${sujet}`}>E-mail</a>
    </p>
  );
}
