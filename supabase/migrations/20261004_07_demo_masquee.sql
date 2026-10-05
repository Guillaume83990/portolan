-- En démonstration, toutes les données des clients sont masquées (y compris les clients fictifs), comme sur les maquettes
create or replace function private.lisible(email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.est_directeur()
$$;
