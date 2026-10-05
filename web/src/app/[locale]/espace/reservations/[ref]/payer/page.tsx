import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cheminEspace, dico, estLangue, ficheYacht } from '@/lib/i18n';
import { mesPaiements, mesReservations, nomYacht, reglagesPublics, session, yachtsDe } from '@/lib/espace/donnees';
import { BadgeClient } from '@/components/espace/Commun';
import { CarteVide } from '@/components/Rose';
import { urlPhoto } from '@/lib/yachts';
import { dateHeure, dateLongue, euros, heure, heuresRestantes, jourSemaineCourt, plage, maintenant } from '@/lib/format';
import { echeanceDue, paiementFictif, stripeDisponible } from '@/lib/paiement/stripe';
import { ChoixPaiement } from './ChoixPaiement';

export const metadata: Metadata = { title: 'Paiement' };

export default async function Payer({ params, searchParams }: PageProps<'/[locale]/espace/reservations/[ref]/payer'>) {
  const { locale, ref } = await params;
  const { moyen } = await searchParams;
  if (!estLangue(locale)) notFound();
  const { user } = await session();
  if (!user) redirect(cheminEspace(locale));
  const t = dico(locale);
  const [resas, pay, r] = await Promise.all([mesReservations(), mesPaiements(), reglagesPublics()]);
  const x = resas.find((v) => v.reference === ref);
  if (!x) notFound();
  const yachts = await yachtsDe(x.yacht);
  const nom = nomYacht(yachts, x.yacht);
  const regle = pay.filter((p) => p.reservation === x.id && p.statut === 'paye').reduce((s, p) => s + p.montant - p.rembourse, 0);
  const due = echeanceDue(x, regle);
  const ouvertureSolde = x.solde_du_le ? new Date(Date.parse(x.solde_du_le) - 30 * 86_400_000).toISOString().slice(0, 10) : null;
  const dates = `${plage(x.debut, x.fin, locale)} ${x.fin.slice(0, 4)}`;

  // États où il n'y a rien à payer (maquette lot 2, acompte-etats)
  const etat = (titre: string, texte: string, bouton: React.ReactNode) => (
    <main className="esp" style={{ maxWidth: '68rem' }}>
      <p className="kicker">{t.paiement.reservation(x.reference)}</p>
      <div className="carte vide" style={{ marginTop: '1.5rem' }}><CarteVide /><p className="vide__titre">{titre}</p><p>{texte}</p>{bouton}</div>
    </main>
  );
  if (x.statut === 'expiree') return etat(t.paiement.expire.titre, t.paiement.expire.texte(dates), <a className="btn btn--plein btn--petit" href={ficheYacht(locale, x.yacht)}>{t.espace.refaireDemande}</a>);
  if (x.statut === 'annulee') return etat(t.paiement.annulee.titre, t.paiement.annulee.texte, <Link className="btn btn--filet btn--petit" href={cheminEspace(locale)}>{t.paiement.annulee.bouton}</Link>);
  if (x.statut === 'refusee') return etat(t.paiement.refusee.titre, t.paiement.refusee.texte, <Link className="btn btn--filet btn--petit" href={cheminEspace(locale, `reservations/${x.reference}`)}>{t.paiement.refusee.bouton}</Link>);
  if (x.statut === 'confirmee' && ouvertureSolde && maintenant() < Date.parse(ouvertureSolde)) return etat(t.paiement.pasEncore.titre, t.paiement.pasEncore.texte(dateLongue(ouvertureSolde, locale)), <Link className="btn btn--filet btn--petit" href={cheminEspace(locale, `reservations/${x.reference}`)}>{t.detail.retour.replace('← ', '')}</Link>);
  if (!due || due.montant <= 0) return etat(t.paiement.dejaPaye.titre, t.paiement.dejaPaye.texte, <Link className="btn btn--filet btn--petit" href={cheminEspace(locale, 'documents')}>{t.paiement.dejaPaye.bouton}</Link>);

  const estAcompte = x.statut === 'a_payer';
  const heures = heuresRestantes(x.expire_le) ?? 0;
  return (
    <main className="esp" style={{ maxWidth: '68rem' }}>
      <p className="kicker">{t.paiement.reservation(x.reference)}</p>
      <h1 className="esp__bonjour">{estAcompte ? t.paiement.titreAcompte : t.paiement.titreSolde}</h1>
      <article className="carte resa-c" style={{ margin: '2rem 0' }}>
        <figure className="resa-c__photo">{yachts[x.yacht]?.fiche?.image?.src && <img src={urlPhoto(yachts[x.yacht].fiche.image!.src)} alt="" />}</figure>
        <div className="resa-c__corps">
          <div className="resa-c__tete"><h2 className="resa-c__nom">{nom}</h2><BadgeClient statut={x.statut} langue={locale} /></div>
          <p className="resa-c__infos">
            <span><b>{t.espace.du(jourSemaineCourt(x.debut, locale), `${jourSemaineCourt(x.fin, locale)} ${x.fin.slice(0, 4)}`)} · {t.espace.nuits(x.nuits)}</b></span>
            <span>{t.espace.embarquement} <b>{heure(x.heure)}, {x.port}</b></span>
            <span><b>{x.invites}</b> {t.espace.invites(x.invites ?? 0).replace(/^\d+\s/, '')}</span>
          </p>
        </div>
      </article>
      {x.note_directeur && <div className="mot"><p>«&#8239;{x.note_directeur}&#8239;»</p><footer>{r.courtier.prenom ?? 'Portolan'}</footer></div>}
      {estAcompte && x.expire_le && <p className="bandeau-info" style={{ marginTop: '1.5rem' }}>{t.paiement.reserveesJusqua(dateHeure(x.expire_le, locale), Math.max(0, heures))}</p>}
      <section style={{ marginTop: '2.25rem' }} className="panneau-c">
        <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="titre-xs">{due.type === 'acompte' ? t.paiement.acompte(r.taux_acompte) : estAcompte ? t.paiement.total : `${t.paiement.solde(100 - r.taux_acompte)} + APA`}</span>
          <span className="chiffre-c" style={{ fontSize: '2.6rem' }}>{euros(due.montant, locale)}</span>
        </p>
        {estAcompte && due.type === 'acompte' && x.solde_du_le && (
          <dl className="paires" style={{ marginTop: '1rem' }}>
            <div><dt>{t.paiement.ensuite}</dt><dd>{t.paiement.ensuiteTexte(euros(x.solde, locale), euros(x.apa, locale), dateLongue(x.solde_du_le, locale), 100 - r.taux_acompte, r.taux_apa)}</dd></div>
          </dl>
        )}
        {!estAcompte && (
          <dl className="paires" style={{ marginTop: '1rem' }}>
            <div><dt>{t.detail.solde}</dt><dd>{euros(x.solde, locale)}</dd></div>
            <div><dt>{t.paiement.apa(r.taux_apa)}</dt><dd>{euros(x.apa, locale)}</dd></div>
          </dl>
        )}
      </section>
      {stripeDisponible() && paiementFictif() && <p className="bandeau-info" role="note" style={{ marginTop: '2rem' }}><b style={{ fontWeight: 500 }}>{t.paiement.fictif[0]}</b>{t.paiement.fictif[1]}</p>}
      {stripeDisponible()
        ? <ChoixPaiement langue={locale} reference={x.reference} montant={euros(due.montant, locale)} carte={r.paiement_carte} virement={r.paiement_virement} initial={moyen === 'virement' && r.paiement_virement ? 'virement' : undefined} />
        : <p className="bandeau-info" style={{ marginTop: '2rem' }}>{t.paiement.indisponible}</p>}
      {r.courtier.email && <p style={{ marginTop: '1rem' }}><a className="lien" href={`mailto:${r.courtier.email}?subject=${encodeURIComponent(x.reference)}`}>{t.paiement.question}</a></p>}
    </main>
  );
}
