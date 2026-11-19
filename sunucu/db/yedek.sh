#!/bin/sh
# Yönetim için pgBackRest kısayolu (boş ayarları temizler, depo adını ekler). Örnekler:
#   docker compose exec yedekci yedek info            → yedek listesi ve arşiv aralığı
#   docker compose exec yedekci yedek check           → arşiv çalışıyor mu
#   docker compose exec yedekci yedek --type=full backup
for v in $(env | sed -n 's/^\(PGBACKREST_[A-Z0-9_]*\)=$/\1/p'); do unset "$v"; done
exec pgbackrest --stanza="${PGBACKREST_STANZA:-repiom}" "$@"
