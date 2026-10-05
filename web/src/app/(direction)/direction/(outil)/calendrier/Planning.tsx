'use client';
// Frise de la flotte : une ligne par yacht à louer. Survol : infobulle. Clic : détail de la réservation.
// Glisser sur des jours libres : « Bloquer des dates » prérempli. Sur téléphone : une liste par yacht et par semaine.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { BoutonBloquer } from '../reservations/Liste';
import { BADGE, libelleStatut, type Statut } from '@/lib/statuts';
import { capitale, dateLongue, euros, initialeNom, jour, plage } from '@/lib/format';
import { useDemo } from '@/components/Demo';

type Barre = { id: string; reference: string; yacht: string; yacht_nom: string; type: string; statut: Statut; debut: string; fin: string; nuits: number; client: string; montant: number; motif: string | null };
const MOTIFS: Record<string, string> = { entretien: 'Entretien', proprietaire: 'Propriétaire', autre: 'Indisponible' };
const JOUR = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const ajouter = (d: string, n: number) => iso(new Date(jour(d).getTime() + n * JOUR));
const classe = (b: Barre) => b.type === 'blocage' ? 'planning2__b--bloc' : b.statut === 'en_attente' ? 'planning2__b--attente' : b.statut === 'a_payer' ? 'planning2__b--payer' : 'planning2__b--ok';
const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Sept.', 'Octobre', 'Novembre', 'Décembre'];
// Numéro de semaine ISO
const semaineIso = (d: string) => { const x = jour(d); const j = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - j + 3); const p = new Date(Date.UTC(x.getUTCFullYear(), 0, 4)); return 1 + Math.round(((x.getTime() - p.getTime()) / JOUR - 3 + ((p.getUTCDay() + 6) % 7)) / 7); };

export function Planning({ annee, anneeReglages, yachts, barres, haute, zoom, mois, semaine }: {
  annee: number; anneeReglages: number; yachts: { slug: string; nom: string }[]; barres: Barre[];
  haute: { debut: string; fin: string }; zoom: 'saison' | 'mois' | 'semaine'; mois: number; semaine: string;
}) {
  const router = useRouter();
  const demo = useDemo();
  // Fenêtre affichée et colonnes d'en-tête
  const { debut, fin, colonnes } = useMemo(() => {
    if (zoom === 'mois') {
      const d = `${annee}-${String(mois).padStart(2, '0')}-01`;
      const f = iso(new Date(Date.UTC(annee, mois, 1)));
      const n = Math.round((jour(f).getTime() - jour(d).getTime()) / JOUR);
      return { debut: d, fin: f, colonnes: Array.from({ length: n }, (_, i) => String(i + 1)) };
    }
    if (zoom === 'semaine') {
      const base = semaine || (barres.find((b) => b.debut >= iso(new Date()))?.debut ?? `${annee}-07-05`);
      const x = jour(base); const lundi = iso(new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * JOUR));
      return { debut: lundi, fin: ajouter(lundi, 7), colonnes: Array.from({ length: 7 }, (_, i) => capitale(new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(jour(ajouter(lundi, i))))) };
    }
    return { debut: `${annee}-04-01`, fin: `${annee}-11-01`, colonnes: MOIS_NOMS.slice(3, 10) };
  }, [zoom, annee, mois, semaine, barres]);
  const total = (jour(fin).getTime() - jour(debut).getTime()) / JOUR;
  const pos = (d: string) => Math.max(0, Math.min(100, ((jour(d).getTime() - jour(debut).getTime()) / JOUR / total) * 100));
  const visibles = barres.filter((b) => b.fin > debut && b.debut < fin);
  const aujourdhui = iso(new Date());
  const [bulle, setBulle] = useState<{ b: Barre; x: number; y: number } | null>(null);
  const [glisse, setGlisse] = useState<{ yacht: string; a: number; b: number } | null>(null);
  const [blocage, setBlocage] = useState<{ yacht: string; debut: string; fin: string } | undefined>();
  const grille = useRef<HTMLDivElement>(null);

  const allerA = (p: Record<string, string | number>) => {
    const q = new URLSearchParams({ annee: String(annee), zoom, mois: String(mois), ...(semaine ? { semaine } : {}), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) });
    router.push(`/direction/calendrier?${q}`);
  };
  const precedent = () => zoom === 'saison' ? allerA({ annee: annee - 1 }) : zoom === 'mois' ? allerA(mois <= 1 ? { annee: annee - 1, mois: 12 } : { mois: mois - 1 }) : allerA({ semaine: ajouter(debut, -7) });
  const suivant = () => zoom === 'saison' ? allerA({ annee: annee + 1 }) : zoom === 'mois' ? allerA(mois >= 12 ? { annee: annee + 1, mois: 1 } : { mois: mois + 1 }) : allerA({ semaine: ajouter(debut, 7) });
  const titre = zoom === 'saison' ? `Saison ${annee}` : zoom === 'mois' ? `${MOIS_NOMS[mois - 1]} ${annee}` : `Semaine ${semaineIso(debut)} · ${plage(debut, ajouter(debut, 6))}`;

  // Glisser sur une piste libre → dates à bloquer
  const jourSous = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(total - 1, Math.floor(((e.clientX - r.left) / r.width) * total)));
  };
  const debutGlisse = (e: React.PointerEvent<HTMLDivElement>, yacht: string) => {
    if (demo || (e.target as HTMLElement).tagName === 'BUTTON') return;
    const d = jourSous(e); e.currentTarget.setPointerCapture(e.pointerId); setGlisse({ yacht, a: d, b: d });
  };
  const finGlisse = () => {
    if (!glisse) return;
    const a = Math.min(glisse.a, glisse.b), b = Math.max(glisse.a, glisse.b);
    if (b > a) setBlocage({ yacht: glisse.yacht, debut: ajouter(debut, a), fin: ajouter(debut, b + 1) });
    setGlisse(null);
  };

  const zooms = [['saison', 'Saison'], ['mois', 'Mois'], ['semaine', 'Semaine']] as const;
  const colGrille = { gridTemplateColumns: `repeat(${colonnes.length}, 1fr)` };
  const fondPiste = { backgroundSize: `calc(100% / ${colonnes.length}) 100%` };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button className="btn btn--filet btn--petit" type="button" aria-label="Période précédente" onClick={precedent}>←</button>
        <span className="titre-xs">{titre}</span>
        <button className="btn btn--filet btn--petit" type="button" aria-label="Période suivante" onClick={suivant}>→</button>
        {annee !== anneeReglages && <button className="lien lien--discret" type="button" onClick={() => allerA({ annee: anneeReglages, zoom: 'saison' })} style={{ fontSize: 'var(--t-xs)' }}>Revenir à {anneeReglages}</button>}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '.4rem' }}>
          {zooms.map(([z, l]) => <button key={z} type="button" className="chip" aria-pressed={zoom === z} onClick={() => allerA({ zoom: z })}>{l}</button>)}
        </span>
      </div>

      <div className="planning2 seul-ordi">
        <div className="planning2__g" ref={grille} onMouseLeave={() => setBulle(null)}>
          <div style={{ borderBottom: '1px solid var(--filet-fort)' }} />
          <div className="planning2__mois" style={colGrille}>{colonnes.map((c, i) => <span key={i}>{c}</span>)}</div>
          {yachts.map((y) => (
            <div key={y.slug} style={{ display: 'contents' }}>
              <div className="planning2__nom">{y.nom}</div>
              <div className="planning2__piste" style={{ ...fondPiste, cursor: demo ? 'default' : 'crosshair', touchAction: 'none' }}
                onPointerDown={(e) => debutGlisse(e, y.slug)} onPointerMove={(e) => glisse && glisse.yacht === y.slug && setGlisse({ ...glisse, b: jourSous(e) })} onPointerUp={finGlisse}>
                {haute.fin > debut && haute.debut < fin && <span className="planning2__haute" style={{ left: `${pos(haute.debut)}%`, width: `${pos(haute.fin) - pos(haute.debut)}%` }} />}
                {aujourdhui >= debut && aujourdhui < fin && <span className="planning2__auj" style={{ left: `${pos(aujourdhui)}%` }} aria-label="Aujourd'hui" />}
                {glisse?.yacht === y.slug && (
                  <span className="planning2__b planning2__b--bloc" style={{ left: `${(Math.min(glisse.a, glisse.b) / total) * 100}%`, width: `${((Math.abs(glisse.b - glisse.a) + 1) / total) * 100}%`, outline: '1px dashed var(--texte)' }} />
                )}
                {visibles.filter((b) => b.yacht === y.slug).map((b) => (
                  <Link key={b.id} href={`/direction/reservations?ref=${b.reference}&filtre=toutes`} className={`planning2__b ${classe(b)}`}
                    style={{ left: `${pos(b.debut)}%`, width: `${Math.max(0.8, pos(b.fin) - pos(b.debut))}%`, textDecoration: 'none' }}
                    onMouseEnter={(e) => { const g = grille.current!.getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(); setBulle({ b, x: Math.min(r.left - g.left, g.width - 290), y: r.bottom - g.top + 6 }); }}
                    onFocus={(e) => { const g = grille.current!.getBoundingClientRect(), r = e.currentTarget.getBoundingClientRect(); setBulle({ b, x: Math.min(r.left - g.left, g.width - 290), y: r.bottom - g.top + 6 }); }}
                    onBlur={() => setBulle(null)}>
                    {b.type === 'blocage' ? MOTIFS[b.motif ?? 'autre'] : `${initialeNom(b.client)}${b.nuits >= 7 ? ` · ${b.nuits} n.` : ''}`}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {bulle && (
            <div className="bulle" role="tooltip" style={{ left: bulle.x, top: bulle.y }}>
              <b>{bulle.b.reference} · <em>{bulle.b.yacht_nom}</em></b>
              {bulle.b.type === 'blocage' ? MOTIFS[bulle.b.motif ?? 'autre'] : bulle.b.client}<br />
              {plage(bulle.b.debut, bulle.b.fin)} {bulle.b.fin.slice(0, 4)} · {bulle.b.nuits} nuits<br />
              {bulle.b.type === 'location' && <>{euros(bulle.b.montant)} · <span style={{ color: 'var(--laiton)' }}>{libelleStatut(bulle.b.statut)}</span></>}
            </div>
          )}
        </div>
      </div>

      <ListeMobile yachts={yachts} barres={barres} annee={annee} />

      <p style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem 1.5rem', fontSize: 'var(--t-xs)', color: 'var(--second)', marginTop: '1rem' }}>
        {[['planning2__b--ok', 'Confirmée, soldée'], ['planning2__b--payer', 'À payer'], ['planning2__b--attente', 'En attente'], ['planning2__b--bloc', 'Blocage']].map(([c, l]) => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><i className={`planning2__b ${c}`} style={{ position: 'static', display: 'inline-block', width: '1.6rem', height: '.8rem', padding: 0 }} />{l}</span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><i style={{ display: 'inline-block', width: '1.6rem', height: '.8rem', background: 'color-mix(in srgb, var(--laiton) 10%, transparent)' }} />Haute saison</span>
      </p>
      <p className="second seul-ordi" style={{ fontSize: 'var(--t-xs)', marginTop: '.5rem' }}>
        Survol&#8239;: infobulle. Clic&#8239;: détail de la réservation.{!demo && <> Glisser sur des jours libres&#8239;: «&nbsp;Bloquer des dates&nbsp;» prérempli.</>}
      </p>
      {blocage && <BoutonBloquer key={`${blocage.yacht}${blocage.debut}${blocage.fin}`} yachts={yachts} prerempli={blocage} />}
    </>
  );
}

// Téléphone : par yacht, les semaines de la saison (réservation ou « Libre »), à partir d'aujourd'hui
function ListeMobile({ yachts, barres, annee }: { yachts: { slug: string; nom: string }[]; barres: Barre[]; annee: number }) {
  const depart = iso(new Date()) > `${annee}-05-01` ? iso(new Date()) : `${annee}-05-01`;
  const x = jour(depart); let lundi = iso(new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * JOUR));
  const semaines: string[] = [];
  while (lundi < `${annee}-10-05` && semaines.length < 24) { semaines.push(lundi); lundi = ajouter(lundi, 7); }
  return (
    <div className="seul-mobile">
      {yachts.map((y) => (
        <div key={y.slug}>
          <h2 className="titre-xs" style={{ margin: '1.5rem 0 .5rem' }}><em>{y.nom}</em></h2>
          <table className="tab"><tbody>
            {semaines.map((s) => {
              const b = barres.find((r) => r.yacht === y.slug && r.debut < ajouter(s, 7) && r.fin > s);
              return (
                <tr key={s}>
                  <td>Sem. {semaineIso(s)}</td>
                  {b ? <>
                    <td><Link href={`/direction/reservations?ref=${b.reference}&filtre=toutes`} style={{ textDecoration: 'none' }}>{plage(b.debut, b.fin)}</Link></td>
                    <td>{b.type === 'blocage' ? <span className="badge badge--neutre">{MOTIFS[b.motif ?? 'autre']}</span> : <span className={`badge ${BADGE[b.statut]}`}>{libelleStatut(b.statut)}</span>}</td>
                  </> : <td colSpan={2} className="second">Libre · {dateLongue(s).replace(/ \d{4}$/, '')}</td>}
                </tr>
              );
            })}
          </tbody></table>
        </div>
      ))}
    </div>
  );
}
