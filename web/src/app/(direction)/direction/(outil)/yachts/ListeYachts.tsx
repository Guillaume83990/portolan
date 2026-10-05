'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Dialogue } from '@/components/Dialogue';
import { BoutonEcrit, useDemo } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { CarteVide } from '@/components/Rose';
import { archiverYacht, creerYacht, dupliquerYacht, reordonnerYachts, supprimerYacht } from '../../actions';

type Ligne = {
  slug: string; nom: string; photo: string; sous: string; vente: boolean; location: boolean; avant: boolean; publie: boolean; archive: boolean;
  prix: string; modifie: string; revoir: string[]; reservations: number;
};

export function ListeYachts({ lignes: initiales, filtre, compteurs, ajouter, site }: {
  lignes: Ligne[]; filtre: 'publies' | 'brouillons' | 'archives'; compteurs: Record<string, number>; ajouter: boolean; site: string;
}) {
  const router = useRouter();
  const notifier = useNotifier();
  const demo = useDemo();
  const [lignes, setLignes] = useState(initiales);
  const [glisse, setGlisse] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [boite, setBoite] = useState<null | 'ajouter' | { supprimer: Ligne }>(ajouter && !demo ? 'ajouter' : null);
  const [envoi, demarrer] = useTransition();

  const enregistrerOrdre = (liste: Ligne[]) => demarrer(async () => {
    const r = await reordonnerYachts(liste.map((l) => l.slug));
    notifier(r.ok ? 'Ordre enregistré · le site suit le nouvel ordre' : r.erreur);
  });
  const deplacer = (slug: string, sens: -1 | 1) => {
    const i = lignes.findIndex((l) => l.slug === slug), j = i + sens;
    if (j < 0 || j >= lignes.length) return;
    const n = [...lignes]; [n[i], n[j]] = [n[j], n[i]]; setLignes(n); enregistrerOrdre(n); setMenu(null);
  };
  const agir = (fn: () => Promise<{ ok: boolean; erreur?: string; message?: string }>, succes: string) => demarrer(async () => {
    const r = await fn(); setMenu(null);
    notifier(r.ok ? (r.message ?? succes) : r.erreur ?? ''); if (r.ok) router.refresh();
  });

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        {([['publies', 'Publiés'], ['brouillons', 'Brouillons'], ['archives', 'Archivés']] as const).map(([f, l]) => (
          <Link key={f} href={`/direction/yachts?filtre=${f}`} className="chip" aria-pressed={filtre === f} style={{ textDecoration: 'none' }}>{l} · {compteurs[f]}</Link>
        ))}
        <BoutonEcrit className="btn btn--plein btn--petit" style={{ marginLeft: 'auto' }} onClick={() => setBoite('ajouter')}>Ajouter un yacht</BoutonEcrit>
      </div>
      {filtre === 'publies' && !demo && lignes.length > 1 && <p className="second" style={{ fontSize: 'var(--t-xs)', marginBottom: '.75rem' }}>Glissez les lignes pour changer l&apos;ordre d&apos;affichage sur le site.</p>}
      {lignes.length === 0 ? (
        <div className="vide"><CarteVide /><p className="vide__titre">{filtre === 'archives' ? 'Aucun yacht archivé.' : filtre === 'brouillons' ? 'Aucun brouillon.' : 'Aucun yacht publié.'}</p></div>
      ) : (
        <table className="tab tab--mobile">
          <thead><tr><th /><th /><th>Yacht</th><th>Statut</th><th>Prix</th><th>Modifié</th><th /></tr></thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.slug} draggable={!demo && filtre === 'publies'} style={{ opacity: glisse === l.slug ? 0.4 : 1 }}
                onDragStart={() => setGlisse(l.slug)} onDragEnd={() => { if (glisse) enregistrerOrdre(lignes); setGlisse(null); }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!glisse || glisse === l.slug) return;
                  const n = lignes.filter((x) => x.slug !== glisse); n.splice(n.findIndex((x) => x.slug === l.slug), 0, lignes.find((x) => x.slug === glisse)!); setLignes(n);
                }}>
                <td className="cache-m">{filtre === 'publies' && !demo && <span className="poignee" aria-hidden="true">⋮⋮</span>}</td>
                <td className="cache-m">{l.photo && <img className="vign" src={l.photo} alt="" />}</td>
                <td>
                  <Link href={`/direction/yachts/${l.slug}`} style={{ textDecoration: 'none' }}><span className="serif" style={{ fontSize: '1.3rem' }}><em>{l.nom}</em></span></Link><br />
                  <span className="second" style={{ fontSize: 'var(--t-xs)' }}>{l.sous}</span>
                </td>
                <td className="cache-m">
                  {l.vente && <span className="badge badge--payer">À vendre</span>} {l.location && <span className="badge badge--payer">À louer</span>}{' '}
                  {l.avant && <span className="badge badge--confirmee">Mis en avant</span>}{' '}
                  {!l.publie && !l.archive && <span className="badge badge--neutre">Brouillon</span>}
                  {l.archive && <span className="badge badge--annulee">Archivé</span>}
                  {l.revoir.length > 0 && <><br /><span style={{ fontSize: 'var(--t-xs)', color: 'var(--alerte)' }}>● Traductions à revoir ({l.revoir.join(', ')})</span></>}
                </td>
                <td className="cache-m">{l.prix}</td>
                <td className="cache-m second">{l.modifie}</td>
                <td style={{ position: 'relative' }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenu(null); }}>
                  <button className="btn btn--filet btn--petit" type="button" aria-label={`Actions pour ${l.nom}`} aria-expanded={menu === l.slug} onClick={() => setMenu(menu === l.slug ? null : l.slug)}>…</button>
                  {menu === l.slug && (
                    <div className="menu-d">
                      <Link href={`/direction/yachts/${l.slug}`}>Modifier</Link>
                      {l.publie && <a href={`${site}/fr/flotte/${l.slug}/`} target="_blank" rel="noopener">Voir sur le site</a>}
                      {!demo && filtre === 'publies' && <>
                        <button type="button" onClick={() => deplacer(l.slug, -1)}>Monter d&apos;un rang</button>
                        <button type="button" onClick={() => deplacer(l.slug, 1)}>Descendre d&apos;un rang</button>
                      </>}
                      <BoutonEcrit onClick={() => agir(() => dupliquerYacht(l.slug), 'Yacht dupliqué en brouillon')}>Dupliquer</BoutonEcrit>
                      <BoutonEcrit onClick={() => agir(() => archiverYacht(l.slug, !l.archive), l.archive ? `${l.nom} sorti des archives (brouillon)` : `${l.nom} archivé · retiré du site`)}>{l.archive ? 'Sortir des archives' : 'Archiver'}</BoutonEcrit>
                      <BoutonEcrit className="danger" style={{ borderTop: '1px solid var(--filet)' }} onClick={() => { setBoite({ supprimer: l }); setMenu(null); }}>Supprimer</BoutonEcrit>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <AjouterYacht ouvert={boite === 'ajouter'} onFermer={() => setBoite(null)} />
      {boite && typeof boite === 'object' && (
        <SupprimerYacht y={boite.supprimer} envoi={envoi} onFermer={() => setBoite(null)}
          onArchiver={() => { agir(() => archiverYacht(boite.supprimer.slug, true), `${boite.supprimer.nom} archivé · retiré du site`); setBoite(null); }}
          onSupprimer={() => demarrer(async () => { const r = await supprimerYacht(boite.supprimer.slug); notifier(r.ok ? `${boite.supprimer.nom} supprimé` : r.erreur); if (r.ok) { setBoite(null); router.refresh(); } })} />
      )}
    </>
  );
}

function AjouterYacht({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const [nom, setNom] = useState(''); const [chantier, setChantier] = useState(''); const [longueur, setLongueur] = useState('');
  const [vente, setVente] = useState(false); const [location, setLocation] = useState(true);
  const [erreur, setErreur] = useState(''); const [envoi, demarrer] = useTransition();
  return (
    <Dialogue ouvert={ouvert} onFermer={onFermer} titre="Ajouter un yacht" actions={<>
      <button className="btn btn--filet btn--petit" type="button" onClick={onFermer}>Retour</button>
      <BoutonEcrit className={`btn btn--plein btn--petit${envoi ? ' is-envoi' : ''}`} disabled={envoi} onClick={() => demarrer(async () => {
        const r = await creerYacht(nom, chantier, Number(longueur.replace(',', '.')) || 0, vente, location);
        if (r && !r.ok) setErreur(r.erreur);
      })}>Créer le brouillon</BoutonEcrit></>}>
      <div className="champs">
        <div className="champ"><label htmlFor="y-nom">Nom</label><input id="y-nom" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} /></div>
        <div className="champs champs--2">
          <div className="champ"><label htmlFor="y-ch">Chantier</label><input id="y-ch" value={chantier} onChange={(e) => setChantier(e.target.value)} /></div>
          <div className="champ"><label htmlFor="y-lg">Longueur (m)</label><input id="y-lg" inputMode="decimal" value={longueur} onChange={(e) => setLongueur(e.target.value)} /></div>
        </div>
        <p style={{ display: 'flex', gap: '1.5rem' }}>
          <label className="inter"><input type="checkbox" checked={vente} onChange={(e) => setVente(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem' }} /> À vendre</label>
          <label className="inter"><input type="checkbox" checked={location} onChange={(e) => setLocation(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem' }} /> À louer</label>
        </p>
      </div>
      <p className="second" style={{ fontSize: 'var(--t-xs)' }}>Le yacht est créé en brouillon : il n&apos;apparaît sur le site qu&apos;une fois publié depuis l&apos;éditeur.</p>
      {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
    </Dialogue>
  );
}

function SupprimerYacht({ y, envoi, onFermer, onArchiver, onSupprimer }: { y: Ligne; envoi: boolean; onFermer: () => void; onArchiver: () => void; onSupprimer: () => void }) {
  const [confirm, setConfirm] = useState('');
  const bloque = y.reservations > 0;
  return (
    <Dialogue ouvert onFermer={onFermer} titre={<>Supprimer {y.nom}&#8239;?</>} actions={<>
      <button className="btn btn--filet btn--petit" type="button" onClick={onFermer}>Retour</button>
      {bloque
        ? <BoutonEcrit className="btn btn--plein btn--petit" onClick={onArchiver}>Archiver</BoutonEcrit>
        : <BoutonEcrit className={`btn btn--danger btn--petit${envoi ? ' is-envoi' : ''}`} disabled={confirm !== y.nom || envoi} onClick={onSupprimer}>Supprimer</BoutonEcrit>}</>}>
      {bloque
        ? <p className="second">Impossible&#8239;: ce yacht a {y.reservations} réservation{y.reservations > 1 ? 's' : ''}. Archivez-le plutôt&#8239;: il disparaît du site et ses réservations sont conservées.</p>
        : <>
          <p className="second">Aucune réservation. Le yacht, ses textes et ses photos seront supprimés.</p>
          <div className="champ"><label htmlFor="s-conf">Tapez {y.nom} pour confirmer</label><input id="s-conf" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /></div>
        </>}
    </Dialogue>
  );
}
