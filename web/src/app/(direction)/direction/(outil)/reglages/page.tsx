import type { Metadata } from 'next';
import { Haut } from '../Haut';
import { direction, reglages, versionsContrat } from '@/lib/direction/donnees';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { Reglages as Formulaires } from './Formulaires';

export const metadata: Metadata = { title: 'Réglages' };

export default async function Reglages() {
  const [{ demo }, r, versions] = await Promise.all([direction(), reglages(), versionsContrat()]);
  const sb = await supabaseServeur();
  const { data: equipe } = demo ? { data: [] } : await sb.from('profils').select('prenom, nom, email, role').in('role', ['directeur']);
  const { data: comptes } = demo ? { data: [] } : await sb.from('reservations').select('contrat_version').not('contrat_version', 'is', null);
  const usages = Object.fromEntries(versions.map((v) => [v.version, (comptes ?? []).filter((c) => c.contrat_version === v.version).length]));
  return (
    <>
      <Haut titre="Réglages" />
      <div className="contenu">
        <Formulaires r={r} versions={versions.map((v) => ({ ...v, reservations: usages[v.version] ?? 0 }))} equipe={equipe ?? []} />
      </div>
    </>
  );
}
