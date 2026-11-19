#!/bin/sh
# Veritabanı göçü (migration): supabase/migrations/*.sql dosyalarını sırayla, her biri TEK işlemde (transaction) uygular.
# Uygulananlar supabase_migrations.schema_migrations tablosuna yazılır (Supabase CLI ile aynı tablo); tekrar çalıştırmak
# güvenlidir. Auth (GoTrue) kendi şemasını kurduktan sonra çalışır (compose: auth sağlıklı olunca).
set -eu
export PGHOST=db PGUSER=postgres PGDATABASE=${POSTGRES_DB:-postgres} PGPASSWORD="$POSTGRES_PASSWORD"
until pg_isready -q; do sleep 2; done
psql -v ON_ERROR_STOP=1 -q <<SQL
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, name text, statements text[]);
SQL
for f in /goc/migrations/*.sql; do
  ad=$(basename "$f" .sql)
  surum=${ad%%_*}
  if [ "$(psql -tAc "select 1 from supabase_migrations.schema_migrations where version = '$surum'")" = "1" ]; then
    continue
  fi
  echo "Uygulanıyor: $ad"
  psql -v ON_ERROR_STOP=1 -q -1 -f "$f"
  psql -v ON_ERROR_STOP=1 -q -c "insert into supabase_migrations.schema_migrations (version, name) values ('$surum', '${ad#*_}')"
done
if [ "${ILK_VERI:-0}" = "1" ]; then
  psql -v ON_ERROR_STOP=1 -q -f /goc/ilk-veri.sql
fi
echo "Göç tamam."
