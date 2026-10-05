-- Expiration automatique des demandes sans réponse et des options non payées, toutes les 15 minutes
create extension if not exists pg_cron;
select cron.schedule('portolan-expirations', '*/15 * * * *', $$select private.expirer()$$);
