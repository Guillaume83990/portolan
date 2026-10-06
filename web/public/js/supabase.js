// Connexion à Supabase (comptes, réservations, disponibilités), chargée seulement quand une page en a besoin.
// La clé ci-dessous est la clé PUBLIQUE de Supabase, faite pour être dans le navigateur :
// la sécurité repose sur les règles de la base (RLS), jamais sur cette clé. Aucune clé secrète ici.
// Bibliothèque : vendor/supabase.min.js (@supabase/supabase-js 2.117.2, licence MIT).

export const SUPABASE_URL = 'https://vdjcuvmatupuavabgxim.supabase.co';
export const SUPABASE_CLE_PUBLIQUE = 'sb_publishable_O32a-ICgaZiw_G0gFTWRPQ_DI07HP8a';

let client = null;
let chargement = null;

function chargerBibliotheque() {
  if (window.supabase?.createClient) return Promise.resolve();
  chargement ??= new Promise((ok, erreur) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/supabase.min.js', import.meta.url).href;
    s.onload = ok;
    s.onerror = () => { chargement = null; erreur(new Error('Supabase indisponible')); };
    document.head.append(s);
  });
  return chargement;
}

// Le client Supabase, prêt à l'emploi : const sb = await db();
export async function db() {
  if (client) return client;
  await chargerBibliotheque();
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'portolan-session' },
  });
  return client;
}
