# Web uygulaması (derlenmiş) + Caddy. Derleme bağlamı: depo kökü (repiom/).
# İmaj ortamdan bağımsızdır: sunucu adresi ve yayımlanabilir anahtar açılışta ortam değişkenlerinden /ayar.js olarak
# üretilir (Caddyfile). Güvenlik başlıkları iki sürüm üretilir: üretim ve yerel deneme (BASLIK_EKI=-yerel).
FROM node:24-alpine AS derleme
WORKDIR /depo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter "@repiom/web..." \
 && pnpm --filter @repiom/web exec vite build \
 && node sunucu/yonlendirici/basliklar.mjs apps/web/public/_headers > /basliklar.caddy \
 && node sunucu/yonlendirici/basliklar.mjs apps/web/public/_headers --yerel > /basliklar-yerel.caddy

FROM caddy:2.10-alpine
COPY sunucu/yonlendirici/Caddyfile /etc/caddy/Caddyfile
COPY --from=derleme /basliklar.caddy /basliklar-yerel.caddy /etc/caddy/
COPY --from=derleme /depo/apps/web/dist /srv/web
COPY supabase/templates /srv/eposta
