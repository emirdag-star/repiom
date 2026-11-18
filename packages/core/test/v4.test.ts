/**
 * Onaylı hesap mantığı (REPIOM_Hesap_Mantigi_v4.xlsx) regresyonu ve girdi senaryoları.
 * Prototipteki test/dogrula.js'in karşılığı.
 */
import { describe, expect, it } from 'vitest';
import expectedRaw from '../reference/beklenen_v4.json';
import {
  calculate,
  emptyBlock,
  emptyProject,
  exampleProject,
  floorArea,
  siteBlockTemplate,
  type CalculationResult,
  type ItemRow,
  type ProjectInput,
} from '../src';

const expected = expectedRaw as unknown as Record<
  string,
  { metraj?: number; piyasa?: number; tutar?: number }
>;
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));

/** v4 örneği yeni düzende. v4'te blok alanları kat düzeninden bağımsız girildiği için _ovr ile aynen verilir. */
export function v4Project(): ProjectInput {
  const t = [
    {
      id: 'a',
      ad: '',
      duzen: '3+1',
      brut: 110,
      balkon: 2,
      mutfak: 'KAPALI',
      isikBandi: 'VAR',
      alaturka: 'YOK',
      ebeveynBanyo: 1,
      ankastre: 'VAR',
      klima: 2,
    },
    {
      id: 'b',
      ad: '',
      duzen: '2+1',
      brut: 85,
      balkon: 1,
      mutfak: 'AMERİKAN',
      isikBandi: 'VAR',
      alaturka: 'YOK',
      ebeveynBanyo: 0,
      ankastre: 'VAR',
      klima: 1,
    },
  ];
  // v4 referansı mantolama altı sıva için %10 kuralıyla (HAYIR) hesaplandı.
  const sis = {
    cephe: 'EPS',
    asansor: 2,
    merdiven: 2,
    isitma: 'KOMBİ',
    isitmaSekli: 'RADYATÖR',
    banyoTavan: 'YEŞİL ALÇIPAN',
    cati: 'KIRMA',
    doseme: 'ASMOLEN',
    suDeposu: 'MODÜLER',
    dilatasyon: 0,
    mantoAltiSiva: 'HAYIR',
  };
  const daire = [
    { tip: 'a', adet: 15 },
    { tip: 'b', adet: 30 },
  ];
  return {
    ad: 'YENİKENT',
    il: 'İstanbul',
    arsa: 3500,
    tipler: t,
    sureAy: 18,
    satisOfisi: true,
    ornekDaire: true,
    jenerator: true,
    trafo: true,
    kdvOrani: 20,
    ongorulemeyenOrani: 2,
    _ovr: { TIA: 10920 },
    bloklar: [
      {
        ad: 'A BLOK',
        sistem: sis,
        katlar: [
          { tur: 'bodrum', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: 405 },
          { tur: 'otopark', tekrar: 1, yukseklik: 4, gomulu: 'EVET', m2: 405 },
          { tur: 'normal', tekrar: 1, yukseklik: 3, daireler: daire },
        ],
        _ovr: {
          N_NOR: 9,
          A_NOR: 430,
          H_NOR: 3,
          BIA: 5700,
          TABAN: 405,
          H_USTU: 27,
          H_YERALTI: 7,
          KAT_YERALTI: 2,
        },
      },
      {
        ad: 'B BLOK',
        sistem: sis,
        katlar: [
          { tur: 'bodrum', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: 365 },
          { tur: 'otopark', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: 365 },
          { tur: 'dukkan', tekrar: 1, yukseklik: 4, gomulu: 'HAYIR', m2: 365 },
          { tur: 'normal', tekrar: 1, yukseklik: 3, daireler: daire },
        ],
        _ovr: {
          N_NOR: 8,
          A_NOR: 400,
          H_NOR: 3,
          BIA: 5220,
          TABAN: 365,
          H_USTU: 28,
          H_YERALTI: 6,
          KAT_YERALTI: 2,
        },
      },
    ],
  };
}

function ok(x: ReturnType<typeof calculate>): CalculationResult {
  if (x.hata !== undefined) throw new Error('Beklenmeyen hata: ' + x.hata);
  return x;
}
const items = (rows: CalculationResult['tumProje']['satirlar']) =>
  rows.filter((r): r is ItemRow => !r.baslik);

describe('v4 regresyonu (REPIOM_Hesap_Mantigi_v4.xlsx)', () => {
  const s = ok(calculate(v4Project()));
  /** Tipe bağlı satırın 3+1 karşılığı v4'te ikinci satırdadır. */
  const second: Record<number, number> = { 91: 92, 96: 97, 109: 110, 112: 113, 123: 124, 139: 140, 141: 142 };

  it('588 değerin hepsi tutuyor (A blok ve proje geneli: metraj, fiyat, tutar)', () => {
    const mismatches: string[] = [];
    let count = 0;
    const check = (r: ItemRow, key: number, label: string) => {
      const e = expected[key] ?? {};
      for (const [name, got, want] of [
        ['metraj', r.metraj, e.metraj],
        ['fiyat', r.piyasaFiyat, e.piyasa],
        ['tutar', r.piyasaTutar, e.tutar],
      ] as const) {
        count++;
        if (!close(got, want || 0)) mismatches.push(`${label} | ${name}: motor ${got} / v4 ${want}`);
      }
    };
    items(s.bloklar[0]!.satirlar).forEach((r) =>
      check(r, r.tipSatiri && (r.tipOda ?? 0) >= 3 ? second[r.i!]! : r.i!, `A ${r.no} ${r.ad}`),
    );
    items(s.projeGeneli.satirlar)
      .filter((r) => r.i !== 179 && r.i !== 219)
      .forEach((r) => check(r, r.i!, `PG ${r.no} ${r.ad}`));
    expect(mismatches).toEqual([]);
    expect(count).toBe(588);
  });

  it('A blok piyasa toplamı 126.396.328 TL', () => {
    expect(Math.round(s.bloklar[0]!.toplam.piyasa)).toBe(126_396_328);
  });
});

describe('girdi senaryoları', () => {
  const run = (p: ProjectInput) => {
    const x = ok(calculate(p));
    const text = JSON.stringify(x.ozet);
    expect(text).not.toMatch(/NaN|null|Infinity/);
    for (const b of x.bloklar)
      for (const r of b.satirlar) expect(Number.isFinite(r.piyasaTutar ?? 0)).toBe(true);
    const total = x.bloklar.reduce((a, b) => a + b.toplam.piyasa, 0) + x.projeGeneli.toplam.piyasa;
    expect(close(total, x.ozet.piyasa)).toBe(true);
    expect(x.ozet.piyasa).toBeGreaterThan(0);
    return x;
  };

  it('boş proje çökmez, Türkçe hata verir', () => {
    expect(calculate(emptyProject())).toEqual({
      hata: 'Hesap için en az toplam inşaat alanını ya da bir bloğun kat bilgilerini gir.',
    });
    expect(calculate({})).toHaveProperty('hata');
  });

  it('yalnız toplam inşaat alanı (6.000 m²) yeterli', () => {
    const x = run(Object.assign(emptyProject(), { toplamInsaatAlani: 6000 }));
    expect(close(x.ozet.toplamInsaatAlani, 6000)).toBe(true);
    expect(x.ozet.toplamDaire).toBeGreaterThan(0);
    expect(x.uyarilar).toEqual([]);
  });

  it('toplam alan + 2 blok + oturum: alan bloklara bölünür', () => {
    const x = run(
      Object.assign(emptyProject(), {
        toplamInsaatAlani: 12000,
        blokAdedi: 2,
        toplamOturum: 1000,
        bloklar: [emptyBlock(0), emptyBlock(1)],
      }),
    );
    expect(x.bloklar).toHaveLength(2);
    expect(close(x.ozet.toplamInsaatAlani, 12000)).toBe(true);
  });

  it('detaylı proje: kat ve daire bilgisi girilince toplam alan yok sayılır ve kullanıcı uyarılır', () => {
    const p = exampleProject();
    p.bloklar = [p.bloklar![0]!];
    p.blokAdedi = 1;
    const x = run(p);
    expect(x.ozet.toplamInsaatAlani).not.toBeCloseTo(4000);
    expect(x.uyarilar.join(' ')).toMatch(/yerine bu kullanıldı/);
  });

  it('örnek proje: A blok detaylı, B blok toplamdan; kat kuralları', () => {
    const x = run(exampleProject());
    const a = x.bloklar[0]!;
    // Kat alanı = daire brütü + %12 ortak alan; dubleks iki seviyeye bölünür.
    expect(a.katlar.map((k) => Math.round(floorArea(k)))).toEqual([400, 400, 400, 493, 314, 448, 202]);
    // Yarı gömülü otopark: 2,6 m'nin yarısı yer altında.
    expect(a.v.H_YERALTI).toBeCloseTo(3 + 1.3, 10);
    expect(a.v.N_NOR).toBe(5); // 3 normal + dubleks (2 seviye)
    expect(x.bloklar[1]!.katlar.length).toBeGreaterThan(0);
  });

  it('site bloğu şablonu (boş ve 2 blok / 20.000 m²)', () => {
    run(siteBlockTemplate());
    const x = run(
      siteBlockTemplate(Object.assign(emptyProject(), { blokAdedi: 2, toplamInsaatAlani: 20000 })),
    );
    expect(x.bloklar).toHaveLength(2);
  });

  it('kısmi girdi: 4 normal kat (daire yok) + 300 m² bodrum', () => {
    const p = emptyProject();
    p.bloklar![0]!.katlar = [
      { tur: 'normal', tekrar: 4, daireler: [] },
      { tur: 'bodrum', tekrar: 1, m2: 300 },
    ];
    const x = run(p);
    expect(x.bloklar[0]!.v.N_NOR).toBe(4);
  });

  it('mantolama altı sıva: EVET net cephenin tamamı, HAYIR %10', () => {
    const base = Object.assign(emptyProject(), { toplamInsaatAlani: 6000 });
    const evet = ok(calculate(base));
    const hayir = ok(
      calculate(
        Object.assign(emptyProject(), {
          toplamInsaatAlani: 6000,
          bloklar: [{ sistem: { mantoAltiSiva: 'HAYIR' } }],
        }),
      ),
    );
    const sıva = (x: CalculationResult) =>
      items(x.bloklar[0]!.satirlar).find((r) => /dış cephe/i.test(r.ad) && /sıva/i.test(r.ad));
    const e = sıva(evet);
    const h = sıva(hayir);
    expect(e && h).toBeTruthy();
    expect(e!.metraj).toBeCloseTo(h!.metraj * 10, 6);
  });

  it('KDV oranı değiştirilebilir, varsayılan %20', () => {
    const base = Object.assign(emptyProject(), { toplamInsaatAlani: 6000 });
    expect(ok(calculate(base)).ozet.kdvOrani).toBe(0.2);
    expect(ok(calculate({ ...base, kdvOrani: 10 })).ozet.kdvOrani).toBe(0.1);
    expect(ok(calculate({ ...base, kdvOrani: '' })).ozet.kdvOrani).toBe(0.2);
  });

  it('il katsayısı piyasa fiyatlarına uygulanır', () => {
    const ist = ok(calculate(Object.assign(emptyProject(), { toplamInsaatAlani: 6000, il: 'İstanbul' })));
    const van = ok(calculate(Object.assign(emptyProject(), { toplamInsaatAlani: 6000, il: 'Van' })));
    const r = (x: CalculationResult) => items(x.bloklar[0]!.satirlar).find((y) => y.i === 1)!;
    expect(r(van).piyasaFiyat).toBeCloseTo(r(ist).piyasaFiyat * 0.88, 6);
  });

  it('elle düzeltme metraj ve fiyatı değiştirir; düzeltme kaldırılınca formüle döner', () => {
    const base = Object.assign(emptyProject(), { toplamInsaatAlani: 6000 });
    const normal = ok(calculate(base));
    const fixed = ok(calculate({ ...base, duzeltmeler: { blok0: { '1': { metraj: 123, piyasa: 10 } } } }));
    const r = items(fixed.bloklar[0]!.satirlar).find((y) => y.i === 1)!;
    expect([r.metraj, r.piyasaFiyat, r.piyasaTutar, r.metrajElle, r.piyasaElle]).toEqual([
      123,
      10,
      1230,
      true,
      true,
    ]);
    const back = ok(calculate({ ...base, duzeltmeler: { blok0: {} } }));
    expect(back.ozet.piyasa).toBe(normal.ozet.piyasa);
  });

  it('bozuk ya da eksik değerler çökertmez', () => {
    run({
      toplamInsaatAlani: '5000',
      tipler: [{ id: 'x', duzen: 'saçma', brut: -5 }],
      bloklar: [
        {
          katlar: [
            {
              tur: 'normal',
              tekrar: 'iki',
              daireler: [
                { tip: 'x', adet: 3 },
                { tip: 'yok', adet: 2 },
              ],
            },
            { tur: 'tavan arası', tekrar: 1 },
          ],
          sistem: { asansor: '', merdiven: null },
        },
      ],
    } as ProjectInput);
  });

  it('BİLİNEN DURUM (prototiple aynı): sayı olmayan KDV oranı KDV tutarını NaN yapar — arayüz doğrulaması engelleyecek', () => {
    const x = ok(calculate(Object.assign(emptyProject(), { toplamInsaatAlani: 6000, kdvOrani: 'abc' })));
    expect(x.ozet.piyasa).toBeGreaterThan(0);
    expect(Number.isNaN(x.ozet.piyasaKdv)).toBe(true);
  });
});
