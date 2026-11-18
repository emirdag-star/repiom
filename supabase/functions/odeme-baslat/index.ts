// Kartla ödeme: ödeme kaydını kullanıcı adına açar (paket, fatura ve sözleşme onayları veritabanında denetlenir),
// iyzico ortak ödeme formunu başlatır ve kullanıcıyı yönlendireceğimiz ödeme sayfası adresini döner.
// Ortam: IYZICO_URL, IYZICO_API_KEY, IYZICO_SECRET_KEY, ODEME_DONUS_URL (odeme-sonuc fonksiyonunun dışarıdan adresi),
//        IZINLI_KAYNAKLAR (uygulama adresleri).
import { cors, db, hata, IZINLI, kullanici, belirtec, yanit } from '../_ortak/ortak.ts';
import { iyzico, iyzicoHazir } from '../_ortak/iyzico.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return hata(req, 405, 'Yalnız POST.');
  if (!iyzicoHazir()) return hata(req, 503, 'Kart ödemesi henüz etkin değil; havale/EFT ile ödeyebilirsin.');
  const u = await kullanici(req);
  if (!u) return hata(req, 401, 'Oturum gerekli.');
  const g = await req.json().catch(() => ({}));
  const donus = String(g.donus ?? '');
  if (!IZINLI.some((k) => donus === k || donus.startsWith(k + '/')))
    return hata(req, 400, 'Geçersiz dönüş adresi.');

  // Ödeme kaydı kullanıcının kendi oturumuyla açılır: tüm kurallar veritabanı fonksiyonunda.
  let o: { id: number; referans: string; tutar: number };
  try {
    o = await db('rpc/odeme_olustur', {
      method: 'POST',
      jwt: belirtec(req),
      govde: { p_paket: g.paket, p_adet: g.adet ?? 1, p_fatura: g.fatura ?? {}, p_yontem: 'kart' },
    });
  } catch (e) {
    return hata(req, 400, (e as Error).message);
  }
  const p = (await db(`paketler?select=id,ad&id=eq.${encodeURIComponent(String(g.paket))}`))?.[0];
  const f = g.fatura ?? {};
  const tutar = Number(o.tutar).toFixed(2);
  const adlar = String(f.ad).trim().split(/\s+/);
  const soyad = adlar.length > 1 ? adlar.pop()! : '-';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const callbackUrl = `${Deno.env.get('ODEME_DONUS_URL')}?donus=${encodeURIComponent(donus)}`;
  const r = await iyzico('/payment/iyzipos/checkoutform/initialize/auth/ecom', {
    locale: 'tr',
    conversationId: String(o.id),
    price: tutar,
    paidPrice: tutar,
    currency: 'TRY',
    basketId: o.referans,
    paymentGroup: 'PRODUCT',
    callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: u.id,
      name: adlar.join(' ') || '-',
      surname: soyad,
      email: u.email,
      // iyzico kimlik numarası ister; VKN'li (kurumsal) alımda yer tutucu gönderilir, fatura bilgisi bizde saklıdır.
      identityNumber: String(f.no).length === 11 ? String(f.no) : '11111111111',
      registrationAddress: String(f.adres),
      ip,
      city: f.il || 'İstanbul',
      country: 'Turkey',
    },
    billingAddress: {
      contactName: String(f.ad),
      city: f.il || 'İstanbul',
      country: 'Turkey',
      address: String(f.adres),
    },
    basketItems: [
      {
        id: String(g.paket),
        name: p?.ad ?? String(g.paket),
        category1: 'Dijital hizmet',
        itemType: 'VIRTUAL',
        price: tutar,
      },
    ],
  });
  if (r.status !== 'success' || !r.token) {
    await db('rpc/odeme_reddet', {
      method: 'POST',
      govde: { p_id: o.id, p_neden: String(r.errorMessage ?? 'Ödeme başlatılamadı') },
    }).catch(() => {});
    return hata(req, 502, 'Ödeme başlatılamadı: ' + String(r.errorMessage ?? 'iyzico yanıt vermedi'));
  }
  await db('rpc/odeme_saglayici_ref', { method: 'POST', govde: { p_id: o.id, p_ref: String(r.token) } });
  return yanit(req, 200, { odemeSayfasi: r.paymentPageUrl, referans: o.referans });
});
