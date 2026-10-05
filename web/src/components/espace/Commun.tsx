// Briques communes de Mon espace (maquettes lot 3) : cadre avec onglets et courtier, frise, badge
import Link from 'next/link';
import { cheminEspace, dico, titreCourtier } from '@/lib/i18n';
import { BADGE, etapesFaites, libelleStatut, type Statut } from '@/lib/statuts';
import { initiales, type Langue } from '@/lib/format';
import type { ReglagesPublics } from '@/lib/espace/donnees';

export function CadreEspace({ langue, prenom, actif, courtier, children }: {
  langue: Langue; prenom: string; actif: 'reservations' | 'documents' | 'compte'; courtier: ReglagesPublics['courtier']; children: React.ReactNode;
}) {
  const t = dico(langue).espace;
  const onglets = [['reservations', '', t.onglets.reservations], ['documents', 'documents', t.onglets.documents], ['compte', 'compte', t.onglets.compte]] as const;
  return (
    <main className="esp">
      <h1 className="esp__bonjour">{t.bonjour(prenom)}</h1>
      <p className="esp__sous">{t.sous}</p>
      <nav className="onglets" aria-label={t.titre}>
        {onglets.map(([cle, sous, libelle]) => <Link key={cle} href={cheminEspace(langue, sous)} aria-current={actif === cle ? 'page' : undefined}>{libelle}</Link>)}
      </nav>
      <div className="esp__grille">
        <div>{children}</div>
        <Courtier langue={langue} courtier={courtier} />
      </div>
    </main>
  );
}

export function Courtier({ langue, courtier: c }: { langue: Langue; courtier: ReglagesPublics['courtier'] }) {
  const t = dico(langue).courtier;
  const nom = `${c.prenom ?? ''} ${c.nom ?? ''}`.trim() || 'Portolan';
  const tel = (c.telephone ?? '').replace(/[^\d+]/g, '');
  return (
    <aside className="esp__cote carte courtier" aria-label={t.titre}>
      <p className="etiq">{t.titre}</p>
      <div className="courtier__id">
        {c.photo
          ? <img className="courtier__photo" src={c.photo} alt="" />
          : <span className="courtier__photo" aria-hidden="true" style={{ display: 'grid', placeItems: 'center', fontFamily: 'var(--serif)', fontSize: '1.4rem', color: 'var(--calcaire)' }}>{initiales(nom)}</span>}
        <div><p className="courtier__nom">{nom}</p>{titreCourtier(c, langue) && <p className="second" style={{ fontSize: 'var(--t-s)' }}>{titreCourtier(c, langue)}</p>}</div>
      </div>
      <div className="courtier__actions">
        {tel && <a className="btn btn--plein btn--petit" href={`tel:${tel}`}>{t.appeler}</a>}
        {c.whatsapp && <a className="btn btn--filet btn--petit" href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">{t.whatsapp}</a>}
        {c.email && <a className="btn btn--filet btn--petit" href={`mailto:${c.email}`}>{t.ecrire}</a>}
      </div>
      <p className="second" style={{ fontSize: 'var(--t-xs)' }}>{t.delai}</p>
    </aside>
  );
}

export function Frise({ langue, statut, verticale, etapes }: { langue: Langue; statut: Statut; verticale?: boolean; etapes?: React.ReactNode[] }) {
  const t = dico(langue).espace;
  // Étapes faites : en attente 0 (la demande est l'étape en cours), à payer 2, confirmée 3, soldée 4, terminée 5
  const faites = statut === 'en_attente' ? 0 : etapesFaites(statut);
  return (
    <ol className={`frise${verticale ? ' frise--verticale' : ''}`} aria-label={t.avancement}>
      {t.frise.map((libelle, i) => {
        const fait = i < faites;
        const courant = i === faites;
        return (
          <li key={libelle} className={fait ? 'is-fait' : courant ? 'is-courant' : ''} aria-current={courant ? 'step' : undefined}>
            {etapes?.[i] ?? libelle}
          </li>
        );
      })}
    </ol>
  );
}

export const BadgeClient = ({ statut, langue }: { statut: Statut; langue: Langue }) => <span className={`badge ${BADGE[statut]}`}>{libelleStatut(statut, langue)}</span>;
