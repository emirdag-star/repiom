// Çizim analizinin yapay zekâ adımı: yazısız plan görselleri (en çok 6) + mahal/alan özeti → en çok 8 kontrol notu ve
// yeni kalemler için tahmini birim fiyat. Analiz başına TEK çağrı; açık rıza ve çağrı hakkı veritabanında denetlenir
// (yz_hakki_al); kullanılan tokenlar kaydedilir (yz_kaydet).
// GİZLİLİK: istemciden gelen özet burada YENİDEN süzülür — yalnız izinli kelimeler ve sayılar geçer; proje adı, pafta
// başlığı, antet, isim, ada-parsel gibi serbest yazılar Claude'a gitmez.
// Ortam: ANTHROPIC_API_KEY, YZ_MODEL (varsayılan claude-sonnet-5-5), ANTHROPIC_BASE_URL (yalnız test: sahte servis).
import Anthropic from 'npm:@anthropic-ai/sdk@1.10.0';
import { belirtec, cors, db, hata, kullanici, yanit } from '../_ortak/ortak.ts';
import { hataBildir } from '../_ortak/hataKaydi.ts';

const MODEL = Deno.env.get('YZ_MODEL') ?? 'claude-sonnet-5-5';
const ANAHTAR = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const TABAN = Deno.env.get('ANTHROPIC_BASE_URL') || undefined;
const EN_COK_GORSEL = 6;
const EN_COK_NOT = 8;

/* ---------- İzin listeleri (packages/core/src/dxf ile aynı sözlük) ---------- */
const MAHALLER = new Set([
  'Salon',
  'Ebeveyn yatak odası',
  'Yatak odası',
  'Oda + mutfak nişi',
  'Oda',
  'Mutfak',
  'Banyo',
  'Duş / ebeveyn banyosu',
  'WC',
  'Antre / hol',
  'Balkon / teras',
  'Merdiven / merdiven holü',
  'Kat / giriş holü',
  'Asansör',
  'Otopark',
  'Depo',
  'Teknik hacim',
  'Dükkan',
  'Çatı arası',
  'Tanınmayan mahal',
]);
const TURLER = new Set(['Kuru', 'Mutfak', 'Islak', 'Balkon', 'Ortak', 'Teknik', 'Dükkan']);
const KAPLAMALAR = new Set([
  'Laminat parke',
  'Seramik',
  'Seramik (dış mekân, donmaya dayanıklı)',
  'Mermer',
  'Granit seramik',
  'Perdahlı beton',
  'Epoksi',
  'Plastik boya',
  'Kara sıva + boya',
  'Dış cephe kaplaması',
  'Badana',
  'Asma tavan (alçıpan)',
  'Asma tavan (yeşil alçıpan)',
  'Plastik boya (dış cephe)',
  'Diğer',
]);
const KAT_TURLERI = new Set(['Bodrum', 'Otopark', 'Normal kat', 'Çatı katı', 'Çatı', 'Zemin', 'Kat']);
const KALEM =
  /^(Jet Grout Zemin İyileştirme Kolonu \(Ø\d{1,3} cm\)|Beton Sınıfı Farkı \(C30\/37 → C\d{2}(\/\d{2})?\))$/;

const sayi = (x: unknown, ust = 1e7) =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= ust ? x : null;
const sec = (x: unknown, izin: Set<string>, yedek: string) =>
  typeof x === 'string' && izin.has(x) ? x : yedek;
const dizi = (x: unknown, n: number): unknown[] => (Array.isArray(x) ? x.slice(0, n) : []);
type Nesne = Record<string, unknown>;
const nesne = (x: unknown): Nesne => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Nesne) : {});

function ozetSuz(g: unknown) {
  const o = nesne(g);
  return {
    katlar: dizi(o.katlar, 60).map((k0, i) => {
      const k = nesne(k0);
      return {
        kat: i + 1,
        tur: sec(k.tur, KAT_TURLERI, 'Kat'),
        tekrar: sayi(k.tekrar, 200) ?? 1,
        mahaller: dizi(k.mahaller, 120).map((m0) => {
          const m = nesne(m0);
          return {
            mahal: sec(m.mahal, MAHALLER, 'Tanınmayan mahal'),
            tur: sec(m.tur, TURLER, 'Kuru'),
            alan_m2: sayi(m.alan_m2, 10000) ?? 0,
            zemin: sec(m.zemin, KAPLAMALAR, 'Diğer'),
            duvar: sec(m.duvar, KAPLAMALAR, 'Diğer'),
            tavan: sec(m.tavan, KAPLAMALAR, 'Diğer'),
          };
        }),
        kapi_adet: sayi(k.kapi_adet, 10000) ?? 0,
        pencere_adet: sayi(k.pencere_adet, 10000) ?? 0,
      };
    }),
    statik: dizi(o.statik, 60).map((p0) => {
      const p = nesne(p0);
      return {
        kat_turu: sec(p.kat_turu, KAT_TURLERI, 'Kat'),
        tekrar: sayi(p.tekrar, 200) ?? 1,
        doseme_m2: sayi(p.doseme_m2, 100000) ?? 0,
        doseme_kalinlik_cm: sayi(p.doseme_kalinlik_cm, 200),
        kiris_kesitleri: dizi(p.kiris_kesitleri, 3).filter(
          (k) => typeof k === 'string' && /^\d{2,3}\/\d{2,3}$/.test(k),
        ),
        kolon_perde_m2: sayi(p.kolon_perde_m2, 10000) ?? 0,
      };
    }),
    temel: dizi(o.temel, 10).map((t0) => {
      const t = nesne(t0);
      return { kalinlik_cm: sayi(t.kalinlik_cm, 500), alan_m2: sayi(t.alan_m2, 100000) ?? 0 };
    }),
    jet_grout: dizi(o.jet_grout, 10).map((j0) => {
      const j = nesne(j0);
      return { adet: sayi(j.adet, 100000) ?? 0, boy_m: sayi(j.boy_m, 200), cap_cm: sayi(j.cap_cm, 500) };
    }),
    beton_sinifi:
      typeof o.beton_sinifi === 'string' && /^C\d{2}$/.test(o.beton_sinifi) ? o.beton_sinifi : null,
  };
}

const SISTEM = `Sen Türkiye'de konut inşaatı maliyeti ve metraj konusunda deneyimli bir yapı denetim mühendisisin.
Sana bir konut projesinin DXF çiziminden otomatik okunmuş özet bilgiler (katlar, mahaller, alanlar, kaplamalar, kalıp planları, temel)
ve kat planlarının yazısız çizgi görüntüleri verilecek.
Görevlerin:
1) Okunan bilgilerdeki tutarsızlıkları ve olası okuma hatalarını bul: plana göre olağandışı mahal alanı, ıslak hacimde eksik kaplama,
   şüpheli kat tekrarı, eksik kat planı, temel/kalıp eksikliği gibi. En çok ${EN_COK_NOT} kısa, somut, Türkçe not yaz; sorun yoksa boş liste döndür.
2) "yeni_kalemler" listesindeki her kalem için verilen ilde güncel piyasa koşullarında KDV hariç birim fiyat tahmini (TL) ver;
   "ad" alanını listedekiyle birebir aynı yaz, gerekçe tek kısa cümle olsun.`;

const SEMA = {
  type: 'object',
  properties: {
    notlar: { type: 'array', items: { type: 'string' } },
    fiyatlar: {
      type: 'array',
      items: {
        type: 'object',
        properties: { ad: { type: 'string' }, fiyat: { type: 'number' }, gerekce: { type: 'string' } },
        required: ['ad', 'fiyat', 'gerekce'],
        additionalProperties: false,
      },
    },
  },
  required: ['notlar', 'fiyatlar'],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return hata(req, 405, 'Yalnız POST.');
  if (!ANAHTAR) return hata(req, 503, 'Yapay zekâ servisi yapılandırılmadı.');
  const u = await kullanici(req);
  if (!u) return hata(req, 401, 'Oturum gerekli.');
  const g = nesne(await req.json().catch(() => ({})));
  const analizId = Number(g.analiz_id);
  if (!Number.isInteger(analizId)) return hata(req, 400, 'Geçersiz istek.');

  const gorseller = dizi(g.gorseller, EN_COK_GORSEL)
    .map((x) => (typeof x === 'string' ? x : ''))
    .filter((x) => x.length > 100 && x.length < 4_000_000 && x.startsWith('iVBORw0KGgo')); // PNG imzası
  const ozet = ozetSuz(g.ozet);
  const yeniKalemler = dizi(g.yeni_kalemler, 20)
    .map((x) => nesne(x))
    .filter((x) => typeof x.ad === 'string' && KALEM.test(x.ad))
    .map((x) => ({
      ad: x.ad as string,
      birim: x.birim === 'm' || x.birim === 'm³' ? x.birim : '',
      metraj: sayi(x.metraj, 1e7) ?? 0,
    }));
  const il = typeof g.il === 'string' && /^[A-Za-zÇĞİÖŞÜçğıöşü ]{2,20}$/.test(g.il) ? g.il : 'İstanbul';

  // Analiz başına tek çağrı: hak, Claude'a gidilmeden önce alınır (rıza ve süre de burada denetlenir).
  try {
    await db('rpc/yz_hakki_al', { method: 'POST', jwt: belirtec(req), govde: { p_id: analizId } });
  } catch (e) {
    return hata(req, (e as { durum?: number }).durum === 404 ? 404 : 403, (e as Error).message);
  }

  const icerik: Anthropic.Beta.BetaContentBlockParam[] = [];
  gorseller.forEach((png, i) => {
    icerik.push({ type: 'text', text: `Kat planı görseli ${i + 1} (yazılar kaldırılmıştır).` });
    icerik.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: png } });
  });
  icerik.push({
    type: 'text',
    text: `İl: ${il}\nOkunan özet (JSON):\n${JSON.stringify(ozet)}\nyeni_kalemler (JSON):\n${JSON.stringify(yeniKalemler)}`,
  });

  const client = new Anthropic({ apiKey: ANAHTAR, baseURL: TABAN, maxRetries: 2, timeout: 120_000 });
  try {
    const r = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SISTEM,
      // Güvenlik sınıflandırıcısı reddederse aynı istek sunucu tarafında uygun modelle yeniden denenir.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SEMA } },
      messages: [{ role: 'user', content: icerik }],
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);
    const kullanim = {
      model: r.model,
      input_tokens: r.usage.input_tokens,
      output_tokens: r.usage.output_tokens,
      cache_read_input_tokens: r.usage.cache_read_input_tokens ?? 0,
      stop_reason: r.stop_reason,
      gorsel: gorseller.length,
    };
    await db('rpc/yz_kaydet', { method: 'POST', govde: { p_id: analizId, p_token: kullanim } }).catch(
      () => {},
    );
    if (r.stop_reason === 'refusal') return hata(req, 502, 'Yapay zekâ bu çizim için kontrol yapmadı.');
    const metin = r.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    let sonuc: { notlar?: unknown; fiyatlar?: unknown };
    try {
      sonuc = JSON.parse(metin);
    } catch {
      return hata(req, 502, 'Yapay zekâ yanıtı okunamadı.');
    }
    const izinliAd = new Set(yeniKalemler.map((k) => k.ad));
    return yanit(req, 200, {
      notlar: dizi(sonuc.notlar, EN_COK_NOT)
        .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
        .map((n) => n.trim().slice(0, 400)),
      fiyatlar: dizi(sonuc.fiyatlar, 20)
        .map((f) => nesne(f))
        .filter((f) => typeof f.ad === 'string' && izinliAd.has(f.ad) && (sayi(f.fiyat, 1e8) ?? 0) > 0)
        .map((f) => ({
          ad: f.ad,
          fiyat: Math.round(f.fiyat as number),
          gerekce: String(f.gerekce ?? '').slice(0, 300),
        })),
      kullanim: { input_tokens: kullanim.input_tokens, output_tokens: kullanim.output_tokens },
    });
  } catch (e) {
    const durum = e instanceof Anthropic.APIError ? e.status : null;
    if (durum === null || durum >= 500 || durum === 401) await hataBildir(e, 'dxf-yz');
    await db('rpc/yz_kaydet', {
      method: 'POST',
      govde: {
        p_id: analizId,
        p_token: { model: MODEL, hata: durum ?? 'baglanti', input_tokens: 0, output_tokens: 0 },
      },
    }).catch(() => {});
    const mesaj =
      e instanceof Anthropic.RateLimitError
        ? 'Yapay zekâ servisi şu anda yoğun.'
        : e instanceof Anthropic.AuthenticationError
          ? 'Yapay zekâ servisi yapılandırma hatası.'
          : 'Yapay zekâ servisine ulaşılamadı.';
    return hata(req, 502, mesaj);
  }
});
