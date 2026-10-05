import type { Metadata } from 'next';
import Link from 'next/link';
import { Haut, Badge } from '../Haut';
import { clients, demandes, direction, documents, notes, paiements, reservations } from '@/lib/direction/donnees';
import { capitale, dateCourte, dateMoyenne, euros, moisAnnee } from '@/lib/format';
import { CarteVide } from '@/components/Rose';
import { NotesInternes } from '../Notes';
import { ContactClient } from '../reservations/Actions';
import { BoutonLien } from './BoutonLien';

export const metadata: Metadata = { title: 'Clients' };
const LANGUES: Record<string, string> = { fr: 'Français', en: 'Anglais', de: 'Allemand', it: 'Italien' };
const TYPES_PAIEMENT: Record<string, string> = { acompte: 'Acompte', solde: 'Solde', apa: 'APA', total: 'Solde + APA' };
const STATUT_DEMANDE: Record<string, string> = { nouvelle: 'nouvelle', en_cours: 'en cours', gagnee: 'gagnée', perdue: 'perdue' };
const TYPES_DEMANDE: Record<string, string> = { dossier: 'Dossier', visite: 'Visite', brochure: 'Brochure', contact: 'Contact', 'projet-acheter': "Projet d'achat", 'projet-louer': 'Projet de location', 'projet-vendre': 'Vente' };

export default async function Clients({ searchParams }: PageProps<'/direction/clients'>) {
  const sp = await searchParams;
  const [{ demo }, liste, resas, pay, docs, dems] = await Promise.all([direction(), clients(), reservations(), paiements(), documents(), demandes()]);
  const tri = sp.tri === 'inscription' || sp.tri === 'nom' ? sp.tri : 'regle';
  const q = typeof sp.q === 'string' ? sp.q.toLowerCase() : '';
  const tries = liste.filter((c) => !q || `${c.prenom} ${c.nom} ${c.email}`.toLowerCase().includes(q))
    .sort((a, b) => tri === 'nom' ? `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`) : tri === 'inscription' ? b.cree_le.localeCompare(a.cree_le) : b.regle - a.regle);
  const choisi = liste.find((c) => c.id === sp.client) ?? tries[0];
  const notesChoisi = choisi ? await notes('client', choisi.id) : [];
  const sesResas = choisi ? resas.filter((r) => r.client === choisi.id && r.type === 'location') : [];
  const sesPaiements = choisi ? pay.filter((p) => p.client === choisi.id && p.statut !== 'en_attente') : [];
  const sesDocs = choisi ? docs.filter((d) => d.client === choisi.id) : [];
  const sesDemandes = choisi ? dems.filter((d) => d.email === choisi.email) : [];
  const th = (cle: string, libelle: string) => (
    <th className={cle === 'regle' ? 'nb' : undefined} aria-sort={tri === cle ? 'descending' : undefined}>
      <Link href={`/direction/clients?tri=${cle}${choisi ? `&client=${choisi.id}` : ''}`} style={{ color: 'inherit', textDecoration: 'none' }}>{libelle}{tri === cle ? ' ↓' : ''}</Link>
    </th>
  );

  return (
    <>
      <Haut titre="Clients" />
      <div className={`maitre${sp.client ? ' a-detail' : ''}`}>
        <div className="maitre__liste">
          {liste.length === 0 ? <div className="vide"><CarteVide /><p className="vide__titre">Aucun client pour l&apos;instant.</p><p>Les comptes créés sur le site apparaîtront ici.</p></div> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tab tab--mobile">
                <thead><tr>{th('nom', 'Client')}<th>Téléphone</th><th>Langue</th><th className="nb">Résa.</th>{th('regle', 'Total réglé')}<th>Dernière croisière</th>{th('inscription', 'Inscription')}</tr></thead>
                <tbody>{tries.map((c) => (
                  <tr key={c.id} className={c.id === choisi?.id ? 'is-choisie' : ''}>
                    <td><Link href={`/direction/clients?client=${c.id}&tri=${tri}`} scroll={false} style={{ textDecoration: 'none' }}><b style={{ fontWeight: 500 }}>{c.prenom} {c.nom}</b></Link><br /><span className="second" style={{ fontSize: 'var(--t-xs)' }}>{c.email}</span></td>
                    <td className="cache-m" style={{ whiteSpace: 'nowrap' }}>{c.telephone || '—'}</td>
                    <td className="cache-m">{c.langue.toUpperCase()}</td>
                    <td className="nb">{c.reservations}</td>
                    <td className="nb cache-m">{euros(c.regle)}</td>
                    <td className="cache-m">{c.derniere ? moisAnnee(c.derniere) : '—'}</td>
                    <td className="cache-m second">{moisAnnee(c.cree_le).toLowerCase()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>

        {choisi && (
          <aside className="maitre__detail" aria-label="Fiche client">
            <p className="seul-mobile" style={{ marginBottom: '1rem' }}><Link className="lien lien--discret" href="/direction/clients">← Clients</Link></p>
            <p className="titre-s">{choisi.prenom} {choisi.nom}</p>
            <p className="second">Compte créé en {moisAnnee(choisi.cree_le).toLowerCase()} · {LANGUES[choisi.langue] ?? choisi.langue}</p>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <ContactClient telephone={choisi.telephone} email={choisi.email} reference="votre projet" yacht="Portolan" demo={demo} />
              {!demo && <BoutonLien email={choisi.email} />}
            </div>
            <h2>Coordonnées</h2>
            <dl className="paires">
              <div><dt>E-mail</dt><dd>{choisi.email}</dd></div>
              {choisi.telephone && <div><dt>Téléphone</dt><dd>{choisi.telephone}</dd></div>}
              {(choisi.adresse || choisi.ville) && <div><dt>Facturation</dt><dd>{[choisi.societe, choisi.adresse, [choisi.code_postal, choisi.ville].filter(Boolean).join(' '), choisi.pays].filter(Boolean).join(', ')}</dd></div>}
            </dl>
            <h2>Réservations</h2>
            {sesResas.length === 0 ? <p className="second">Aucune réservation.</p> : (
              <table className="tab"><tbody>{sesResas.map((r) => (
                <tr key={r.id}><td><Link className="lien" href={`/direction/reservations?ref=${r.reference}&filtre=toutes`}>{r.reference}</Link></td><td className="serif"><em>{r.yacht_nom}</em></td><td><Badge statut={r.statut} /></td></tr>
              ))}</tbody></table>
            )}
            <h2>Paiements</h2>
            {sesPaiements.length === 0 ? <p className="second">Aucun paiement.</p> : (
              <table className="tab"><tbody>{sesPaiements.map((p) => (
                <tr key={p.id}><td className="second">{p.paye_le ? dateMoyenne(p.paye_le) : '—'}</td><td>{TYPES_PAIEMENT[p.type] ?? p.type} {p.reference}</td><td className="nb">{euros(p.montant)}{p.rembourse > 0 && <><br /><span className="second" style={{ fontSize: 'var(--t-xs)' }}>{euros(p.rembourse)} remboursés</span></>}</td></tr>
              ))}</tbody></table>
            )}
            <h2>Documents</h2>
            <p className="second">{sesDocs.length ? `${sesDocs.length} document${sesDocs.length > 1 ? 's' : ''} : ${sesDocs.map((d) => d.numero).join(', ')}` : 'Aucun document pour l’instant.'}</p>
            {sesDemandes.length > 0 && <>
              <h2>Demandes de formulaire</h2>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: 'var(--t-s)' }}>
                {sesDemandes.map((d) => <li key={d.id}><Link className="lien" href={`/direction/demandes?demande=${d.id}`}>{TYPES_DEMANDE[d.type] ?? capitale(d.type)}</Link>, {dateCourte(d.cree_le)} {new Date(d.cree_le).getFullYear()} ({STATUT_DEMANDE[d.statut]})</li>)}
              </ul>
            </>}
            <h2>Notes internes</h2>
            <NotesInternes cible="client" id={choisi.id} notes={notesChoisi} />
          </aside>
        )}
      </div>
    </>
  );
}
