-- Portolan : MVP (04/10/2026). Cycle complet d'une réservation (validation, acompte, solde, APA),
-- paiements, documents, historique, notes internes, réglages de paiement et de société, hors marché.
-- Appliquée d'abord sur le projet de développement « portolan-mvp ».

-- ---------------------------------------------------------------------------------------------
-- Réglages : paiement, société, contrat, notifications, courtier référent
-- ---------------------------------------------------------------------------------------------
alter table public.reglages
  add column taux_acompte int not null default 50 check (taux_acompte between 1 and 100),
  add column taux_apa int not null default 30 check (taux_apa between 0 and 100),
  add column delai_reponse_h int not null default 48 check (delai_reponse_h between 1 and 720),
  add column delai_paiement_h int not null default 72 check (delai_paiement_h between 1 and 720),
  add column solde_jours int not null default 30 check (solde_jours between 0 and 180),
  add column relance_h int not null default 24 check (relance_h between 1 and 168),
  add column tva_location text not null default 'Selon les eaux naviguées',
  add column paiement_carte boolean not null default true,
  add column paiement_virement boolean not null default true,
  add column societe jsonb not null default '{}',
  add column contrat_version text not null default 'v1.0',
  add column contrat_conditions text not null default '',
  add column notif_email text not null default '',
  add column notif jsonb not null default '{"demande": true, "paiement": true, "non_traitee": true}',
  add column courtier jsonb not null default '{}';

create table public.versions_contrat (
  version text primary key,
  du date not null,
  conditions text not null default '',
  cree_le timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- Profils : prénom séparé, adresse de facturation, client Stripe ; e-mail tenu à jour
-- ---------------------------------------------------------------------------------------------
alter table public.profils
  add column prenom text not null default '' check (char_length(prenom) <= 80),
  add column societe text not null default '' check (char_length(societe) <= 120),
  add column adresse text not null default '' check (char_length(adresse) <= 200),
  add column code_postal text not null default '' check (char_length(code_postal) <= 20),
  add column ville text not null default '' check (char_length(ville) <= 80),
  add column pays text not null default '' check (char_length(pays) <= 80),
  add column tva text not null default '' check (char_length(tva) <= 40),
  add column stripe_customer text;
grant update (prenom, nom, telephone, langue, societe, adresse, code_postal, ville, pays, tva) on public.profils to authenticated;

-- Le rôle n'est plus jamais déduit de l'adresse : tout nouveau compte est client ; le rôle directeur se donne à la main.
create or replace function private.nouveau_compte() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profils (id, email, prenom, nom, telephone, langue)
  values (
    new.id, coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'prenom', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'nom', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'telephone', ''), 40),
    case when new.raw_user_meta_data ->> 'langue' in ('fr', 'en', 'de', 'it') then new.raw_user_meta_data ->> 'langue' else 'fr' end
  );
  return new;
end $$;

create function private.email_modifie() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profils set email = coalesce(new.email, '') where id = new.id;
  return new;
end $$;
create trigger email_modifie after update of email on auth.users
  for each row when (old.email is distinct from new.email) execute function private.email_modifie();

-- ---------------------------------------------------------------------------------------------
-- Yachts : archivage, mise en avant, textes traduits champ par champ
-- textes = { "en": { "<champ>": { "texte": "...", "source": "<français traduit>" } }, "de": …, "it": … }
-- Une traduction est « à revoir » quand le français actuel du champ diffère de sa « source ».
-- ---------------------------------------------------------------------------------------------
alter table public.yachts
  add column archive boolean not null default false,
  add column mis_en_avant boolean not null default false,
  add column textes jsonb not null default '{}';

-- ---------------------------------------------------------------------------------------------
-- Réservations : nouveaux statuts, échéancier, preuve d'acceptation, blocages motivés
-- ---------------------------------------------------------------------------------------------
alter table public.reservations drop constraint reservations_statut_check;
alter table public.reservations add constraint reservations_statut_check
  check (statut in ('en_attente', 'a_payer', 'confirmee', 'soldee', 'terminee', 'refusee', 'expiree', 'annulee'));
alter table public.reservations
  add column expire_le timestamptz,
  add column valide_le timestamptz,
  add column acompte int not null default 0,
  add column solde int not null default 0,
  add column apa int not null default 0,
  add column solde_du_le date,
  add column contrat_version text,
  add column accepte_le timestamptz,
  add column accepte_ip text,
  add column note_interne text not null default '' check (char_length(note_interne) <= 4000),
  add column motif text check (motif in ('entretien', 'proprietaire', 'autre')),
  add column rembourse int not null default 0;

-- Les dates restent bloquées tant que la réservation vit (demande, option à payer, confirmée, soldée)
alter table public.reservations add constraint reservations_sans_chevauchement_mvp
  exclude using gist (yacht with =, periode with &&)
  where (statut in ('en_attente', 'a_payer', 'confirmee', 'soldee'));
create index reservations_statut on public.reservations (statut);

-- ---------------------------------------------------------------------------------------------
-- Paiements (écrits par le serveur à la réception d'un webhook Stripe, ou par le directeur à la main)
-- ---------------------------------------------------------------------------------------------
create table public.paiements (
  id uuid primary key default gen_random_uuid(),
  reservation uuid not null references public.reservations on delete cascade,
  type text not null check (type in ('acompte', 'solde', 'apa', 'total')),
  montant int not null check (montant > 0),
  methode text check (methode in ('carte', 'virement', 'manuel')),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'paye', 'echoue', 'rembourse')),
  stripe_session text unique,
  stripe_payment_intent text,
  paye_le timestamptz,
  rembourse int not null default 0,
  justificatif text not null default '',
  cree_le timestamptz not null default now()
);
create index paiements_reservation on public.paiements (reservation);

-- ---------------------------------------------------------------------------------------------
-- Documents (contrat, factures, reçu de l'APA) : fichiers PDF dans le bucket privé « documents »,
-- rangés sous <client>/<référence>/<numéro>.pdf. Numérotation continue et sans trou par année.
-- ---------------------------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  reservation uuid not null references public.reservations on delete cascade,
  client uuid references public.profils (id) on delete set null,
  type text not null check (type in ('contrat', 'facture_acompte', 'facture_solde', 'recu_apa')),
  numero text not null unique,
  chemin text not null,
  taille int not null default 0,
  cree_le timestamptz not null default now()
);
create index documents_reservation on public.documents (reservation);
create index documents_client on public.documents (client);

create table private.compteurs (prefixe text, annee int, valeur int not null default 0, primary key (prefixe, annee));
create function private.prochain_numero(p_prefixe text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  a int := extract(year from now())::int;
  v int;
begin
  insert into private.compteurs (prefixe, annee, valeur) values (p_prefixe, a, 1)
  on conflict (prefixe, annee) do update set valeur = private.compteurs.valeur + 1
  returning valeur into v;
  return p_prefixe || '-' || a || '-' || lpad(v::text, 4, '0');
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
create policy "documents : lecture (le client, la direction)" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (
    (storage.foldername(name))[1] = (select auth.uid())::text or (select private.est_directeur())));

-- ---------------------------------------------------------------------------------------------
-- Historique d'une réservation, notes internes, demandes suivies, inscriptions « hors marché »
-- ---------------------------------------------------------------------------------------------
create table public.journal (
  id bigint generated always as identity primary key,
  reservation uuid not null references public.reservations on delete cascade,
  texte text not null,
  auteur text not null default 'Portolan',
  cree_le timestamptz not null default now()
);
create index journal_reservation on public.journal (reservation, cree_le);

create table public.notes (
  id bigint generated always as identity primary key,
  cible text not null check (cible in ('client', 'demande', 'reservation')),
  cible_id uuid not null,
  texte text not null check (char_length(texte) between 1 and 4000),
  auteur text not null default '',
  cree_le timestamptz not null default now()
);
create index notes_cible on public.notes (cible, cible_id);

alter table public.demandes
  add column statut text not null default 'nouvelle' check (statut in ('nouvelle', 'en_cours', 'gagnee', 'perdue')),
  add column brochure_envoyee_le timestamptz;

create table public.inscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  langue text not null default 'fr' check (langue in ('fr', 'en', 'de', 'it')),
  cree_le timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- Droits et règles de sécurité des nouvelles tables
-- ---------------------------------------------------------------------------------------------
alter table public.versions_contrat enable row level security;
alter table public.paiements enable row level security;
alter table public.documents enable row level security;
alter table public.journal enable row level security;
alter table public.notes enable row level security;
alter table public.inscriptions enable row level security;
alter table private.compteurs enable row level security;

revoke all on public.versions_contrat, public.paiements, public.documents, public.journal, public.notes, public.inscriptions from anon, authenticated;
grant select on public.versions_contrat to anon, authenticated;
grant insert, update, delete on public.versions_contrat to authenticated;
grant select on public.paiements, public.documents to authenticated;
grant select on public.journal to authenticated;
grant select, insert, delete on public.notes to authenticated;
grant insert on public.inscriptions to anon, authenticated;
grant select, delete on public.inscriptions to authenticated;
revoke all on private.compteurs from anon, authenticated;

create policy "contrat : lecture" on public.versions_contrat for select to anon, authenticated using (true);
create policy "contrat : directeur" on public.versions_contrat for all to authenticated
  using ((select private.est_directeur())) with check ((select private.est_directeur()));

create policy "paiements : lecture" on public.paiements for select to authenticated
  using ((select private.est_directeur()) or exists (
    select 1 from public.reservations r where r.id = reservation and r.client = (select auth.uid())));
create policy "documents : lecture" on public.documents for select to authenticated
  using (client = (select auth.uid()) or (select private.est_directeur()));
create policy "journal : lecture" on public.journal for select to authenticated
  using ((select private.voit_direction()));
create policy "notes : direction" on public.notes for select to authenticated
  using ((select private.voit_direction()));
create policy "notes : ajout" on public.notes for insert to authenticated
  with check ((select private.est_directeur()));
create policy "notes : suppression" on public.notes for delete to authenticated
  using ((select private.est_directeur()));
create policy "hors marché : inscription" on public.inscriptions for insert to anon, authenticated with check (true);
create policy "hors marché : lecture" on public.inscriptions for select to authenticated
  using ((select private.est_directeur()));
create policy "hors marché : désinscription" on public.inscriptions for delete to authenticated
  using ((select private.est_directeur()));

-- ---------------------------------------------------------------------------------------------
-- Journal : une ligne à chaque événement important (écrite par les fonctions)
-- ---------------------------------------------------------------------------------------------
create function private.noter(p_reservation uuid, p_texte text, p_auteur text default 'Portolan') returns void
language sql volatile security definer set search_path = '' as $$
  insert into public.journal (reservation, texte, auteur) values (p_reservation, p_texte, p_auteur)
$$;

create function private.nom_directeur() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(trim(prenom), ''), nullif(trim(nom), ''), 'la direction') from public.profils where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------------------------
-- Disponibilités publiques et réservation : statuts du MVP, échéance de réponse
-- ---------------------------------------------------------------------------------------------
create or replace function public.disponibilites(p_yacht text default null)
returns table (yacht text, debut date, fin date, etat text)
language sql stable security definer set search_path = '' as $$
  select r.yacht, r.debut, r.fin,
    case when r.type = 'blocage' then 'indisponible' when r.statut in ('confirmee', 'soldee') then 'reserve' else 'option' end
  from public.reservations r
  join public.yachts y on y.slug = r.yacht and y.publie and not y.archive
  where r.statut in ('en_attente', 'a_payer', 'confirmee', 'soldee')
    and r.fin >= current_date
    and (p_yacht is null or r.yacht = p_yacht)
  order by r.yacht, r.debut
$$;

create or replace function public.reserver(
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
  select * into y from public.yachts where slug = p_yacht and publie and not archive and location_basse is not null;
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
  if (select count(*) from public.reservations where client = uid and statut = 'en_attente') >= 2 then
    raise exception 'trop_de_demandes';
  end if;

  insert into public.reservations (yacht, client, client_nom, client_email, client_telephone, langue,
    debut, fin, heure, port, invites, message, nuits, montant, expire_le, contrat_version, accepte_le)
  values (p_yacht, uid, trim(p.prenom || ' ' || p.nom), p.email, p.telephone,
    case when p_langue in ('fr', 'en', 'de', 'it') then p_langue else 'fr' end,
    p_debut, p_fin, p_heure, coalesce(p_port, y.port), p_invites, left(coalesce(p_message, ''), 2000),
    (prix ->> 'nuits')::int, (prix ->> 'montant')::int,
    now() + make_interval(hours => r.delai_reponse_h), r.contrat_version, now())
  returning * into res;

  perform private.noter(res.id, 'Demande créée depuis la fiche ' || y.nom, 'Client');
  return jsonb_build_object('id', res.id, 'reference', res.reference, 'montant', res.montant, 'nuits', res.nuits);
exception
  when exclusion_violation then raise exception 'dates_indisponibles';
end $$;

-- ---------------------------------------------------------------------------------------------
-- Échéancier : acompte, solde, APA. Départ trop proche (moins de « solde_jours ») : tout d'un coup.
-- ---------------------------------------------------------------------------------------------
create function public.echeancier(p_montant int, p_debut date) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  r public.reglages;
  a int; s int; apa int; du date; tout boolean;
begin
  select * into r from public.reglages;
  du := p_debut - r.solde_jours;
  tout := du <= current_date;
  apa := (round(p_montant * r.taux_apa / 100.0))::int;
  if tout then a := p_montant; s := 0;
  else a := (round(p_montant * r.taux_acompte / 100.0))::int; s := p_montant - a; end if;
  return jsonb_build_object('acompte', a, 'solde', s, 'apa', apa, 'solde_du_le', du, 'tout_d_un_coup', tout,
    'taux_acompte', r.taux_acompte, 'taux_apa', r.taux_apa);
end $$;

-- ---------------------------------------------------------------------------------------------
-- Actions du directeur
-- ---------------------------------------------------------------------------------------------
create function public.valider_reservation(p_id uuid, p_mot text default '') returns jsonb
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
  perform private.noter(p_id, 'Validée par ' || private.nom_directeur() || ' · lien d''acompte envoyé', private.nom_directeur());
  return to_jsonb(res);
end $$;

create or replace function public.decider_reservation(p_id uuid, p_decision text, p_note text default '') returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.est_directeur() then raise exception 'reserve_au_directeur'; end if;
  if p_decision not in ('refusee', 'annulee') then raise exception 'decision_invalide'; end if;
  if p_decision = 'refusee' and coalesce(trim(p_note), '') = '' then raise exception 'motif_obligatoire'; end if;
  update public.reservations
     set statut = p_decision, note_directeur = left(coalesce(nullif(p_note, ''), note_directeur), 2000), decide_le = now()
   where id = p_id
     and ((p_decision = 'refusee' and statut = 'en_attente')
       or (p_decision = 'annulee' and statut in ('en_attente', 'a_payer', 'confirmee', 'soldee')));
  if not found then raise exception 'decision_impossible'; end if;
  perform private.noter(p_id, case p_decision when 'refusee' then 'Refusée : ' || p_note else 'Annulée' || coalesce(' : ' || nullif(p_note, ''), '') end,
    private.nom_directeur());
end $$;

create function public.prolonger_option(p_id uuid, p_heures int) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.est_directeur() then raise exception 'reserve_au_directeur'; end if;
  if p_heures not between 1 and 168 then raise exception 'duree_invalide'; end if;
  update public.reservations set expire_le = greatest(coalesce(expire_le, now()), now()) + make_interval(hours => p_heures)
  where id = p_id and statut in ('en_attente', 'a_payer');
  if not found then raise exception 'decision_impossible'; end if;
  perform private.noter(p_id, 'Délai prolongé de ' || p_heures || ' h', private.nom_directeur());
end $$;

-- Paiement reçu (webhook Stripe côté serveur, ou saisie manuelle du directeur) : fait avancer la réservation
create function private.paiement_recu(p_reservation uuid, p_type text, p_montant int, p_methode text,
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
    || ' reçu (' || p_methode || ') · ' || to_char(p_montant, 'FM999G999G999') || ' €');
  return res;
end $$;

create function public.marquer_paiement(p_id uuid, p_type text, p_montant int, p_methode text, p_le date, p_justificatif text default '')
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare res public.reservations;
begin
  if not private.est_directeur() then raise exception 'reserve_au_directeur'; end if;
  if p_type not in ('acompte', 'solde', 'apa', 'total') or p_methode not in ('carte', 'virement', 'manuel') then raise exception 'paiement_invalide'; end if;
  res := private.paiement_recu(p_id, p_type, p_montant, p_methode, null, null, coalesce(p_le::timestamptz, now()), p_justificatif);
  return to_jsonb(res);
end $$;

-- Expirations (appelée toutes les 15 minutes par pg_cron)
create function private.expirer() returns int
language plpgsql volatile security definer set search_path = '' as $$
declare n int := 0; x record;
begin
  for x in update public.reservations set statut = 'expiree', decide_le = now()
    where type = 'location' and statut in ('en_attente', 'a_payer') and expire_le is not null and expire_le < now()
    returning id, statut loop
    perform private.noter(x.id, 'Expirée : délai dépassé, dates libérées');
    n := n + 1;
  end loop;
  update public.reservations set statut = 'terminee' where type = 'location' and statut = 'soldee' and fin < current_date;
  return n;
end $$;

-- Le client annule sa demande (en attente ou à payer)
create or replace function public.annuler_reservation(p_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  update public.reservations set statut = 'annulee', decide_le = now()
  where id = p_id and client = auth.uid() and statut in ('en_attente', 'a_payer');
  if not found then raise exception 'annulation_impossible'; end if;
  perform private.noter(p_id, 'Annulée par le client', 'Client');
end $$;

-- ---------------------------------------------------------------------------------------------
-- Lectures de l'espace directeur (masquées pour le compte de démonstration)
-- ---------------------------------------------------------------------------------------------
create function public.dir_reservations()
returns table (
  id uuid, reference text, yacht text, yacht_nom text, type text, client uuid, client_nom text, client_email text,
  client_telephone text, langue text, debut date, fin date, heure time, port text, invites int, nuits int,
  montant int, acompte int, solde int, apa int, solde_du_le date, statut text, expire_le timestamptz,
  message text, note_directeur text, note_interne text, motif text, regle bigint, rembourse int,
  cree_le timestamptz, decide_le timestamptz
)
language sql stable security definer set search_path = '' as $$
  select r.id, r.reference, r.yacht, y.nom, r.type, r.client,
    case when private.lisible(r.client_email) then r.client_nom else private.masquer(r.client_nom) end,
    case when private.lisible(r.client_email) then r.client_email else 'masqué en démonstration' end,
    case when private.lisible(r.client_email) then r.client_telephone else '' end,
    r.langue, r.debut, r.fin, r.heure, r.port, r.invites, r.nuits, r.montant, r.acompte, r.solde, r.apa, r.solde_du_le,
    r.statut, r.expire_le,
    case when private.lisible(r.client_email) then r.message else '' end,
    r.note_directeur,
    case when private.est_directeur() then r.note_interne else '' end,
    r.motif,
    coalesce((select sum(p.montant - p.rembourse) from public.paiements p where p.reservation = r.id and p.statut = 'paye'), 0),
    r.rembourse, r.cree_le, r.decide_le
  from public.reservations r
  join public.yachts y on y.slug = r.yacht
  where private.voit_direction()
  order by r.debut, r.yacht
$$;

create function public.dir_journal(p_reservation uuid)
returns table (cree_le timestamptz, texte text, auteur text)
language sql stable security definer set search_path = '' as $$
  select j.cree_le, j.texte, j.auteur from public.journal j
  where private.voit_direction() and j.reservation = p_reservation order by j.cree_le
$$;

create function public.dir_demandes()
returns table (
  id uuid, type text, yacht text, yacht_nom text, nom text, email text, telephone text, message text,
  details jsonb, langue text, page text, statut text, brochure_envoyee_le timestamptz, cree_le timestamptz
)
language sql stable security definer set search_path = '' as $$
  select d.id, d.type, d.yacht, y.nom,
    case when private.lisible(d.email) then d.nom else private.masquer(d.nom) end,
    case when private.lisible(d.email) then d.email else 'masqué en démonstration' end,
    case when private.lisible(d.email) then d.telephone else '' end,
    case when private.lisible(d.email) then d.message else '' end,
    case when private.lisible(d.email) then d.details else '{}'::jsonb end,
    d.langue, d.page, d.statut, d.brochure_envoyee_le, d.cree_le
  from public.demandes d
  left join public.yachts y on y.slug = d.yacht
  where private.voit_direction()
  order by d.cree_le desc
$$;

create function public.dir_clients()
returns table (
  id uuid, prenom text, nom text, email text, telephone text, langue text, cree_le timestamptz,
  societe text, adresse text, code_postal text, ville text, pays text,
  reservations bigint, regle bigint, derniere date
)
language sql stable security definer set search_path = '' as $$
  select p.id,
    case when private.lisible(p.email) then p.prenom else private.masquer(p.prenom) end,
    case when private.lisible(p.email) then p.nom else private.masquer(p.nom) end,
    case when private.lisible(p.email) then p.email else 'masqué en démonstration' end,
    case when private.lisible(p.email) then p.telephone else '' end,
    p.langue, p.cree_le,
    case when private.lisible(p.email) then p.societe else '' end,
    case when private.lisible(p.email) then p.adresse else '' end,
    case when private.lisible(p.email) then p.code_postal else '' end,
    case when private.lisible(p.email) then p.ville else '' end,
    p.pays,
    (select count(*) from public.reservations r where r.client = p.id and r.type = 'location'),
    coalesce((select sum(pa.montant - pa.rembourse) from public.paiements pa join public.reservations r on r.id = pa.reservation
      where r.client = p.id and pa.statut = 'paye'), 0),
    (select max(r.debut) from public.reservations r where r.client = p.id and r.statut in ('terminee', 'soldee', 'confirmee') and r.debut <= current_date)
  from public.profils p
  where private.voit_direction() and p.role = 'client'
  order by 14 desc, p.cree_le desc
$$;

create function public.dir_paiements()
returns table (id uuid, reservation uuid, reference text, client uuid, type text, montant int, methode text, statut text, paye_le timestamptz, rembourse int)
language sql stable security definer set search_path = '' as $$
  select pa.id, pa.reservation, r.reference, r.client, pa.type, pa.montant, pa.methode, pa.statut, pa.paye_le, pa.rembourse
  from public.paiements pa join public.reservations r on r.id = pa.reservation
  where private.voit_direction()
  order by pa.paye_le desc nulls last
$$;

create function public.dir_documents()
returns table (id uuid, reservation uuid, reference text, client uuid, type text, numero text, cree_le timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.id, d.reservation, r.reference, d.client, d.type, d.numero, d.cree_le
  from public.documents d join public.reservations r on r.id = d.reservation
  where private.voit_direction() order by d.cree_le desc
$$;

create function public.dir_notes(p_cible text, p_id uuid)
returns table (id bigint, texte text, auteur text, cree_le timestamptz)
language sql stable security definer set search_path = '' as $$
  select n.id, case when private.est_directeur() then n.texte else 'Note masquée en démonstration' end, n.auteur, n.cree_le
  from public.notes n where private.voit_direction() and n.cible = p_cible and n.cible_id = p_id order by n.cree_le
$$;

create function public.dir_inscriptions()
returns table (id uuid, email text, langue text, cree_le timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.id, case when private.lisible(i.email) then i.email else 'masqué en démonstration' end, i.langue, i.cree_le
  from public.inscriptions i where private.voit_direction() order by i.cree_le desc
$$;

-- Les chiffres du tableau de bord
create function public.dir_tableau() returns jsonb
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
    'saison_debut', r.saison_debut,
    'encaisse', coalesce((select sum(montant - rembourse) from public.paiements where statut = 'paye'), 0),
    'a_encaisser', coalesce((
      select sum(greatest(0, x.montant + x.apa - coalesce(pp.regle, 0)))
      from public.reservations x
      left join lateral (select sum(p.montant - p.rembourse) as regle from public.paiements p
        where p.reservation = x.id and p.statut = 'paye') pp on true
      where x.type = 'location' and x.statut in ('a_payer', 'confirmee', 'soldee')), 0),
    'a_traiter', (select count(*) from public.reservations where type = 'location' and statut = 'en_attente'),
    'a_traiter_24h', (select count(*) from public.reservations where type = 'location' and statut = 'en_attente' and cree_le < now() - interval '24 hours'),
    'a_payer', (select count(*) from public.reservations where type = 'location' and statut = 'a_payer'),
    'demandes_nouvelles', (select count(*) from public.demandes where statut = 'nouvelle'),
    'nouveaux_clients', (select count(*) from public.profils where role = 'client' and cree_le >= date_trunc('month', now())),
    'occupation_totale', coalesce((
      select round(100.0 * sum(least(x.fin, r.saison_fin) - greatest(x.debut, r.saison_debut))
        / nullif(nuits_saison * (select count(*) from public.yachts where location_basse is not null and not archive), 0))
      from public.reservations x where x.type = 'location' and x.statut in ('confirmee', 'soldee', 'terminee')
        and x.fin > r.saison_debut and x.debut < r.saison_fin), 0),
    'occupation', coalesce((
      select jsonb_agg(jsonb_build_object('slug', y.slug, 'nom', y.nom, 'nuits', o.nuits, 'total', nuits_saison) order by y.ordre)
      from public.yachts y
      cross join lateral (
        select coalesce(sum(greatest(0, least(x.fin, r.saison_fin) - greatest(x.debut, r.saison_debut))), 0)::int as nuits
        from public.reservations x
        where x.yacht = y.slug and x.type = 'location' and x.statut in ('confirmee', 'soldee', 'terminee')
      ) o
      where y.location_basse is not null and not y.archive
    ), '[]'),
    'par_mois', coalesce((
      select jsonb_agg(jsonb_build_object('mois', m.mois, 'confirme', m.confirme, 'attente', m.attente) order by m.mois)
      from (
        select to_char(debut, 'YYYY-MM') as mois,
          coalesce(sum(montant) filter (where statut in ('confirmee', 'soldee', 'terminee')), 0)::bigint as confirme,
          coalesce(sum(montant) filter (where statut in ('en_attente', 'a_payer')), 0)::bigint as attente
        from public.reservations where type = 'location' and debut >= r.saison_debut and debut < r.saison_fin
          and statut in ('en_attente', 'a_payer', 'confirmee', 'soldee', 'terminee')
        group by 1
      ) m
    ), '[]')
  ) into res;
  return res;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Espace client : ce qui est nécessaire avant de supprimer un compte
-- ---------------------------------------------------------------------------------------------
create function public.croisiere_a_venir() returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(x) from (
    select r.reference, y.nom as yacht, r.debut, r.fin from public.reservations r join public.yachts y on y.slug = r.yacht
    where r.client = auth.uid() and r.statut in ('a_payer', 'confirmee', 'soldee') and r.fin >= current_date
    order by r.debut limit 1
  ) x
$$;

-- ---------------------------------------------------------------------------------------------
-- Droits d'exécution
-- ---------------------------------------------------------------------------------------------
revoke all on function public.echeancier, public.valider_reservation, public.prolonger_option, public.marquer_paiement,
  public.dir_reservations, public.dir_journal, public.dir_demandes, public.dir_clients, public.dir_paiements,
  public.dir_documents, public.dir_notes, public.dir_inscriptions, public.dir_tableau, public.croisiere_a_venir from public, anon;
grant execute on function public.echeancier to anon, authenticated;
grant execute on function public.valider_reservation, public.prolonger_option, public.marquer_paiement,
  public.dir_reservations, public.dir_journal, public.dir_demandes, public.dir_clients, public.dir_paiements,
  public.dir_documents, public.dir_notes, public.dir_inscriptions, public.dir_tableau, public.croisiere_a_venir to authenticated;
revoke all on function private.prochain_numero, private.paiement_recu, private.expirer, private.noter,
  private.nom_directeur, private.email_modifie from public, anon, authenticated;
grant execute on function private.nom_directeur to authenticated;
