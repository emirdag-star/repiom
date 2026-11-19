#!/usr/bin/env bash
# Veritabanını yedekten GERİ YÜKLER (sunucuda, sunucu/ klasöründe çalıştırılır).
#   ./geri-yukle.sh "2026-11-20 14:35:00+03"   → o dakikaya geri dön (PITR)
#   ./geri-yukle.sh son                        → arşivdeki en son ana kadar (ör. disk arızasından sonra)
# Ek seçenekler: --env-file <dosya> (varsayılan .env), --yerel (yerel deneme yığını), --onayli (soru sorma).
# DİKKAT: Hedef zamandan SONRA yapılan tüm değişiklikler (kayıtlar, ödemeler) geri alınır. Geri dönmeden önce
# şimdiki durumun yedeği alınır; yine de bu işlem iki kişiyle ve bakım duyurusuyla yapılmalıdır.
set -euo pipefail
cd "$(dirname "$0")"

HEDEF="${1:-}"
shift || true
ORTAM=.env
DOSYALAR=(-f compose.yaml)
ONAYLI=0
while [ $# -gt 0 ]; do
  case "$1" in
    --env-file) ORTAM="$2"; shift 2 ;;
    --yerel) DOSYALAR+=(-f compose.yerel.yaml); shift ;;
    --onayli) ONAYLI=1; shift ;;
    *) echo "Bilinmeyen seçenek: $1" >&2; exit 2 ;;
  esac
done
if [ -z "$HEDEF" ]; then
  echo 'Kullanım: ./geri-yukle.sh "YYYY-AA-GG SS:DD:ss+03" | son  [--env-file .env] [--yerel] [--onayli]' >&2
  exit 2
fi
D=(docker compose "${DOSYALAR[@]}" --env-file "$ORTAM")

if [ "$HEDEF" = "son" ]; then TUR=(--type=default); else TUR=(--type=time "--target=$HEDEF" --target-action=promote); fi

echo "Mevcut yedekler:"
"${D[@]}" exec -T yedekci yedek info || true
if [ "$ONAYLI" != 1 ]; then
  read -r -p "Veritabanı '$HEDEF' anına geri döndürülecek; sonraki değişiklikler kaybolacak. Onay için EVET yaz: " cevap
  [ "$cevap" = "EVET" ] || { echo "Vazgeçildi."; exit 1; }
fi

echo "1/5 Şimdiki durumun yedeği alınıyor (geri dönüşün de geri alınabilmesi için)…"
"${D[@]}" exec -T yedekci yedek --type=incr backup || echo "UYARI: anlık yedek alınamadı; devam ediliyor."

echo "2/5 Servisler durduruluyor…"
"${D[@]}" stop yonlendirici functions rest auth yedekci db

echo "3/5 Geri yükleniyor (yalnız değişen dosyalar, --delta)…"
"${D[@]}" run --rm --no-deps --user postgres --entrypoint yedek db --delta "${TUR[@]}" restore

echo "4/5 Veritabanı başlatılıyor (WAL kayıtları hedef ana kadar oynatılır)…"
"${D[@]}" up -d db
until "${D[@]}" exec -T db pg_isready -q; do sleep 2; done
until [ "$("${D[@]}" exec -T db psql -U postgres -tAc 'select pg_is_in_recovery()')" = "f" ]; do sleep 2; done

echo "5/5 Diğer servisler başlatılıyor ve yeni zaman çizgisinin tam yedeği alınıyor…"
"${D[@]}" up -d
"${D[@]}" exec -T yedekci yedek --type=full backup
echo "Geri yükleme tamam: $HEDEF"
