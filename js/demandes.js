// Une demande de formulaire → une ligne de la table « demandes » de Supabase.
// Écriture seule : personne ne peut relire les demandes, sauf le directeur (règles de la base).
// Les champs connus ont leur colonne, les autres vont dans « détails ».
import { db } from './supabase.js';

export async function enregistrerDemande(form, type) {
  const champs = Object.fromEntries(new FormData(form).entries());
  const { nom = '', email = '', tel = '', telephone = '', message = '', demande, consentement, ...details } = champs;
  const sb = await db();
  const { error } = await sb.from('demandes').insert({
    type: (type || demande || form.dataset.type || 'contact').slice(0, 40),
    yacht: form.dataset.slug || null,
    nom: (nom.trim() || email.trim()).slice(0, 120),
    email: email.trim(),
    telephone: (tel || telephone).trim().slice(0, 40),
    message: message.trim().slice(0, 4000),
    details: { ...details, ...(form.dataset.yacht && !form.dataset.slug ? { yacht: form.dataset.yacht } : {}) },
    langue: (document.documentElement.lang || 'fr').slice(0, 2),
    page: location.pathname.slice(0, 300),
  });
  if (error) throw error;
}
