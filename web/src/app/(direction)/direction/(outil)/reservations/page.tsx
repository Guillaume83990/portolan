import type { Metadata } from 'next';
import Link from 'next/link';
import { Haut, Badge } from '../Haut';
import { direction, journal, reservations, yachts, type ResaDir } from '@/lib/direction/donnees';
import { dans, dateCourte, dateMoyenne, euros, heure, jourSemaineCourt, plage, heureMinute, capitale, dateLongue } from '@/lib/format';
import { CarteVide } from '@/components/Rose';
import { TableReservations, FiltresReservations, BoutonBloquer } from './Liste';
import { ActionsReservation, NotesReservation, ContactClient } from './Actions';

export const metadata: Metadata = { title: 'Réservations' };

const FILTRES = [
  ['a_traiter', 'À traiter'], ['a_payer', 'À payer'], ['confirmees', 'Confirmées'], ['soldees', 'Soldées'],
  ['passees', 'Passées'], ['blocages', 'Blocages'], ['toutes', 'Toutes'],
] as const;
type Filtre = (typeof FILTRES)[number][0];
const garde: Record<Filtre, (r: ResaDir) => boolean> = {
  a_traiter: (r) => r.type === 'location' && r.statut === 'en_attente',
  a_payer: (r) => r.type === 'location' && r.statut === 'a_payer',
  confirmees: (r) => r.type === 'location' && r.statut === 'confirmee',
  soldees: (r) => r.type === 'location' && r.statut === 'soldee',
  passees: (r) => r.type === 'location' && ['terminee', 'refusee', 'expiree', 'annulee'].includes(r.statut),
  blocages: (r) => r.type === 'blocage',
  toutes: () => true,
};
const VIDE: Record<Filtre, [string, string]> = {
  a_traiter: ['Rien à traiter.', 'Belle journée.'], a_payer: ['Aucun acompte attendu.', 'Les demandes validées apparaîtront ici.'],
  confirmees: ['Aucune réservation confirmée.', 'Elles apparaîtront ici dès le premier acompte.'], soldees: ['Aucune réservation soldée.', ''],
  passees: ['Aucune réservation passée.', ''], blocages: ['Aucun blocage.', 'Entretien ou usage du propriétaire : « Bloquer des dates ».'],
  toutes: ['Saison vide', 'Les premières demandes apparaîtront ici.'],
};
const LANGUES: Record<string, string> = { fr: 'Français', en: 'Anglais', de: 'Allemand', it: 'Italien' };
const MOTIFS: Record<string, string> = { entretien: 'Entretien', proprietaire: 'Usage du propriétaire', autre: 'Autre' };

function echeance(r: ResaDir) {
  if (r.type === 'blocage') return MOTIFS[r.motif ?? 'autre'];
  if (r.statut === 'en_attente') return `expire ${dans(r.expire_le)}`;
  if (r.statut === 'a_payer') return `acompte ${dans(r.expire_le)}`;
  if (r.statut === 'confirmee' && r.solde_du_le) return `solde le ${new Date(r.solde_du_le + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
  return '—';
}

export default async function Reservations({ searchParams }: PageProps<'/direction/reservations'>) {
  const sp = await searchParams;
  const [{ demo }, toutes, flotte] = await Promise.all([direction(), reservations(), yachts()]);
  const choisie = typeof sp.ref === 'string' ? toutes.find((r) => r.reference === sp.ref) : undefined;
  const filtre: Filtre = (FILTRES.some(([f]) => f === sp.filtre) ? sp.filtre : choisie && !garde.a_traiter(choisie) ? 'toutes' : 'a_traiter') as Filtre;
  const yacht = typeof sp.yacht === 'string' ? sp.yacht : '';
  const mois = typeof sp.mois === 'string' ? sp.mois : '';
  const desc = sp.tri === 'desc';

  const liste = toutes.filter(garde[filtre]).filter((r) => !yacht || r.yacht === yacht).filter((r) => !mois || r.debut.startsWith(mois))
    .sort((a, b) => (desc ? -1 : 1) * a.debut.localeCompare(b.debut));
  const selection = choisie ?? liste[0];
  const compte = (f: Filtre) => toutes.filter(garde[f]).length;
  const histoire = selection ? await journal(selection.id) : [];
  const passees = selection?.client ? toutes.filter((r) => r.client === selection.client && r.id !== selection.id && r.type === 'location').length : 0;
  const moisSaison = [...new Set(toutes.map((r) => r.debut.slice(0, 7)))].sort();

  const lignes = liste.map((r) => ({
    id: r.id, reference: r.reference, yacht: r.yacht_nom, client: r.type === 'blocage' ? MOTIFS[r.motif ?? 'autre'] : r.client_nom,
    plage: plage(r.debut, r.fin), nuits: r.nuits, montant: r.type === 'blocage' ? '—' : euros(r.montant),
    statut: r.statut, type: r.type, echeance: echeance(r),
  }));

  return (
    <>
      <Haut titre="Réservations" />
      <div className={`maitre${choisie ? ' a-detail' : ''}`}>
        <div className="maitre__liste">
          <nav className="onglets" aria-label="Filtres">
            {FILTRES.map(([f, libelle]) => {
              const n = f === 'a_traiter' || f === 'a_payer' ? compte(f) : 0;
              return (
                <Link key={f} href={`/direction/reservations?filtre=${f}${yacht ? `&yacht=${yacht}` : ''}`} aria-current={f === filtre ? 'page' : undefined}>
                  {libelle}{n > 0 && <span className="compteur">{n}</span>}
                </Link>
              );
            })}
          </nav>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'end', margin: '1.25rem 0' }}>
            <FiltresReservations yacht={yacht} mois={mois} yachts={flotte.map((y) => ({ slug: y.slug, nom: y.nom }))} moisSaison={moisSaison} />
            <BoutonBloquer yachts={flotte.filter((y) => y.location_basse != null && !y.archive).map((y) => ({ slug: y.slug, nom: y.nom }))} ouvert={sp.bloquer === '1'} />
          </div>
          {lignes.length === 0
            ? <div className="vide"><CarteVide /><p className="vide__titre">{VIDE[filtre][0]}</p>{VIDE[filtre][1] && <p>{VIDE[filtre][1]}</p>}</div>
            : <TableReservations lignes={lignes} choisie={selection?.reference} desc={desc} />}
        </div>

        {selection && (
          <aside className="maitre__detail" aria-label={`Détail de la réservation ${selection.reference}`}>
            <p className="seul-mobile" style={{ marginBottom: '1rem' }}><Link className="lien lien--discret" href={`/direction/reservations?filtre=${filtre}`}>← Réservations</Link></p>
            <p style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="etiq">{selection.reference}</span>
              {selection.type === 'blocage' ? <span className="badge badge--neutre">Blocage</span> : <Badge statut={selection.statut} />}
              {selection.type === 'location' && ['en_attente', 'a_payer'].includes(selection.statut) && <span className="second" style={{ fontSize: 'var(--t-xs)' }}>{echeance(selection)}</span>}
            </p>
            <p className="titre-s" style={{ marginTop: '.6rem' }}><em>{selection.yacht_nom}</em></p>
            <p className="second">
              Du {jourSemaineCourt(selection.debut)} au {jourSemaineCourt(selection.fin)} {selection.fin.slice(0, 4)} · {selection.nuits} nuit{selection.nuits > 1 ? 's' : ''}
              {selection.type === 'location' && <> · <b style={{ color: 'var(--texte)', fontWeight: 500 }}>{euros(selection.montant)}</b></>}
            </p>

            {selection.type === 'location' ? (
              <>
                <h2>Client</h2>
                <dl className="paires">
                  <div><dt>Nom</dt><dd>{selection.client ? <Link className="lien" href={`/direction/clients?client=${selection.client}`}>{selection.client_nom}</Link> : selection.client_nom}
                    {passees > 0 && <> · {passees} autre{passees > 1 ? 's' : ''} réservation{passees > 1 ? 's' : ''}</>}</dd></div>
                  <div><dt>E-mail</dt><dd>{selection.client_email}</dd></div>
                  {selection.client_telephone && <div><dt>Téléphone</dt><dd>{selection.client_telephone}</dd></div>}
                  <div><dt>Langue</dt><dd>{LANGUES[selection.langue] ?? selection.langue}</dd></div>
                </dl>
                <ContactClient telephone={selection.client_telephone} email={selection.client_email} reference={selection.reference} yacht={selection.yacht_nom} demo={demo} />

                <h2>Croisière</h2>
                <dl className="paires">
                  <div><dt>Embarquement</dt><dd>{heure(selection.heure)}, {selection.port}</dd></div>
                  <div><dt>Invités</dt><dd>{selection.invites}</dd></div>
                  {selection.message && <div><dt>Souhaits</dt><dd>{selection.message}</dd></div>}
                </dl>

                <h2>Échéancier</h2>
                <Echeancier r={selection} />
              </>
            ) : (
              <>
                <h2>Blocage</h2>
                <dl className="paires">
                  <div><dt>Motif</dt><dd>{MOTIFS[selection.motif ?? 'autre']}</dd></div>
                  {selection.note_interne && <div><dt>Note</dt><dd>{selection.note_interne}</dd></div>}
                </dl>
              </>
            )}

            {histoire.length > 0 && (
              <>
                <h2>Historique</h2>
                <ol className="journal">
                  {histoire.map((j, i) => <li key={i}><time dateTime={j.cree_le}>{dateCourte(j.cree_le)} {heureMinute(j.cree_le)}</time><span>{j.texte}</span></li>)}
                </ol>
              </>
            )}

            {selection.type === 'location' && (
              <>
                <h2>Notes</h2>
                <NotesReservation id={selection.id} interne={selection.note_interne} mot={selection.note_directeur} />
              </>
            )}
            <ActionsReservation key={selection.id} demo={demo} auto={typeof sp.action === 'string' ? sp.action : ''} r={{
              id: selection.id, reference: selection.reference, type: selection.type, statut: selection.statut,
              client: selection.client_nom, acompte: selection.acompte, solde: selection.solde, apa: selection.apa, montant: selection.montant,
              regle: selection.regle, debut: selection.debut,
            }} />
          </aside>
        )}
      </div>
    </>
  );
}

function Echeancier({ r }: { r: ResaDir }) {
  // Avant validation, l'échéancier est celui que la validation appliquera (50 % / 50 % / APA 30 %)
  const acompte = r.acompte || Math.round(r.montant / 2), solde = r.acompte ? r.solde : r.montant - acompte, apa = r.apa || Math.round(r.montant * 0.3);
  const du = r.solde_du_le ?? new Date(Date.parse(r.debut) - 30 * 86_400_000).toISOString().slice(0, 10);
  const paye = (montantCumule: number) => r.regle >= montantCumule;
  return (
    <dl className="paires">
      <div><dt>Acompte 50&nbsp;%</dt><dd>{euros(acompte)} · {r.statut === 'en_attente' ? 'sous 72 h après validation' : paye(acompte) ? 'reçu' : `avant le ${capitale(dateLongue(r.expire_le ?? r.debut))}`}</dd></div>
      {solde > 0 && <div><dt>Solde</dt><dd>{euros(solde)} · {paye(acompte + solde) ? 'reçu' : `avant le ${dateLongue(du)}`}</dd></div>}
      <div><dt>APA 30&nbsp;%</dt><dd>{euros(apa)} · {paye(acompte + solde + apa) ? 'reçue' : `avant le ${dateLongue(du)}`}</dd></div>
      {r.regle > 0 && <div><dt>Réglé</dt><dd>{euros(r.regle)} sur {euros(r.montant + apa)}{r.rembourse > 0 ? ` · ${euros(r.rembourse)} remboursés` : ''}</dd></div>}
      <div><dt>Demande reçue</dt><dd>{dateMoyenne(r.cree_le)}</dd></div>
    </dl>
  );
}
