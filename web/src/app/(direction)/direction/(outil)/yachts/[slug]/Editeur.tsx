'use client';
// Éditeur d'un yacht : 7 onglets (identité, caractéristiques, prix, textes en 4 langues, photos, visite, publication).
// Un seul bouton « Enregistrer » ; refus si le yacht a été modifié ailleurs depuis l'ouverture (Recharger ou Écraser).
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';
import { Dialogue } from '@/components/Dialogue';
import { BoutonEcrit, useDemo } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { supabaseNavigateur } from '@/lib/supabase/navigateur';
import { champsTraduisibles, urlPhoto, type Fiche, type Photo, type Yacht } from '@/lib/yachts';
import { euros, ilYa, jour } from '@/lib/format';
import { archiverYacht, enregistrerYacht, supprimerYacht, traduireIA } from '../../../actions';

type Saison = { annee: number; haute_debut: string; haute_fin: string; taux_acompte: number; taux_apa: number; solde_jours: number };
type Langue = 'en' | 'de' | 'it';
const ONGLETS = [['identite', 'Identité'], ['carac', 'Caractéristiques'], ['prix', 'Prix'], ['textes', 'Textes'], ['photos', 'Photos'], ['visite', 'Visite'], ['publi', 'Publication']] as const;
type Onglet = (typeof ONGLETS)[number][0];
const PONTS_DEFAUT = ['Extérieur', 'Pont soleil', 'Pont supérieur', 'Pont principal', 'Pont inférieur'];
const nombre = (s: string) => { const n = Number(String(s).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const egal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function Editeur({ yacht, site, saison, nbReservations }: { yacht: Yacht; site: string; saison: Saison; nbReservations: number }) {
  const router = useRouter();
  const notifier = useNotifier();
  const demo = useDemo();
  const [y, setY] = useState<Yacht>(() => structuredClone(yacht));
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [retirees, setRetirees] = useState<string[]>([]);
  const [conflit, setConflit] = useState<string | null>(null);
  const [echec, setEchec] = useState('');
  const [envoi, demarrer] = useTransition();
  const ouvertLe = useRef(yacht.modifie_le);

  const fiche = y.fiche;
  const setFiche = (f: Partial<Fiche>) => setY((v) => ({ ...v, fiche: { ...v.fiche, ...f } }));
  const champsModifies = (['nom', 'slug', 'port', 'invites', 'vente', 'location_basse', 'location_haute', 'publie', 'mis_en_avant', 'ordre', 'fiche', 'textes'] as const)
    .filter((k) => !egal(y[k], yacht[k]));
  // Nombre de modifications : chaque champ de la fiche compte pour une
  const nbModifs = champsModifies.filter((k) => k !== 'fiche').length
    + Object.keys({ ...fiche, ...yacht.fiche }).filter((k) => !egal(fiche[k as keyof Fiche], yacht.fiche[k as keyof Fiche])).length;
  const arevoir = useMemo(() => {
    const champs = champsTraduisibles(fiche);
    return (['en', 'de', 'it'] as Langue[]).filter((l) => Object.entries(champs).some(([k, fr]) => { const t = y.textes?.[l]?.[k]; return !t?.texte || t.source !== fr; }));
  }, [fiche, y.textes]);

  function enregistrer(ecraser = false, modifSupp?: Partial<Yacht>) {
    const cible = { ...y, ...modifSupp };
    const modif: Partial<Yacht> = {};
    for (const k of ['nom', 'slug', 'port', 'invites', 'vente', 'location_basse', 'location_haute', 'publie', 'mis_en_avant', 'ordre', 'fiche', 'textes'] as const) {
      if (!egal(cible[k], yacht[k])) (modif as Record<string, unknown>)[k] = cible[k];
    }
    if (!Object.keys(modif).length) return;
    demarrer(async () => {
      setEchec('');
      const r = await enregistrerYacht(yacht.slug, modif, ouvertLe.current, ecraser, retirees);
      if (!r.ok) { if (r.erreur === 'conflit') setConflit(r.modifieLe ?? ''); else setEchec(r.erreur); return; }
      setConflit(null); setRetirees([]);
      notifier('Enregistré · en ligne sur le site dans quelques secondes');
      if (r.slug !== yacht.slug) router.replace(`/direction/yachts/${r.slug}`); else router.refresh();
    });
  }

  const statut = y.archive ? <span className="badge badge--annulee">Archivé</span> : yacht.publie ? <span className="badge badge--confirmee">Publié</span> : <span className="badge badge--neutre">Brouillon</span>;

  return (
    <>
      <header className="ed-tete">
        <Link className="lien lien--discret" href="/direction/yachts" style={{ fontSize: 'var(--t-s)' }}>← Yachts</Link>
        <h1>{y.nom || 'Sans nom'}</h1>{statut}
        <span className="ed-modif" style={{ marginLeft: 'auto', visibility: nbModifs ? 'visible' : 'hidden' }} aria-live="polite">
          {nbModifs} modification{nbModifs > 1 ? 's' : ''} non enregistrée{nbModifs > 1 ? 's' : ''}
        </span>
        {yacht.publie && <a className="btn btn--filet btn--petit" href={`${site}/fr/flotte/${yacht.slug}/`} target="_blank" rel="noopener">Voir sur le site</a>}
        <BoutonEcrit className={`btn btn--plein btn--petit${envoi ? ' is-envoi' : ''}`} disabled={!nbModifs || envoi} onClick={() => enregistrer()}>Enregistrer</BoutonEcrit>
      </header>
      <div className="contenu">
        {echec && <p className="bandeau-info bandeau-info--alerte" role="alert" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {echec} <button className="lien" type="button" onClick={() => enregistrer()}>Réessayer</button></p>}
        <nav className="onglets" role="tablist" aria-label="Sections">
          {ONGLETS.map(([o, l]) => (
            <button key={o} role="tab" type="button" id={`tab-${o}`} aria-controls={`pan-${o}`} aria-selected={onglet === o} onClick={() => setOnglet(o)}>
              {l}{o === 'textes' && arevoir.length > 0 && <span className="point-r" aria-label="traductions à revoir" />}
            </button>
          ))}
        </nav>
        <div role="tabpanel" id={`pan-${onglet}`} aria-labelledby={`tab-${onglet}`}>
          {onglet === 'identite' && <Identite y={y} setY={setY} setFiche={setFiche} />}
          {onglet === 'carac' && <Caracteristiques y={y} setY={setY} setFiche={setFiche} />}
          {onglet === 'prix' && <Prix y={y} setY={setY} saison={saison} />}
          {onglet === 'textes' && <Textes y={y} setY={setY} arevoir={arevoir} demo={demo} />}
          {onglet === 'photos' && <Photos y={y} setFiche={setFiche} onRetirer={(src) => setRetirees((r) => [...r, src])} demo={demo} />}
          {onglet === 'visite' && <Visite fiche={fiche} setFiche={setFiche} />}
          {onglet === 'publi' && <Publication y={y} arevoir={arevoir} nbReservations={nbReservations} envoi={envoi}
            basculer={() => { const publie = !y.publie; setY((v) => ({ ...v, publie })); enregistrer(false, { publie }); }} />}
        </div>
      </div>

      <Dialogue ouvert={conflit !== null} onFermer={() => setConflit(null)} titre="Ce yacht a été modifié ailleurs" actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={() => enregistrer(true)}>Écraser</button>
        <button className="btn btn--plein btn--petit" type="button" onClick={() => { setConflit(null); router.refresh(); location.reload(); }}>Recharger</button></>}>
        <p className="second">{y.nom} a été modifié depuis un autre poste {conflit ? ilYa(conflit) : 'entre-temps'}. Recharger ou écraser&#8239;?</p>
      </Dialogue>
    </>
  );
}

// ------------------------------------------------------------------------------------------
type PropsY = { y: Yacht; setY: React.Dispatch<React.SetStateAction<Yacht>>; setFiche?: (f: Partial<Fiche>) => void };

function Champ({ id, label, valeur, onChange, aide, large, type = 'text', inputMode }: {
  id: string; label: string; valeur: string | number | null | undefined; onChange: (v: string) => void; aide?: string; large?: boolean; type?: string; inputMode?: 'numeric' | 'decimal';
}) {
  return (
    <div className={`champ${large ? ' champ--large' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} inputMode={inputMode} value={valeur ?? ''} onChange={(e) => onChange(e.target.value)} />
      {aide && <p className="champ__aide">{aide}</p>}
    </div>
  );
}

function Inter({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`inter${on ? ' is-on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}
      style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit' }}><i />{children}</button>
  );
}

function Identite({ y, setY, setFiche }: PropsY) {
  const f = y.fiche;
  return (
    <>
      <div className="ed-sec"><div><h2>Identité</h2></div>
        <div className="champs champs--2">
          <Champ id="i-nom" label="Nom" valeur={y.nom} onChange={(v) => setY((x) => ({ ...x, nom: v.slice(0, 60) }))} />
          <Champ id="i-slug" label="Adresse de la page" valeur={y.slug} onChange={(v) => setY((x) => ({ ...x, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
            aide="Changer l'adresse casse les liens déjà partagés vers cette fiche." />
          <Champ id="i-ch" label="Chantier" valeur={f.chantier} onChange={(v) => setFiche!({ chantier: v })} />
          <Champ id="i-chc" label="Nom court du chantier" valeur={f.chantierCourt} onChange={(v) => setFiche!({ chantierCourt: v })} />
          <div className="champ"><label htmlFor="i-type">Type</label>
            <select id="i-type" value={f.type ?? 'moteur'} onChange={(e) => setFiche!({ type: e.target.value as 'moteur' | 'voile' })}><option value="moteur">Moteur</option><option value="voile">Voilier</option></select></div>
          <Champ id="i-num" label="Numéro dans la flotte" valeur={String(y.ordre).padStart(2, '0')} inputMode="numeric" onChange={(v) => setY((x) => ({ ...x, ordre: Math.max(1, nombre(v)) }))} />
          <Champ id="i-port" label="Port d'attache" valeur={y.port} onChange={(v) => setY((x) => ({ ...x, port: v }))} />
          <Champ id="i-pav" label="Pavillon" valeur={f.pavillon} onChange={(v) => setFiche!({ pavillon: v })} />
          <p><Inter on={!!f.exclusivite} onChange={(v) => setFiche!({ exclusivite: v })}>Exclusivité Portolan</Inter></p>
          <p><Inter on={y.mis_en_avant} onChange={(v) => setY((x) => ({ ...x, mis_en_avant: v }))}>Mis en avant à l&apos;accueil</Inter></p>
        </div>
      </div>
      <div className="ed-sec"><div><h2>Vente et location</h2><p>Les prix correspondants s&apos;affichent dans l&apos;onglet Prix.</p></div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <label className="lead__consent" style={{ color: 'var(--texte)' }}><input type="checkbox" checked={y.vente != null} onChange={(e) => setY((x) => ({ ...x, vente: e.target.checked ? (yachtPrix(x.vente) || 1_000_000) : null }))} /> À vendre</label>
          <label className="lead__consent" style={{ color: 'var(--texte)' }}><input type="checkbox" checked={y.location_basse != null} onChange={(e) => setY((x) => ({ ...x, location_basse: e.target.checked ? 50_000 : null, location_haute: e.target.checked ? 60_000 : null }))} /> À louer</label>
        </div>
      </div>
    </>
  );
}
const yachtPrix = (v: number | null) => v ?? 0;

function Caracteristiques({ y, setY, setFiche }: PropsY) {
  const f = y.fiche;
  const nb = (k: keyof Fiche) => (v: string) => setFiche!({ [k]: v === '' ? null : nombre(v) } as Partial<Fiche>);
  const fr = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','));
  return (
    <div className="ed-sec"><div><h2>Caractéristiques</h2><p>Unités affichées à droite de chaque champ.</p></div>
      <div className="champs champs--3">
        <Champ id="c-annee" label="Année" valeur={f.annee} inputMode="numeric" onChange={nb('annee')} />
        <Champ id="c-refit" label="Refit" valeur={f.refit} inputMode="numeric" onChange={nb('refit')} />
        <Champ id="c-lg" label="Longueur (m)" valeur={fr(f.longueur)} inputMode="decimal" onChange={nb('longueur')} />
        <Champ id="c-la" label="Largeur (m)" valeur={fr(f.largeur)} inputMode="decimal" onChange={nb('largeur')} />
        <Champ id="c-ti" label="Tirant d'eau (m)" valeur={fr(f.tirant)} inputMode="decimal" onChange={nb('tirant')} />
        <Champ id="c-coque" label="Coque" valeur={f.coque} onChange={(v) => setFiche!({ coque: v })} />
        <Champ id="c-archi" label="Architecte" valeur={f.architecte} onChange={(v) => setFiche!({ architecte: v })} />
        <Champ id="c-inv" label="Invités" valeur={y.invites} inputMode="numeric" onChange={(v) => setY((x) => ({ ...x, invites: Math.max(1, nombre(v)) }))} />
        <Champ id="c-cab" label="Cabines" valeur={f.nbCabines ?? (f.cabines?.match(/^(\d+)/)?.[1] ?? '')} inputMode="numeric" onChange={nb('nbCabines')} />
        <Champ id="c-cabd" label="Description des cabines" large valeur={f.cabines} onChange={(v) => setFiche!({ cabines: v })} />
        <Champ id="c-eq" label="Équipage" valeur={f.equipage} inputMode="numeric" onChange={nb('equipage')} />
        <Champ id="c-cr" label="Croisière (nœuds)" valeur={f.vitesse?.croisiere} inputMode="numeric" onChange={(v) => setFiche!({ vitesse: { ...f.vitesse, croisiere: nombre(v) } })} />
        <Champ id="c-max" label="Pointe (nœuds)" valeur={f.vitesse?.max} inputMode="numeric" onChange={(v) => setFiche!({ vitesse: { ...f.vitesse, max: nombre(v) } })} />
        <Champ id="c-auto" label="Autonomie (milles)" valeur={f.autonomie != null ? f.autonomie.toLocaleString('fr-FR') : ''} inputMode="numeric" onChange={nb('autonomie')} />
        <Champ id="c-mot" label="Motorisation" valeur={f.moteurs} onChange={(v) => setFiche!({ moteurs: v })} />
        <Champ id="c-sta" label="Stabilisateurs" valeur={f.stabilisateurs} onChange={(v) => setFiche!({ stabilisateurs: v })} />
      </div>
    </div>
  );
}

// Même calcul que la base (prix_sejour) : chaque nuit au tarif de sa saison, chaque partie arrondie à 10 €
function simuler(y: Yacht, s: Saison, du: string, au: string) {
  if (!du || !au || au <= du || y.location_basse == null) return null;
  const n = Math.round((jour(au).getTime() - jour(du).getTime()) / 86_400_000);
  const debutH = du > s.haute_debut ? du : s.haute_debut, finH = au < s.haute_fin ? au : s.haute_fin;
  const nh = Math.max(0, Math.round((jour(finH).getTime() - jour(debutH).getTime()) / 86_400_000));
  const mb = Math.round((y.location_basse * (n - nh)) / 7 / 10) * 10, mh = Math.round(((y.location_haute ?? 0) * nh) / 7 / 10) * 10;
  const total = mb + mh, acompte = Math.round((total * s.taux_acompte) / 100);
  return { n, nh, total, acompte, solde: total - acompte, apa: Math.round((total * s.taux_apa) / 100) };
}

function Prix({ y, setY, saison }: PropsY & { saison: Saison }) {
  const [du, setDu] = useState(`${saison.annee}-07-10`);
  const [au, setAu] = useState(`${saison.annee}-07-17`);
  const sim = simuler(y, saison, du, au);
  const nuit = (v: number | null) => (v ? `Soit ${euros(Math.round(v / 7))} la nuit.` : undefined);
  const dateFr = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return (
    <>
      {y.vente != null && (
        <div className="ed-sec"><div><h2>Vente</h2></div>
          <div className="champs champs--2"><Champ id="p-vente" label="Prix de vente (€)" valeur={y.vente.toLocaleString('fr-FR')} inputMode="numeric"
            onChange={(v) => setY((x) => ({ ...x, vente: Math.max(1, nombre(v)) }))} aide={euros(y.vente)} /></div>
        </div>
      )}
      {y.location_basse != null && (
        <>
          <div className="ed-sec"><div><h2>Location</h2><p>Saison {saison.annee}&#8239;: haute saison du {dateFr(saison.haute_debut)} au {dateFr(saison.haute_fin)} (Réglages).</p></div>
            <div className="champs champs--2">
              <Champ id="p-basse" label="Basse saison, la semaine (€)" valeur={y.location_basse.toLocaleString('fr-FR')} inputMode="numeric"
                onChange={(v) => setY((x) => ({ ...x, location_basse: Math.max(1, nombre(v)) }))} aide={nuit(y.location_basse)} />
              <Champ id="p-haute" label="Haute saison, la semaine (€)" valeur={(y.location_haute ?? 0).toLocaleString('fr-FR')} inputMode="numeric"
                onChange={(v) => setY((x) => ({ ...x, location_haute: Math.max(1, nombre(v)) }))} aide={nuit(y.location_haute)} />
            </div>
          </div>
          <div className="ed-sec"><div><h2>Simulateur</h2><p>Exactement ce que le client verra.</p></div>
            <div className="panneau-c" style={{ display: 'grid', gap: '1rem', maxWidth: '34rem' }}>
              <div className="champs champs--2">
                <Champ id="s-du" label="Du" type="date" valeur={du} onChange={setDu} />
                <Champ id="s-au" label="Au" type="date" valeur={au} onChange={setAu} />
              </div>
              {sim ? (
                <dl className="paires">
                  <div><dt>{sim.n} nuit{sim.n > 1 ? 's' : ''}, {sim.nh === sim.n ? 'haute saison' : sim.nh === 0 ? 'basse saison' : `dont ${sim.nh} en haute saison`}</dt><dd>{euros(sim.total)}</dd></div>
                  <div><dt>Acompte {saison.taux_acompte}&nbsp;%</dt><dd>{euros(sim.acompte)}</dd></div>
                  <div><dt>Solde</dt><dd>{euros(sim.solde)}</dd></div>
                  <div><dt>APA {saison.taux_apa}&nbsp;%</dt><dd>{euros(sim.apa)}</dd></div>
                </dl>
              ) : <p className="second">Choisissez deux dates.</p>}
            </div>
          </div>
        </>
      )}
      {y.vente == null && y.location_basse == null && <div className="ed-sec"><div><h2>Prix</h2></div><p className="second">Ce yacht n&apos;est ni à vendre ni à louer&#8239;: cochez l&apos;une des deux cases dans l&apos;onglet Identité.</p></div>}
    </>
  );
}

// ------------------------------------------------------------------------------------------
// Textes : le français se modifie ici ; en anglais, allemand, italien, chaque champ montre le français de référence
// ------------------------------------------------------------------------------------------
function Textes({ y, setY, arevoir, demo }: PropsY & { arevoir: Langue[]; demo: boolean }) {
  const notifier = useNotifier();
  const [langue, setLangue] = useState<'fr' | Langue>('fr');
  const [propositions, setPropositions] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState<string | null>(null);
  const f = y.fiche;
  const champs = champsTraduisibles(f);

  // Listes en français : ajouter, retirer, réordonner ; les traductions suivent leurs paragraphes
  const reindexer = (prefixe: string, transformer: (i: number) => number | null) => {
    const textes = structuredClone(y.textes ?? {});
    for (const l of ['en', 'de', 'it'] as const) {
      const t = textes[l]; if (!t) continue;
      const nouveau: typeof t = {};
      for (const [k, v] of Object.entries(t)) {
        const m = k.match(new RegExp(`^${prefixe}\\.(\\d+)(.*)$`));
        if (!m) { nouveau[k] = v; continue; }
        const j = transformer(Number(m[1])); if (j != null) nouveau[`${prefixe}.${j}${m[2]}`] = v;
      }
      textes[l] = nouveau;
    }
    return textes;
  };
  function liste<T>(cle: 'description' | 'points' | 'ponts', valeurs: T[], vide: T) {
    return {
      changer: (i: number, v: T) => { const n = [...valeurs]; n[i] = v; setY((x) => ({ ...x, fiche: { ...x.fiche, [cle]: n } })); },
      ajouter: () => setY((x) => ({ ...x, fiche: { ...x.fiche, [cle]: [...valeurs, vide] } })),
      retirer: (i: number) => setY((x) => ({ ...x, textes: reindexer(cle, (k) => (k === i ? null : k > i ? k - 1 : k)), fiche: { ...x.fiche, [cle]: valeurs.filter((_, k) => k !== i) } })),
      monter: (i: number) => { if (i === 0) return; const n = [...valeurs]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setY((x) => ({ ...x, textes: reindexer(cle, (k) => (k === i ? i - 1 : k === i - 1 ? i : k)), fiche: { ...x.fiche, [cle]: n } })); },
    };
  }
  const desc = liste('description', f.description ?? [], '');
  const points = liste('points', f.points ?? [], ['', ''] as [string, string]);
  const ponts = liste('ponts', f.ponts ?? [], ['', ''] as [string, string]);

  const traduction = (l: Langue, k: string) => y.textes?.[l]?.[k];
  const setTraduction = (l: Langue, k: string, texte: string) =>
    setY((x) => ({ ...x, textes: { ...x.textes, [l]: { ...(x.textes?.[l] ?? {}), [k]: { texte, source: champs[k] } } } }));

  async function traduire(cles: string[], cle: string) {
    if (langue === 'fr') return;
    setEnCours(cle);
    const r = await traduireIA(langue, Object.fromEntries(cles.map((k) => [k, champs[k]])));
    setEnCours(null);
    if (!r.ok) { notifier(r.erreur); return; }
    setPropositions((p) => ({ ...p, ...Object.fromEntries(Object.entries(r.traductions).map(([k, t]) => [`${langue}:${k}`, t])) }));
  }
  const aRevoirLangue = (l: Langue) => Object.keys(champs).filter((k) => { const t = traduction(l, k); return !t?.texte || t.source !== champs[k]; });

  const ctx: CtxTraduction = { langue: langue as Langue, traduction, setTraduction, champs, propositions, setPropositions, enCours, traduire, demo };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center', margin: '1.5rem 0 .5rem' }}>
        <div className="langues" role="group" aria-label="Langue">
          {(['fr', 'en', 'de', 'it'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={langue === l} className={l !== 'fr' && arevoir.includes(l) ? 'is-manque' : ''} onClick={() => setLangue(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
        {langue !== 'fr' && !demo && (
          <button className={`btn btn--filet btn--petit${enCours === 'tout' ? ' is-envoi' : ''}`} type="button" style={{ marginLeft: 'auto' }} disabled={!!enCours}
            onClick={() => { const c = aRevoirLangue(langue); if (c.length) traduire(c, 'tout'); else notifier('Tout est déjà traduit dans cette langue.'); }}>
            {enCours === 'tout' ? 'Traduction en cours…' : "Traduire toute la langue avec l'IA"}</button>
        )}
      </div>

      {langue === 'fr' ? (
        <>
          <div className="ed-sec"><div><h2>Accroche</h2><p>Une phrase, sous le nom.</p></div>
            <Fr id="fr-acc" label="Accroche (FR)" valeur={f.accroche ?? ''} onChange={(v) => setY((x) => ({ ...x, fiche: { ...x.fiche, accroche: v } }))} /></div>
          <div className="ed-sec"><div><h2>Présentation</h2><p>Paragraphes, réordonnables.</p></div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {(f.description ?? []).map((p, i) => <div key={i}><Fr id={`fr-d${i}`} label={`Paragraphe ${i + 1} (FR)`} multiligne valeur={p} onChange={(v) => desc.changer(i, v)} /><BoutonsListe i={i} l={desc} /></div>)}
              <p><button className="lien" type="button" onClick={desc.ajouter}>+ Ajouter un paragraphe</button></p>
            </div></div>
          <div className="ed-sec"><div><h2>Points forts</h2></div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {(f.points ?? []).map(([t, x], i) => <div key={i}><div className="champs champs--2">
                <Fr id={`fr-pt${i}`} label="Titre (FR)" valeur={t} onChange={(v) => points.changer(i, [v, x])} />
                <Fr id={`fr-px${i}`} label="Texte (FR)" valeur={x} onChange={(v) => points.changer(i, [t, v])} /></div><BoutonsListe i={i} l={points} /></div>)}
              <p><button className="lien" type="button" onClick={points.ajouter}>+ Ajouter un point fort</button></p>
            </div></div>
          <div className="ed-sec"><div><h2>Ponts</h2></div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {(f.ponts ?? []).map(([n, a], i) => <div key={i}><div className="champs champs--2">
                <Fr id={`fr-pn${i}`} label="Pont (FR)" valeur={n} onChange={(v) => ponts.changer(i, [v, a])} />
                <Fr id={`fr-pa${i}`} label="Aménagement (FR)" valeur={a} onChange={(v) => ponts.changer(i, [n, v])} /></div><BoutonsListe i={i} l={ponts} /></div>)}
              <p><button className="lien" type="button" onClick={ponts.ajouter}>+ Ajouter un pont</button></p>
            </div></div>
          <div className="ed-sec"><div><h2>Cabines</h2></div>
            <Fr id="fr-cab" label="Description des cabines (FR)" valeur={f.cabines ?? ''} onChange={(v) => setY((x) => ({ ...x, fiche: { ...x.fiche, cabines: v } }))} /></div>
          <p className="second" style={{ fontSize: 'var(--t-xs)', marginTop: '1rem' }}>Les descriptions des photos se modifient dans l&apos;onglet Photos.</p>
        </>
      ) : (
        <>
          {champs['accroche'] !== undefined && <div className="ed-sec"><div><h2>Accroche</h2><p>Une phrase, sous le nom.</p></div><ChampTraduit ctx={ctx} k="accroche" label="Accroche" /></div>}
          {(f.description ?? []).length > 0 && <div className="ed-sec"><div><h2>Présentation</h2></div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>{(f.description ?? []).map((_, i) => <ChampTraduit ctx={ctx} key={i} k={`description.${i}`} label={`Paragraphe ${i + 1}`} multiligne />)}</div></div>}
          {(f.points ?? []).length > 0 && <div className="ed-sec"><div><h2>Points forts</h2></div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>{(f.points ?? []).map((_, i) => <div className="champs champs--2" key={i}><ChampTraduit ctx={ctx} k={`points.${i}.titre`} label="Titre" /><ChampTraduit ctx={ctx} k={`points.${i}.texte`} label="Texte" /></div>)}</div></div>}
          {(f.ponts ?? []).length > 0 && <div className="ed-sec"><div><h2>Ponts</h2></div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>{(f.ponts ?? []).map((_, i) => <div className="champs champs--2" key={i}><ChampTraduit ctx={ctx} k={`ponts.${i}.nom`} label="Pont" /><ChampTraduit ctx={ctx} k={`ponts.${i}.amenagement`} label="Aménagement" /></div>)}</div></div>}
          {champs['cabines'] !== undefined && <div className="ed-sec"><div><h2>Cabines</h2></div><ChampTraduit ctx={ctx} k="cabines" label="Cabines" /></div>}
          {(f.galerie ?? []).length > 0 && <div className="ed-sec"><div><h2>Photos</h2><p>Descriptions lues par les moteurs de recherche et les lecteurs d&apos;écran.</p></div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>{(f.galerie ?? []).map((_, i) => <ChampTraduit ctx={ctx} key={i} k={`galerie.${i}.alt`} label={`Photo ${i + 1}`} />)}</div></div>}
        </>
      )}
    </>
  );
}

type CtxTraduction = {
  langue: Langue; traduction: (l: Langue, k: string) => { texte: string; source: string } | undefined; setTraduction: (l: Langue, k: string, t: string) => void;
  champs: Record<string, string>; propositions: Record<string, string>; setPropositions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  enCours: string | null; traduire: (cles: string[], cle: string) => Promise<void>; demo: boolean;
};

// Un champ traduit (anglais, allemand, italien) avec sa référence française et l'éventuelle proposition de l'IA
function ChampTraduit({ ctx, k, label, multiligne }: { ctx: CtxTraduction; k: string; label: string; multiligne?: boolean }) {
    const { langue: l, traduction, setTraduction, champs, propositions, setPropositions, enCours, traduire, demo } = ctx;
    const t = traduction(l, k);
    const revoir = !!t?.texte && t.source !== champs[k];
    const prop = propositions[`${l}:${k}`];
    const fermer = () => setPropositions((p) => { const n = { ...p }; delete n[`${l}:${k}`]; return n; });
    const id = `t-${l}-${k.replace(/\./g, '-')}`;
    return (
      <div style={{ display: 'grid', gap: '.6rem' }}>
        <div className="champ">
          <p className="ref-fr">FR&#8239;: {champs[k] || <em>vide</em>}</p>
          <label htmlFor={id}>{label} ({l.toUpperCase()}) {revoir && <span className="badge badge--payer" style={{ marginLeft: '.5rem' }}>À revoir</span>}{!t?.texte && <span className="point-r" aria-label="manquante" />}</label>
          {multiligne
            ? <textarea id={id} rows={3} value={t?.texte ?? ''} onChange={(e) => setTraduction(l, k, e.target.value)} readOnly={demo} />
            : <input id={id} value={t?.texte ?? ''} onChange={(e) => setTraduction(l, k, e.target.value)} readOnly={demo} />}
          {revoir && <p className="champ__aide">Le français a changé depuis cette traduction.</p>}
        </div>
        {prop && (
          <div className="proposition">
            <p className="etiq" style={{ color: 'var(--accent)' }}>Proposition de traduction</p>
            <p>{prop}</p>
            <p style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <button className="btn btn--plein btn--petit" type="button" onClick={() => { setTraduction(l, k, prop); fermer(); }}>Accepter</button>
              <button className="btn btn--filet btn--petit" type="button" onClick={() => { setTraduction(l, k, prop); fermer(); setTimeout(() => document.getElementById(id)?.focus(), 0); }}>Modifier</button>
              <button className="lien lien--discret" type="button" style={{ fontSize: 'var(--t-s)' }} onClick={fermer}>Ignorer</button>
            </p>
          </div>
        )}
        {!demo && <p><button className="lien lien--discret" type="button" style={{ fontSize: 'var(--t-xs)' }} disabled={!!enCours} onClick={() => traduire([k], k)}>
          {enCours === k ? 'Traduction en cours…' : "Traduire ce champ avec l'IA"}</button></p>}
      </div>
    );
}

const Fr = ({ id, label, valeur, onChange, multiligne }: { id: string; label: string; valeur: string; onChange: (v: string) => void; multiligne?: boolean }) => (
    <div className="champ"><label htmlFor={id}>{label}</label>
      {multiligne ? <textarea id={id} rows={3} value={valeur} onChange={(e) => onChange(e.target.value)} /> : <input id={id} value={valeur} onChange={(e) => onChange(e.target.value)} />}</div>
  );
const BoutonsListe = ({ i, l }: { i: number; l: { retirer: (i: number) => void; monter: (i: number) => void } }) => (
    <p style={{ display: 'flex', gap: '1rem', fontSize: 'var(--t-xs)' }}>
      {i > 0 && <button className="lien lien--discret" type="button" onClick={() => l.monter(i)}>Monter</button>}
      <button className="lien lien--discret" type="button" onClick={() => l.retirer(i)}>Retirer</button>
    </p>
  );


// ------------------------------------------------------------------------------------------
// Photos : envoi (WebP 1600 et 900 px préparés dans le navigateur), ordre, principale, suppression réelle
// ------------------------------------------------------------------------------------------
type Envoi = { id: string; nom: string; etat: 'preparation' | 'envoi' | 'erreur'; message?: string; progres: number };
const FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const TAILLE_MAX = 20 * 1024 * 1024;

function Photos({ y, setFiche, onRetirer, demo }: { y: Yacht; setFiche: (f: Partial<Fiche>) => void; onRetirer: (src: string) => void; demo: boolean }) {
  const galerie = y.fiche.galerie ?? [];
  const principale = y.fiche.image?.src;
  const [envois, setEnvois] = useState<Envoi[]>([]);
  const [glisse, setGlisse] = useState<number | null>(null);
  const [survol, setSurvol] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const ponts = [...new Set([...PONTS_DEFAUT, ...(y.fiche.ponts ?? []).map(([n]) => n), ...galerie.map((p) => p.pont).filter(Boolean) as string[]])];
  const maj = (i: number, p: Partial<Photo>) => setFiche({ galerie: galerie.map((x, k) => (k === i ? { ...x, ...p } : x)) });

  async function envoyer(fichiers: File[]) {
    const sb = supabaseNavigateur();
    const ajoutees: Photo[] = [];
    for (const [k, fichier] of fichiers.entries()) {
      const id = `${Date.now().toString(36)}${k}`;
      if (!FORMATS.includes(fichier.type)) { setEnvois((e) => [...e, { id, nom: fichier.name, etat: 'erreur', message: 'Format refusé : JPEG, PNG ou WebP seulement.', progres: 0 }]); continue; }
      if (fichier.size > TAILLE_MAX) { setEnvois((e) => [...e, { id, nom: fichier.name, etat: 'erreur', message: 'Photo trop lourde : 20 Mo au plus.', progres: 0 }]); continue; }
      setEnvois((e) => [...e, { id, nom: fichier.name, etat: 'preparation', progres: 5 }]);
      try {
        const image = await createImageBitmap(fichier);
        const cle = `${y.slug}/${id}`;
        let dims = { w: 0, h: 0 };
        for (const [n, largeur] of [1600, 900].entries()) {
          const l = Math.min(largeur, image.width), h = Math.round((image.height * l) / image.width);
          const canvas = document.createElement('canvas'); canvas.width = l; canvas.height = h;
          canvas.getContext('2d')!.drawImage(image, 0, 0, l, h);
          const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/webp', 0.82));
          if (!blob || blob.type !== 'image/webp') throw new Error('Ce navigateur ne sait pas préparer les photos : utilisez Chrome, Edge ou Firefox.');
          setEnvois((e) => e.map((x) => (x.id === id ? { ...x, etat: 'envoi', progres: 30 + n * 35 } : x)));
          // Identifiant unique : jamais de remplacement (un « upsert » exigerait en plus un droit de lecture sur le stockage)
          const { error } = await sb.storage.from('yachts').upload(`${cle}-${largeur}.webp`, blob, { contentType: 'image/webp', upsert: false });
          if (error) throw error;
          if (largeur === 1600) dims = { w: l, h };
        }
        ajoutees.push({ src: `supabase:${cle}`, ...dims, pont: galerie[galerie.length - 1]?.pont ?? 'Extérieur', alt: '' });
        setEnvois((e) => e.filter((x) => x.id !== id));
      } catch (err) {
        setEnvois((e) => e.map((x) => (x.id === id ? { ...x, etat: 'erreur', message: err instanceof Error && err.message.startsWith('Ce navigateur') ? err.message : "L'envoi a échoué. Réessayez.", progres: 0 } : x)));
      }
    }
    if (ajoutees.length) setFiche({ galerie: [...galerie, ...ajoutees], ...(principale ? {} : { image: { ...ajoutees[0] } }) });
  }

  const deposer = (e: React.DragEvent) => { e.preventDefault(); setSurvol(false); if (!demo && e.dataTransfer.files.length) envoyer([...e.dataTransfer.files]); };
  const deplacer = (de: number, vers: number) => { const n = [...galerie]; const [p] = n.splice(de, 1); n.splice(vers, 0, p); setFiche({ galerie: n }); };

  return (
    <div className="ed-sec" style={{ gridTemplateColumns: '1fr' }}>
      {!demo && (
        <div className="depot" onDragOver={(e) => { e.preventDefault(); setSurvol(true); }} onDragLeave={() => setSurvol(false)} onDrop={deposer}
          style={survol ? { borderStyle: 'solid', background: 'color-mix(in srgb, var(--laiton) 10%, transparent)' } : undefined}>
          Glissez vos photos ici (JPEG, PNG ou WebP, 20&nbsp;Mo au plus par photo). Elles sont optimisées automatiquement.
          <button className="btn btn--filet btn--petit" type="button" onClick={() => champ.current?.click()}>Choisir des photos</button>
          <input ref={champ} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { if (e.target.files) envoyer([...e.target.files]); e.target.value = ''; }} />
        </div>
      )}
      {galerie.length === 0 && envois.length === 0 && <p className="second">Aucune photo pour l&apos;instant.</p>}
      <div className="photos2">
        {galerie.map((p, i) => {
          const estPrincipale = p.src === principale;
          const langues = (['en', 'de', 'it'] as const).map((l) => [l, !!y.textes?.[l]?.[`galerie.${i}.alt`]?.texte] as const);
          return (
            <div key={p.src + i} className={`photo2${estPrincipale ? ' photo2--principale' : ''}`} draggable={!demo}
              onDragStart={() => setGlisse(i)} onDragOver={(e) => { e.preventDefault(); if (glisse != null && glisse !== i) { deplacer(glisse, i); setGlisse(i); } }} onDragEnd={() => setGlisse(null)}
              style={{ opacity: glisse === i ? 0.4 : 1, cursor: demo ? 'default' : 'grab' }}>
              <img src={urlPhoto(p.src)} alt={p.alt} />
              <div>
                {estPrincipale && <p><span className="badge badge--confirmee">★ Principale</span></p>}
                <label className="champ"><span className="champ__label">Pont</span>
                  <select value={p.pont ?? ''} onChange={(e) => maj(i, { pont: e.target.value })} disabled={demo}>{ponts.map((n) => <option key={n}>{n}</option>)}</select></label>
                <label className="champ"><span className="champ__label">Description (FR){!p.alt && <span className="point-r" aria-label="manquante" />}</span>
                  <input value={p.alt} onChange={(e) => maj(i, { alt: e.target.value })} readOnly={demo} /></label>
                <p className="second">Description&#8239;: FR {p.alt ? '✓' : <span className="point-r" />} {langues.map(([l, ok]) => <span key={l}>{l.toUpperCase()} {ok ? '✓' : <span className="point-r" />} </span>)}</p>
                {!demo && <p style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {!estPrincipale && <button className="lien" type="button" onClick={() => setFiche({ image: { src: p.src, w: p.w, h: p.h, alt: p.alt } })}>Définir comme principale</button>}
                  <button className="lien lien--discret" type="button" onClick={() => { onRetirer(p.src); setFiche({ galerie: galerie.filter((_, k) => k !== i), ...(estPrincipale ? { image: galerie.find((_, k) => k !== i) } : {}) }); }}>Supprimer</button>
                </p>}
              </div>
            </div>
          );
        })}
        {envois.map((e) => (
          <div className="photo2" key={e.id}>
            {e.etat === 'erreur'
              ? <div style={{ aspectRatio: '16/10', display: 'grid', placeItems: 'center', background: 'rgb(11 21 19 / .06)', color: 'var(--alerte)', fontSize: 'var(--t-xs)' }}>Refusée</div>
              : <div className="squelette" style={{ aspectRatio: '16/10' }} />}
            <div>
              <p>{e.nom}</p>
              {e.etat === 'erreur' ? <p className="champ__erreur">{e.message}</p> : <>
                <div className="prog"><i style={{ width: `${e.progres}%` }} /></div>
                <p className="second">{e.etat === 'preparation' ? 'Préparation…' : `Envoi… ${e.progres} %`}</p></>}
              {e.etat === 'erreur' && <button className="lien lien--discret" type="button" style={{ fontSize: 'var(--t-xs)' }} onClick={() => setEnvois((x) => x.filter((v) => v.id !== e.id))}>Fermer</button>}
            </div>
          </div>
        ))}
      </div>
      {galerie.length > 0 && !demo && <p className="second" style={{ fontSize: 'var(--t-xs)' }}>Glissez les photos pour changer leur ordre dans la galerie. N&apos;oubliez pas d&apos;enregistrer.</p>}
    </div>
  );
}

function Visite({ fiche, setFiche }: { fiche: Fiche; setFiche: (f: Partial<Fiche>) => void }) {
  const v = fiche.visite;
  return (
    <div className="ed-sec"><div><h2>Visite à bord</h2><p>Réalisée par l&apos;agence.</p></div>
      <div style={{ display: 'grid', gap: '1rem', maxWidth: '34rem' }}>
        {v ? <>
          <Inter on={v.active !== false} onChange={(on) => setFiche({ visite: { ...v, active: on } })}>Afficher la visite à bord sur la fiche</Inter>
          {v.affiche && <img src={urlPhoto(v.affiche)} alt="" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover' }} />}
          <p className="second" style={{ fontSize: 'var(--t-s)' }}>{Array.isArray(v.pieces) ? `${v.pieces.length} étapes` : 'Visite continue'}{v.duree ? ` · environ ${v.duree} secondes de défilement` : ''}. Pour une nouvelle visite, contactez SudWebProject.</p>
        </> : <p className="second">Ce yacht n&apos;a pas encore de visite à bord. Pour en réaliser une, contactez SudWebProject.</p>}
      </div>
    </div>
  );
}

function Publication({ y, arevoir, nbReservations, envoi, basculer }: { y: Yacht; arevoir: Langue[]; nbReservations: number; envoi: boolean; basculer: () => void }) {
  const router = useRouter();
  const notifier = useNotifier();
  const [boite, setBoite] = useState<null | 'archiver' | 'supprimer'>(null);
  const [confirm, setConfirm] = useState('');
  const [enCours, demarrer] = useTransition();
  const f = y.fiche;
  const accroche4 = !!f.accroche && (['en', 'de', 'it'] as const).every((l) => y.textes?.[l]?.accroche?.texte);
  const manquesPhotos = (f.galerie ?? []).flatMap((p, i) => [!p.alt ? 'FR' : null, ...(['en', 'de', 'it'] as const).map((l) => (y.textes?.[l]?.[`galerie.${i}.alt`]?.texte ? null : l.toUpperCase()))]).filter(Boolean);
  const points = [
    { ok: !!f.image?.src, texte: 'Photo principale' },
    { ok: accroche4, texte: 'Accroche en 4 langues' },
    { ok: y.vente != null || y.location_basse != null, texte: 'Prix' },
    { ok: (f.galerie ?? []).filter((p) => p.alt).length >= 3, texte: 'Au moins 3 photos décrites' },
    { ok: manquesPhotos.length === 0, texte: manquesPhotos.length ? `Descriptions de photos : ${manquesPhotos.length} manquante${manquesPhotos.length > 1 ? 's' : ''} (${[...new Set(manquesPhotos)].join(', ')})` : 'Descriptions de photos' },
    { ok: arevoir.length === 0, texte: arevoir.length ? `Traductions à revoir (${arevoir.map((l) => l.toUpperCase()).join(', ')})` : 'Traductions à jour' },
  ];
  const manques = points.filter((p) => !p.ok).length;
  return (
    <>
      <div className="ed-sec"><div><h2>Publication</h2><p>{y.archive ? 'Archivé : retiré du site.' : y.publie ? 'Publié : visible sur le site.' : 'Brouillon : visible seulement par la direction.'}</p></div>
        <div style={{ display: 'grid', gap: '1rem', maxWidth: '40rem' }}>
          <ul className="ct-promises" style={{ margin: 0 }}>{points.map((p) => <li key={p.texte} style={p.ok ? undefined : { color: 'var(--alerte)' }}>{p.texte} {p.ok ? '✓' : ''}</li>)}</ul>
          {manques > 0 && <p className="bandeau-info">La publication reste possible&#8239;: les textes manquants s&apos;afficheront en français.</p>}
          {!y.archive && <p style={{ display: 'flex', gap: '.75rem' }}>
            <BoutonEcrit className={`btn ${y.publie ? 'btn--filet' : 'btn--plein'} btn--petit${envoi ? ' is-envoi' : ''}`} disabled={envoi} onClick={basculer}>{y.publie ? 'Repasser en brouillon' : 'Publier'}</BoutonEcrit>
          </p>}
        </div>
      </div>
      <div className="ed-sec zone-sensible"><div><h2>Zone sensible</h2></div>
        <p style={{ display: 'flex', gap: '.75rem' }}>
          <BoutonEcrit className="btn btn--filet btn--petit" onClick={() => setBoite('archiver')}>{y.archive ? 'Sortir des archives' : 'Archiver'}</BoutonEcrit>
          <BoutonEcrit className="btn btn--danger btn--petit" onClick={() => setBoite('supprimer')}>Supprimer</BoutonEcrit>
        </p>
      </div>
      <Dialogue ouvert={boite === 'archiver'} onFermer={() => setBoite(null)} titre={y.archive ? `Sortir ${y.nom} des archives ?` : `Archiver ${y.nom} ?`} actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={() => setBoite(null)}>Retour</button>
        <BoutonEcrit className="btn btn--plein btn--petit" disabled={enCours} onClick={() => demarrer(async () => { const r = await archiverYacht(y.slug, !y.archive); notifier(r.ok ? (y.archive ? 'Sorti des archives (brouillon)' : 'Archivé · retiré du site') : r.erreur); setBoite(null); router.refresh(); })}>{y.archive ? 'Sortir des archives' : 'Archiver'}</BoutonEcrit></>}>
        <p className="second">{y.archive ? 'Le yacht redevient un brouillon, à publier quand vous le souhaitez.' : 'Le yacht disparaît du site ; ses réservations, textes et photos sont conservés.'}</p>
      </Dialogue>
      <Dialogue ouvert={boite === 'supprimer'} onFermer={() => setBoite(null)} titre={<>Supprimer {y.nom}&#8239;?</>} actions={<>
        <button className="btn btn--filet btn--petit" type="button" onClick={() => setBoite(null)}>Retour</button>
        {nbReservations > 0
          ? <BoutonEcrit className="btn btn--plein btn--petit" onClick={() => setBoite('archiver')}>Archiver</BoutonEcrit>
          : <BoutonEcrit className="btn btn--danger btn--petit" disabled={confirm !== y.nom || enCours} onClick={() => demarrer(async () => { const r = await supprimerYacht(y.slug); if (r.ok) { notifier(`${y.nom} supprimé`); router.push('/direction/yachts'); } else notifier(r.erreur); })}>Supprimer</BoutonEcrit>}</>}>
        {nbReservations > 0
          ? <p className="second">Impossible&#8239;: ce yacht a {nbReservations} réservation{nbReservations > 1 ? 's' : ''}. Archivez-le plutôt&#8239;: il disparaît du site et ses réservations sont conservées.</p>
          : <><p className="second">Aucune réservation. Le yacht, ses textes et ses photos seront supprimés.</p>
            <div className="champ"><label htmlFor="ed-conf">Tapez {y.nom} pour confirmer</label><input id="ed-conf" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /></div></>}
      </Dialogue>
    </>
  );
}
