// Remise à zéro des comptes de démonstration (chaque nuit, /api/cron/demo) : comptes recréés si besoin, mots de passe
// et coordonnées rétablis (un visiteur ne peut pas verrouiller la démonstration), données du client fictif recréées.
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { assurerDocuments } from '@/lib/pdf/generer';
import { identifiantsDemo, type CompteDemo } from './comptes';

const PROFILS: Record<CompteDemo, Record<string, string>> = {
  directeur: { role: 'demo', prenom: 'Visite', nom: 'de démonstration', langue: 'fr' },
  client: {
    role: 'client', prenom: 'Camille', nom: 'Laurent', langue: 'fr', telephone: '+33 6 00 00 00 00',
    societe: '', adresse: '12 rue de la Paix', code_postal: '75002', ville: 'Paris', pays: 'France', tva: '',
  },
};

async function compte(cle: CompteDemo) {
  const id = identifiantsDemo(cle);
  if (!id) throw new Error(`identifiants_${cle}_manquants`);
  const admin = supabaseAdmin();
  const p = PROFILS[cle];
  const { data: existant } = await admin.from('profils').select('id').eq('email', id.email).maybeSingle();
  let uid = existant?.id as string | undefined;
  const meta = { prenom: p.prenom, nom: p.nom, langue: p.langue };
  if (uid) {
    const { error } = await admin.auth.admin.updateUserById(uid, { email: id.email, password: id.mdp, email_confirm: true, user_metadata: meta });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email: id.email, password: id.mdp, email_confirm: true, user_metadata: meta });
    if (error) throw error;
    uid = data.user.id;
  }
  const { error } = await admin.from('profils').update({ ...p, email: id.email }).eq('id', uid);
  if (error) throw error;
  return uid;
}

// Fichiers PDF du client de démonstration (rangés sous <client>/<référence>/) : supprimés avant de recréer ses données
async function viderDocuments(uid: string) {
  const stock = supabaseAdmin().storage.from('documents');
  const { data: dossiers } = await stock.list(uid, { limit: 1000 });
  for (const d of dossiers ?? []) {
    const { data: fichiers } = await stock.list(`${uid}/${d.name}`, { limit: 1000 });
    if (fichiers?.length) await stock.remove(fichiers.map((f) => `${uid}/${d.name}/${f.name}`));
  }
}

export async function reinitialiserDemo() {
  const admin = supabaseAdmin();
  await compte('directeur');
  const client = await compte('client');
  await viderDocuments(client);
  const { data: refs, error } = await admin.rpc('semer_demo_client', { p_client: client });
  if (error) throw error;
  const { data: payees } = await admin.from('reservations').select('id').eq('client', client).in('statut', ['confirmee', 'soldee']);
  for (const r of payees ?? []) await assurerDocuments(r.id);
  return { reservations: refs as string[] };
}
