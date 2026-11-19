// Sunucu fonksiyonları için hata kaydı (Sentry, AB bölgesi). SENTRY_DSN yoksa hiçbir şey yapmaz (yerel ve testler).
// Kişisel veri gönderilmez: istek, kullanıcı ve ek veri silinir; mesajlardaki e-posta / kimlik / uzun sayılar maskelenir
// (packages/istemci/src/hataKaydi.ts ile aynı kurallar; fonksiyonlar o pakete erişemediği için burada kısaca tekrarlanır).
const DSN = Deno.env.get('SENTRY_DSN') ?? '';

const maskele = (s: string) =>
  s
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-posta]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[kimlik]')
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[belirteç]')
    .replace(/\b\d{10,19}\b/g, '[sayı]');

type Sentry = typeof import('npm:@sentry/deno@11.15.0');
let sentry: Promise<Sentry> | null = null;

function yukle(): Promise<Sentry> {
  sentry ??= import('npm:@sentry/deno@11.15.0').then((S) => {
    S.init({
      dsn: DSN,
      environment: Deno.env.get('ORTAM') ?? 'uretim',
      defaultIntegrations: false,
      tracesSampleRate: 0,
      beforeSend(olay) {
        delete olay.user;
        delete olay.request;
        delete olay.extra;
        delete olay.server_name;
        if (olay.message) olay.message = maskele(olay.message);
        olay.exception?.values?.forEach((v) => {
          if (v.value) v.value = maskele(v.value);
        });
        olay.breadcrumbs = [];
        return olay;
      },
    });
    return S;
  });
  return sentry;
}

/** Beklenmeyen bir sunucu hatasını kaydeder (yanıtı geciktirmemek için en çok 2 sn beklenir). */
export async function hataBildir(e: unknown, fonksiyon: string): Promise<void> {
  if (!DSN) return;
  try {
    const S = await yukle();
    S.withScope((k) => {
      k.setTag('fonksiyon', fonksiyon);
      S.captureException(e);
    });
    await S.flush(2000);
  } catch {
    /* hata kaydı asıl işi bozmaz */
  }
}
