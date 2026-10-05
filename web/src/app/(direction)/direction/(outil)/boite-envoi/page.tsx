// Boîte d'envoi : chaque e-mail automatique tel que le client (ou la direction) le reçoit, avec ses pièces jointes.
// En démonstration, seuls les e-mails des comptes fictifs sont visibles (règle de la base).
import type { Metadata } from 'next';
import Link from 'next/link';
import { Haut } from '../Haut';
import { direction } from '@/lib/direction/donnees';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { adminDisponible, supabaseAdmin } from '@/lib/supabase/admin';
import { envoiReelPossible } from '@/lib/emails/envoi';
import { dateLongue, heureMinute, ilYa } from '@/lib/format';
import { CarteVide } from '@/components/Rose';
import { TraiterMaintenant } from './TraiterMaintenant';

export const metadata: Metadata = { title: 'Boîte d’envoi' };

const MODELES: Record<string, string> = {
  demande_recue: 'Demande reçue', demande_validee: 'Demande validée', relance_paiement: 'Relance de paiement', option_expiree: 'Option expirée',
  demande_refusee: 'Demande refusée', acompte_recu: 'Acompte reçu', virement: 'Coordonnées de virement', appel_solde: 'Appel du solde',
  solde_recu: 'Solde reçu', embarquement: 'Embarquement', annulation: 'Annulation', remboursement: 'Remboursement',
  formulaire: 'Formulaire', inscription: 'Hors marché', paiement_recu: 'Paiement reçu', rappel_directeur: 'Rappel 24 h',
};
const STATUTS: Record<string, [string, string]> = { prepare: ['Préparé', 'badge--neutre'], envoye: ['Envoyé', 'badge--ok'], echec: ['Échec', 'badge--retard'] };
const LANGUES: Record<string, string> = { fr: 'Français', en: 'Anglais', de: 'Allemand', it: 'Italien' };
type Ligne = { id: string; cree_le: string; pour: string; destinataire: string; langue: string; modele: string; objet: string; statut: string; erreur: string | null; reservations: { reference: string } | null };

export default async function BoiteEnvoi({ searchParams }: PageProps<'/direction/boite-envoi'>) {
  const sp = await searchParams;
  const { demo } = await direction();
  const sb = await supabaseServeur();
  const pour = sp.pour === 'client' || sp.pour === 'direction' ? sp.pour : '';
  let q = sb.from('emails').select('id, cree_le, pour, destinataire, langue, modele, objet, statut, erreur, reservations(reference)').order('cree_le', { ascending: false }).limit(120);
  if (pour) q = q.eq('pour', pour);
  const { data } = await q;
  const liste = (data ?? []) as unknown as Ligne[];
  const choisi = liste.find((e) => e.id === sp.email) ?? liste[0];
  const { data: detail } = choisi ? await sb.from('emails').select('html, apercu, pieces').eq('id', choisi.id).single() : { data: null };
  const { data: pieces } = detail?.pieces?.length ? await sb.from('documents').select('id, type, numero').in('id', detail.pieces) : { data: [] };
  // File d'attente (lecture serveur) : événements pas encore traités et erreurs
  const file = adminDisponible()
    ? await supabaseAdmin().from('evenements').select('id, erreur', { count: 'exact' }).is('traite_le', null).then((x) => ({ attente: x.count ?? 0, erreurs: (x.data ?? []).filter((e) => e.erreur).length }))
    : null;
  const lien = (p: Record<string, string>) => `/direction/boite-envoi?${new URLSearchParams({ ...(pour ? { pour } : {}), ...p })}`;

  return (
    <>
      <Haut titre="Boîte d’envoi" />
      <div className={`maitre${sp.email ? ' a-detail' : ''}`}>
        <div className="maitre__liste">
          <p className="bandeau-info" style={{ marginBottom: '1rem' }}>
            {envoiReelPossible()
              ? demo ? 'Démonstration : les e-mails sont préparés ici ; seules les adresses autorisées les reçoivent vraiment.' : 'Les e-mails partent par Resend et restent consultables ici.'
              : 'Aucun service d’envoi branché : les e-mails sont préparés ici, exactement tels qu’ils partiraient.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <Link className="chip" aria-pressed={!pour} href="/direction/boite-envoi" style={{ textDecoration: 'none' }}>Tous</Link>
            <Link className="chip" aria-pressed={pour === 'client'} href="/direction/boite-envoi?pour=client" style={{ textDecoration: 'none' }}>Clients</Link>
            <Link className="chip" aria-pressed={pour === 'direction'} href="/direction/boite-envoi?pour=direction" style={{ textDecoration: 'none' }}>Direction</Link>
            {file && <span className="second" style={{ fontSize: 'var(--t-xs)', marginLeft: 'auto' }}>
              {file.attente ? `${file.attente} événement${file.attente > 1 ? 's' : ''} en attente${file.erreurs ? `, dont ${file.erreurs} en erreur` : ''}` : 'File à jour'}
            </span>}
            {file && file.attente > 0 && <TraiterMaintenant />}
          </div>
          {liste.length === 0 ? (
            <div className="vide"><CarteVide /><p className="vide__titre">Aucun e-mail pour l’instant.</p><p>Chaque étape d’une réservation (demande, validation, acompte, solde…) en prépare un ici.</p></div>
          ) : (
            <table className="tab tab--mobile">
              <thead><tr><th>Date</th><th>Destinataire</th><th>Objet</th><th>Réservation</th><th>État</th></tr></thead>
              <tbody>{liste.map((e) => (
                <tr key={e.id} className={e.id === choisi?.id ? 'is-choisie' : ''}>
                  <td className="second" style={{ whiteSpace: 'nowrap' }}>{ilYa(e.cree_le)}</td>
                  <td className="cache-m">{e.pour === 'direction' ? <span className="badge badge--neutre">Direction</span> : e.destinataire}</td>
                  <td><Link className="lien" href={lien({ email: e.id })} scroll={false}>{e.objet}</Link><br /><small className="second">{MODELES[e.modele] ?? e.modele} · {e.langue.toUpperCase()}</small></td>
                  <td className="cache-m">{e.reservations?.reference ?? '—'}</td>
                  <td><span className={`badge ${STATUTS[e.statut]?.[1] ?? ''}`}>{STATUTS[e.statut]?.[0] ?? e.statut}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        {choisi && detail && (
          <aside className="maitre__detail" aria-label="Aperçu de l’e-mail">
            <p className="seul-mobile" style={{ marginBottom: '1rem' }}><Link className="lien lien--discret" href={lien({})}>← Boîte d’envoi</Link></p>
            <p className="titre-s">{choisi.objet}</p>
            <dl className="paires" style={{ marginTop: '1rem' }}>
              <div><dt>À</dt><dd>{choisi.destinataire}</dd></div>
              <div><dt>Le</dt><dd>{dateLongue(choisi.cree_le)}, {heureMinute(choisi.cree_le)}</dd></div>
              <div><dt>Modèle</dt><dd>{MODELES[choisi.modele] ?? choisi.modele} · {LANGUES[choisi.langue] ?? choisi.langue}</dd></div>
              <div><dt>Aperçu</dt><dd className="second">{detail.apercu}</dd></div>
              {choisi.reservations && <div><dt>Réservation</dt><dd><Link className="lien" href={`/direction/reservations?ref=${choisi.reservations.reference}&filtre=toutes`}>{choisi.reservations.reference}</Link></dd></div>}
              <div><dt>État</dt><dd>{STATUTS[choisi.statut]?.[0]}{choisi.erreur ? ` · ${choisi.erreur}` : ''}</dd></div>
              {(pieces ?? []).length > 0 && <div><dt>Pièces jointes</dt><dd style={{ display: 'grid', gap: '.25rem' }}>
                {(pieces ?? []).map((d) => <a key={d.id} className="lien" href={`/api/documents/${d.id}`}>{d.numero}.pdf</a>)}
              </dd></div>}
            </dl>
            <iframe title={`Aperçu : ${choisi.objet}`} srcDoc={detail.html} sandbox="" loading="lazy"
              style={{ width: '100%', height: '78vh', border: '1px solid var(--filet)', marginTop: '1.25rem', background: '#E7E6DF' }} />
          </aside>
        )}
      </div>
    </>
  );
}
