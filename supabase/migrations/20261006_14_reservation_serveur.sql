-- Réservation depuis la fiche d'un yacht : uniquement par le serveur de l'application (/api/reservations).
-- Le serveur vérifie la session du client, la protection anti-robot (Turnstile) et la case d'acceptation du
-- contrat, puis appelle reserver_serveur avec la clé secrète : l'adresse IP est enregistrée comme preuve
-- d'acceptation (avec la version du contrat et l'heure, déjà notées par public.reserver).
-- Le navigateur ne peut plus appeler public.reserver directement (ce qui contournait Turnstile).

revoke execute on function public.reserver(text, date, date, time, text, int, text, text) from public, anon, authenticated;

create or replace function public.reserver_serveur(
  p_client uuid, p_ip text,
  p_yacht text, p_debut date, p_fin date, p_heure time, p_port text, p_invites int,
  p_message text default '', p_langue text default 'fr'
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  res jsonb;
begin
  if p_client is null then raise exception 'connexion_requise'; end if;
  -- public.reserver lit le client dans auth.uid() : on lui présente la session vérifiée par le serveur
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_client, 'role', 'authenticated')::text, true);
  res := public.reserver(p_yacht, p_debut, p_fin, p_heure, p_port, p_invites, p_message, p_langue);
  update public.reservations set accepte_ip = left(p_ip, 64) where id = (res ->> 'id')::uuid;
  return res;
end $$;

revoke execute on function public.reserver_serveur(uuid, text, text, date, date, time, text, int, text, text) from public, anon, authenticated;
grant execute on function public.reserver_serveur(uuid, text, text, date, date, time, text, int, text, text) to service_role;
