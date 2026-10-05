// Retour de la page Stripe : vérification, paiement réussi, virement en attente, ou échec (maquettes lot 2, 2.4)
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cheminEspace, dico, estLangue } from '@/lib/i18n';
import { mesDocuments, mesReservations, nomYacht, reglagesPublics, session, yachtsDe } from '@/lib/espace/donnees';
import { Frise } from '@/components/espace/Commun';
import { dateHeure, dateLongue, euros, eurosCentimes, plage } from '@/lib/format';
import { lireSession, stripeDisponible, type EtatSession } from '@/lib/paiement/stripe';
import { Copier, Verification } from './Retour';
import { lancerTraitement } from '@/lib/evenements/lancer';

export const metadata: Metadata = { title: 'Paiement' };

export default async function RetourPaiement({ params, searchParams }: PageProps<'/[locale]/espace/reservations/[ref]/paiement'>) {
  const { locale, ref } = await params;
  if (!estLangue(locale)) notFound();
  const { user, profil } = await session();
  if (!user || !profil) redirect(cheminEspace(locale));
  const sp = await searchParams;
  const t = dico(locale);
  const [resas, docs, r] = await Promise.all([mesReservations(), mesDocuments(), reglagesPublics()]);
  const x = resas.find((v) => v.reference === ref);
  if (!x) notFound();
  const yachts = await yachtsDe(x.yacht);
  const nom = nomYacht(yachts, x.yacht);
  const lienPayer = cheminEspace(locale, `reservations/${x.reference}/payer`);
  const reservees = x.expire_le ? t.retour.reserveesJusqua(dateHeure(x.expire_le, locale)) : null;

  let etat: EtatSession = { etat: 'echec' };
  if (typeof sp.session_id === 'string' && stripeDisponible()) {
    try { etat = await lireSession(sp.session_id, x.id); } catch { etat = { etat: 'echec' }; }
    if (etat.etat === 'paye') lancerTraitement(); // contrat, facture et e-mail de confirmation, si le webhook n'est pas déjà passé
  }

  if (etat.etat === 'paye') {
    // Le paiement est confirmé par Stripe ; la réservation avance dès qu'il est enregistré (webhook ou retour)
    if (x.statut === 'a_payer') return <Verification langue={locale} titre={t.retour.verification} texte={t.retour.verificationTexte} />;
    const contrat = docs.find((d) => d.reservation === x.id && d.type === 'contrat');
    const solde = x.statut === 'soldee' || x.statut === 'terminee';
    return (
      <main className="esp" style={{ maxWidth: '68rem' }}>
        <svg className="rose-fete" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1v30M1 16h30M5.4 5.4l21.2 21.2M26.6 5.4L5.4 26.6" /><circle cx="16" cy="16" r="6.5" /></svg>
        <p className="kicker" style={{ marginTop: '1.5rem' }}>{t.paiement.reservation(x.reference)}</p>
        <h1 className="esp__bonjour">{solde ? t.retour.soldeTitre : t.retour.carteTitre}</h1>
        <p className="esp__sous" style={{ maxWidth: '46ch' }}>{solde ? t.retour.soldeTexte(nom) : t.retour.carteTexte(nom, `${plage(x.debut, x.fin, locale)} ${x.fin.slice(0, 4)}`, profil.email)}</p>
        <div style={{ margin: '2rem 0' }}><Frise langue={locale} statut={x.statut} /></div>
        {!solde && x.solde_du_le && (() => { const [a, m, b] = t.retour.prochaine(euros(x.solde + x.apa, locale), dateLongue(x.solde_du_le, locale)); return <p className="bandeau-info">{a}<b style={{ fontWeight: 500 }}>{m}</b>{b}</p>; })()}
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginTop: '2rem' }}>
          {contrat && <a className="btn btn--plein" href={`/api/documents/${contrat.id}?langue=${locale}`}>{t.espace.telechargerContrat}</a>}
          <Link className="btn btn--filet" href={cheminEspace(locale)}>{t.retour.monEspace}</Link>
        </p>
      </main>
    );
  }

  if (etat.etat === 'virement') {
    const lignes: [string, string][] = [
      [t.retour.beneficiaire, etat.titulaire || r.societe.raison_sociale || 'Portolan'], [t.retour.iban, etat.iban], [t.retour.bic, etat.bic],
      [t.retour.reference, etat.reference], [t.retour.montantExact, eurosCentimes(etat.montant, locale)],
    ];
    return (
      <main className="esp" style={{ maxWidth: '68rem' }}>
        <p className="kicker">{t.paiement.reservation(x.reference)}</p>
        <h1 className="esp__bonjour">{t.retour.virementTitre}</h1>
        <p className="esp__sous" style={{ maxWidth: '48ch' }}>{t.retour.virementTexte}</p>
        <section className="panneau-c" style={{ marginTop: '2rem' }}>
          {lignes.map(([libelle, valeur]) => (
            <div className="copie" key={libelle}><span className="second">{libelle}</span><code>{valeur}</code><Copier valeur={valeur} libelle={t.retour.copier} fait={t.retour.copie} /></div>
          ))}
        </section>
        {reservees && <p className="bandeau-info" style={{ marginTop: '1.5rem' }}>{reservees}</p>}
        <p style={{ marginTop: '1.5rem' }}><Link className="btn btn--filet" href={cheminEspace(locale)}>{t.retour.monEspace}</Link></p>
      </main>
    );
  }

  if (etat.etat === 'attente') return <Verification langue={locale} titre={t.retour.verification} texte={t.retour.verificationTexte} />;

  return (
    <main className="esp" style={{ maxWidth: '68rem' }}>
      <p className="kicker">{t.paiement.reservation(x.reference)}</p>
      <h1 className="esp__bonjour">{t.retour.echecTitre}</h1>
      <p className="esp__sous">{t.retour.echecTexte}</p>
      <ul className="ct-promises" style={{ marginTop: '1rem', maxWidth: '44rem' }}>{t.retour.echecCauses.map((c) => <li key={c} style={{ color: 'var(--texte)' }}>{c}</li>)}</ul>
      {reservees && <p className="bandeau-info" style={{ marginTop: '1.5rem' }}>{reservees}</p>}
      <p style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginTop: '2rem' }}>
        <Link className="btn btn--plein" href={lienPayer}>{t.retour.reessayer}</Link>
        {r.paiement_virement && <Link className="btn btn--filet" href={`${lienPayer}?moyen=virement`}>{t.retour.parVirement}</Link>}
      </p>
    </main>
  );
}
