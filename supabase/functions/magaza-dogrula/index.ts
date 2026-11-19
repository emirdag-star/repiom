// Mobil uygulama içi satın almayı mağazadan doğrular ve hakkı tanımlar (tek seferlik/tüketilebilir ürünler).
// İstemci: { platform: 'ios', urun, islem: transactionId } ya da { platform: 'android', urun, jeton: purchaseToken }.
// Aynı işlem tekrar gönderilirse yeniden hak verilmez (veritabanında tekil). İstemci, BAŞARILI yanıttan sonra işlemi
// mağazada bitirir (finishTransaction, isConsumable: true).
import { db, hata, kullanici, yanit } from '../_ortak/ortak.ts';
import { appleIslem, googleSatin, MagazaHatasi } from '../_ortak/magaza.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok');
  if (req.method !== 'POST') return hata(req, 405, 'Yalnız POST.');
  const u = await kullanici(req);
  if (!u) return hata(req, 401, 'Oturum gerekli.');
  const g = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const platform = g.platform;
  const urun = typeof g.urun === 'string' && /^[a-z0-9_]{2,40}$/.test(g.urun) ? g.urun : null;
  if ((platform !== 'ios' && platform !== 'android') || !urun) return hata(req, 400, 'Geçersiz istek.');

  try {
    let islem: string;
    let ortam = '';
    if (platform === 'ios') {
      const t = await appleIslem(String(g.islem ?? ''));
      if (t.productId !== urun) throw new MagazaHatasi('Satın alınan ürün eşleşmiyor.', 403);
      if (t.revocationDate) throw new MagazaHatasi('Bu satın alma iade edilmiş.', 403);
      if (t.type && t.type !== 'Consumable') throw new MagazaHatasi('Beklenmeyen ürün türü.', 403);
      islem = t.transactionId;
      ortam = t.environment ?? '';
    } else {
      islem = String(g.jeton ?? '');
      const s = await googleSatin(urun, islem);
      if (s.productId && s.productId !== urun) throw new MagazaHatasi('Satın alınan ürün eşleşmiyor.', 403);
      if (s.purchaseState === 2)
        throw new MagazaHatasi('Ödeme henüz tamamlanmadı; tamamlanınca hakkın tanımlanır.', 409);
      if (s.purchaseState !== 0) throw new MagazaHatasi('Bu satın alma iptal edilmiş.', 403);
    }
    const r = (await db('rpc/magaza_satin_alma', {
      method: 'POST',
      govde: { p_kullanici: u.id, p_platform: platform, p_islem: islem, p_urun: urun, p_ortam: ortam },
    })) as { odeme_id: number; yeni: boolean };
    return yanit(req, 200, { tamam: true, yeni: r.yeni });
  } catch (e) {
    if (e instanceof MagazaHatasi) return hata(req, e.durum, e.message);
    const durum = (e as { durum?: number }).durum;
    if (durum && durum < 500) return hata(req, 403, (e as Error).message);
    return hata(
      req,
      502,
      'Satın alma doğrulanamadı. Hakkın kaybolmaz; uygulamayı yeniden açınca tekrar denenir.',
    );
  }
});
