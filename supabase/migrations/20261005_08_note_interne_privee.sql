-- La note interne de la direction ne doit jamais être lisible par le client (qui lit ses propres réservations).
-- Lecture colonne par colonne : tout sauf note_interne. La direction la lit par dir_reservations().
revoke select on public.reservations from authenticated;
grant select (id, reference, yacht, type, client, client_nom, client_email, client_telephone, langue, debut, fin, periode, heure, port,
  invites, message, nuits, montant, statut, note_directeur, cree_le, decide_le, expire_le, valide_le, acompte, solde, apa, solde_du_le,
  contrat_version, accepte_le, accepte_ip, motif, rembourse) on public.reservations to authenticated;
