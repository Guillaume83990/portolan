-- Lots 5 et 6 : e-mails automatiques et documents PDF.
-- La base émet un événement à chaque étape (déclencheurs) ; le serveur de l'application les traite :
-- il génère les PDF (contrat, factures, reçu de l'APA), prépare l'e-mail dans la langue du client et le range
-- dans la boîte d'envoi (table emails), puis l'envoie réellement si un fournisseur est configuré.

alter table public.reglages
  add column taux_tva numeric(4, 1) not null default 20 check (taux_tva between 0 and 30);

-- ---------------------------------------------------------------------------------------------
-- File des événements
-- ---------------------------------------------------------------------------------------------
create table public.evenements (
  id bigint generated always as identity primary key,
  type text not null check (type in (
    'demande_recue', 'demande_validee', 'demande_refusee', 'option_expiree', 'annulation', 'remboursement',
    'acompte_recu', 'solde_recu', 'paiement_recu', 'relance_paiement', 'appel_solde', 'embarquement',
    'rappel_directeur', 'formulaire', 'inscription')),
  reservation uuid references public.reservations on delete cascade,
  demande uuid references public.demandes on delete cascade,
  inscription uuid references public.inscriptions on delete cascade,
  donnees jsonb not null default '{}',
  cree_le timestamptz not null default now(),
  pris_le timestamptz,
  traite_le timestamptz,
  essais int not null default 0,
  erreur text
);
create index evenements_a_traiter on public.evenements (id) where traite_le is null;
create index evenements_reservation on public.evenements (reservation);
-- Les rappels datés ne partent qu'une fois par réservation
create unique index evenements_une_fois on public.evenements (type, reservation)
  where type in ('relance_paiement', 'appel_solde', 'embarquement', 'rappel_directeur');

-- ---------------------------------------------------------------------------------------------
-- Boîte d'envoi : chaque e-mail préparé, tel qu'il est (ou serait) reçu
-- ---------------------------------------------------------------------------------------------
create table public.emails (
  id uuid primary key default gen_random_uuid(),
  evenement bigint references public.evenements on delete set null,
  reservation uuid references public.reservations on delete cascade,
  pour text not null check (pour in ('client', 'direction')),
  destinataire text not null,
  langue text not null default 'fr' check (langue in ('fr', 'en', 'de', 'it')),
  modele text not null,
  objet text not null,
  apercu text not null default '',
  html text not null,
  texte text not null default '',
  pieces uuid[] not null default '{}',
  statut text not null default 'prepare' check (statut in ('prepare', 'envoye', 'echec')),
  fournisseur_id text,
  erreur text,
  cree_le timestamptz not null default now()
);
create index emails_date on public.emails (cree_le desc);
create index emails_reservation on public.emails (reservation);

-- Adresses des comptes fictifs : seules visibles du compte de démonstration
create function private.fictive(p_email text) returns boolean
language sql immutable set search_path = '' as $$
  select lower(p_email) like '%@exemple.com' or lower(p_email) like '%@portolan.example'
$$;

alter table public.evenements enable row level security;
alter table public.emails enable row level security;
revoke all on public.evenements, public.emails from anon, authenticated;
grant select on public.emails to authenticated;
create policy "boîte d'envoi : direction" on public.emails for select to authenticated
  using ((select private.est_directeur()) or ((select private.voit_direction()) and private.fictive(destinataire)));

-- ---------------------------------------------------------------------------------------------
-- Documents : un seul par type et par réservation ; le numéro est réservé avant la génération du PDF
-- (si l'envoi du fichier échoue, on régénère le même numéro : la numérotation reste sans trou)
-- ---------------------------------------------------------------------------------------------
create unique index documents_un_par_type on public.documents (reservation, type);

create function public.document_reserver(p_reservation uuid, p_type text) returns public.documents
language plpgsql volatile security definer set search_path = '' as $$
declare
  d public.documents;
  r public.reservations;
begin
  select * into d from public.documents where reservation = p_reservation and type = p_type;
  if found then return d; end if;
  select * into r from public.reservations where id = p_reservation for update;
  if not found then raise exception 'reservation_introuvable'; end if;
  select * into d from public.documents where reservation = p_reservation and type = p_type;
  if found then return d; end if;
  insert into public.documents (reservation, client, type, numero, chemin)
  select p_reservation, r.client, p_type, n, coalesce(r.client::text, 'sans-compte') || '/' || r.reference || '/' || n || '.pdf'
  from private.prochain_numero(case p_type when 'contrat' then 'C' when 'recu_apa' then 'R' else 'F' end) n
  returning * into d;
  return d;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Déclencheurs : une étape de la réservation, un paiement, un formulaire, une inscription
-- ---------------------------------------------------------------------------------------------
create function private.evenement_reservation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t text;
begin
  if new.type <> 'location' then return new; end if;
  if tg_op = 'INSERT' then
    if new.statut = 'en_attente' then t := 'demande_recue'; end if;
  elsif new.statut is distinct from old.statut then
    t := case new.statut
      when 'a_payer' then 'demande_validee'
      when 'refusee' then 'demande_refusee'
      when 'expiree' then 'option_expiree'
      when 'annulee' then 'annulation'
      when 'confirmee' then 'acompte_recu'
      when 'soldee' then case when old.statut = 'a_payer' then 'acompte_recu' else 'solde_recu' end
    end;
  end if;
  if t is not null then
    insert into public.evenements (type, reservation, donnees)
    values (t, new.id, jsonb_build_object('avant', case when tg_op = 'UPDATE' then old.statut end));
  end if;
  return new;
end $$;
create trigger evenement_reservation after insert or update of statut on public.reservations
  for each row execute function private.evenement_reservation();

create function private.evenement_paiement() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.statut = 'paye' and (tg_op = 'INSERT' or old.statut is distinct from 'paye') then
    insert into public.evenements (type, reservation, donnees)
    values ('paiement_recu', new.reservation, jsonb_build_object('paiement', new.id, 'montant', new.montant, 'methode', new.methode, 'type', new.type));
  end if;
  if tg_op = 'UPDATE' and new.rembourse > old.rembourse then
    insert into public.evenements (type, reservation, donnees)
    values ('remboursement', new.reservation, jsonb_build_object('paiement', new.id, 'montant', new.rembourse - old.rembourse, 'methode', new.methode));
  end if;
  return new;
end $$;
create trigger evenement_paiement after insert or update of statut, rembourse on public.paiements
  for each row execute function private.evenement_paiement();

create function private.evenement_formulaire() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'demandes' then
    insert into public.evenements (type, demande) values ('formulaire', new.id);
  else
    insert into public.evenements (type, inscription) values ('inscription', new.id);
  end if;
  return new;
end $$;
create trigger evenement_demande after insert on public.demandes for each row execute function private.evenement_formulaire();
create trigger evenement_inscription after insert on public.inscriptions for each row execute function private.evenement_formulaire();

-- ---------------------------------------------------------------------------------------------
-- Rappels datés (appelés avec les expirations, toutes les 15 minutes)
-- ---------------------------------------------------------------------------------------------
create function private.planifier() returns int
language plpgsql volatile security definer set search_path = '' as $$
declare n int := 0; k int; g public.reglages;
begin
  select * into g from public.reglages limit 1;
  -- Relance de l'acompte, 24 h avant l'échéance de l'option
  insert into public.evenements (type, reservation)
  select 'relance_paiement', id from public.reservations
  where type = 'location' and statut = 'a_payer' and expire_le > now() and expire_le < now() + make_interval(hours => g.relance_h)
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;
  -- Appel du solde et de l'APA, quand le paiement du solde s'ouvre (un mois avant l'échéance)
  insert into public.evenements (type, reservation)
  select 'appel_solde', id from public.reservations
  where type = 'location' and statut = 'confirmee' and solde_du_le is not null
    and current_date >= solde_du_le - 30 and debut > current_date
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;
  -- Informations d'embarquement, trois jours avant
  insert into public.evenements (type, reservation)
  select 'embarquement', id from public.reservations
  where type = 'location' and statut in ('soldee', 'confirmee') and debut between current_date and current_date + 3
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;
  -- Demande sans réponse depuis 24 h : rappel à la direction
  insert into public.evenements (type, reservation)
  select 'rappel_directeur', id from public.reservations
  where type = 'location' and statut = 'en_attente' and cree_le < now() - interval '24 hours' and expire_le > now()
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;
  return n;
end $$;

select cron.unschedule('portolan-expirations');
select cron.schedule('portolan-expirations', '*/15 * * * *', $$select private.expirer(); select private.planifier()$$);

-- ---------------------------------------------------------------------------------------------
-- Côté serveur uniquement (clé secrète) : prendre des événements à traiter, réserver un document
-- ---------------------------------------------------------------------------------------------
create function public.evenements_a_traiter(p_limite int default 20) returns setof public.evenements
language sql volatile security definer set search_path = '' as $$
  update public.evenements e set pris_le = now(), essais = e.essais + 1
  where e.id in (
    select id from public.evenements
    where traite_le is null and essais < 5 and (pris_le is null or pris_le < now() - interval '5 minutes')
    order by id limit p_limite for update skip locked)
  returning e.*
$$;

revoke all on function public.document_reserver, public.evenements_a_traiter, private.planifier from public, anon, authenticated;
grant execute on function public.document_reserver, public.evenements_a_traiter to service_role;
revoke all on function private.evenement_reservation, private.evenement_paiement, private.evenement_formulaire from public, anon, authenticated;
grant execute on function private.fictive to authenticated;
