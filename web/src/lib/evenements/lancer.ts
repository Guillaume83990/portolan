// Lance le traitement des événements juste après la réponse (actions, webhook Stripe) : la page n'attend ni les PDF ni les e-mails
import 'server-only';
import { after } from 'next/server';
import { adminDisponible } from '@/lib/supabase/admin';
import { traiterEvenements } from './traiter';

export function lancerTraitement() {
  if (!adminDisponible()) return;
  after(async () => {
    try { await traiterEvenements(); } catch { /* repris par la tâche planifiée */ }
  });
}
