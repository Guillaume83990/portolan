-- Revue de sécurité : le compte de démonstration (identifiants publics) ne doit lire aucune donnée d'un vrai client.
-- 1. Notes internes et historique : lecture directe réservée au directeur (la démonstration passe par les fonctions dir_*, masquées).
-- 2. Historique en démonstration : notes libres masquées, et rien après « : » (motifs, objets d'e-mails avec le nom du client).
-- 3. Boîte d'envoi en démonstration : seulement les e-mails liés à un client fictif (les e-mails à la direction citent le client).

alter policy "notes : direction" on public.notes using ((select private.est_directeur()));
alter policy "journal : lecture" on public.journal using ((select private.est_directeur()));

-- Les notes écrites à la main par le directeur sont marquées « libres » (texte quelconque)
alter table public.journal add column libre boolean not null default false;
update public.journal set libre = true
where auteur not in ('Portolan', 'Client')
  and texte !~ '^(Validée par|Refusée|Annulée|Délai prolongé|Remboursement de|Acompte reçu|Solde reçu|Paiement reçu|APA reçue)';

create or replace function public.noter_reservation(p_id uuid, p_texte text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.est_directeur() then raise exception 'reserve_au_directeur'; end if;
  insert into public.journal (reservation, texte, auteur, libre) values (p_id, left(p_texte, 500), private.nom_directeur(), true);
end $$;

create or replace function public.dir_journal(p_reservation uuid)
returns table (cree_le timestamptz, texte text, auteur text)
language sql stable security definer set search_path = '' as $$
  select j.cree_le,
    case when private.est_directeur() then j.texte
         when j.libre then 'Note masquée en démonstration'
         else split_part(j.texte, ' : ', 1) end,
    j.auteur
  from public.journal j
  where private.voit_direction() and j.reservation = p_reservation order by j.cree_le
$$;

-- Une réservation dont le client est fictif (comptes d'exemple) : seule visible en démonstration dans la boîte d'envoi
create function private.reservation_fictive(p_reservation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select private.fictive(r.client_email) from public.reservations r where r.id = p_reservation), false)
$$;
revoke all on function private.reservation_fictive from public, anon;
grant execute on function private.reservation_fictive to authenticated;

alter policy "boîte d'envoi : direction" on public.emails using (
  (select private.est_directeur())
  or ((select private.voit_direction()) and private.fictive(destinataire)
      and (pour = 'client' or (reservation is not null and private.reservation_fictive(reservation))))
);
