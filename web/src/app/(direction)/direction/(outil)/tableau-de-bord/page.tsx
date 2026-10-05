import type { Metadata } from 'next';
import Link from 'next/link';
import { Haut, Badge } from '../Haut';
import { demandes, direction, reservations, tableau } from '@/lib/direction/donnees';
import { dans, euros, ilYa, jour, jourSemaine, plage, prenomInitiale, capitale, heure, dateCourte, maintenant } from '@/lib/format';
import { BoutonRelance } from './BoutonRelance';
import { CarteVide } from '@/components/Rose';

export const metadata: Metadata = { title: 'Tableau de bord' };
const TYPES: Record<string, string> = { dossier: 'Demande de dossier', visite: 'Demande de visite', brochure: 'Brochure', contact: 'Contact', 'projet-acheter': "Projet d'achat", 'projet-louer': 'Projet de location', 'projet-vendre': 'Vente' };
const MOIS = ['Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.'];

export default async function TableauDeBord() {
  const [{ profil, demo }, t, resas, dems] = await Promise.all([direction(), tableau(), reservations(), demandes()]);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const jOuverture = Math.ceil((jour(t.saison_debut).getTime() - maintenant()) / 86_400_000);
  const locations = resas.filter((r) => r.type === 'location');
  const soldeEnRetard = (r: (typeof resas)[number]) => r.statut === 'confirmee' && r.solde_du_le && r.solde_du_le < aujourdhui && r.regle < r.montant + r.apa;

  // À traiter maintenant : demandes, acomptes attendus, soldes en retard, formulaires nouveaux
  type Tache = { cle: string; alerte: boolean; titre: React.ReactNode; detail: string; actions: React.ReactNode };
  const taches: Tache[] = [
    ...locations.filter((r) => r.statut === 'en_attente').sort((a, b) => a.cree_le.localeCompare(b.cree_le)).map((r) => ({
      cle: r.id, alerte: (maintenant() - Date.parse(r.cree_le)) > 86_400_000,
      titre: <>Demande {r.reference} · <em>{r.yacht_nom}</em>, {plage(r.debut, r.fin)} · {demo ? r.client_nom : prenomInitiale(r.client_nom)}</>,
      detail: `Reçue ${ilYa(r.cree_le)} · expire ${dans(r.expire_le)}`,
      actions: demo
        ? <><button className="btn btn--plein btn--petit" aria-disabled="true" title="Lecture seule en démonstration">Valider</button><button className="btn btn--filet btn--petit" aria-disabled="true" title="Lecture seule en démonstration">Refuser</button></>
        : <><Link className="btn btn--plein btn--petit" href={`/direction/reservations?ref=${r.reference}&action=valider`}>Valider</Link>
          <Link className="btn btn--filet btn--petit" href={`/direction/reservations?ref=${r.reference}&action=refuser`}>Refuser</Link></>,
    })),
    ...locations.filter((r) => r.statut === 'a_payer').map((r) => ({
      cle: r.id, alerte: true,
      titre: <>Acompte attendu {r.reference} · <em>{r.yacht_nom}</em> · {euros(r.acompte)}</>,
      detail: `Échéance ${dans(r.expire_le)}`,
      actions: <BoutonRelance id={r.id} />,
    })),
    ...locations.filter(soldeEnRetard).map((r) => ({
      cle: r.id, alerte: true,
      titre: <>Solde en retard {r.reference} · <em>{r.yacht_nom}</em> · {euros(r.montant + r.apa - r.regle)}</>,
      detail: `Dû depuis le ${dateCourte(r.solde_du_le!)}`,
      actions: <BoutonRelance id={r.id} />,
    })),
    ...dems.filter((d) => d.statut === 'nouvelle').map((d) => ({
      cle: d.id, alerte: false,
      titre: <>{TYPES[d.type] ?? 'Demande'}{d.yacht_nom ? <> · <em>{d.yacht_nom}</em></> : null} · {d.nom}</>,
      detail: capitale(ilYa(d.cree_le)),
      actions: <Link className="btn btn--filet btn--petit" href={`/direction/demandes?demande=${d.id}`}>Ouvrir</Link>,
    })),
  ].slice(0, 6);

  const prochains = locations.filter((r) => ['en_attente', 'a_payer', 'confirmee', 'soldee'].includes(r.statut) && r.debut >= aujourdhui)
    .sort((a, b) => a.debut.localeCompare(b.debut)).slice(0, 5);

  const mois = MOIS.map((libelle, i) => {
    const cle = `${t.annee}-${String(i + 5).padStart(2, '0')}`;
    const m = t.par_mois.find((x) => x.mois === cle);
    return { libelle, confirme: m?.confirme ?? 0, attente: m?.attente ?? 0 };
  });
  const max = Math.max(1, ...mois.map((m) => m.confirme + m.attente));

  return (
    <>
      <Haut titre="Tableau de bord" />
      <div className="contenu">
        <p style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '.5rem 1.5rem', marginBottom: '1.5rem' }}>
          <span className="titre-s">Bonjour {demo ? '' : profil.prenom}</span>
          <span className="second">{capitale(jourSemaine(new Date()))} · Saison {t.annee}{jOuverture > 0 ? <> · J&#8209;{jOuverture} avant l&apos;ouverture</> : null}</span>
        </p>
        <div className="kpis">
          <div className="kpi2"><span className="etiq">Encaissé</span><strong>{euros(t.encaisse)}</strong><small>Acomptes et soldes reçus</small></div>
          <div className="kpi2"><span className="etiq">À encaisser</span><strong>{euros(t.a_encaisser)}</strong><small>Soldes et APA à venir, acomptes attendus</small></div>
          <div className={`kpi2${t.a_traiter_24h ? ' kpi2--alerte' : ''}`}><span className="etiq">Demandes à traiter</span><strong>{t.a_traiter}</strong>
            <small>{t.a_traiter_24h ? <>Dont {t.a_traiter_24h} depuis plus de 24&nbsp;h</> : 'Toutes reçues depuis moins de 24 h'}</small></div>
          <div className="kpi2"><span className="etiq">Occupation de la saison</span><strong>{t.occupation_totale}&nbsp;%</strong><small>Nuits réservées sur nuits ouvertes</small></div>
          <div className="kpi2"><span className="etiq">Nouveaux clients</span><strong>{t.nouveaux_clients}</strong><small>Ce mois-ci</small></div>
        </div>

        <div className="grille-d grille-d--2">
          <section className="bloc-d">
            <div className="bloc-d__tete"><h2>À traiter maintenant</h2><Link className="lien lien--discret" href="/direction/reservations" style={{ fontSize: 'var(--t-xs)' }}>Tout voir</Link></div>
            <div className="bloc-d__corps">
              {taches.length === 0 && <div className="vide" style={{ padding: '2rem 1rem' }}><CarteVide /><p className="vide__titre">Rien à traiter.</p><p>Belle journée.</p></div>}
              {taches.map((x, i) => (
                <div className="tache" key={x.cle}>
                  <span className={`tache__type${x.alerte ? ' tache__type--alerte' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                  <p><b>{x.titre}</b><span>{x.detail}</span></p>
                  <span className="tache__act">{x.actions}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="bloc-d">
            <div className="bloc-d__tete"><h2>Prochains embarquements</h2></div>
            <div className="bloc-d__corps" style={{ paddingTop: 0 }}>
              {prochains.length === 0 && <p className="second" style={{ paddingTop: '1rem' }}>Aucun embarquement à venir.</p>}
              <table className="tab tab--mobile"><tbody>
                {prochains.map((r) => (
                  <tr key={r.id}>
                    <td>{dateCourte(r.debut)}</td>
                    <td className="serif"><Link href={`/direction/reservations?ref=${r.reference}&filtre=toutes`} style={{ textDecoration: 'none' }}><em>{r.yacht_nom}</em></Link></td>
                    <td className="cache-m">{demo ? r.client_nom : r.client_nom.replace(/^(\S)\S*\s+/, '$1. ')}</td>
                    <td className="cache-m">{r.port}, {heure(r.heure)}</td>
                    <td>{soldeEnRetard(r) ? <span className="badge badge--retard">Solde en retard</span> : <Badge statut={r.statut} />}</td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          </section>
        </div>

        <div className="grille-d grille-d--2">
          <section className="bloc-d">
            <div className="bloc-d__tete"><h2>Occupation par yacht</h2><span className="second" style={{ fontSize: 'var(--t-xs)' }}>Nuits réservées / nuits de saison</span></div>
            <div className="bloc-d__corps">
              {t.occupation.map((o) => {
                const v = o.total ? Math.round((100 * o.nuits) / o.total) : 0;
                return <div className="barre-occ" key={o.slug}><span><em>{o.nom}</em></span><i style={{ '--v': `${v}%` } as React.CSSProperties} role="img" aria-label={`${v} %`} /><b>{v}&nbsp;%</b></div>;
              })}
            </div>
          </section>
          <section className="bloc-d">
            <div className="bloc-d__tete"><h2>Chiffre d&apos;affaires par mois</h2><span className="second" style={{ fontSize: 'var(--t-xs)' }}>Saison {t.annee}, en k€</span></div>
            <div className="bloc-d__corps">
              <div className="histo" role="img" aria-label={mois.map((m) => `${m.libelle} : ${Math.round((m.confirme + m.attente) / 1000)} k€`).join(', ')}>
                {mois.map((m) => (
                  <div key={m.libelle}>
                    <b>{Math.round((m.confirme + m.attente) / 1000)}</b>
                    <span className="pile">
                      <i style={{ height: `${(8.5 * m.confirme) / max}rem` }} />
                      <i style={{ height: `${(8.5 * m.attente) / max}rem` }} />
                    </span>
                    {m.libelle}
                  </div>
                ))}
              </div>
              <p className="legende-d"><span>Confirmé</span><span>En attente</span></p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
