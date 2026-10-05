-- Portolan : actions complémentaires de l'espace directeur et point d'entrée des paiements Stripe

-- Le directeur ajoute une ligne à l'historique (relance, lien renvoyé, appel de solde…)
create function public.noter_reservation(p_id uuid, p_texte text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.est_directeur() then raise exception 'reserve_au_directeur'; end if;
  perform private.noter(p_id, left(p_texte, 500), private.nom_directeur());
end $$;

-- Remboursement (après annulation) : réparti sur les paiements reçus, du plus récent au plus ancien
create function public.enregistrer_remboursement(p_id uuid, p_montant int) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare reste int := p_montant; p record; part int;
begin
  if not private.est_directeur() then raise exception 'reserve_au_directeur'; end if;
  if p_montant < 0 then raise exception 'montant_invalide'; end if;
  for p in select id, montant - rembourse as dispo from public.paiements
           where reservation = p_id and statut = 'paye' and montant > rembourse order by paye_le desc loop
    exit when reste <= 0;
    part := least(reste, p.dispo);
    update public.paiements set rembourse = rembourse + part,
      statut = case when rembourse + part >= montant then 'rembourse' else statut end where id = p.id;
    reste := reste - part;
  end loop;
  if reste > 0 then raise exception 'montant_superieur_a_l_encaisse'; end if;
  update public.reservations set rembourse = rembourse + p_montant where id = p_id;
  if p_montant > 0 then
    perform private.noter(p_id, 'Remboursement de ' || to_char(p_montant, 'FM999G999G999') || ' € enregistré', private.nom_directeur());
  end if;
end $$;

-- Paiement confirmé par Stripe (webhook) : appelable uniquement avec la clé secrète du serveur
create function public.paiement_stripe(p_reservation uuid, p_type text, p_montant int, p_methode text, p_session text, p_intent text)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare res public.reservations;
begin
  res := private.paiement_recu(p_reservation, p_type, p_montant, p_methode, p_session, p_intent, now(), '');
  return to_jsonb(res);
end $$;

revoke all on function public.noter_reservation, public.enregistrer_remboursement, public.paiement_stripe from public, anon, authenticated;
grant execute on function public.noter_reservation, public.enregistrer_remboursement to authenticated;
grant execute on function public.paiement_stripe to service_role;
