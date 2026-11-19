#!/bin/sh
# Veritabanı açılışı: WAL arşivi ayarını ortam değişkenine göre yazar, sonra Supabase'in kendi giriş betiğine devreder.
# YEDEK_ACIK=1 → her WAL dosyası pgBackRest ile (şifreli) yedek deposuna gönderilir; en geç ARSIV_SURESI saniyede bir.
set -eu
AYAR=/etc/postgresql-custom/conf.d/repiom-arsiv.conf
# Boş bırakılan pgBackRest değişkenleri silinir (ör. yerel klasör deposunda S3 ayarları boştur).
for v in $(env | sed -n 's/^\(PGBACKREST_[A-Z0-9_]*\)=$/\1/p'); do unset "$v"; done
if [ "${YEDEK_ACIK:-0}" = "1" ]; then
  cat > "$AYAR" <<AYARLAR
archive_mode = on
archive_command = 'pgbackrest --stanza=${PGBACKREST_STANZA:-repiom} archive-push %p'
archive_timeout = ${ARSIV_SURESI:-60}
wal_level = replica
max_wal_senders = 3
AYARLAR
else
  echo "UYARI: YEDEK_ACIK=1 değil; sürekli yedek (WAL arşivi) KAPALI." >&2
  printf "archive_mode = off\n" > "$AYAR"
fi
exec docker-entrypoint.sh "$@"
