'use server';
import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { annulerVirementEnAttente, creerSession, echeanceDue, stripeDisponible } from '@/lib/paiement/stripe';
import { cheminEspace, estLangue } from '@/lib/i18n';

// Démarre le paiement : la base est relue (montants, statut) ; rien ne vient du navigateur à part le moyen choisi
export async function payer(reference: string, methode: 'carte' | 'virement', langue: string) {
  if (!stripeDisponible() || !estLangue(langue)) return { ok: false as const };
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const };
  const { data: r } = await sb.from('reservations').select('id, reference, yacht, statut, acompte, solde, apa, montant').eq('reference', reference).eq('client', user.id).single();
  if (!r) return { ok: false as const };
  const { data: pay } = await sb.from('paiements').select('montant, rembourse').eq('reservation', r.id).eq('statut', 'paye');
  const regle = (pay ?? []).reduce((s, p) => s + p.montant - p.rembourse, 0);
  const due = echeanceDue(r, regle);
  if (!due || due.montant <= 0) return { ok: false as const };
  const base = `${process.env.NEXT_PUBLIC_APP_URL}${cheminEspace(langue, `reservations/${reference}`)}`;
  // Un virement déjà ouvert pour ce montant : mêmes coordonnées bancaires ; le client choisit la carte : on l'annule
  const { data: attente } = await sb.from('paiements').select('id, montant, stripe_session, stripe_payment_intent')
    .eq('reservation', r.id).eq('statut', 'en_attente').eq('methode', 'virement').order('cree_le', { ascending: false }).limit(1).maybeSingle();
  if (attente?.stripe_session) {
    if (methode === 'virement' && attente.montant === due.montant) redirect(`${base}/paiement?session_id=${attente.stripe_session}`);
    await annulerVirementEnAttente(attente.id, attente.stripe_payment_intent);
  }
  const { data: p } = await sb.from('profils').select('prenom, nom, email').eq('id', user.id).single();
  const { data: y } = await sb.from('yachts').select('nom').eq('slug', r.yacht).maybeSingle();
  let url: string | null = null;
  try {
    const session = await creerSession({
      reservationId: r.id, reference, yacht: y?.nom ?? r.yacht, echeance: due, methode, langue, email: p?.email ?? user.email!,
      clientId: user.id, nom: `${p?.prenom ?? ''} ${p?.nom ?? ''}`.trim(), retour: `${base}/paiement`, annulation: `${base}/paiement?etat=annule`,
    });
    url = session.url;
  } catch {
    return { ok: false as const };
  }
  if (url) redirect(url);
  return { ok: false as const };
}
