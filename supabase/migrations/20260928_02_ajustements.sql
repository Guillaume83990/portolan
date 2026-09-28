-- Portolan : ajustements appliqués après les fondations (28/09/2026)

-- Les actions réservées aux comptes connectés ne sont pas appelables sans connexion
revoke execute on function public.reserver, public.annuler_reservation, public.decider_reservation from anon;

-- Chaque partie du prix (nuits de basse saison, nuits de haute saison) est arrondie à la dizaine d'euros,
-- pour que le détail affiché au client tombe juste avec le total. Le calcul ne lit que des données publiques.
create or replace function public.prix_sejour(p_yacht text, p_debut date, p_fin date) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  y public.yachts;
  r public.reglages;
  n_haute int;
  n_total int;
  m_basse int;
  m_haute int;
begin
  select * into y from public.yachts where slug = p_yacht and publie and location_basse is not null;
  if not found or p_fin <= p_debut then return null; end if;
  select * into r from public.reglages;
  n_total := p_fin - p_debut;
  n_haute := greatest(0, least(p_fin, r.haute_fin) - greatest(p_debut, r.haute_debut));
  m_basse := (round(y.location_basse * (n_total - n_haute) / 7.0 / 10) * 10)::int;
  m_haute := (round(y.location_haute * n_haute / 7.0 / 10) * 10)::int;
  return jsonb_build_object(
    'nuits', n_total,
    'nuits_haute', n_haute,
    'nuits_basse', n_total - n_haute,
    'minimum', case when n_haute > 0 then r.min_nuits_haute else r.min_nuits_basse end,
    'montant_basse', m_basse,
    'montant_haute', m_haute,
    'montant', m_basse + m_haute
  );
end $$;

-- Index pour retrouver vite les demandes d'un yacht (espace directeur)
create index demandes_yacht on public.demandes (yacht);

-- Étapes des visites rangées en liste (ordre garanti) : voir tools/supabase/seed-depuis-flotte.cjs
