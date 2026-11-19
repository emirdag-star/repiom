// SAHTE App Store / Google Play API — YALNIZ TEST VE YEREL GELİŞTİRME İÇİN. SAHTE_MAGAZA=1 değilse kapalı; üretime
// yayınlanmaz. Gerçek API'lerin yanıt biçimini taklit eder. "verify_jwt = false" (supabase/config.toml).
//   POST /sahte/satin-al { platform, urun }        → { islem } (iOS transactionId) ya da { jeton } (Android purchaseToken)
//   POST /sahte/iade     { platform, islem|jeton } → işlemi iade edilmiş yapar
//   GET  /inApps/v1/transactions/{id}              → { signedTransactionInfo }
//   POST /token                                    → Google OAuth erişim belirteci
//   GET  /androidpublisher/v3/applications/{p}/purchases/products/{urun}/tokens/{jeton}
//   GET  /androidpublisher/v3/applications/{p}/purchases/voidedpurchases
const ACIK = Deno.env.get('SAHTE_MAGAZA') === '1';
const BUNDLE = Deno.env.get('APPLE_BUNDLE_ID') ?? '';

interface Kayit {
  platform: 'ios' | 'android';
  urun: string;
  iade?: number;
}
const kayitlar = new Map<string, Kayit>();
let sayac = 1000;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
const b64url = (s: string) =>
  btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const sahteJws = (o: unknown) =>
  `${b64url(JSON.stringify({ alg: 'ES256', x5c: ['SAHTE'] }))}.${b64url(JSON.stringify(o))}.SAHTE`;

Deno.serve(async (req) => {
  if (!ACIK) return new Response('Kapalı', { status: 404 });
  const yol = new URL(req.url).pathname.replace(/^.*\/test-magaza/, '');
  const yetkili = /^Bearer .+/.test(req.headers.get('authorization') ?? '');

  if (req.method === 'POST' && yol === '/sahte/satin-al') {
    const g = (await req.json()) as { platform: 'ios' | 'android'; urun: string };
    const id =
      g.platform === 'ios' ? String(++sayac) + String(Date.now()) : `sahte-jeton-${crypto.randomUUID()}`;
    kayitlar.set(id, { platform: g.platform, urun: g.urun });
    return json(g.platform === 'ios' ? { islem: id } : { jeton: id });
  }
  if (req.method === 'POST' && yol === '/sahte/iade') {
    const g = (await req.json()) as { islem?: string; jeton?: string };
    const k = kayitlar.get(g.islem ?? g.jeton ?? '');
    if (!k) return json({ hata: 'yok' }, 404);
    k.iade = Date.now();
    return json({ tamam: true });
  }
  if (req.method === 'POST' && yol === '/token')
    return json({ access_token: 'sahte-google', expires_in: 3600, token_type: 'Bearer' });
  if (!yetkili) return json({ errorCode: 4010000, errorMessage: 'yetkisiz' }, 401);

  let m = /^\/inApps\/v1\/transactions\/(\d+)$/.exec(yol);
  if (req.method === 'GET' && m) {
    const k = kayitlar.get(m[1]!);
    if (!k || k.platform !== 'ios')
      return json({ errorCode: 4040010, errorMessage: 'Transaction id not found.' }, 404);
    return json({
      signedTransactionInfo: sahteJws({
        transactionId: m[1],
        originalTransactionId: m[1],
        productId: k.urun,
        bundleId: BUNDLE,
        type: 'Consumable',
        environment: 'Sandbox',
        ...(k.iade ? { revocationDate: k.iade, revocationReason: 0 } : {}),
      }),
    });
  }
  m = /^\/androidpublisher\/v3\/applications\/[^/]+\/purchases\/products\/([^/]+)\/tokens\/([^/]+)$/.exec(
    yol,
  );
  if (req.method === 'GET' && m) {
    const k = kayitlar.get(decodeURIComponent(m[2]!));
    if (!k || k.platform !== 'android' || k.urun !== decodeURIComponent(m[1]!))
      return json({ error: { code: 404 } }, 404);
    return json({
      kind: 'androidpublisher#productPurchase',
      purchaseState: k.iade ? 1 : 0,
      consumptionState: 0,
      orderId: 'GPA.SAHTE',
      productId: k.urun,
    });
  }
  if (req.method === 'GET' && /\/purchases\/voidedpurchases$/.test(yol)) {
    return json({
      voidedPurchases: [...kayitlar.entries()]
        .filter(([, k]) => k.platform === 'android' && k.iade)
        .map(([jeton, k]) => ({
          purchaseToken: jeton,
          orderId: 'GPA.SAHTE',
          voidedTimeMillis: String(k.iade),
        })),
    });
  }
  return json({ hata: 'bulunamadı' }, 404);
});
