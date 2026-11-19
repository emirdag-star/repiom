# Sunucu fonksiyonları: Supabase Edge Runtime + bizim fonksiyonlarımız + yönlendirici. Derleme bağlamı: depo kökü.
# Test fonksiyonları (test-*: sahte iyzico / Claude / mağaza) üretim imajına HİÇ girmez.
FROM public.ecr.aws/supabase/edge-runtime:v1.79.1

COPY supabase/functions /home/deno/functions
RUN rm -rf /home/deno/functions/test-* /home/deno/functions/.env /home/deno/functions/.env.example
COPY sunucu/fonksiyonlar/main /home/deno/yonlendirici

CMD ["start", "--user-worker-request-idle-timeout", "150000", "--main-service", "/home/deno/yonlendirici"]
