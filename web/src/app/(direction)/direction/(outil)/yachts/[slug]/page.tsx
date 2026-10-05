import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { reglages, reservations, yachts } from '@/lib/direction/donnees';
import { Editeur } from './Editeur';

export async function generateMetadata({ params }: PageProps<'/direction/yachts/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const y = (await yachts()).find((x) => x.slug === slug);
  return { title: y ? `${y.nom} · Éditeur` : 'Éditeur de yacht' };
}

export default async function PageEditeur({ params }: PageProps<'/direction/yachts/[slug]'>) {
  const { slug } = await params;
  const [flotte, r, resas] = await Promise.all([yachts(), reglages(), reservations()]);
  const y = flotte.find((x) => x.slug === slug);
  if (!y) notFound();
  return (
    <Editeur key={`${y.slug}-${y.modifie_le}`} yacht={y} site={process.env.NEXT_PUBLIC_SITE_URL!}
      saison={{ annee: r.annee, haute_debut: r.haute_debut, haute_fin: r.haute_fin, taux_acompte: r.taux_acompte, taux_apa: r.taux_apa, solde_jours: r.solde_jours }}
      nbReservations={resas.filter((x) => x.yacht === y.slug).length} />
  );
}
