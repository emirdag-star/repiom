/**
 * Hata kaydı (Sentry, AB bölgesi) için KİŞİSEL VERİ SÜZGECİ — web, mobil ve sunucu aynı kuralı kullanır.
 * Gönderilmez: kullanıcı bilgisi (e-posta, kimlik, IP), istek gövdesi/çerez/başlıklar, adreslerdeki sorgu dizgileri,
 * ekmek kırıntılarındaki (breadcrumb) veri, serbest metindeki e-posta / UUID / uzun sayılar (TCKN, vergi no, kart).
 * Proje adı ve çizim içeriği hata kaydına zaten konmaz; mesajlarda geçse bile yukarıdaki kalıplar maskelenir.
 */

type Nesne = Record<string, unknown>;

const KALIPLAR: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-posta]'],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[kimlik]'],
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[belirteç]'],
  [/\b\d{10,19}\b/g, '[sayı]'],
];

/** Serbest metindeki kişisel veri kalıplarını maskeler. */
export function metniAyikla(s: string): string {
  return KALIPLAR.reduce((m, [r, y]) => m.replace(r, y), s);
}

/** Adresten sorgu dizgisini ve parça kısmını atar; yoldaki kimlikleri maskeler. */
export function adresiAyikla(u: string): string {
  return metniAyikla(u.replace(/[?#].*$/, ''));
}

/** Sentry olayını (event) kişisel veriden arındırır. Olay tipi bilerek gevşek: üç SDK'da da aynı biçimdedir. */
export function olayiAyikla<T>(olay: T): T {
  const e = olay as Nesne;
  delete e.user;
  delete e.extra;
  delete e.server_name;
  const istek = e.request as Nesne | undefined;
  if (istek)
    e.request = {
      url: typeof istek.url === 'string' ? adresiAyikla(istek.url) : undefined,
      method: istek.method,
    };
  if (typeof e.message === 'string') e.message = metniAyikla(e.message);
  if (typeof e.transaction === 'string') e.transaction = adresiAyikla(e.transaction);
  const ist = (e.exception as { values?: Nesne[] } | undefined)?.values;
  ist?.forEach((x) => {
    if (typeof x.value === 'string') x.value = metniAyikla(x.value);
  });
  const kirintilar = e.breadcrumbs as Nesne[] | { values?: Nesne[] } | undefined;
  const liste = Array.isArray(kirintilar) ? kirintilar : kirintilar?.values;
  liste?.forEach((k) => kiritiyiAyikla(k));
  const bag = e.contexts as Nesne | undefined;
  if (bag)
    for (const ad of Object.keys(bag))
      if (!['os', 'device', 'app', 'browser', 'runtime', 'trace'].includes(ad)) delete bag[ad];
  return olay;
}

/** Ekmek kırıntısı: yalnız tür, kategori ve ayıklanmış mesaj/adres kalır. */
export function kiritiyiAyikla<T>(k: T): T {
  const b = k as Nesne;
  const veri = b.data as Nesne | undefined;
  b.data =
    veri && typeof veri.url === 'string'
      ? { url: adresiAyikla(veri.url), status_code: veri.status_code, method: veri.method }
      : undefined;
  if (typeof b.message === 'string') b.message = metniAyikla(b.message).slice(0, 300);
  return k;
}
