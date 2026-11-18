/**
 * DXF analizi: prototiple (reference/dxf.js) birebir karşılaştırma, kurgusal çizimlerde beklenen değerler ve
 * özel durumlar (birim, kopya kat, statiksiz çizim, Türkçe Windows kodlaması).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { calculate, dxf, type CalculationResult, type ItemRow, type ProjectInput } from '../src';
import { EXAMPLE_2_1, EXAMPLE_3_1 } from '../src/dxf/example';

const {
  readDxfBytes,
  analyzeDrawings,
  projectFromAnalysis,
  analysisWarnings,
  exampleDrawings,
  parseFloorTitle,
  duplicateFloors,
} = dxf;

/* ---------- prototip ---------- */
type Legacy = {
  oku: (it: AsyncIterable<Uint8Array>) => Promise<unknown>;
  mimari: (d: unknown) => unknown;
  statik: (d: unknown) => unknown;
  analiz: (
    ad: string,
    dm: unknown,
    ds: unknown,
    sec: unknown,
  ) => { proje: unknown; mimari: unknown; statik: unknown; hata?: string };
};
const ctx: Record<string, unknown> = { TextDecoder };
runInNewContext(readFileSync(join(__dirname, '..', 'reference', 'dxf.js'), 'utf8'), ctx);
const L = ctx.REPIOM_DXF as Legacy;
const legacyRead = (s: string | Uint8Array) =>
  L.oku(
    (async function* () {
      yield typeof s === 'string' ? new TextEncoder().encode(s) : s;
    })(),
  );
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Prototipin ürettiği örnek çizim (araclar/ornek_dxf_uret.py → kaynak/ornek_dxf.js). */
function pythonExample(): { mimari: string; statik: string } {
  const src = readFileSync(join(__dirname, '..', 'reference', 'ornek_dxf.js'), 'utf8');
  const o = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1)) as {
    mimari: string;
    statik: string;
  };
  const dec = (b: string) => new TextDecoder().decode(Buffer.from(b, 'base64'));
  return { mimari: dec(o.mimari), statik: dec(o.statik) };
}

async function analyze(m: string | Uint8Array, s: string | Uint8Array | null) {
  const dm = await readDxfBytes(m);
  const ds = s === null ? null : await readDxfBytes(s);
  const a = analyzeDrawings(dm, ds);
  if (a.hata !== undefined) throw new Error(a.hata);
  return a;
}
const SEC = { katYuksekligi: 3, donatiKgM3: 110, il: 'İstanbul' };

describe('örnek çizim üreticisi', () => {
  it('varsayılan çıktı prototipin Python üreticisiyle bayt bayt aynı', () => {
    const py = pythonExample();
    const ts = exampleDrawings();
    expect(ts.mimari).toBe(py.mimari);
    expect(ts.statik).toBe(py.statik);
  });
});

describe('prototiple birebir aynı', () => {
  const variants: [string, Parameters<typeof exampleDrawings>[0]][] = [
    ['varsayılan', {}],
    ['ayrı ad + alan yazısı', { mahalYazisi: 'ayri' }],
    ['yazısız pencereler', { pencereCizgi: true }],
    ['başlıkta yanlış birim (mm)', { insunits: 4 }],
    ['C35 beton, jet grout yok', { betonSinifi: 'C35', jetGrout: false, radyeCm: 80 }],
    [
      'iki blok',
      {
        katlar: [
          { baslik: 'A BLOK 1. BODRUM KAT PLANI', plan: 'bodrum' },
          { baslik: 'A BLOK ZEMİN 1-2-3-4. KAT PLANI', plan: 'konut' },
          { baslik: 'B BLOK ZEMİN 1-2. KAT PLANI', plan: 'konut' },
        ],
      },
    ],
    [
      'statikte kopya ve donatı eşi',
      {
        kalip: [
          { baslik: '(-3.00) 1. BODRUM KAT TAVANI KALIP PLANI (1/50)', onek: 'K1B' },
          { baslik: '(+0.00) ZEMİN, 1., 2. NORMAL KAT TAVANI KALIP PLANI (1/50)', onek: 'KZ' },
          { baslik: '(+0.00) ZEMİN, 1., 2. NORMAL KAT TAVANI KALIP PLANI (1/50)', onek: 'KZ' },
        ],
      },
    ],
  ];
  it.each(variants)('%s: okuma, mimari, statik ve proje girdisi', async (_, o) => {
    const { mimari, statik } = exampleDrawings(o);
    const [lm, ls] = [await legacyRead(mimari), await legacyRead(statik)];
    const [dm, ds] = [await readDxfBytes(mimari, 4096), await readDxfBytes(statik, 4096)];
    expect(plain(dm)).toEqual(plain(lm));
    expect(plain(ds)).toEqual(plain(ls));
    const want = L.analiz('Deneme', lm, ls, SEC);
    const a = analyzeDrawings(dm, ds);
    if (a.hata !== undefined) throw new Error(a.hata);
    expect(plain(a.mimari)).toEqual(plain(want.mimari));
    expect(plain(a.statik)).toEqual(plain(want.statik));
    expect(plain(projectFromAnalysis(a, 'Deneme', SEC))).toEqual(plain(want.proje));
  });

  it('statiksiz çizim', async () => {
    const { mimari } = exampleDrawings();
    const want = L.analiz('Deneme', await legacyRead(mimari), null, SEC);
    const a = await analyze(mimari, null);
    expect(plain(projectFromAnalysis(a, 'Deneme', SEC))).toEqual(plain(want.proje));
  });

  it('parça sınırı satır ortasına düşse de aynı sonuç (akış halinde okuma)', async () => {
    const { mimari } = exampleDrawings();
    const tek = await readDxfBytes(mimari, 1 << 30);
    for (const n of [1, 7, 333, 65536]) expect(plain(await readDxfBytes(mimari, n))).toEqual(plain(tek));
  });
});

describe('kurgusal çizimde beklenen değerler', () => {
  it('katlar, tekrarlar, mahaller, kapı ve pencereler', async () => {
    const a = await analyze(exampleDrawings().mimari, exampleDrawings().statik);
    const M = a.mimari;
    expect(M.birim).toBe('cm');
    expect(M.katlar.map((k) => [k.tur, k.tekrar, k.mahaller.length])).toEqual([
      ['bodrum', 1, 6],
      ['normal', 1, 19],
      ['normal', 3, 19],
    ]);
    const zemin = M.katlar[1]!;
    // Net alanlar çizimdeki A: değerleriyle aynı.
    const net =
      [...EXAMPLE_3_1, ...EXAMPLE_2_1].reduce((s, r) => s + (r[1] * r[2]) / 1e4, 0) +
      (400 * 450 + 180 * 180) / 1e4;
    expect(zemin.mahaller.reduce((s, m) => s + m.alan, 0)).toBeCloseTo(net, 6);
    // Kapalı sınırdan çevre: salon 600×500 → 22 m.
    expect(zemin.mahaller.find((m) => m.ad === 'SALON')!.cevre).toBeCloseTo(22, 6);
    // Pencereler: ölçü yazısından.
    const pen = (defs: typeof EXAMPLE_3_1) => defs.reduce((s, r) => s + r[6], 0);
    expect(Object.values(zemin.pencereler).reduce((s, x) => s + x, 0)).toBe(
      pen(EXAMPLE_3_1) + pen(EXAMPLE_2_1),
    );
    expect(zemin.pencereler['160/140']).toBe(2 + 1 + 2 + 1);
    // Kapılar: balkon ve asansör hariç her mahalde bir kapı.
    const kapi = [...EXAMPLE_3_1, ...EXAMPLE_2_1].filter((r) => r[0] !== 'BALKON').length + 1; // + merdiven holü
    expect(Object.values(zemin.kapilar).reduce((s, x) => s + x, 0)).toBe(kapi);
  });

  it('statik: kalıp planları, döşeme, kolon, temel, jet grout, beton sınıfı', async () => {
    const { statik } = exampleDrawings();
    const a = await analyze(exampleDrawings().mimari, statik);
    const S = a.statik;
    const main = S.planlar.filter((p) => !p.kopya);
    expect(main.map((p) => [p.kat, p.tekrar])).toEqual(
      expect.arrayContaining([
        ['1. bodrum', 1],
        ['Zemin', 3],
        ['3. normal', 1],
      ]),
    );
    for (const p of main) {
      expect(p.doseme_kalinlik[0]![0]).toBe(15);
      expect(p.kolon_adet).toBe(24);
      expect(p.kolon_alan_m2).toBeCloseTo(24 * 0.18, 6);
      expect(p.kiris_kesit.map((k) => k[0])).toEqual(expect.arrayContaining(['30/50', '30/60']));
      // Döşeme: 25 × 16,5 m + konsol 15 × 1,5 m = 435 m² (ızgara çözünürlüğü payıyla).
      expect(p.doseme_alan_m2).toBeGreaterThan(425);
      expect(p.doseme_alan_m2).toBeLessThan(450);
      expect(p.alan_yontemi).toBe('kiriş ve döşeme kenarlarından kapalı alan');
    }
    expect(S.temel.A).toMatchObject({ tip: 'Radye', kalinlik_cm: 60 });
    expect(S.jet_grout.A).toEqual({ adet: 48, boy_m: 10, cap_cm: 60 });
    expect(S.beton_sinifi).toBe('C30');
  });

  it('daireler ve tipleri: her katta bir 3+1 ve bir 2+1', async () => {
    const a = await analyze(exampleDrawings().mimari, exampleDrawings().statik);
    const p = projectFromAnalysis(a, 'Deneme', SEC);
    expect(p.tipler!.map((t) => t.duzen).sort()).toEqual(['2+1', '3+1']);
    const normal = p.bloklar![0]!.katlar!.filter((k) => k.tur === 'normal');
    expect(normal.map((k) => [k.tekrar, (k.daireler ?? []).reduce((s, d) => s + Number(d.adet), 0)])).toEqual(
      [
        [1, 2],
        [3, 2],
      ],
    );
  });

  it('proje girdisi hesap motorunda çalışır; ölçülen beton ve yeni kalemler hesaba girer', async () => {
    const a = await analyze(exampleDrawings().mimari, exampleDrawings().statik);
    const p = projectFromAnalysis(a, 'Deneme', SEC);
    const s = calculate(p as ProjectInput) as CalculationResult;
    expect(s.hata).toBeUndefined();
    expect(s.ozet.piyasa).toBeGreaterThan(0);
    const rows = s.bloklar[0]!.satirlar.filter((r): r is ItemRow => !r.baslik);
    const beton = rows.find((r) => r.i === 8)!;
    expect(beton.metrajElle).toBe(true);
    expect(beton.metraj).toBe(p.duzeltmeler!.blok0!['8']!.metraj);
    expect(rows.find((r) => r.i === 10)!.metraj).toBeCloseTo((Number(beton.metraj) * 110) / 1000, 1);
    expect(rows.some((r) => r.ad.startsWith('Jet Grout') && r.ad.endsWith('(tahmini fiyat)'))).toBe(true);
  });

  it('pafta başlıkları: tekrarlar ve elenenler', () => {
    expect(parseFloorTitle('ZEMİN 1-2-3-4-5-6-7-8. KAT PLANI Ö:1/50')).toMatchObject({
      tur: 'normal',
      tekrar: 9,
    });
    expect(parseFloorTitle('A BLOK 2. BODRUM KAT PLANI')).toMatchObject({
      blok: 'A',
      tur: 'bodrum',
      tekrar: 1,
    });
    expect(parseFloorTitle('ÇATI KATI PLANI')).toMatchObject({ tur: 'catikati' });
    for (const t of [
      'VAZİYET PLANI',
      'A-A KESİT',
      'SU DEPOSU PLANI',
      'ZEMİN KAT KALIP PLANI',
      'LEJANT',
      'RADYE TEMEL PLANI',
    ])
      expect(parseFloorTitle(t), t).toBeNull();
  });
});

describe('özel durumlar', () => {
  it('başlıkta birim yanlış yazılmış (mm): ölçülere göre cm alınır, sonuç değişmez ve kullanıcı uyarılır', async () => {
    const dogru = await analyze(exampleDrawings().mimari, exampleDrawings().statik);
    const yanlis = await analyze(
      exampleDrawings({ insunits: 4 }).mimari,
      exampleDrawings({ insunits: 4 }).statik,
    );
    expect(yanlis.birim).toEqual({ mimari: 'cm', statik: 'cm', baslik: 'mm' });
    expect(plain(projectFromAnalysis(yanlis, 'D', SEC))).toEqual(plain(projectFromAnalysis(dogru, 'D', SEC)));
    expect(analysisWarnings(yanlis).join(' ')).toMatch(
      /başlığında birim "mm" yazıyor; çizim ölçülerine göre birim santimetre/,
    );
    expect(analysisWarnings(dogru).join(' ')).not.toMatch(/birim/);
  });

  it.each([
    ['milimetre', 10, 'mm', 4],
    ['metre', 0.01, 'm', 6],
  ] as const)(
    "çizim gerçekten %s ile çizilmiş: cm'ye çevrilir, sonuç cm çizimle aynı",
    async (_, olcek, birim, insunits) => {
      const cm = projectFromAnalysis(
        await analyze(exampleDrawings().mimari, exampleDrawings().statik),
        'D',
        SEC,
      );
      const o = { olcek, insunits };
      const a = await analyze(exampleDrawings(o).mimari, exampleDrawings(o).statik);
      expect(a.birim.mimari).toBe(birim);
      expect(a.birim.statik).toBe(birim);
      const p = projectFromAnalysis(a, 'D', SEC);
      const sc = calculate(cm as ProjectInput) as CalculationResult;
      const sx = calculate(p as ProjectInput) as CalculationResult;
      // Döşeme alanı 20 cm'lik ızgarayla ölçülür (prototip yöntemi): ölçeklemedeki kayan nokta artıkları
      // birkaç hücreyi kaydırabilir; toplam %0,5 içinde kalmalı. Mahaller, kapı ve pencereler birebir aynı.
      expect(Math.abs(sx.ozet.piyasa / sc.ozet.piyasa - 1)).toBeLessThan(0.005);
      expect(
        plain(a.mimari.katlar.map((k) => [k.tekrar, k.mahaller.map((m) => m.alan), k.kapilar, k.pencereler])),
      ).toEqual(
        plain(
          (await analyze(exampleDrawings().mimari, null)).mimari.katlar.map((k) => [
            k.tekrar,
            k.mahaller.map((m) => m.alan),
            k.kapilar,
            k.pencereler,
          ]),
        ),
      );
      expect(p.tipler).toEqual(cm.tipler);
    },
  );

  it('statikte aynı kat iki kez çizilmiş: kopya ayıklanır, beton değişmez', async () => {
    const tek = await analyze(exampleDrawings().mimari, exampleDrawings().statik);
    const kalip = [
      { baslik: '(-3.00) 1. BODRUM KAT TAVANI KALIP PLANI (1/50)', onek: 'K1B' },
      { baslik: '(+0.00) ZEMİN, 1., 2. NORMAL KAT TAVANI KALIP PLANI (1/50)', onek: 'KZ' },
      { baslik: '(+9.00) 3. NORMAL KAT TAVANI KALIP PLANI (1/50)', onek: 'K3' },
      { baslik: '(+0.00) ZEMİN, 1., 2. NORMAL KAT TAVANI KALIP PLANI (1/50)', onek: 'KZ' },
      { baslik: '(+9.00) 3. NORMAL KAT TAVANI DONATI PLANI (1/50)', onek: '' },
    ];
    const iki = await analyze(exampleDrawings().mimari, exampleDrawings({ kalip }).statik);
    expect(iki.statik.planlar.map((p) => p.kopya).sort()).toEqual(
      ['', '', '', 'adsız eş çizim (donatı/kalıp eşi)', 'aynı kat ikinci kez çizilmiş'].sort(),
    );
    const beton = (a: typeof tek) => projectFromAnalysis(a, 'D', SEC).duzeltmeler!.blok0!['8']!.metraj;
    expect(beton(iki)).toBe(beton(tek));
  });

  it('mimaride aynı kat iki kez çizilmiş: uyarılır; biri hariç bırakılınca tek çizimle aynı sonuç', async () => {
    const katlar = [
      { baslik: '1. BODRUM KAT PLANI Ö:1/50', plan: 'bodrum' as const },
      { baslik: 'ZEMİN KAT PLANI Ö:1/50', plan: 'konut' as const },
      { baslik: '1-2-3. KAT PLANI Ö:1/50', plan: 'konut' as const },
      { baslik: '1-2-3. KAT PLANI Ö:1/50', plan: 'konut' as const },
    ];
    const tek = await analyze(exampleDrawings().mimari, exampleDrawings().statik);
    const iki = await analyze(exampleDrawings({ katlar }).mimari, exampleDrawings().statik);
    expect(duplicateFloors(iki.mimari)).toEqual([[2, 3]]);
    expect(analysisWarnings(iki).join(' ')).toMatch(/aynı kat iki kez çizilmiş olabilir/);
    iki.mimari.katlar[3]!.haric = true;
    expect(analysisWarnings(iki).join(' ')).not.toMatch(/iki kez/);
    expect(plain(projectFromAnalysis(iki, 'D', SEC))).toEqual(plain(projectFromAnalysis(tek, 'D', SEC)));
  });

  it('statik dosyası yok: formülle tahmin edilir, uyarılır, hesap çalışır', async () => {
    const a = await analyze(exampleDrawings().mimari, null);
    expect(a.statikVar).toBe(false);
    expect(analysisWarnings(a)).toContain(
      'Statik DXF yüklenmedi: beton, kalıp ve temel formülle tahmin edilir.',
    );
    const p = projectFromAnalysis(a, 'D', SEC);
    expect(p.duzeltmeler).toEqual({});
    expect(p.bloklar![0]!._ovr).not.toHaveProperty('BIA');
    expect((calculate(p as ProjectInput) as CalculationResult).ozet.piyasa).toBeGreaterThan(0);
  });

  it('Türkçe Windows (1254) kodlu dosya da okunur', async () => {
    const tr: Record<string, number> = {
      ı: 0xfd,
      İ: 0xdd,
      ş: 0xfe,
      Ş: 0xde,
      ğ: 0xf0,
      Ğ: 0xd0,
      ç: 0xe7,
      Ç: 0xc7,
      ö: 0xf6,
      Ö: 0xd6,
      ü: 0xfc,
      Ü: 0xdc,
      '²': 0xb2,
    };
    const m = exampleDrawings().mimari;
    const bytes = Uint8Array.from([...m].map((c) => (c.charCodeAt(0) < 128 ? c.charCodeAt(0) : tr[c]!)));
    expect(bytes.some((b) => b === 0xdd)).toBe(true);
    const a = await analyze(bytes, exampleDrawings().statik);
    const b = await analyze(m, exampleDrawings().statik);
    expect(plain(a.mimari)).toEqual(plain(b.mimari));
  });

  it('kat planı olmayan çizimde Türkçe hata', async () => {
    const r = analyzeDrawings(await readDxfBytes(exampleDrawings().statik), null);
    expect(r).toEqual({ hata: 'Mimari dosyada okunabilir kat planı bulunamadı.' });
  });

  it('kaplama: çizimdeki geçerli; ıslak hacimde "boya" seramik sayılır ve uyarılır; seçim kuraldan önce gelir', async () => {
    const a = await analyze(exampleDrawings().mimari, null);
    const banyo = a.mimari.katlar[1]!.mahaller.find((m) => m.ad === 'BANYO')!;
    expect(dxf.chosenFinish(banyo, 'zemin')).toBe('Seramik');
    expect(dxf.chosenFinish(banyo, 'tavan')).toBe('Plastik boya'); // çizimde "Boya" yazıyor
    const salon = a.mimari.katlar[1]!.mahaller.find((m) => m.ad === 'SALON')!;
    expect(dxf.chosenFinish(salon, 'zemin')).toBe('Laminat parke');
    const ayri = await analyze(exampleDrawings({ mahalYazisi: 'ayri' }).mimari, null);
    const wc = ayri.mimari.katlar[1]!.mahaller.find((m) => m.ad === 'WC')!;
    expect([
      dxf.chosenFinish(wc, 'zemin'),
      dxf.chosenFinish(wc, 'duvar'),
      dxf.chosenFinish(wc, 'tavan'),
    ]).toEqual(['Seramik', 'Seramik', 'Asma tavan (yeşil alçıpan)']);
    // Islak hacimde çizimde boya → uyarı
    banyo.duvar = 'Boya';
    expect(analysisWarnings(a).join(' ')).toMatch(/ıslak hacimde duvar kaplaması çizimde "boya" yazıyor/);
    // Kullanıcı seçimi
    salon.secim = { zemin: 'Mermer' };
    expect(dxf.chosenFinish(salon, 'zemin')).toBe('Mermer');
  });
});
