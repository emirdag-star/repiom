// SAHTE iyzico — YALNIZ TEST VE YEREL GELİŞTİRME İÇİN. SAHTE_IYZICO=1 değilse hiçbir istek kabul edilmez;
// üretime yayınlanmaz. Ödeme formunu başlatma, ödeme sayfası (Öde / Reddet) ve sonucu sorgulama uç noktalarını taklit eder.
// "verify_jwt = false" (supabase/config.toml).
const ACIK = Deno.env.get('SAHTE_IYZICO') === '1';
const GENEL = Deno.env.get('SAHTE_IYZICO_GENEL_URL') ?? 'http://127.0.0.1:55321/functions/v1/test-iyzico';

const b64 = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const coz = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s))));
const json = (o: unknown) =>
  new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } });
/** Kullanıcının ödeme sayfasındaki seçimi (gerçek iyzico'da sonuç sağlayıcıda tutulur). */
const sonuclar = new Map<string, 'ok' | 'red'>();
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

Deno.serve(async (req) => {
  if (!ACIK) return new Response('Kapalı', { status: 404 });
  const yol = new URL(req.url).pathname;
  if (yol.endsWith('/checkoutform/initialize/auth/ecom')) {
    if (!/^IYZWSv2 /.test(req.headers.get('authorization') ?? ''))
      return json({ status: 'failure', errorMessage: 'imza yok' });
    const g = await req.json();
    const token = b64({ c: g.conversationId, p: g.price, u: g.callbackUrl, r: crypto.randomUUID() });
    return json({
      status: 'success',
      token,
      paymentPageUrl: `${GENEL}/odeme?token=${encodeURIComponent(token)}`,
    });
  }
  if (yol.endsWith('/odeme')) {
    const token = new URL(req.url).searchParams.get('token') ?? '';
    const t = coz(token);
    const form = (sonuc: string, etiket: string) =>
      `<form method="post" action="${GENEL}/karar"><input type="hidden" name="token" value="${esc(token)}">` +
      `<input type="hidden" name="sonuc" value="${sonuc}"><button>${etiket}</button></form>`;
    return new Response(
      `<!doctype html><html lang="tr"><meta charset="utf-8"><title>Sahte iyzico</title><main><h1>Sahte iyzico ödeme sayfası</h1>` +
        `<p>Tutar: ${esc(String(t.p))} TL</p>${form('ok', 'Ödemeyi tamamla')}${form('red', 'Kart reddedildi')}</main></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
  if (yol.endsWith('/karar')) {
    // Seçim kaydedilir; iyzico gibi aynı token ile uygulamanın dönüş adresine POST edilir.
    const f = await req.formData();
    const token = String(f.get('token') ?? '');
    sonuclar.set(token, f.get('sonuc') === 'ok' ? 'ok' : 'red');
    const t = coz(token);
    return new Response(
      `<!doctype html><html lang="tr"><meta charset="utf-8"><title>Yönlendiriliyor</title><body onload="document.forms[0].submit()">` +
        `<form method="post" action="${esc(t.u)}"><input type="hidden" name="token" value="${esc(token)}"><noscript><button>Devam</button></noscript></form></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
  if (yol.endsWith('/checkoutform/auth/ecom/detail')) {
    const g = await req.json();
    const token = String(g.token);
    const sonuc = sonuclar.get(token);
    const t = coz(token);
    return json(
      sonuc === 'ok'
        ? {
            status: 'success',
            paymentStatus: 'SUCCESS',
            paidPrice: t.p,
            conversationId: t.c,
            paymentId: 'SAHTE-' + t.r.slice(0, 8),
          }
        : {
            status: 'success',
            paymentStatus: 'FAILURE',
            conversationId: t.c,
            errorMessage: 'Kart reddedildi (sahte)',
          },
    );
  }
  return new Response('Bulunamadı', { status: 404 });
});
