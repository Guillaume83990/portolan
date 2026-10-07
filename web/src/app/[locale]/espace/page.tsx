import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dico, estLangue, cheminEspace, ficheYacht, pageSite } from '@/lib/i18n';
import { mesReservations, nomYacht, reglagesPublics, session, yachtsDe, type ResaClient, type YachtResume } from '@/lib/espace/donnees';
import { CadreEspace, Frise, BadgeClient } from '@/components/espace/Commun';
import { CarteVide } from '@/components/Rose';
import { urlPhoto } from '@/lib/yachts';
import { dateLongue, dateHeure, euros, jourSemaineCourt, jour, relatif, heure, type Langue } from '@/lib/format';
import { Porte } from './Porte';
import { retourValide } from '@/lib/site/retour';
import { SessionDirection } from './SessionDirection';
import { AnnulerDemande, Decompte } from './Interactions';

export async function generateMetadata({ params }: PageProps<'/[locale]/espace'>): Promise<Metadata> {
  const { locale } = await params;
  return { title: estLangue(locale) ? dico(locale).espace.titre : 'Portolan' };
}

export default async function MonEspace({ params, searchParams }: PageProps<'/[locale]/espace'>) {
  const { locale } = await params;
  if (!estLangue(locale)) notFound();
  const sp = await searchParams;
  const t = dico(locale);
  const { user, profil } = await session();
  if (!user || !profil) return <Porte langue={locale} lienInvalide={sp.lien === 'invalide'} retour={retourValide(typeof sp.retour === 'string' ? sp.retour : null)} />;
  if (profil.role !== 'client') return <SessionDirection langue={locale} />;

  const r = await reglagesPublics();
  let resas: ResaClient[] = [];
  let echec = false;
  try { resas = await mesReservations(); } catch { echec = true; }
  const yachts = await yachtsDe([...new Set(resas.map((x) => x.yacht))].join(','));
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const aVenir = resas.filter((x) => ['en_attente', 'a_payer', 'confirmee', 'soldee'].includes(x.statut) && x.fin >= aujourdhui);
  const passees = resas.filter((x) => !aVenir.includes(x)).sort((a, b) => b.debut.localeCompare(a.debut));
  const aPayer = aVenir.find((x) => x.statut === 'a_payer');
  const soldeOuvert = aVenir.find((x) => x.statut === 'confirmee' && x.solde_du_le && Date.parse(x.solde_du_le) - Date.now() < 30 * 86_400_000);
  const motCourtier = [...aVenir].reverse().find((x) => x.note_directeur);

  return (
    <CadreEspace langue={locale} prenom={profil.prenom} actif="reservations" courtier={r.courtier}>
      {echec ? (
        <div className="carte vide" role="alert"><CarteVide /><p className="vide__titre">{t.espace.erreur.titre}</p><p>{t.espace.erreur.texte}</p>
          <a className="btn btn--plein btn--petit" href={cheminEspace(locale)}>{t.espace.erreur.reessayer}</a></div>
      ) : resas.length === 0 ? (
        <div className="carte vide"><CarteVide /><p className="vide__titre">{t.espace.vide.titre}</p><p>{t.espace.vide.texte}</p>
          <p style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', justifyContent: 'center' }}>
            <a className="btn btn--plein btn--petit" href={pageSite(locale, 'louer')}>{t.espace.vide.yachts}</a>
            <a className="btn btn--filet btn--petit" href={pageSite(locale, 'contact')}>{t.espace.vide.courtier}</a></p></div>
      ) : (
        <>
          {aPayer && (
            <div className="afaire">
              <p><span className="etiq">{t.espace.afaire}</span>{(() => { const [a, m, b] = t.espace.afaireAcompte(nomYacht(yachts, aPayer.yacht), euros(aPayer.acompte, locale), aPayer.expire_le ? dateHeure(aPayer.expire_le, locale) : ''); return <>{a}<strong>{m}</strong>{b}</>; })()}</p>
              <Link className="btn btn--light btn--petit" href={cheminEspace(locale, `reservations/${aPayer.reference}/payer`)}>{t.espace.reglerAcompte}</Link>
            </div>
          )}
          {!aPayer && soldeOuvert && (
            <div className="afaire">
              <p><span className="etiq">{t.espace.afaire}</span>{(() => { const [a, m, b] = t.espace.afaireSolde(nomYacht(yachts, soldeOuvert.yacht), euros(soldeOuvert.solde + soldeOuvert.apa, locale), dateLongue(soldeOuvert.solde_du_le!, locale)); return <>{a}<strong>{m}</strong>{b}</>; })()}</p>
              <Link className="btn btn--light btn--petit" href={cheminEspace(locale, `reservations/${soldeOuvert.reference}/payer`)}>{t.espace.reglerSolde}</Link>
            </div>
          )}
          {aVenir.length > 0 && (
            <section className="esp__section">
              <h2>{t.espace.aVenir}</h2>
              {aVenir.map((x) => <CarteResa key={x.id} x={x} langue={locale} yachts={yachts} />)}
            </section>
          )}
          {motCourtier && (
            <section className="esp__section">
              <div className="mot">
                <p>«&#8239;{motCourtier.note_directeur}&#8239;»</p>
                <footer>{t.espace.motDe(r.courtier.prenom ?? 'Portolan', dateLongue(motCourtier.decide_le ?? motCourtier.cree_le, locale).replace(/ \d{4}$/, ''))}</footer>
              </div>
            </section>
          )}
          {passees.length > 0 && (
            <section className="esp__section">
              <h2>{t.espace.passees}</h2>
              {passees.map((x) => <CarteResa key={x.id} x={x} langue={locale} yachts={yachts} compacte />)}
            </section>
          )}
        </>
      )}
    </CadreEspace>
  );

  function CarteResa({ x, langue, yachts, compacte }: { x: ResaClient; langue: Langue; yachts: Record<string, YachtResume>; compacte?: boolean }) {
    const nom = nomYacht(yachts, x.yacht);
    const photo = urlPhoto(yachts[x.yacht]?.fiche?.image?.src);
    const lien = cheminEspace(langue, `reservations/${x.reference}`);
    const jours = Math.ceil((jour(x.debut).getTime() - Date.now()) / 86_400_000);
    return (
      <article className={`carte resa-c${compacte ? ' resa-c--compacte' : ''}`}>
        <figure className="resa-c__photo">{photo && <img src={photo} alt="" />}</figure>
        <div className="resa-c__corps">
          <div className="resa-c__tete">
            <h3 className="resa-c__nom"><Link href={lien} style={{ textDecoration: 'none' }}>{nom}</Link></h3>
            <BadgeClient statut={x.statut} langue={langue} />
            {!compacte && <span className="second" style={{ marginLeft: 'auto', fontSize: 'var(--t-xs)', letterSpacing: '.08em' }}>{x.reference}</span>}
          </div>
          {compacte ? (
            <p className="resa-c__infos"><span><b>{t.espace.du(dateLongue(x.debut, langue).replace(/ \d{4}$/, ''), dateLongue(x.fin, langue))} · {t.espace.nuits(x.nuits)}</b></span><span>{x.reference}</span><span><b>{x.statut === 'terminee' || x.statut === 'soldee' ? euros(x.montant, langue) : '—'}</b></span></p>
          ) : (
            <p className="resa-c__infos">
              <span><b>{t.espace.du(jourSemaineCourt(x.debut, langue), `${jourSemaineCourt(x.fin, langue)} ${x.fin.slice(0, 4)}`)} · {t.espace.nuits(x.nuits)}</b></span>
              <span>{t.espace.embarquement} <b>{heure(x.heure)}, {x.port}</b></span>
              <span><b>{x.invites}</b> {t.espace.invites(x.invites ?? 0).replace(/^\d+\s/, '')}</span>
              <span><b>{x.statut === 'en_attente' ? t.espace.envoyee(relatif(x.cree_le, langue)) : euros(x.montant, langue)}</b></span>
            </p>
          )}
          {!compacte && <Frise langue={langue} statut={x.statut} />}
          <div className="resa-c__action">
            {x.statut === 'en_attente' && <><p>{t.espace.reponse24}</p><AnnulerDemande langue={langue} id={x.id} yacht={nom} dates={`${dateLongue(x.debut, langue).replace(/ \d{4}$/, '')} → ${dateLongue(x.fin, langue)}`} /></>}
            {x.statut === 'a_payer' && <><Decompte langue={langue} montant={euros(x.acompte, langue)} expire={x.expire_le} />
              <Link className="btn btn--plein btn--petit" href={cheminEspace(langue, `reservations/${x.reference}/payer`)}>{t.espace.reglerAcompte}</Link></>}
            {x.statut === 'confirmee' && <>{(() => { const [a, m, b] = t.espace.soldeApa(euros(x.solde + x.apa, langue), x.solde_du_le ? dateLongue(x.solde_du_le, langue) : ''); return <p>{a}<strong>{m}</strong>{b}</p>; })()}
              <Link className="btn btn--filet btn--petit" href={cheminEspace(langue, 'documents')}>{t.espace.telechargerContrat}</Link></>}
            {x.statut === 'soldee' && <p>{t.espace.toutRegle(Math.max(0, jours))}</p>}
            {x.statut === 'terminee' && <a className="btn btn--filet btn--petit" href={ficheYacht(langue, x.yacht)}>{t.espace.reserverDeNouveau}</a>}
            {(x.statut === 'expiree' || x.statut === 'annulee') && <a className="btn btn--filet btn--petit" href={ficheYacht(langue, x.yacht)}>{t.espace.refaireDemande}</a>}
            {x.statut === 'refusee' && <Link className="btn btn--filet btn--petit" href={lien}>{t.paiement.refusee.bouton}</Link>}
          </div>
        </div>
      </article>
    );
  }
}

