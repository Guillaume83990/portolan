import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cheminEspace, dico, estLangue } from '@/lib/i18n';
import { mesDocuments, mesReservations, nomYacht, reglagesPublics, session, yachtsDe } from '@/lib/espace/donnees';
import { CadreEspace } from '@/components/espace/Commun';
import { LigneDocument } from '@/components/espace/Document';
import { CarteVide } from '@/components/Rose';
import { plage } from '@/lib/format';
import { FiltresDocuments } from './Filtres';

export const metadata: Metadata = { title: 'Documents' };
const FAMILLES: Record<string, string[]> = { tous: [], contrats: ['contrat'], factures: ['facture_acompte', 'facture_solde'], apa: ['recu_apa'] };

export default async function MesDocuments({ params, searchParams }: PageProps<'/[locale]/espace/documents'>) {
  const { locale } = await params;
  if (!estLangue(locale)) notFound();
  const { user, profil } = await session();
  if (!user || !profil || profil.role !== 'client') redirect(cheminEspace(locale));
  const sp = await searchParams;
  const t = dico(locale).documents;
  const [docs, resas, r] = await Promise.all([mesDocuments(), mesReservations(), reglagesPublics()]);
  const yachts = await yachtsDe([...new Set(resas.map((x) => x.yacht))].join(','));
  const famille = typeof sp.type === 'string' && sp.type in FAMILLES ? sp.type : 'tous';
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase() : '';
  const filtres = docs.filter((d) => famille === 'tous' || FAMILLES[famille].includes(d.type))
    .filter((d) => !q || d.numero.toLowerCase().includes(q) || resas.find((x) => x.id === d.reservation)?.reference.toLowerCase().includes(q));
  const groupes = resas.filter((x) => filtres.some((d) => d.reservation === x.id)).sort((a, b) => b.debut.localeCompare(a.debut));

  return (
    <CadreEspace langue={locale} prenom={profil.prenom} actif="documents" courtier={r.courtier}>
      {docs.length === 0 ? (
        <div className="carte vide"><CarteVide /><p className="vide__titre">{t.vide.titre}</p><p>{t.vide.texte}</p></div>
      ) : (
        <>
          <FiltresDocuments langue={locale} famille={famille} q={q} />
          {groupes.length === 0 && <p className="second" style={{ marginTop: '2rem' }}>{t.aucunResultat}</p>}
          {groupes.map((x) => (
            <section className="esp__section" key={x.id}>
              <h2 style={{ marginBottom: '.25rem' }}><em>{nomYacht(yachts, x.yacht)}</em></h2>
              <p className="second" style={{ fontSize: 'var(--t-s)', marginBottom: '.5rem' }}>{plage(x.debut, x.fin, locale)} {x.fin.slice(0, 4)} · {x.reference}</p>
              {filtres.filter((d) => d.reservation === x.id).map((d) => <LigneDocument key={d.id} d={d} langue={locale} reference={x.reference} />)}
            </section>
          ))}
          <p className="second" style={{ fontSize: 'var(--t-xs)', marginTop: '2.5rem', maxWidth: '60ch' }}>{t.mention}</p>
        </>
      )}
    </CadreEspace>
  );
}
