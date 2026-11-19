# Web uygulaması (derlenmiş) + Caddy. Derleme bağlamı: depo kökü (repiom/).
# Web'in sunucu adresi ve yayımlanabilir anahtarı derleme zamanında gömülür (Vite); bunlar gizli değildir.
FROM node:24-alpine AS derleme
WORKDIR /depo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter "@repiom/web..."
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SENTRY_DSN=
ARG VITE_ORTAM=uretim
# Yalnız yerel deneme (http://localhost): HTTPS'e zorlama ve HSTS başlıkları çıkarılır.
ARG YEREL=0
RUN VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN VITE_ORTAM=$VITE_ORTAM pnpm --filter @repiom/web exec vite build \
 && if [ "$YEREL" = 1 ]; then Y=--yerel; else Y=; fi \
 && node sunucu/yonlendirici/basliklar.mjs apps/web/public/_headers $Y > /basliklar.caddy

FROM caddy:2.10-alpine
COPY sunucu/yonlendirici/Caddyfile /etc/caddy/Caddyfile
COPY --from=derleme /basliklar.caddy /etc/caddy/basliklar.caddy
COPY --from=derleme /depo/apps/web/dist /srv/web
COPY supabase/templates /srv/eposta
