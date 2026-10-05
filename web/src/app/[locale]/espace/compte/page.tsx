import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cheminEspace, estLangue } from '@/lib/i18n';
import { reglagesPublics, session } from '@/lib/espace/donnees';
import { CadreEspace } from '@/components/espace/Commun';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { FormulairesCompte } from './Formulaires';

export const metadata: Metadata = { title: 'Compte' };

export default async function MonCompte({ params }: PageProps<'/[locale]/espace/compte'>) {
  const { locale } = await params;
  if (!estLangue(locale)) notFound();
  const { user, profil } = await session();
  if (!user || !profil) redirect(cheminEspace(locale));
  const r = await reglagesPublics();
  const sb = await supabaseServeur();
  const { data: avenir } = await sb.rpc('croisiere_a_venir');
  return (
    <CadreEspace langue={locale} prenom={profil.prenom} actif="compte" courtier={r.courtier}>
      <FormulairesCompte langue={locale} profil={profil} avenir={avenir as { yacht: string; debut: string; fin: string } | null}
        courtier={{ prenom: r.courtier.prenom ?? '', email: r.courtier.email ?? '' }} />
    </CadreEspace>
  );
}
