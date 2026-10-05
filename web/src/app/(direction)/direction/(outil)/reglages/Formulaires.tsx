'use client';
// Réglages : chaque section s'enregistre à part (saison, paiement, société, contrat, notifications, courtier)
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { BoutonEcrit, useDemo } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { enregistrerReglages, nouvelleVersionContrat } from '../../actions';
import type { Reglages as R } from '@/lib/direction/donnees';
import { dateLongue, dateMoyenne } from '@/lib/format';

type Version = { version: string; du: string; conditions: string; reservations: number };
const n = (s: string) => Number(String(s).replace(/[^\d]/g, '')) || 0;

function Section({ titre, aide, children }: { titre: string; aide: string; children: React.ReactNode }) {
  return <section className="reg"><div><h2>{titre}</h2><p>{aide}</p></div><div style={{ display: 'grid', gap: '1.25rem', maxWidth: '52rem' }}>{children}</div></section>;
}
function C({ id, label, v, set, type = 'text', aide, large, suffixe }: { id: string; label: string; v: string | number; set: (s: string) => void; type?: string; aide?: string; large?: boolean; suffixe?: string }) {
  return (
    <div className={`champ${large ? ' champ--large' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem' }}><input id={id} type={type} value={v} onChange={(e) => set(e.target.value)} style={{ flex: 1, minWidth: 0 }} />{suffixe && <span className="second" style={{ fontSize: 'var(--t-s)', whiteSpace: 'nowrap' }}>{suffixe}</span>}</span>
      {aide && <p className="champ__aide">{aide}</p>}
    </div>
  );
}

export function Reglages({ r, versions, equipe }: { r: R; versions: Version[]; equipe: { prenom: string; nom: string; email: string; role: string }[] }) {
  const router = useRouter();
  const notifier = useNotifier();
  const demo = useDemo();
  const [envoi, demarrer] = useTransition();
  const sauver = (modif: Record<string, unknown>, message: string) => demarrer(async () => {
    const res = await enregistrerReglages(modif); notifier(res.ok ? message : res.erreur); if (res.ok) router.refresh();
  });
  const Bouton = ({ onClick }: { onClick: () => void }) => <p><BoutonEcrit className={`btn btn--plein btn--petit${envoi ? ' is-envoi' : ''}`} disabled={envoi} onClick={onClick}>Enregistrer</BoutonEcrit></p>;

  // Saison
  const [s, setS] = useState({ annee: String(r.annee), saison_debut: r.saison_debut, saison_fin: r.saison_fin, haute_debut: r.haute_debut, haute_fin: r.haute_fin,
    min: `${r.min_nuits_haute} / ${r.min_nuits_basse}`, heure_min: r.heure_min.slice(0, 5), heure_max: r.heure_max.slice(0, 5) });
  const [ports, setPorts] = useState(r.ports);
  const [nouveauPort, setNouveauPort] = useState('');
  const [erreurSaison, setErreurSaison] = useState('');
  const sauverSaison = () => {
    const [mh, mb] = s.min.split('/').map((x) => n(x));
    if (s.saison_fin <= s.saison_debut || s.haute_fin <= s.haute_debut) { setErreurSaison('Chaque fin doit suivre son début.'); return; }
    if (!mh || !mb) { setErreurSaison('Indiquez les nuits minimum sous la forme « 7 / 3 ».'); return; }
    setErreurSaison('');
    sauver({ annee: n(s.annee), saison_debut: s.saison_debut, saison_fin: s.saison_fin, haute_debut: s.haute_debut, haute_fin: s.haute_fin,
      min_nuits_haute: mh, min_nuits_basse: mb, heure_min: s.heure_min, heure_max: s.heure_max, ports }, 'Saison enregistrée · appliquée immédiatement aux réservations');
  };
  // Paiement
  const [p, setP] = useState({ taux_acompte: String(r.taux_acompte), taux_apa: String(r.taux_apa), delai_reponse_h: String(r.delai_reponse_h), delai_paiement_h: String(r.delai_paiement_h),
    solde_jours: String(r.solde_jours), relance_h: String(r.relance_h), tva_location: r.tva_location, taux_tva: String(r.taux_tva ?? 20).replace('.', ','), carte: r.paiement_carte, virement: r.paiement_virement });
  // Société
  const [so, setSo] = useState<Record<string, string>>({ raison_sociale: '', forme: '', rcs: '', siret: '', tva: '', telephone: '', email: '', siege: '', bureau_monaco: '', iban: '', bic: '', mentions: '', ...r.societe });
  // Contrat
  const [version, setVersion] = useState(() => { const m = r.contrat_version.match(/^v(\d+)\.(\d+)$/); return m ? `v${m[1]}.${Number(m[2]) + 1}` : 'v1.0'; });
  const [conditions, setConditions] = useState(r.contrat_conditions);
  // Notifications
  const [notifEmail, setNotifEmail] = useState(r.notif_email);
  const [notif, setNotif] = useState(r.notif);
  // Courtier présenté aux clients
  const [co, setCo] = useState<Record<string, string>>({ prenom: '', nom: '', titre: '', titre_en: '', titre_de: '', titre_it: '', telephone: '', whatsapp: '', email: '', ...r.courtier });

  const S = (k: keyof typeof s) => (v: string) => setS((x) => ({ ...x, [k]: v }));
  const P = (k: keyof typeof p) => (v: string) => setP((x) => ({ ...x, [k]: v }));
  const SO = (k: string) => (v: string) => setSo((x) => ({ ...x, [k]: v }));
  const CO = (k: string) => (v: string) => setCo((x) => ({ ...x, [k]: v }));

  return (
    <>
      <Section titre="Saison" aide="S'applique immédiatement aux réservations et au site.">
        <div className="champs champs--3">
          <C id="r-annee" label="Année" v={s.annee} set={S('annee')} />
          <C id="r-d" label="Premier embarquement" type="date" v={s.saison_debut} set={S('saison_debut')} />
          <C id="r-f" label="Dernier débarquement" type="date" v={s.saison_fin} set={S('saison_fin')} />
          <C id="r-hd" label="Haute saison, du" type="date" v={s.haute_debut} set={S('haute_debut')} />
          <C id="r-hf" label="au" type="date" v={s.haute_fin} set={S('haute_fin')} aide="Lendemain de la dernière nuit de haute saison." />
          <C id="r-min" label="Nuits minimum (haute / basse)" v={s.min} set={S('min')} />
          <C id="r-hmin" label="Embarquement de" type="time" v={s.heure_min} set={S('heure_min')} />
          <C id="r-hmax" label="à" type="time" v={s.heure_max} set={S('heure_max')} />
        </div>
        <div>
          <p className="champ__label" style={{ fontSize: 'var(--t-xs)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--second)' }}>Ports d&apos;embarquement</p>
          <p style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.5rem', alignItems: 'center' }}>
            {ports.map((port) => (
              <button key={port} type="button" className="chip" style={{ display: 'inline-flex', alignItems: 'center' }} aria-label={`Retirer ${port}`} disabled={demo}
                onClick={() => setPorts((x) => x.filter((y) => y !== port))}>{port} ✕</button>
            ))}
            {!demo && <span style={{ display: 'inline-flex', gap: '.4rem', alignItems: 'center' }}>
              <input aria-label="Nouveau port" value={nouveauPort} onChange={(e) => setNouveauPort(e.target.value)} placeholder="Villefranche"
                style={{ font: 'inherit', fontSize: 'var(--t-s)', border: 0, borderBottom: '1px solid var(--filet-fort)', background: 'none', width: '9rem', color: 'var(--texte)' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && nouveauPort.trim()) { setPorts((x) => [...new Set([...x, nouveauPort.trim()])]); setNouveauPort(''); } }} />
              <button className="lien" type="button" onClick={() => { if (nouveauPort.trim()) { setPorts((x) => [...new Set([...x, nouveauPort.trim()])]); setNouveauPort(''); } }}>+ Ajouter</button>
            </span>}
          </p>
        </div>
        {erreurSaison && <p className="note is-erreur" role="alert">{erreurSaison}</p>}
        <Bouton onClick={sauverSaison} />
      </Section>

      <Section titre="Paiement" aide="Délais et taux appliqués à chaque nouvelle validation.">
        <div className="champs champs--3">
          <C id="p-ac" label="Acompte" v={p.taux_acompte} set={P('taux_acompte')} suffixe="%" />
          <C id="p-apa" label="APA" v={p.taux_apa} set={P('taux_apa')} suffixe="%" />
          <C id="p-rep" label="Réponse du courtier" v={p.delai_reponse_h} set={P('delai_reponse_h')} suffixe="h" />
          <C id="p-pai" label="Paiement de l'acompte" v={p.delai_paiement_h} set={P('delai_paiement_h')} suffixe="h" />
          <C id="p-sol" label="Appel du solde" v={p.solde_jours} set={P('solde_jours')} suffixe="jours avant" />
          <C id="p-rel" label="Relance" v={p.relance_h} set={P('relance_h')} suffixe="h avant l'échéance" />
          <C id="p-taux-tva" label="TVA des factures" v={p.taux_tva} set={P('taux_tva')} suffixe="%" />
          <div className="champ"><label htmlFor="p-tva">TVA sur la location</label>
            <select id="p-tva" value={p.tva_location} onChange={(e) => P('tva_location')(e.target.value)}>
              <option>Selon les eaux naviguées</option><option>TVA française 20 %</option><option>Hors champ (eaux internationales)</option>
            </select><p className="champ__aide">À valider avec l&apos;expert-comptable.</p></div>
        </div>
        <p style={{ display: 'flex', gap: '2rem' }}>
          <label className="lead__consent" style={{ color: 'var(--texte)' }}><input type="checkbox" checked={p.carte} onChange={(e) => setP((x) => ({ ...x, carte: e.target.checked }))} /> Carte</label>
          <label className="lead__consent" style={{ color: 'var(--texte)' }}><input type="checkbox" checked={p.virement} onChange={(e) => setP((x) => ({ ...x, virement: e.target.checked }))} /> Virement</label>
        </p>
        <Bouton onClick={() => sauver({ taux_acompte: n(p.taux_acompte), taux_apa: n(p.taux_apa), delai_reponse_h: n(p.delai_reponse_h), delai_paiement_h: n(p.delai_paiement_h),
          solde_jours: n(p.solde_jours), relance_h: n(p.relance_h), tva_location: p.tva_location, taux_tva: Number(p.taux_tva.replace(',', '.')) || 0, paiement_carte: p.carte, paiement_virement: p.virement }, 'Réglages de paiement enregistrés')} />
      </Section>

      <Section titre="Société" aide="Repris sur les contrats et factures.">
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))' }}>
          <div className="champs champs--2">
            <C id="s-rs" label="Raison sociale" v={so.raison_sociale} set={SO('raison_sociale')} />
            <C id="s-fo" label="Forme et capital" v={so.forme} set={SO('forme')} />
            <C id="s-rcs" label="RCS" v={so.rcs} set={SO('rcs')} />
            <C id="s-siret" label="SIRET" v={so.siret} set={SO('siret')} />
            <C id="s-tva" label="N° de TVA" v={so.tva} set={SO('tva')} />
            <C id="s-tel" label="Téléphone" v={so.telephone} set={SO('telephone')} />
            <C id="s-siege" label="Siège" v={so.siege} set={SO('siege')} large />
            <C id="s-mc" label="Bureau de Monaco" v={so.bureau_monaco} set={SO('bureau_monaco')} large />
            <C id="s-iban" label="IBAN (virements)" v={so.iban} set={SO('iban')} />
            <C id="s-bic" label="BIC" v={so.bic} set={SO('bic')} />
            <div className="champ champ--large"><label htmlFor="s-ment">Mentions de bas de facture</label><textarea id="s-ment" rows={2} value={so.mentions} onChange={(e) => SO('mentions')(e.target.value)} /></div>
          </div>
          <div className="facture-ap" aria-label="Aperçu de l'en-tête de facture" style={{ alignSelf: 'start' }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem' }}>Portolan</p>
            <p>{[so.raison_sociale, so.forme].filter(Boolean).join(' · ')}</p>
            <p>{so.siege}</p>
            <p>{[so.rcs, so.tva && `TVA ${so.tva}`].filter(Boolean).join(' · ')}</p>
            <p style={{ marginTop: '.75rem', fontSize: 'var(--t-s)' }}><b>Facture F-{new Date().getFullYear()}-0001</b></p>
            {so.mentions && <p className="second" style={{ marginTop: '.5rem' }}>{so.mentions}</p>}
          </div>
        </div>
        <Bouton onClick={() => sauver({ societe: so }, 'Société enregistrée · reprise sur les prochains documents')} />
      </Section>

      <Section titre="Contrat" aide="Une réservation garde la version acceptée par le client.">
        <p>Version en vigueur&#8239;: <b style={{ fontWeight: 500 }}>{r.contrat_version}</b>{versions[0] && <>, du {dateLongue(versions.find((v) => v.version === r.contrat_version)?.du ?? versions[0].du)}</>}</p>
        <div className="champ"><label htmlFor="c-cond">Conditions particulières</label><textarea id="c-cond" rows={4} value={conditions} onChange={(e) => setConditions(e.target.value)} readOnly={demo} /></div>
        <table className="tab"><tbody>{versions.map((v) => (
          <tr key={v.version}><td>{v.version}</td><td className="second">{dateMoyenne(v.du)}</td><td>{v.version === r.contrat_version ? <span className="badge badge--confirmee">En vigueur</span> : `${v.reservations} réservation${v.reservations > 1 ? 's' : ''}`}</td></tr>
        ))}</tbody></table>
        {!demo && <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div className="champ" style={{ width: '8rem' }}><label htmlFor="c-v">Nouvelle version</label><input id="c-v" value={version} onChange={(e) => setVersion(e.target.value)} /></div>
          <BoutonEcrit className={`btn btn--plein btn--petit${envoi ? ' is-envoi' : ''}`} disabled={envoi || conditions === r.contrat_conditions}
            onClick={() => demarrer(async () => { const res = await nouvelleVersionContrat(version, conditions); notifier(res.ok ? `Version ${version} en vigueur` : res.erreur); if (res.ok) router.refresh(); })}>Publier cette version</BoutonEcrit>
          <p className="champ__aide" style={{ flexBasis: '100%' }}>Modifier les conditions crée une nouvelle version&#8239;; les réservations déjà acceptées gardent la leur.</p>
        </div>}
      </Section>

      <Section titre="Notifications" aide="Qui est prévenu, et de quoi.">
        <div className="champs champs--2"><C id="n-mail" label="E-mail des alertes" type="email" v={notifEmail} set={setNotifEmail} /></div>
        <div style={{ display: 'grid', gap: '.6rem' }}>
          {([['demande', 'Nouvelle demande'], ['paiement', 'Paiement reçu'], ['non_traitee', 'Demande non traitée depuis 24 h']] as const).map(([k, l]) => (
            <label key={k} className="lead__consent" style={{ color: 'var(--texte)' }}><input type="checkbox" checked={notif[k]} onChange={(e) => setNotif((x) => ({ ...x, [k]: e.target.checked }))} /> {l}</label>
          ))}
        </div>
        <p className="champ__aide">Les alertes partiront dès que l&apos;envoi des e-mails (Resend) sera branché.</p>
        <Bouton onClick={() => sauver({ notif_email: notifEmail, notif }, 'Notifications enregistrées')} />
      </Section>

      <Section titre="Courtier" aide="Présenté aux clients dans leur espace : nom, téléphone, WhatsApp.">
        <div className="champs champs--2">
          <C id="co-p" label="Prénom" v={co.prenom} set={CO('prenom')} /><C id="co-n" label="Nom" v={co.nom} set={CO('nom')} />
          <C id="co-t" label="Fonction" v={co.titre} set={CO('titre')} large />
          <C id="co-t-en" label="Fonction en anglais" v={co.titre_en} set={CO('titre_en')} />
          <C id="co-t-de" label="Fonction en allemand" v={co.titre_de} set={CO('titre_de')} />
          <C id="co-t-it" label="Fonction en italien" v={co.titre_it} set={CO('titre_it')} />
          <C id="co-tel" label="Téléphone" v={co.telephone} set={CO('telephone')} /><C id="co-wa" label="WhatsApp" v={co.whatsapp} set={CO('whatsapp')} />
          <C id="co-mail" label="E-mail" type="email" v={co.email} set={CO('email')} large />
        </div>
        <Bouton onClick={() => sauver({ courtier: co }, 'Courtier enregistré')} />
      </Section>

      <Section titre="Équipe" aide="Lecture seule dans le MVP.">
        {equipe.length === 0 ? <p className="second">Masqué en démonstration.</p> : (
          <table className="tab"><tbody>{equipe.map((m) => (
            <tr key={m.email}><td>{m.prenom} {m.nom}</td><td className="second">{m.email}</td><td>Direction</td></tr>
          ))}</tbody></table>
        )}
      </Section>
    </>
  );
}
