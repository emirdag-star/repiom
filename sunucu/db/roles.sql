-- Kaynak: supabase/supabase docker/volumes/db/roles.sql (Apache-2.0). Rol parolaları POSTGRES_PASSWORD ile.
-- supabase_functions_admin satırı çıkarıldı: o rolü resmi kurulumda webhooks.sql oluşturur, biz kullanmıyoruz.
-- NOTE: change to your own passwords for production environments
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
