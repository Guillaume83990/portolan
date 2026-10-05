// Envoi d'un e-mail : rendu HTML et texte, rangement dans la boîte d'envoi (table emails), historique de la réservation,
// puis envoi réel par Resend si c'est configuré. En démonstration, seules les adresses autorisées reçoivent vraiment l'e-mail.
import 'server-only';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Langue } from '@/lib/format';
import type { Document } from '@/lib/pdf/generer';

export type Envoi = {
  pour: 'client' | 'direction'; destinataire: string; langue: Langue; modele: string;
  objet: string; apercu: string; element: React.ReactElement;
  reservation?: string | null; evenement?: number | null; pieces?: Document[]; repondreA?: string;
};

const demo = () => process.env.NEXT_PUBLIC_DEMO === 'true';
const autorisees = () => (process.env.EMAILS_AUTORISES ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
export const envoiReelPossible = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_EXPEDITEUR);
const envoiReelVers = (adresse: string) => envoiReelPossible() && (!demo() || autorisees().includes(adresse.toLowerCase()));

export async function envoyer(e: Envoi) {
  const admin = supabaseAdmin();
  // Espace fine insécable (montants, « : ») → insécable simple : Georgia et Outlook n'ont pas ce caractère
  const [html, texte] = (await Promise.all([render(e.element), render(e.element, { plainText: true })])).map((x) => x.replace(/ /g, ' '));
  const { data: ligne, error } = await admin.from('emails').insert({
    evenement: e.evenement ?? null, reservation: e.reservation ?? null, pour: e.pour, destinataire: e.destinataire, langue: e.langue,
    modele: e.modele, objet: e.objet, apercu: e.apercu, html, texte, pieces: (e.pieces ?? []).map((d) => d.id),
  }).select('id').single();
  if (error) throw error;

  let statut: 'prepare' | 'envoye' | 'echec' = 'prepare';
  if (envoiReelVers(e.destinataire)) {
    try {
      const pieces = await Promise.all((e.pieces ?? []).map(async (d) => {
        const { data } = await admin.storage.from('documents').download(d.chemin);
        return { filename: `${d.numero}.pdf`, content: Buffer.from(await data!.arrayBuffer()) };
      }));
      const { data, error: err } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.EMAIL_EXPEDITEUR!, to: e.destinataire, subject: e.objet, html, text: texte,
        ...(e.repondreA ? { replyTo: e.repondreA } : {}), ...(pieces.length ? { attachments: pieces } : {}),
      });
      if (err) throw new Error(err.message);
      statut = 'envoye';
      await admin.from('emails').update({ statut, fournisseur_id: data?.id ?? null }).eq('id', ligne.id);
    } catch (x) {
      statut = 'echec';
      await admin.from('emails').update({ statut, erreur: x instanceof Error ? x.message : String(x) }).eq('id', ligne.id);
    }
  }

  // Historique exact : envoyé, ou seulement préparé (boîte d'envoi) quand aucun envoi réel n'a eu lieu
  if (e.reservation) {
    const qui = e.pour === 'client' ? 'au client' : 'à la direction';
    const etat = statut === 'envoye' ? 'envoyé' : statut === 'echec' ? 'non envoyé (erreur)' : 'préparé (boîte d’envoi)';
    await admin.from('journal').insert({ reservation: e.reservation, texte: `E-mail ${qui} ${etat} : « ${e.objet} »`, auteur: 'Portolan' });
  }
  return { id: ligne.id as string, statut };
}
