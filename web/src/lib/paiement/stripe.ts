// Paiements Stripe (Checkout) : carte bancaire, ou virement SEPA vers un IBAN dédié au client (customer_balance).
// Le paiement est enregistré par le webhook ; la page de retour l'enregistre aussi (idempotent : une session = un paiement).
import 'server-only';
import Stripe from 'stripe';
import { adminDisponible, supabaseAdmin } from '@/lib/supabase/admin';
import type { Langue } from '@/lib/format';

// Site de démonstration : aucun débit réel possible. Avec NEXT_PUBLIC_DEMO=true, seule une clé de test Stripe est acceptée
// (une clé « live » collée par erreur désactive le paiement au lieu de débiter un visiteur).
export const paiementFictif = () => process.env.NEXT_PUBLIC_DEMO === 'true';
export const stripeDisponible = () => {
  const cle = process.env.STRIPE_SECRET_KEY ?? '';
  return paiementFictif() ? cle.startsWith('sk_test_') : Boolean(cle);
};
let client: Stripe | null = null;
export const stripe = () => {
  if (!stripeDisponible()) throw new Error('stripe_indisponible');
  return (client ??= new Stripe(process.env.STRIPE_SECRET_KEY!));
};

export type Echeance = { type: 'acompte' | 'total'; montant: number };

// Ce que le client doit régler maintenant : l'acompte (option à payer), ou le solde et l'APA (réservation confirmée)
export function echeanceDue(r: { statut: string; acompte: number; solde: number; apa: number; montant: number }, regle: number): Echeance | null {
  if (r.statut === 'a_payer') return { type: r.solde === 0 ? 'total' : 'acompte', montant: Math.max(0, (r.solde === 0 ? r.montant + r.apa : r.acompte) - regle) };
  if (r.statut === 'confirmee') return { type: 'total', montant: Math.max(0, r.montant + r.apa - regle) };
  return null;
}

export async function creerSession(o: {
  reservationId: string; reference: string; yacht: string; echeance: Echeance; methode: 'carte' | 'virement';
  langue: Langue; email: string; clientId: string; nom: string; retour: string; annulation: string;
}) {
  const s = stripe();
  // Un client Stripe par compte (nécessaire au virement : l'IBAN lui est attribué)
  let customer: string | undefined;
  if (adminDisponible()) {
    const admin = supabaseAdmin();
    const { data } = await admin.from('profils').select('stripe_customer').eq('id', o.clientId).single();
    customer = data?.stripe_customer ?? undefined;
    if (!customer) {
      customer = (await s.customers.create({ email: o.email, name: o.nom, metadata: { profil: o.clientId } })).id;
      await admin.from('profils').update({ stripe_customer: customer }).eq('id', o.clientId);
    }
  } else if (o.methode === 'virement') {
    customer = (await s.customers.create({ email: o.email, name: o.nom, metadata: { profil: o.clientId } })).id;
  }
  const libelle = o.echeance.type === 'acompte' ? 'Acompte' : 'Solde et avance sur frais (APA)';
  return s.checkout.sessions.create({
    mode: 'payment',
    locale: o.langue,
    ...(customer ? { customer } : { customer_email: o.email }),
    client_reference_id: o.reference,
    line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: o.echeance.montant * 100, product_data: { name: `${libelle} · ${o.yacht} · ${o.reference}` } } }],
    allowed_payment_method_types: o.methode === 'carte' ? ['card'] : ['customer_balance'],
    ...(o.methode === 'virement' ? { payment_method_options: { customer_balance: { funding_type: 'bank_transfer', bank_transfer: { type: 'eu_bank_transfer', eu_bank_transfer: { country: 'FR' } } } } } : {}),
    payment_intent_data: { description: `${libelle} ${o.reference}`, metadata: { reservation: o.reservationId, type: o.echeance.type, reference: o.reference } },
    metadata: { reservation: o.reservationId, type: o.echeance.type, reference: o.reference },
    success_url: `${o.retour}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: o.annulation,
  });
}

export type EtatSession =
  | { etat: 'paye'; montant: number; methode: 'carte' | 'virement' }
  | { etat: 'virement'; montant: number; iban: string; bic: string; titulaire: string; reference: string }
  | { etat: 'attente' } | { etat: 'echec' };

export async function lireSession(id: string, reservationId: string): Promise<EtatSession> {
  const s = stripe();
  const session = await s.checkout.sessions.retrieve(id, { expand: ['payment_intent'] });
  if (session.metadata?.reservation !== reservationId) return { etat: 'echec' };
  const methode = session.payment_method_types.includes('customer_balance') ? 'virement' : 'carte';
  if (session.payment_status === 'paid') {
    await enregistrer(session);
    return { etat: 'paye', montant: (session.amount_total ?? 0) / 100, methode };
  }
  const i = session.status === 'complete' ? coordonnees(session) : null;
  if (i) return { etat: 'virement', ...i };
  return session.status === 'open' ? { etat: 'attente' } : { etat: 'echec' };
}

// Coordonnées du virement (IBAN dédié au client, référence, montant restant), lues sur le paiement Stripe
function coordonnees(session: Stripe.Checkout.Session) {
  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  const instr = pi?.next_action?.display_bank_transfer_instructions;
  if (!instr) return null;
  const iban = instr.financial_addresses?.find((a) => a.type === 'iban')?.iban;
  return { montant: (instr.amount_remaining ?? session.amount_total ?? 0) / 100, iban: iban?.iban ?? '', bic: iban?.bic ?? '', titulaire: iban?.account_holder_name ?? '', reference: instr.reference ?? '' };
}
export async function instructionsVirement(sessionId: string) {
  return coordonnees(await stripe().checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] }));
}

// Virement choisi mais pas encore reçu : Stripe envoie le client sur sa page d'instructions (IBAN), sans retour sur le site.
// On garde la session « en attente » pour lui remontrer les mêmes coordonnées au lieu d'ouvrir un second virement.
export async function noterVirementEnAttente(session: Stripe.Checkout.Session) {
  if (!adminDisponible() || session.payment_status === 'paid' || !session.metadata?.reservation) return false;
  if (!session.payment_method_types.includes('customer_balance')) return false;
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  const { error } = await supabaseAdmin().from('paiements').insert({
    reservation: session.metadata.reservation, type: session.metadata.type === 'total' ? 'total' : 'acompte',
    montant: Math.round((session.amount_total ?? 0) / 100), methode: 'virement', statut: 'en_attente',
    stripe_session: session.id, stripe_payment_intent: pi,
  });
  if (error?.code === '23505') return false; // déjà noté (événement rejoué) : rien à refaire
  if (error) throw error;
  return true; // premier passage
}

// Le client paie finalement par carte : le virement resté en attente est annulé chez Stripe (pas de double paiement)
export async function annulerVirementEnAttente(paiementId: string, intent: string | null) {
  if (!adminDisponible()) return;
  if (intent) await stripe().paymentIntents.cancel(intent).catch(() => {});
  await supabaseAdmin().from('paiements').update({ statut: 'echoue' }).eq('id', paiementId).eq('statut', 'en_attente');
}

// Enregistre un paiement confirmé par Stripe (appel idempotent : la base ignore une session déjà enregistrée)
export async function enregistrer(session: Stripe.Checkout.Session) {
  if (!adminDisponible() || session.payment_status !== 'paid' || !session.metadata?.reservation) return false;
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  const { error } = await supabaseAdmin().rpc('paiement_stripe', {
    p_reservation: session.metadata.reservation, p_type: session.metadata.type === 'total' ? 'total' : 'acompte',
    p_montant: Math.round((session.amount_total ?? 0) / 100), p_methode: session.payment_method_types.includes('customer_balance') ? 'virement' : 'carte',
    p_session: session.id, p_intent: pi,
  });
  if (error) throw error;
  return true;
}
