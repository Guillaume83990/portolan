-- Historique exact : tant que les e-mails ne sont pas branchés, la validation rend le paiement disponible dans l'espace client
-- (même fonction que 20261004_04_mvp.sql, seul le texte de l'historique change)
create or replace function public.valider_reservation(p_id uuid, p_mot text default '') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  res public.reservations;
  r public.reglages;
  e jsonb;
begin
  if not private.est_directeur() then raise exception 'reserve_au_directeur'; end if;
  select * into r from public.reglages;
  select * into res from public.reservations where id = p_id and statut = 'en_attente' and type = 'location' for update;
  if not found then raise exception 'decision_impossible'; end if;
  e := public.echeancier(res.montant, res.debut);
  update public.reservations set
    statut = 'a_payer', valide_le = now(), decide_le = now(),
    expire_le = now() + make_interval(hours => r.delai_paiement_h),
    acompte = (e ->> 'acompte')::int, solde = (e ->> 'solde')::int, apa = (e ->> 'apa')::int,
    solde_du_le = (e ->> 'solde_du_le')::date,
    note_directeur = left(coalesce(nullif(p_mot, ''), note_directeur), 2000)
  where id = p_id returning * into res;
  perform private.noter(p_id, 'Validée par ' || private.nom_directeur() || ' · acompte à régler depuis l''espace client', private.nom_directeur());
  return to_jsonb(res);
end $$;
