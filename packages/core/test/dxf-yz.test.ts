/** Yapay zekâ özeti gizlilik kuralları: proje adı, pafta başlığı, serbest yazı, antet, ada-parsel gönderilmez. */
import { describe, expect, it } from 'vitest';
import { dxf } from '../src';

async function analiz(o: Parameters<typeof dxf.exampleDrawings>[0] = {}) {
  const c = dxf.exampleDrawings(o);
  const a = dxf.analyzeDrawings(await dxf.readDxfBytes(c.mimari), await dxf.readDxfBytes(c.statik));
  if (a.hata !== undefined) throw new Error(a.hata);
  return a;
}

describe('yapay zekâ özeti', () => {
  it('katlar, mahaller ve statik sayısal olarak özetlenir', async () => {
    const a = await analiz();
    const s = dxf.aiSummary(a.mimari, a.statik);
    expect(s.katlar.map((k) => [k.kat, k.tur, k.tekrar, k.mahaller.length])).toEqual([
      [1, 'Bodrum', 1, 6],
      [2, 'Normal kat', 1, 19],
      [3, 'Normal kat', 3, 19],
    ]);
    expect(s.katlar[1]!.mahaller.find((m) => m.mahal === 'Salon')).toMatchObject({
      tur: 'Kuru',
      alan_m2: 30,
      zemin: 'Laminat parke',
    });
    expect(s.statik).toHaveLength(3);
    expect(s.beton_sinifi).toBe('C30');
    expect(s.jet_grout).toEqual([{ adet: 48, boy_m: 10, cap_cm: 60 }]);
  });

  it('çizimdeki serbest yazılar, başlıklar ve kişisel bilgiler özette yer almaz', async () => {
    const GIZLI = ['AHMET YILMAZ', 'ADA 123 PARSEL 45', 'ŞAHSİ ODA', 'Gizli Kaplama Markası'];
    const a = await analiz({
      katlar: [
        { baslik: '1. BODRUM KAT PLANI AHMET YILMAZ', plan: 'bodrum' },
        { baslik: 'ZEMİN KAT PLANI ADA 123 PARSEL 45', plan: 'konut' },
        { baslik: '1-2-3. KAT PLANI', plan: 'konut' },
      ],
    });
    // Çizimde serbest adlı ve markalı mahal olsun.
    const m = a.mimari.katlar[1]!.mahaller[0]!;
    m.ad = 'ŞAHSİ ODA';
    m.std = null;
    m.zemin = 'Gizli Kaplama Markası';
    const metin = JSON.stringify(dxf.aiSummary(a.mimari, a.statik));
    for (const g of GIZLI) expect(metin).not.toContain(g);
    expect(metin).not.toMatch(/PLAN/i);
    expect(metin).toContain('Tanınmayan mahal');
    expect(metin).toContain('"zemin":"Diğer"');
  });

  it('hesap dışı bırakılan kat özete girmez', async () => {
    const a = await analiz();
    a.mimari.katlar[2]!.haric = true;
    expect(dxf.aiSummary(a.mimari, a.statik).katlar).toHaveLength(2);
  });
});
