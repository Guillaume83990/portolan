// Webhook Stripe : un paiement confirmé (carte immédiate ou virement reçu plus tard) fait avancer la réservation ;
// un virement choisi mais pas encore reçu est noté « en attente ».
// La signature est toujours vérifiée ; un même événement rejoué n'est compté qu'une fois.
import type Stripe from 'stripe';
import { enregistrer, instructionsVirement, noterVirementEnAttente, stripe, stripeDisponible } from '@/lib/paiement/stripe';
import { envoyerCoordonneesVirement } from '@/lib/evenements/traiter';
import { lancerTraitement } from '@/lib/evenements/lancer';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeDisponible() || !secret) return new Response('Stripe non configuré', { status: 503 });
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Signature manquante', { status: 400 });
  let evenement: Stripe.Event;
  try {
    evenement = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response('Signature invalide', { status: 400 });
  }
  if (evenement.type === 'checkout.session.completed' || evenement.type === 'checkout.session.async_payment_succeeded') {
    try {
      const session = evenement.data.object as Stripe.Checkout.Session;
      if (await enregistrer(session)) lancerTraitement();
      else if (await noterVirementEnAttente(session)) {
        // Premier passage de ce virement : coordonnées bancaires par e-mail (IBAN dédié au client)
        const instr = await instructionsVirement(session.id);
        if (instr) await envoyerCoordonneesVirement(session.metadata!.reservation, instr);
      }
    } catch {
      return new Response('Enregistrement impossible', { status: 500 }); // Stripe réessaiera
    }
  }
  return new Response('ok');
}
