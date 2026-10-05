import type { Metadata } from 'next';
import Link from 'next/link';
import { Haut } from '../Haut';
import { demandes, direction, inscriptions, notes, type DemandeDir } from '@/lib/direction/donnees';
import { capitale, dateCourte, dateLongue, heureMinute, ilYa } from '@/lib/format';
import { CarteVide } from '@/components/Rose';
import { NotesInternes } from '../Notes';
import { StatutDemande, FiltreType, HorsMarche } from './Interactions';
import { ContactClient } from '../reservations/Actions';

export const metadata: Metadata = { title: 'Demandes' };

const TYPES_DEMANDE: Record<string, string> = {
  dossier: 'Dossier', visite: 'Visite', brochure: 'Brochure', contact: 'Contact', question: 'Question',
  'projet-acheter': "Projet d'achat", 'projet-louer': 'Projet de location', 'projet-vendre': 'Vente', 'hors-marche': 'Hors marché',
};
const STATUTS = [['nouvelle', 'Nouvelle'], ['en_cours', 'En cours'], ['gagnee', 'Gagnée'], ['perdue', 'Perdue']] as const;
const LANGUES: Record<string, string> = { fr: 'Français', en: 'Anglais', de: 'Allemand', it: 'Italien' };
const DETAILS: Record<string, string> = { taille: 'Taille', budget: 'Budget', periode: 'Période', invites: 'Invités', echeance: 'Échéance', yacht: 'Yacht', port: "Port d'attache", rappel: 'Préfère' };

// Résumé d'une demande en une ligne : message, ou critères du formulaire
function resume(d: DemandeDir) {
  if (d.brochure_envoyee_le) return `Brochure envoyée le ${dateCourte(d.brochure_envoyee_le)}`;
  if (d.message) return `« ${d.message.length > 80 ? d.message.slice(0, 80) + '…' : d.message} »`;
  return Object.entries(d.details ?? {}).filter(([k]) => k !== 'rappel').map(([, v]) => v).join(', ');
}

export default async function Demandes({ searchParams }: PageProps<'/direction/demandes'>) {
  const sp = await searchParams;
  const [{ demo }, liste, inscrits] = await Promise.all([direction(), demandes(), inscriptions()]);
  const onglet = sp.onglet === 'hors-marche' ? 'hors-marche' : 'demandes';
  const vue = sp.vue === 'liste' ? 'liste' : 'colonnes';
  const type = typeof sp.type === 'string' ? sp.type : '';
  const filtrees = liste.filter((d) => !type || d.type === type);
  const choisie = liste.find((d) => d.id === sp.demande) ?? (onglet === 'demandes' ? filtrees[0] : undefined);
  const notesChoisie = choisie ? await notes('demande', choisie.id) : [];
  const lien = (p: Record<string, string>) => `/direction/demandes?${new URLSearchParams({ vue, ...(type ? { type } : {}), ...p })}`;

  const carte = (d: DemandeDir) => (
    <Link key={d.id} href={lien({ demande: d.id })} className={`carte-dem${d.id === choisie?.id ? ' is-choisie' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }} scroll={false}>
      <p style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', color: 'var(--texte)', fontSize: 'var(--t-xs)' }}>
        <span className="badge badge--neutre">{TYPES_DEMANDE[d.type] ?? d.type}</span><span className="second">{ilYa(d.cree_le).replace('il y a ', 'il y a ')}</span>
      </p>
      <b style={{ fontWeight: 500 }}>{d.nom}{d.yacht_nom && <> · <em>{d.yacht_nom}</em></>}</b>
      <p>{d.langue.toUpperCase()} · {resume(d)}</p>
    </Link>
  );

  return (
    <>
      <Haut titre="Demandes" />
      <div className={`maitre${sp.demande ? ' a-detail' : ''}`}>
        <div className="maitre__liste">
          <nav className="onglets">
            <Link href="/direction/demandes" aria-current={onglet === 'demandes' ? 'page' : undefined}>Demandes</Link>
            <Link href="/direction/demandes?onglet=hors-marche" aria-current={onglet === 'hors-marche' ? 'page' : undefined}>Hors marché <span className="compteur">{inscrits.length}</span></Link>
          </nav>
          {onglet === 'hors-marche' ? <HorsMarche inscrits={inscrits} demo={demo} /> : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center', margin: '1.25rem 0' }}>
                <Link className="chip" aria-pressed={vue === 'colonnes'} href={lien({ vue: 'colonnes' })} style={{ textDecoration: 'none' }}>Colonnes</Link>
                <Link className="chip" aria-pressed={vue === 'liste'} href={lien({ vue: 'liste' })} style={{ textDecoration: 'none' }}>Liste</Link>
                <FiltreType type={type} types={Object.entries(TYPES_DEMANDE).filter(([k]) => liste.some((d) => d.type === k))} />
              </div>
              {filtrees.length === 0 ? <div className="vide"><CarteVide /><p className="vide__titre">Aucune demande.</p><p>Les formulaires du site arriveront ici.</p></div>
                : vue === 'colonnes' ? (
                  <div className="colonnes">
                    {STATUTS.map(([s, l]) => {
                      const col = filtrees.filter((d) => d.statut === s);
                      return <section className="colonne" key={s}><h3>{l}<span>{col.length}</span></h3>{col.map(carte)}</section>;
                    })}
                  </div>
                ) : (
                  <table className="tab tab--mobile">
                    <thead><tr><th>Type</th><th>Nom</th><th>Yacht</th><th>Langue</th><th>Reçue</th><th>Statut</th></tr></thead>
                    <tbody>{filtrees.map((d) => (
                      <tr key={d.id} className={d.id === choisie?.id ? 'is-choisie' : ''}>
                        <td><span className="badge badge--neutre">{TYPES_DEMANDE[d.type] ?? d.type}</span></td>
                        <td><Link className="lien" href={lien({ demande: d.id })} scroll={false}>{d.nom}</Link></td>
                        <td className="cache-m serif"><em>{d.yacht_nom ?? '—'}</em></td>
                        <td className="cache-m">{d.langue.toUpperCase()}</td>
                        <td className="cache-m second">{ilYa(d.cree_le)}</td>
                        <td>{STATUTS.find(([s]) => s === d.statut)?.[1]}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
            </>
          )}
        </div>

        {onglet === 'demandes' && choisie && (
          <aside className="maitre__detail" aria-label="Détail de la demande">
            <p className="seul-mobile" style={{ marginBottom: '1rem' }}><Link className="lien lien--discret" href={lien({})}>← Demandes</Link></p>
            <p style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge badge--neutre">{TYPES_DEMANDE[choisie.type] ?? choisie.type}</span>
              <span className="second" style={{ fontSize: 'var(--t-xs)' }}>Reçue le {dateLongue(choisie.cree_le)}, {heureMinute(choisie.cree_le)}{choisie.yacht_nom ? ` · depuis la fiche ${choisie.yacht_nom}` : choisie.page ? ` · depuis ${choisie.page}` : ''}</span>
            </p>
            <p className="titre-s" style={{ marginTop: '.6rem' }}>{choisie.nom}</p>
            <dl className="paires" style={{ marginTop: '1rem' }}>
              {choisie.yacht_nom && <div><dt>Yacht</dt><dd><em>{choisie.yacht_nom}</em></dd></div>}
              <div><dt>E-mail</dt><dd>{choisie.email}</dd></div>
              {choisie.telephone && <div><dt>Téléphone</dt><dd>{choisie.telephone}</dd></div>}
              <div><dt>Langue</dt><dd>{LANGUES[choisie.langue] ?? choisie.langue}</dd></div>
              {Object.entries(choisie.details ?? {}).map(([k, v]) => <div key={k}><dt>{DETAILS[k] ?? capitale(k)}</dt><dd>{capitale(String(v))}</dd></div>)}
              {choisie.message && <div><dt>Message</dt><dd>« {choisie.message} »</dd></div>}
              {choisie.brochure_envoyee_le && <div><dt>Brochure</dt><dd>Envoyée le {dateLongue(choisie.brochure_envoyee_le)}</dd></div>}
            </dl>
            <ContactClient telephone={choisie.telephone} email={choisie.email} reference="votre demande" yacht={choisie.yacht_nom ?? 'Portolan'} demo={demo} />
            <h2>Statut</h2>
            <StatutDemande id={choisie.id} statut={choisie.statut} />
            <h2>Notes internes</h2>
            <NotesInternes cible="demande" id={choisie.id} notes={notesChoisie} />
          </aside>
        )}
      </div>
    </>
  );
}
