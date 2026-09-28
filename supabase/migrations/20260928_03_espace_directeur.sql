-- Portolan : espace directeur (lecture des réservations, demandes, clients et chiffres)
-- Le directeur voit tout. Le compte « demo » (à montrer aux prospects) voit la même chose en lecture seule,
-- mais les données personnelles des vrais clients sont masquées. Les clients fictifs (@exemple.com) restent lisibles.

-- Masque un texte personnel : « Guillaume Martin » → « G. M. », une adresse → « masquée »
create function private.masquer(t text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(nullif(string_agg(left(m, 1) || '.', ' '), ''), '—')
  from regexp_split_to_table(trim(coalesce(t, '')), '\s+') as m where m <> ''
$$;

create function private.lisible(email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.est_directeur() or coalesce(email, '') like '%@exemple.com'
$$;

-- Toutes les réservations et blocages
create function public.direction_reservations()
returns table (
  id uuid, reference text, yacht text, yacht_nom text, type text, client uuid, client_nom text, client_email text,
  client_telephone text, langue text, debut date, fin date, heure time, port text, invites int, nuits int,
  montant int, statut text, message text, note_directeur text, cree_le timestamptz, decide_le timestamptz
)
language sql stable security definer set search_path = '' as $$
  select r.id, r.reference, r.yacht, y.nom, r.type, r.client,
    case when private.lisible(r.client_email) then r.client_nom else private.masquer(r.client_nom) end,
    case when private.lisible(r.client_email) then r.client_email else 'masqué en démonstration' end,
    case when private.lisible(r.client_email) then r.client_telephone else '' end,
    r.langue, r.debut, r.fin, r.heure, r.port, r.invites, r.nuits, r.montant, r.statut,
    case when private.lisible(r.client_email) then r.message else '' end,
    r.note_directeur, r.cree_le, r.decide_le
  from public.reservations r
  join public.yachts y on y.slug = r.yacht
  where private.voit_direction()
  order by r.debut, r.yacht
$$;

-- Les demandes envoyées par les formulaires
create function public.direction_demandes()
returns table (
  id uuid, type text, yacht text, yacht_nom text, nom text, email text, telephone text, message text,
  details jsonb, langue text, page text, traitee boolean, cree_le timestamptz
)
language sql stable security definer set search_path = '' as $$
  select d.id, d.type, d.yacht, y.nom,
    case when private.lisible(d.email) then d.nom else private.masquer(d.nom) end,
    case when private.lisible(d.email) then d.email else 'masqué en démonstration' end,
    case when private.lisible(d.email) then d.telephone else '' end,
    case when private.lisible(d.email) then d.message else '' end,
    case when private.lisible(d.email) then d.details else '{}'::jsonb end,
    d.langue, d.page, d.traitee, d.cree_le
  from public.demandes d
  left join public.yachts y on y.slug = d.yacht
  where private.voit_direction()
  order by d.traitee, d.cree_le desc
$$;

-- Les clients inscrits, avec leurs séjours et le montant confirmé
create function public.direction_clients()
returns table (id uuid, nom text, email text, telephone text, langue text, role text, cree_le timestamptz, sejours bigint, confirme bigint)
language sql stable security definer set search_path = '' as $$
  select p.id,
    case when private.est_directeur() then p.nom else private.masquer(p.nom) end,
    case when private.est_directeur() then p.email else 'masqué en démonstration' end,
    case when private.est_directeur() then p.telephone else '' end,
    p.langue, p.role, p.cree_le,
    count(r.id) filter (where r.statut in ('en_attente', 'confirmee')),
    coalesce(sum(r.montant) filter (where r.statut = 'confirmee'), 0)
  from public.profils p
  left join public.reservations r on r.client = p.id and r.type = 'location'
  where private.voit_direction()
  group by p.id
  order by p.cree_le desc
$$;

-- Les chiffres du tableau de bord (aucune donnée personnelle)
create function public.tableau_de_bord() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  r public.reglages;
  nuits_saison int;
  res jsonb;
begin
  if not private.voit_direction() then raise exception 'reserve_au_directeur'; end if;
  select * into r from public.reglages;
  nuits_saison := r.saison_fin - r.saison_debut;
  select jsonb_build_object(
    'annee', r.annee,
    'ca_confirme', coalesce((select sum(montant) from public.reservations where type = 'location' and statut = 'confirmee'), 0),
    'ca_attente', coalesce((select sum(montant) from public.reservations where type = 'location' and statut = 'en_attente'), 0),
    'a_traiter', (select count(*) from public.reservations where type = 'location' and statut = 'en_attente'),
    'demandes_nouvelles', (select count(*) from public.demandes where not traitee),
    'clients', (select count(*) from public.profils where role = 'client'),
    'sejours_confirmes', (select count(*) from public.reservations where type = 'location' and statut = 'confirmee'),
    'occupation', coalesce((
      select jsonb_agg(jsonb_build_object('slug', y.slug, 'nom', y.nom, 'nuits', o.nuits, 'total', nuits_saison) order by y.ordre)
      from public.yachts y
      cross join lateral (
        select coalesce(sum(least(x.fin, r.saison_fin) - greatest(x.debut, r.saison_debut)), 0)::int as nuits
        from public.reservations x
        where x.yacht = y.slug and x.type = 'location' and x.statut = 'confirmee'
      ) o
      where y.location_basse is not null
    ), '[]'),
    'par_mois', coalesce((
      select jsonb_agg(jsonb_build_object('mois', m.mois, 'montant', m.montant) order by m.mois)
      from (
        select to_char(debut, 'YYYY-MM') as mois, sum(montant)::bigint as montant
        from public.reservations where type = 'location' and statut = 'confirmee' group by 1
      ) m
    ), '[]')
  ) into res;
  return res;
end $$;

revoke all on function public.direction_reservations, public.direction_demandes, public.direction_clients, public.tableau_de_bord from public, anon;
grant execute on function public.direction_reservations, public.direction_demandes, public.direction_clients, public.tableau_de_bord to authenticated;
revoke all on function private.masquer, private.lisible from public;
grant execute on function private.masquer, private.lisible to authenticated;

-- Quelques demandes fictives, pour que le compte de démonstration ait de quoi montrer
insert into public.demandes (type, yacht, nom, email, telephone, message, details, langue, page, traitee, cree_le) values
  ('dossier', 'castellane', 'Mme Okafor', 'okafor@exemple.com', '+44 20 0000 0000', 'Could you send the full file and the survey history?', '{}', 'en', '/en/fleet/castellane/', false, now() - interval '2 hours'),
  ('visite', 'alize', 'M. Delcourt', 'delcourt@exemple.com', '+33 6 00 00 00 00', 'Visite possible samedi matin à Saint-Tropez ?', '{}', 'fr', '/fr/flotte/alize/', false, now() - interval '1 day'),
  ('projet-acheter', null, 'Famille Schneider', 'schneider@exemple.com', '', 'Wir suchen eine Yacht zwischen 30 und 45 m.', '{"taille":"30-45 m","budget":"5-15 M€","rappel":"e-mail"}', 'de', '/de/', false, now() - interval '3 days'),
  ('brochure', 'camarat', 'rossi@exemple.com', 'rossi@exemple.com', '', '', '{}', 'it', '/it/flotta/camarat/', true, now() - interval '6 days');

-- Photos des yachts ajoutées depuis l'espace directeur : lisibles par tous, envoyées et supprimées par le directeur seul.
-- Le navigateur les redimensionne en WebP (900 et 1600 px) avant l'envoi ; 5 Mo au plus par fichier.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('yachts', 'yachts', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
create policy "photos yachts : ajout (directeur)" on storage.objects for insert to authenticated
  with check (bucket_id = 'yachts' and (select private.est_directeur()));
create policy "photos yachts : remplacement (directeur)" on storage.objects for update to authenticated
  using (bucket_id = 'yachts' and (select private.est_directeur()))
  with check (bucket_id = 'yachts' and (select private.est_directeur()));
create policy "photos yachts : suppression (directeur)" on storage.objects for delete to authenticated
  using (bucket_id = 'yachts' and (select private.est_directeur()));

-- Le premier compte créé avec l'adresse de la direction devient directeur (adresse unique : personne ne peut la reprendre ensuite)
create or replace function private.nouveau_compte() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profils (id, email, nom, telephone, langue, role)
  values (
    new.id, coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'nom', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'telephone', ''), 40),
    case when new.raw_user_meta_data ->> 'langue' in ('fr', 'en', 'de', 'it') then new.raw_user_meta_data ->> 'langue' else 'fr' end,
    case when lower(new.email) = 'directeur@portolan.example'
          and not exists (select 1 from public.profils where role = 'directeur') then 'directeur' else 'client' end
  );
  return new;
end $$;

-- Le compte de démonstration ne peut pas modifier son profil
drop policy "profil : modification du sien" on public.profils;
create policy "profil : modification du sien" on public.profils for update to authenticated
  using (id = (select auth.uid()) and role <> 'demo') with check (id = (select auth.uid()) and role <> 'demo');

-- Le directeur ajoute directement des lignes (blocages de dates) : il lui faut le compteur des références
grant usage on sequence public.reservations_numero to authenticated;

-- Compte de démonstration (lecture seule) : demo@portolan.example, créé à la main le 28/09/2026 (rôle « demo »)
