-- Durcissement après l'audit de sécurité du 07/10/2026.
-- 1 · Formulaires du site (contact, dossier, visite, brochure, hors marché) : plus d'écriture anonyme dans la base.
--     Ils passent par le serveur de l'application (/api/demandes) : anti-robot Turnstile, contrôle des champs,
--     limite d'envois par adresse ; le serveur écrit avec la clé secrète.
-- 2 · Réglages : la table complète (IBAN, BIC, e-mails de notification) n'est plus lisible que par la direction.
--     Le site et les clients lisent public.reglages_publics() : saison, taux, contrat, courtier, raison sociale.
-- 3 · Comptes de démonstration partagés : leur profil ne se modifie pas (marque « demo » posée par le serveur
--     dans app_metadata, que seul le serveur peut écrire ; elle figure dans le jeton de session).

-- 1 · Formulaires
drop policy if exists "demandes : envoi" on public.demandes;
drop policy if exists "hors marché : inscription" on public.inscriptions;
revoke insert on public.demandes, public.inscriptions from anon, authenticated;

-- 2 · Réglages
drop policy if exists "réglages lisibles" on public.reglages;
create policy "réglages : lecture (direction)" on public.reglages for select to authenticated
  using ((select private.voit_direction()));
revoke select on public.reglages from anon;

create or replace function public.reglages_publics() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'annee', r.annee, 'saison_debut', r.saison_debut, 'saison_fin', r.saison_fin,
    'haute_debut', r.haute_debut, 'haute_fin', r.haute_fin,
    'min_nuits_haute', r.min_nuits_haute, 'min_nuits_basse', r.min_nuits_basse,
    'heure_min', r.heure_min, 'heure_max', r.heure_max, 'ports', r.ports,
    'taux_acompte', r.taux_acompte, 'taux_apa', r.taux_apa, 'taux_tva', r.taux_tva, 'tva_location', r.tva_location,
    'solde_jours', r.solde_jours, 'delai_reponse_h', r.delai_reponse_h, 'delai_paiement_h', r.delai_paiement_h,
    'paiement_carte', r.paiement_carte, 'paiement_virement', r.paiement_virement,
    'contrat_version', r.contrat_version, 'courtier', r.courtier,
    'societe', jsonb_build_object('raison_sociale', r.societe ->> 'raison_sociale')
  ) from public.reglages r limit 1
$$;
revoke execute on function public.reglages_publics() from public;
grant execute on function public.reglages_publics() to anon, authenticated;

-- 3 · Profil des comptes de démonstration : non modifiable
drop policy if exists "profil : modification du sien" on public.profils;
create policy "profil : modification du sien" on public.profils for update to authenticated
  using (id = (select auth.uid()) and role <> 'demo' and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'demo', '') <> 'true')
  with check (id = (select auth.uid()) and role <> 'demo' and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'demo', '') <> 'true');
