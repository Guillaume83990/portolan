-- Compte client de démonstration : ses données fictives sont recréées chaque nuit par le serveur (clé secrète uniquement).
-- Trois réservations dans la saison, sur des créneaux libres : une demande en attente, une réservation à payer
-- (pour essayer la carte de test Stripe), une réservation confirmée avec son acompte (le serveur génère ses PDF).
-- Les étapes créées ici ne déclenchent ni e-mail ni notification (événements marqués comme traités).

create function public.semer_demo_client(p_client uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  p public.profils;
  g public.reglages;
  res public.reservations;
  e jsonb;
  prix jsonb;
  item jsonb;
  y record;
  d date;
  place boolean;
  refs text[] := '{}';
  dernier bigint;
  plan jsonb := '[{"statut": "confirmee", "mois": 6, "nuits": 7, "invites": 6},
                  {"statut": "a_payer", "mois": 9, "nuits": 4, "invites": 4},
                  {"statut": "en_attente", "mois": 5, "nuits": 3, "invites": 2}]';
begin
  select * into p from public.profils where id = p_client and role = 'client';
  if not found then raise exception 'client_demo_introuvable'; end if;
  select * into g from public.reglages limit 1;
  select coalesce(max(id), 0) into dernier from public.evenements;

  -- Tout ce qu'un visiteur a fait la veille disparaît (paiements, documents, historique : suppression en cascade)
  delete from public.reservations where client = p_client;

  for item in select * from jsonb_array_elements(plan) loop
    place := false;
    <<yachts>>
    for y in select slug, port from public.yachts where publie and not archive and location_basse is not null order by ordre loop
      for d in select gs::date from generate_series(make_date(g.annee, (item ->> 'mois')::int, 1), make_date(g.annee, (item ->> 'mois')::int, 28), interval '1 day') gs
               where extract(isodow from gs) = 6 loop
        prix := public.prix_sejour(y.slug, d, d + (item ->> 'nuits')::int);
        continue when prix is null or (prix ->> 'nuits')::int < (prix ->> 'minimum')::int;
        begin
          insert into public.reservations (yacht, client, client_nom, client_email, client_telephone, langue,
            debut, fin, heure, port, invites, message, nuits, montant, expire_le, contrat_version, accepte_le, accepte_ip)
          values (y.slug, p_client, trim(p.prenom || ' ' || p.nom), p.email, p.telephone, p.langue,
            d, d + (item ->> 'nuits')::int, '12:00', y.port, (item ->> 'invites')::int, 'Réservation de démonstration.',
            (prix ->> 'nuits')::int, (prix ->> 'montant')::int,
            now() + make_interval(hours => g.delai_reponse_h), g.contrat_version, now(), '203.0.113.10')
          returning * into res;
          place := true;
        exception when exclusion_violation then
          continue;
        end;
        exit yachts when place;
      end loop;
    end loop;
    continue when not place;

    if item ->> 'statut' <> 'en_attente' then
      e := public.echeancier(res.montant, res.debut);
      update public.reservations set
        statut = case when item ->> 'statut' = 'a_payer' then 'a_payer' else 'confirmee' end,
        valide_le = now(), decide_le = now(),
        expire_le = case when item ->> 'statut' = 'a_payer' then now() + make_interval(hours => g.delai_paiement_h) end,
        acompte = (e ->> 'acompte')::int, solde = (e ->> 'solde')::int, apa = (e ->> 'apa')::int,
        solde_du_le = (e ->> 'solde_du_le')::date,
        note_directeur = 'Avec plaisir : le chef vous prépare une table sur le pont soleil le premier soir.'
      where id = res.id returning * into res;
      if item ->> 'statut' = 'confirmee' then
        insert into public.paiements (reservation, type, montant, methode, statut, paye_le)
        values (res.id, 'acompte', res.acompte, 'carte', 'paye', now() - interval '2 days');
      end if;
    end if;
    perform private.noter(res.id, 'Données de démonstration (réinitialisées chaque nuit)');
    refs := refs || res.reference;
  end loop;

  -- Pas d'e-mail ni de notification pour ces données recréées
  update public.evenements set traite_le = now(), erreur = 'Données de démonstration'
  where id > dernier and traite_le is null
    and reservation in (select id from public.reservations where client = p_client);

  return to_jsonb(refs);
end $$;

revoke all on function public.semer_demo_client from public, anon, authenticated;
grant execute on function public.semer_demo_client to service_role;
