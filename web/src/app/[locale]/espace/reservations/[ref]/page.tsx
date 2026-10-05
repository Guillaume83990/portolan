import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cheminEspace, dico, estLangue, ficheYacht, pageSite } from '@/lib/i18n';
import { mesDocuments, mesPaiements, mesReservations, nomYacht, reglagesPublics, session, yachtsDe } from '@/lib/espace/donnees';
import { BadgeClient } from '@/components/espace/Commun';
import { LigneDocument } from '@/components/espace/Document';
import { urlPhoto } from '@/lib/yachts';
import { capitale, dateLongue, dateMoyenne, euros, heure, heureMinute, jourSemaine, maintenant } from '@/lib/format';
import { AnnulerDemande } from '../../Interactions';

export const metadata: Metadata = { title: 'Réservation' };

export default async function DetailReservation({ params }: PageProps<'/[locale]/espace/reservations/[ref]'>) {
  const { locale, ref } = await params;
  if (!estLangue(locale)) notFound();
  const { user } = await session();
  if (!user) redirect(cheminEspace(locale));
  const t = dico(locale);
  const [resas, pay, docs, r] = await Promise.all([mesReservations(), mesPaiements(), mesDocuments(), reglagesPublics()]);
  const x = resas.find((v) => v.reference === ref);
  if (!x) notFound();
  const yachts = await yachtsDe(x.yacht);
  const nom = nomYacht(yachts, x.yacht);
  const photo = urlPhoto(yachts[x.yacht]?.fiche?.image?.src, 1600);
  const paiements = pay.filter((p) => p.reservation === x.id && p.statut !== 'en_attente');
  const documents = docs.filter((d) => d.reservation === x.id);
  const courtier = r.courtier.prenom ?? 'Portolan';
  const regle = paiements.reduce((s, p) => s + p.montant - p.rembourse, 0);
  const acompte = x.acompte || Math.round((x.montant * r.taux_acompte) / 100);
  const apa = x.apa || Math.round((x.montant * r.taux_apa) / 100);
  const solde = x.acompte ? x.solde : x.montant - acompte;
  const payeAcompte = paiements.find((p) => p.type === 'acompte' || p.type === 'total');
  const payeSolde = paiements.find((p) => p.type === 'solde' || p.type === 'total');
  const payeApa = paiements.find((p) => p.type === 'apa' || p.type === 'total');
  const ouvertureSolde = x.solde_du_le ? new Date(Date.parse(x.solde_du_le) - 30 * 86_400_000).toISOString().slice(0, 10) : null;
  const quand = (iso: string) => `${dateMoyenne(iso, locale)}, ${heureMinute(iso, locale)}`;
  const methode = (m: string | null) => (m ? t.detail.methodes[m as keyof typeof t.detail.methodes] ?? m : '—');
  const actif = ['en_attente', 'a_payer', 'confirmee', 'soldee', 'terminee'].includes(x.statut);
  const faites = x.statut === 'en_attente' ? 0 : x.statut === 'a_payer' ? 2 : x.statut === 'confirmee' ? 3 : x.statut === 'soldee' ? 4 : 5;
  const embarquement = `${capitale(jourSemaine(x.debut, locale))}, ${heure(x.heure)}, ${x.port}`;
  const etapes = [
    { titre: t.detail.etapes.demande, sous: [quand(x.cree_le)] },
    { titre: t.detail.etapes.validee(courtier), sous: x.valide_le ? [quand(x.valide_le)] : [] },
    { titre: payeAcompte ? t.detail.etapes.acompte(methode(payeAcompte.methode).toLowerCase()) : t.paiement.acompte(r.taux_acompte), sous: payeAcompte?.paye_le ? [`${quand(payeAcompte.paye_le)} · ${euros(payeAcompte.montant, locale)}`] : x.statut === 'a_payer' && x.expire_le ? [`${t.detail.etapes.aRegler(dateLongue(x.expire_le, locale))} · ${euros(acompte, locale)}`] : [] },
    { titre: t.detail.etapes.solde, sous: payeSolde?.paye_le ? [quand(payeSolde.paye_le)] : x.solde_du_le ? [`${t.detail.etapes.aRegler(dateLongue(x.solde_du_le, locale))} · ${euros(solde + apa, locale)}`, ouvertureSolde ? t.detail.etapes.rappel(dateLongue(ouvertureSolde, locale).replace(/ \d{4}$/, '')) : ''].filter(Boolean) : [] },
    { titre: t.detail.etapes.embarquement, sous: [embarquement] },
  ];
  const ligne = (libelle: string, montant: number, p: typeof payeAcompte, avant: string | null) => (
    <tr>
      <td>{libelle}</td><td className="nb">{euros(montant, locale)}</td>
      <td>{p ? <span className={`badge ${p.rembourse >= p.montant ? 'badge--annulee' : 'badge--soldee'}`}>{p.rembourse >= p.montant ? t.detail.rembourse : t.detail.paye}</span> : <span className="badge badge--neutre">{t.detail.aVenir}</span>}</td>
      <td className="cache-m">{methode(p?.methode ?? null)}</td>
      <td className="cache-m">{p?.paye_le ? dateMoyenne(p.paye_le, locale) : avant ? t.detail.avant(dateLongue(avant, locale)) : '—'}</td>
    </tr>
  );

  return (
    <main>
      <section className="det-hero" style={{ marginTop: 'var(--header-h)' }}>
        {photo && <img src={photo} alt="" />}
        <p style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <BadgeClient statut={x.statut} langue={locale} /><span style={{ fontSize: 'var(--t-xs)', letterSpacing: '.14em' }}>{x.reference}</span>
        </p>
        <h1 className="det-hero__nom">{nom}</h1>
        <p style={{ fontSize: 'var(--t-l)', fontWeight: 300, marginTop: '.5rem' }}>{t.espace.du(jourSemaine(x.debut, locale).replace(/ \d{4}$/, ''), jourSemaine(x.fin, locale))}</p>
      </section>
      <div className="det">
        <aside>
          <p className="etiq" style={{ marginBottom: '1.25rem' }}><Link className="lien lien--discret" href={cheminEspace(locale)}>{t.detail.retour}</Link></p>
          {actif && (
            <ol className="frise frise--verticale" aria-label={t.espace.avancement}>
              {etapes.map((e, i) => (
                <li key={i} className={i < faites ? 'is-fait' : i === faites ? 'is-courant' : ''} aria-current={i === faites ? 'step' : undefined}>
                  <strong>{e.titre}</strong>{e.sous.map((s) => <span key={s}>{s}</span>)}
                </li>
              ))}
            </ol>
          )}
        </aside>
        <div>
          {x.statut === 'refusee' && (
            <section><p className="bandeau-info bandeau-info--alerte">{t.detail.refusee.titre}</p>
              {x.note_directeur && <div className="mot" style={{ marginTop: '1rem' }}><p>«&#8239;{x.note_directeur}&#8239;»</p><footer>{t.espace.motDe(courtier, dateLongue(x.decide_le ?? x.cree_le, locale).replace(/ \d{4}$/, ''))}</footer></div>}
              <p style={{ marginTop: '1rem' }}><a className="btn btn--filet btn--petit" href={pageSite(locale, 'flotte')}>{t.espace.voirAutres}</a></p></section>
          )}
          {(x.statut === 'expiree' || x.statut === 'annulee') && (
            <section><p className="bandeau-info">{x.statut === 'expiree' ? t.detail.expiree : t.detail.annulee}</p>
              <p style={{ marginTop: '1rem' }}><a className="btn btn--filet btn--petit" href={ficheYacht(locale, x.yacht)}>{t.espace.refaireDemande}</a></p></section>
          )}
          <section>
            <h2>{t.detail.croisiere}</h2>
            <dl className="paires">
              <div><dt>{t.espace.embarquement}</dt><dd>{embarquement}</dd></div>
              <div><dt>{t.detail.debarquement}</dt><dd>{capitale(jourSemaine(x.fin, locale))}, {x.port}</dd></div>
              <div><dt>{t.espace.invites(2).replace(/^\d+\s/, '').replace(/^./, (c) => c.toUpperCase())}</dt><dd>{x.invites}</dd></div>
              {x.message && <div><dt>{t.detail.souhaits}</dt><dd>{x.message}</dd></div>}
            </dl>
            {x.note_directeur && x.statut !== 'refusee' && <div className="mot" style={{ marginTop: '1.25rem' }}><p>«&#8239;{x.note_directeur}&#8239;»</p><footer>{t.espace.motDe(courtier, dateLongue(x.decide_le ?? x.cree_le, locale).replace(/ \d{4}$/, ''))}</footer></div>}
          </section>
          {x.statut !== 'en_attente' && x.statut !== 'refusee' && (
            <section>
              <h2>{t.detail.paiements}</h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="tab tab--mobile">
                  <thead><tr><th>{t.detail.echeance}</th><th className="nb">{t.detail.montant}</th><th>{t.detail.statut}</th><th>{t.detail.moyen}</th><th>{t.detail.date}</th></tr></thead>
                  <tbody>
                    {ligne(t.detail.acompte(r.taux_acompte), acompte, payeAcompte, x.expire_le)}
                    {solde > 0 && ligne(t.detail.solde, solde, payeSolde, x.solde_du_le)}
                    {ligne(t.detail.apa(r.taux_apa), apa, payeApa, x.solde_du_le)}
                  </tbody>
                </table>
              </div>
              <p style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem', fontSize: 'var(--t-s)' }}>
                {(() => { const [a, m, b, tot] = t.detail.totalRegle(euros(regle, locale), euros(x.montant + apa, locale)); return <span>{a}<strong className="chiffre-c" style={{ fontSize: '1.3rem' }}>{m}</strong><span className="second">{b}{tot}</span></span>; })()}
                {x.statut === 'a_payer' && <Link className="btn btn--plein btn--petit" href={cheminEspace(locale, `reservations/${x.reference}/payer`)}>{t.espace.reglerAcompte}</Link>}
                {x.statut === 'confirmee' && ouvertureSolde && (maintenant() >= Date.parse(ouvertureSolde)
                  ? <Link className="btn btn--plein btn--petit" href={cheminEspace(locale, `reservations/${x.reference}/payer`)}>{t.espace.reglerSolde}</Link>
                  : <span className="second">{t.detail.ouvreLe(dateLongue(ouvertureSolde, locale))}</span>)}
              </p>
            </section>
          )}
          {documents.length > 0 && (
            <section><h2>{t.detail.documents}</h2>{documents.map((d) => <LigneDocument key={d.id} d={d} langue={locale} reference={x.reference} />)}</section>
          )}
          {actif && x.statut !== 'terminee' && (
            <section>
              <h2>{t.detail.annulation}</h2>
              <p className="second" style={{ maxWidth: '62ch' }}>{x.statut === 'en_attente' || x.statut === 'a_payer' ? t.detail.annulationTexte.avant : t.detail.annulationTexte.apres}</p>
              <p style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {(x.statut === 'en_attente' || x.statut === 'a_payer') && <AnnulerDemande langue={locale} id={x.id} yacht={nom} dates={`${dateLongue(x.debut, locale).replace(/ \d{4}$/, '')} → ${dateLongue(x.fin, locale)}`} />}
                <a className="lien" href={pageSite(locale, 'conditions')}>{t.detail.conditions}</a>
              </p>
            </section>
          )}
          {r.courtier.email && <p style={{ marginTop: '2.5rem' }}><a className="lien" href={`mailto:${r.courtier.email}?subject=${encodeURIComponent(`${x.reference} · ${nom}`)}`}>{t.detail.question(courtier)}</a></p>}
        </div>
      </div>
    </main>
  );
}
