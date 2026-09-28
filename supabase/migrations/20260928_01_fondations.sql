-- Portolan : fondations du back-end (Supabase, projet « portolan », Paris)
-- Tables : réglages de la saison, profils (clients et directeur), yachts, réservations, demandes des formulaires.
-- Sécurité : chaque table est protégée (RLS). Un client ne voit que ses réservations ; seul le directeur modifie.
-- Les prix ne viennent jamais du navigateur : la base les calcule elle-même.

create extension if not exists btree_gist with schema extensions;

-- Fonctions internes (non exposées sur l'API)
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Réglages de la saison (une seule ligne)
-- ---------------------------------------------------------------------------------------------
create table public.reglages (
  id boolean primary key default true check (id),
  annee int not null,
  saison_debut date not null,                 -- premier embarquement possible
  saison_fin date not null,                   -- dernier débarquement possible
  haute_debut date not null,                  -- première nuit de haute saison
  haute_fin date not null,                    -- lendemain de la dernière nuit de haute saison
  min_nuits_haute int not null default 7,
  min_nuits_basse int not null default 3,
  heure_min time not null default '10:00',
  heure_max time not null default '18:00',
  ports text[] not null default array['Saint-Tropez', 'Cannes', 'Monaco', 'Saint-Raphaël'],
  derniere_publication timestamptz,
  check (saison_fin > saison_debut and haute_fin > haute_debut)
);

-- ---------------------------------------------------------------------------------------------
-- Profils : un par compte (créé automatiquement à l'inscription)
-- ---------------------------------------------------------------------------------------------
create table public.profils (
  id uuid primary key references auth.users on delete cascade,
  email text not null default '',
  nom text not null default '' check (char_length(nom) <= 120),
  telephone text not null default '' check (char_length(telephone) <= 40),
  langue text not null default 'fr' check (langue in ('fr', 'en', 'de', 'it')),
  role text not null default 'client' check (role in ('client', 'directeur', 'demo')),
  cree_le timestamptz not null default now()
);

create function private.role_actuel() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profils where id = auth.uid()
$$;
create function private.est_directeur() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.role_actuel() = 'directeur', false)
$$;
create function private.voit_direction() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.role_actuel() in ('directeur', 'demo'), false)
$$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated;

-- À chaque inscription : un profil, avec le nom et la langue saisis dans le formulaire
create function private.nouveau_compte() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profils (id, email, nom, telephone, langue)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'nom', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'telephone', ''), 40),
    case when new.raw_user_meta_data ->> 'langue' in ('fr', 'en', 'de', 'it') then new.raw_user_meta_data ->> 'langue' else 'fr' end
  );
  return new;
end $$;
create trigger nouveau_compte after insert on auth.users
  for each row execute function private.nouveau_compte();

-- ---------------------------------------------------------------------------------------------
-- Yachts : les champs utiles aux calculs en colonnes, le reste de la fiche en JSON
-- (même forme que l'ancien data/flotte.json, pour que la génération des pages ne change presque pas)
-- traductions = { "en": { "<texte français>": "<traduction>" }, "de": {…}, "it": {…} }
-- ---------------------------------------------------------------------------------------------
create table public.yachts (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  ordre int not null default 0,
  nom text not null check (char_length(nom) between 1 and 60),
  publie boolean not null default true,
  invites int not null check (invites > 0),
  port text not null,
  vente bigint check (vente > 0),
  location_basse int check (location_basse > 0),
  location_haute int check (location_haute > 0),
  fiche jsonb not null default '{}',
  traductions jsonb not null default '{}',
  modifie_le timestamptz not null default now(),
  check ((location_basse is null) = (location_haute is null))
);

-- ---------------------------------------------------------------------------------------------
-- Réservations (location) et blocages de dates (entretien, usage du propriétaire)
-- ---------------------------------------------------------------------------------------------
create sequence public.reservations_numero;
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default 'PTL-' || lpad(nextval('public.reservations_numero')::text, 5, '0'),
  yacht text not null references public.yachts (slug) on update cascade,
  type text not null default 'location' check (type in ('location', 'blocage')),
  client uuid references public.profils (id) on delete set null,
  client_nom text not null default '',
  client_email text not null default '',
  client_telephone text not null default '',
  langue text not null default 'fr' check (langue in ('fr', 'en', 'de', 'it')),
  debut date not null,                         -- jour d'embarquement
  fin date not null,                           -- jour de débarquement
  periode daterange generated always as (daterange(debut, fin, '[)')) stored,
  heure time,
  port text,
  invites int check (invites > 0),
  message text not null default '' check (char_length(message) <= 2000),
  nuits int not null default 0,
  montant int not null default 0,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'confirmee', 'refusee', 'annulee')),
  note_directeur text not null default '' check (char_length(note_directeur) <= 2000),
  cree_le timestamptz not null default now(),
  decide_le timestamptz,
  check (fin > debut),
  -- Deux réservations actives ne peuvent jamais se chevaucher sur un même yacht
  constraint reservations_sans_chevauchement exclude using gist (yacht with =, periode with &&)
    where (statut in ('en_attente', 'confirmee'))
);
create index reservations_client on public.reservations (client);
create index reservations_debut on public.reservations (debut);

-- ---------------------------------------------------------------------------------------------
-- Demandes des formulaires (dossier, brochure, visite, contact…) : tout le monde peut écrire, seul le directeur lit
-- ---------------------------------------------------------------------------------------------
create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'contact' check (char_length(type) between 1 and 40),
  yacht text references public.yachts (slug) on update cascade on delete set null,
  nom text not null check (char_length(nom) between 1 and 120),
  email text not null check (char_length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telephone text not null default '' check (char_length(telephone) <= 40),
  message text not null default '' check (char_length(message) <= 4000),
  details jsonb not null default '{}' check (pg_column_size(details) < 4000),
  langue text not null default 'fr' check (langue in ('fr', 'en', 'de', 'it')),
  page text not null default '' check (char_length(page) <= 300),
  traitee boolean not null default false,
  cree_le timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- Droits et règles de sécurité (RLS)
-- ---------------------------------------------------------------------------------------------
alter table public.reglages enable row level security;
alter table public.profils enable row level security;
alter table public.yachts enable row level security;
alter table public.reservations enable row level security;
alter table public.demandes enable row level security;

revoke all on public.reglages, public.profils, public.yachts, public.reservations, public.demandes from anon, authenticated;
grant select on public.reglages, public.yachts to anon, authenticated;
grant update on public.reglages, public.yachts to authenticated;
grant insert, delete on public.yachts to authenticated;
grant select on public.profils to authenticated;
grant update (nom, telephone, langue) on public.profils to authenticated;   -- jamais le rôle
grant select, insert, update, delete on public.reservations to authenticated;
grant insert on public.demandes to anon, authenticated;
grant select, update, delete on public.demandes to authenticated;
revoke all on sequence public.reservations_numero from anon, authenticated;

-- Réglages : lisibles par tous, modifiables par le directeur
create policy "réglages lisibles" on public.reglages for select to anon, authenticated using (true);
create policy "réglages : directeur" on public.reglages for update to authenticated
  using ((select private.est_directeur())) with check ((select private.est_directeur()));

-- Profils : chacun le sien, le directeur tous
create policy "profil : lecture" on public.profils for select to authenticated
  using (id = (select auth.uid()) or (select private.est_directeur()));
create policy "profil : modification du sien" on public.profils for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Yachts : les yachts publiés sont publics ; le directeur voit tout et modifie
create policy "yachts : lecture" on public.yachts for select to anon, authenticated
  using (publie or (select private.voit_direction()));
create policy "yachts : ajout" on public.yachts for insert to authenticated
  with check ((select private.est_directeur()));
create policy "yachts : modification" on public.yachts for update to authenticated
  using ((select private.est_directeur())) with check ((select private.est_directeur()));
create policy "yachts : suppression" on public.yachts for delete to authenticated
  using ((select private.est_directeur()));

-- Réservations : le client lit les siennes (il réserve et annule par les fonctions plus bas) ; le directeur fait tout
create policy "réservations : lecture" on public.reservations for select to authenticated
  using (client = (select auth.uid()) or (select private.est_directeur()));
create policy "réservations : ajout (directeur)" on public.reservations for insert to authenticated
  with check ((select private.est_directeur()));
create policy "réservations : modification (directeur)" on public.reservations for update to authenticated
  using ((select private.est_directeur())) with check ((select private.est_directeur()));
create policy "réservations : suppression (directeur)" on public.reservations for delete to authenticated
  using ((select private.est_directeur()));

-- Demandes : tout le monde peut en envoyer, seul le directeur les lit
create policy "demandes : envoi" on public.demandes for insert to anon, authenticated
  with check (not traitee);
create policy "demandes : lecture (directeur)" on public.demandes for select to authenticated
  using ((select private.est_directeur()));
create policy "demandes : modification (directeur)" on public.demandes for update to authenticated
  using ((select private.est_directeur())) with check ((select private.est_directeur()));
create policy "demandes : suppression (directeur)" on public.demandes for delete to authenticated
  using ((select private.est_directeur()));

-- ---------------------------------------------------------------------------------------------
-- Calculs et actions (appelés depuis le site)
-- ---------------------------------------------------------------------------------------------

-- Prix d'un séjour : chaque nuit au tarif de sa saison (tarif de la semaine ÷ 7), arrondi à la dizaine d'euros
create function public.prix_sejour(p_yacht text, p_debut date, p_fin date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  y public.yachts;
  r public.reglages;
  n_haute int;
  n_total int;
begin
  select * into y from public.yachts where slug = p_yacht and publie and location_basse is not null;
  if not found or p_fin <= p_debut then return null; end if;
  select * into r from public.reglages;
  n_total := p_fin - p_debut;
  n_haute := greatest(0, least(p_fin, r.haute_fin) - greatest(p_debut, r.haute_debut));
  return jsonb_build_object(
    'nuits', n_total,
    'nuits_haute', n_haute,
    'nuits_basse', n_total - n_haute,
    'minimum', case when n_haute > 0 then r.min_nuits_haute else r.min_nuits_basse end,
    'montant', (round((y.location_basse * (n_total - n_haute) + y.location_haute * n_haute) / 7.0 / 10) * 10)::int
  );
end $$;

-- Disponibilités publiques : les dates prises, sans aucune donnée personnelle
create function public.disponibilites(p_yacht text default null)
returns table (yacht text, debut date, fin date, etat text)
language sql stable security definer set search_path = '' as $$
  select r.yacht, r.debut, r.fin,
    case when r.type = 'blocage' then 'indisponible' when r.statut = 'confirmee' then 'reserve' else 'option' end
  from public.reservations r
  join public.yachts y on y.slug = r.yacht and y.publie
  where r.statut in ('en_attente', 'confirmee')
    and r.fin >= current_date
    and (p_yacht is null or r.yacht = p_yacht)
  order by r.yacht, r.debut
$$;

-- Réserver (client connecté) : tout est vérifié ici, le prix est calculé ici
create function public.reserver(
  p_yacht text, p_debut date, p_fin date, p_heure time, p_port text, p_invites int,
  p_message text default '', p_langue text default 'fr'
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  p public.profils;
  y public.yachts;
  r public.reglages;
  prix jsonb;
  res public.reservations;
begin
  if uid is null then raise exception 'connexion_requise'; end if;
  select * into p from public.profils where id = uid;
  if p.role = 'demo' then raise exception 'mode_demo'; end if;
  select * into y from public.yachts where slug = p_yacht and publie and location_basse is not null;
  if not found then raise exception 'yacht_non_louable'; end if;
  select * into r from public.reglages;
  if p_debut is null or p_fin is null or p_fin <= p_debut then raise exception 'dates_invalides'; end if;
  if p_debut < current_date + 2 then raise exception 'date_trop_proche'; end if;
  if p_debut < r.saison_debut or p_fin > r.saison_fin then raise exception 'hors_saison'; end if;
  prix := public.prix_sejour(p_yacht, p_debut, p_fin);
  if (prix ->> 'nuits')::int < (prix ->> 'minimum')::int then raise exception 'sejour_trop_court'; end if;
  if p_invites is null or p_invites < 1 or p_invites > y.invites then raise exception 'invites_invalides'; end if;
  if p_heure is null or p_heure < r.heure_min or p_heure > r.heure_max then raise exception 'heure_invalide'; end if;
  if p_port is not null and p_port <> y.port and not (p_port = any (r.ports)) then raise exception 'port_invalide'; end if;
  -- Garde-fou : deux demandes en attente au plus par client (évite qu'un visiteur bloque tout le calendrier)
  if (select count(*) from public.reservations where client = uid and statut = 'en_attente') >= 2 then
    raise exception 'trop_de_demandes';
  end if;

  insert into public.reservations (yacht, client, client_nom, client_email, client_telephone, langue,
    debut, fin, heure, port, invites, message, nuits, montant)
  values (p_yacht, uid, p.nom, p.email, p.telephone,
    case when p_langue in ('fr', 'en', 'de', 'it') then p_langue else 'fr' end,
    p_debut, p_fin, p_heure, coalesce(p_port, y.port), p_invites, left(coalesce(p_message, ''), 2000),
    (prix ->> 'nuits')::int, (prix ->> 'montant')::int)
  returning * into res;

  return jsonb_build_object('id', res.id, 'reference', res.reference, 'montant', res.montant, 'nuits', res.nuits);
exception
  when exclusion_violation then raise exception 'dates_indisponibles';
end $$;

-- Annuler sa demande (client), tant qu'elle est en attente
create function public.annuler_reservation(p_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  update public.reservations set statut = 'annulee', decide_le = now()
  where id = p_id and client = auth.uid() and statut = 'en_attente';
  if not found then raise exception 'annulation_impossible'; end if;
end $$;

-- Confirmer, refuser ou annuler une réservation (directeur)
create function public.decider_reservation(p_id uuid, p_decision text, p_note text default '') returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.est_directeur() then raise exception 'reserve_au_directeur'; end if;
  if p_decision not in ('confirmee', 'refusee', 'annulee') then raise exception 'decision_invalide'; end if;
  update public.reservations
     set statut = p_decision, note_directeur = left(coalesce(p_note, ''), 2000), decide_le = now()
   where id = p_id
     and ((p_decision in ('confirmee', 'refusee') and statut = 'en_attente')
       or (p_decision = 'annulee' and statut in ('en_attente', 'confirmee')));
  if not found then raise exception 'decision_impossible'; end if;
end $$;

revoke all on function public.prix_sejour, public.disponibilites, public.reserver,
  public.annuler_reservation, public.decider_reservation from public;
grant execute on function public.prix_sejour, public.disponibilites to anon, authenticated;
grant execute on function public.reserver, public.annuler_reservation, public.decider_reservation to authenticated;

-- Dates de modification des yachts
create function private.date_modification() returns trigger
language plpgsql set search_path = '' as $$
begin new.modifie_le := now(); return new; end $$;
create trigger yachts_modification before update on public.yachts
  for each row execute function private.date_modification();
