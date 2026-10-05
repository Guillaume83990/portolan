// Client Supabase côté serveur (composants serveur, Server Actions, routes) : il agit avec la session
// de la personne connectée, donc sous les règles de la base (RLS). Rien ici ne contourne la sécurité.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function supabaseServeur() {
  const magasin = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => magasin.getAll(),
      setAll: (liste) => {
        // Appelé depuis un composant serveur, l'écriture est impossible : le proxy rafraîchit la session.
        try { liste.forEach(({ name, value, options }) => magasin.set(name, value, options)); } catch {}
      },
    },
  });
}

export type Profil = {
  id: string; email: string; prenom: string; nom: string; telephone: string; langue: 'fr' | 'en' | 'de' | 'it';
  role: 'client' | 'directeur' | 'demo'; societe: string; adresse: string; code_postal: string; ville: string;
  pays: string; tva: string; cree_le: string;
};

// La personne connectée et son profil (null si personne n'est connecté)
export async function profilConnecte() {
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, profil: null as Profil | null };
  const { data: profil } = await sb.from('profils').select('*').eq('id', user.id).single<Profil>();
  return { sb, user, profil };
}
