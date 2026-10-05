-- Montants de l'historique au format français (« 20 570 € » et non « 20,570 € ») :
-- la base tourne en en_US, le séparateur de milliers « G » y donne une virgule.
-- (mêmes fonctions que 20261004_04_mvp.sql et 20261004_06_actions.sql, seul le format du montant change)
create function private.euros(p_montant int) returns text
language sql immutable set search_path = '' as $$
  select replace(to_char(p_montant, 'FM999,999,999'), ',', U&'\202F') || U&'\00A0€'
$$;
revoke all on function private.euros from public, anon, authenticated;

create or replace function private.paiement_recu(p_reservation uuid, p_type text, p_montant int, p_methode text,
  p_session text default null, p_intent text default null, p_le timestamptz default now(), p_justificatif text default '')
returns public.reservations
language plpgsql volatile security definer set search_path = '' as $$
declare
  res public.reservations;
  regle int;
begin
  select * into res from public.reservations where id = p_reservation for update;
  if not found then raise exception 'reservation_introuvable'; end if;
  if p_session is not null and exists (select 1 from public.paiements where stripe_session = p_session and statut = 'paye') then
    return res;  -- événement Stripe rejoué : rien à refaire
  end if;
  insert into public.paiements (reservation, type, montant, methode, statut, stripe_session, stripe_payment_intent, paye_le, justificatif)
  values (p_reservation, p_type, p_montant, p_methode, 'paye', p_session, p_intent, p_le, coalesce(p_justificatif, ''))
  on conflict (stripe_session) do update set statut = 'paye', paye_le = excluded.paye_le,
    stripe_payment_intent = excluded.stripe_payment_intent, methode = excluded.methode;
  select coalesce(sum(montant - rembourse), 0) into regle from public.paiements where reservation = p_reservation and statut = 'paye';
  if res.statut = 'a_payer' and regle >= res.acompte then
    update public.reservations set statut = case when res.solde = 0 and regle >= res.montant + res.apa then 'soldee' else 'confirmee' end,
      expire_le = null where id = p_reservation returning * into res;
  elsif res.statut = 'confirmee' and regle >= res.montant + res.apa then
    update public.reservations set statut = 'soldee' where id = p_reservation returning * into res;
  end if;
  perform private.noter(p_reservation,
    case p_type when 'acompte' then 'Acompte' when 'solde' then 'Solde' when 'apa' then 'APA' else 'Paiement' end
    || ' reçu (' || p_methode || ') · ' || private.euros(p_montant));
  return res;
end $$;

create or replace function public.enregistrer_remboursement(p_id uuid, p_montant int) returns void
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
    perform private.noter(p_id, 'Remboursement de ' || private.euros(p_montant) || ' enregistré', private.nom_directeur());
  end if;
end $$;

-- Lignes déjà écrites avec la virgule
update public.journal set texte = regexp_replace(texte, '(\d{1,3}),(\d{3}) €', '\1' || U&'\202F' || '\2' || U&'\00A0€', 'g')
where texte ~ '\d,\d{3} €';
