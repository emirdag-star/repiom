#!/bin/sh
# Yedekçi: veritabanıyla aynı veri klasörünü (salt okunur) ve soket klasörünü paylaşır.
#  - Açılışta yedek deposunu hazırlar (stanza-create, idempotent) ve arşivi denetler (check).
#  - Her gece YEDEK_SAATI'nde (İstanbul saati): pazar TAM, diğer günler FARK yedeği; ardından saklama kuralı uygulanır.
#  - Son durum /var/lib/pgbackrest/durum dosyasına yazılır (sağlık denetimi ve izleme için).
set -u
# Boş bırakılan pgBackRest değişkenleri silinir (ör. yerel klasör deposunda S3 ayarları boştur).
for v in $(env | sed -n 's/^\(PGBACKREST_[A-Z0-9_]*\)=$/\1/p'); do unset "$v"; done
S=${PGBACKREST_STANZA:-repiom}
SAAT=${YEDEK_SAATI:-03:30}
DURUM=/var/lib/pgbackrest/durum
yaz() { echo "$(date -Iseconds) $*" | tee "$DURUM"; }

if [ "${YEDEK_ACIK:-0}" != "1" ]; then
  yaz "KAPALI yedek (YEDEK_ACIK=1 değil)"
  exec sleep infinity
fi

until pg_isready -h /var/run/postgresql -q; do sleep 5; done
pgbackrest --stanza="$S" stanza-create || { yaz "HATA stanza-create"; }
pgbackrest --stanza="$S" check && yaz "TAMAM arşiv denetimi" || yaz "HATA arşiv denetimi"

# Hiç tam yedek yoksa hemen bir tane al.
if ! pgbackrest --stanza="$S" info --output=json | grep -q '"type":"full"'; then
  pgbackrest --stanza="$S" --type=full backup && yaz "TAMAM ilk tam yedek" || yaz "HATA ilk tam yedek"
fi

while :; do
  # Bir sonraki çalışma zamanına kadar bekle.
  simdi=$(date +%s)
  hedef=$(date -d "$(date +%Y-%m-%d) $SAAT" +%s 2>/dev/null || date -D '%Y-%m-%d %H:%M' -d "$(date +%Y-%m-%d) $SAAT" +%s)
  [ "$hedef" -le "$simdi" ] && hedef=$((hedef + 86400))
  sleep $((hedef - simdi))
  if [ "$(date +%u)" = "7" ]; then tur=full; else tur=diff; fi
  if pgbackrest --stanza="$S" --type=$tur backup; then
    pgbackrest --stanza="$S" expire
    yaz "TAMAM $tur yedek"
  else
    yaz "HATA $tur yedek"
  fi
done
