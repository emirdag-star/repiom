/** Fiyat listesi mantığı: prototip (reference/fiyat.js) ile karşılaştırma ve kurallar. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  diffPrices,
  extractNewPrices,
  mergePrices,
  parseLocaleNumber,
  PRICE_TABLE_ERROR,
  priceItemByCode,
  priceItems,
  type SheetRows,
} from '../src';

type LegacyF = {
  kalemler: () => unknown[];
  sayiCevir: (x: unknown) => number | null;
  yeniFiyatlar: (s: unknown) => { fiyatlar: Record<string, number>; hatalar: string[] };
  farklar: (y: unknown, m: unknown) => unknown[];
};
const ctx: Record<string, unknown> = {};
const dir = join(__dirname, '..', 'reference');
for (const f of ['veri.js', 'hesap.js', 'fiyat.js']) runInNewContext(readFileSync(join(dir, f), 'utf8'), ctx);
const L = ctx.REPIOM_FIYAT as LegacyF;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

function table(values: Record<string, unknown>, extra: unknown[][] = []): SheetRows {
  const rows: unknown[][] = [
    ['REPİO(M) birim fiyat güncelleme tablosu'],
    ['açıklama'],
    [],
    ['Kod', 'Sıra', 'İş Kalemi', 'Birim', 'Fiyat türü', 'Mevcut Birim Fiyat', 'Formül', 'YENİ Birim Fiyat'],
  ];
  for (const k of priceItems()) {
    if (k.baslik) rows.push(['', k.sira, k.ad]);
    else rows.push([k.kod, k.sira, k.ad, k.birim, '', k.varsayilan ?? '', '', values[k.kod] ?? null]);
  }
  return { 'Birim Fiyatlar': [...rows, ...extra] };
}

describe('fiyat listesi: prototiple aynı', () => {
  it('kalem listesi (kod, sıra, sabit/formül, varsayılan fiyat) aynı', () => {
    expect(plain(priceItems())).toEqual(
      plain(L.kalemler()).map((k) => Object.fromEntries(Object.entries(k as object))),
    );
  });

  it('sayı okuma aynı', () => {
    const cases = [
      '1.250,50',
      '1250.5',
      '1250',
      '1.250',
      '1,250',
      '₺ 3.400',
      '320 TL',
      '12,5',
      '',
      '  ',
      'abc',
      7,
      -3,
      null,
      undefined,
      '1.234.567,89',
      '0,5',
      '2.5',
    ];
    for (const c of cases)
      expect(parseLocaleNumber(c), String(c)).toBe(
        L.sayiCevir(c) === null || Number.isNaN(L.sayiCevir(c)) ? null : L.sayiCevir(c),
      );
  });

  it('tablodan fiyat ayıklama ve farklar aynı', () => {
    const codes = Object.keys(priceItemByCode());
    const values: Record<string, unknown> = {};
    codes.forEach((k, i) => {
      if (i % 7 === 0) values[k] = (i + 1) * 100;
      if (i % 11 === 0) values[k] = `${i},50`;
    });
    const sheets = table(values, [
      ['K999', '', '', '', '', '', '', 5],
      [codes[0], '', '', '', '', '', '', 'yanlış'],
    ]);
    const got = extractNewPrices(sheets);
    const want = L.yeniFiyatlar(sheets);
    expect(plain(got)).toEqual(plain(want));
    const current = { [codes[0]!]: 1, [codes[1]!]: 2 };
    expect(plain(diffPrices(got.fiyatlar, current))).toEqual(plain(L.farklar(want.fiyatlar, current)));
  });
});

describe('fiyat listesi kuralları', () => {
  it('all risk, öngörülemeyen ve tipe bağlı ikinci satırlar listede yok', () => {
    const codes = Object.keys(priceItemByCode());
    for (const k of ['K179', 'K219', 'K092', 'K097', 'K110']) expect(codes).not.toContain(k);
    expect(codes).toContain('K001');
  });

  it('başlık satırı bulunamazsa Türkçe hata', () => {
    expect(() =>
      extractNewPrices({
        Sayfa1: [
          ['a', 'b'],
          [1, 2],
        ],
      }),
    ).toThrow(PRICE_TABLE_ERROR);
  });

  it('bilinmeyen kod, negatif ve aşırı büyük fiyat reddedilir; boş hücre değişiklik sayılmaz', () => {
    const r = extractNewPrices(
      table({ K001: -5, K002: 1e12, K003: '' }, [['K500', '', '', '', '', '', '', 10]]),
    );
    expect(r.fiyatlar).toEqual({});
    expect(r.hatalar).toEqual([
      'K001: "-5" geçerli bir fiyat değil',
      'K002: "1000000000000" geçerli bir fiyat değil',
      'K500: bilinmeyen kod',
    ]);
  });

  it('fark: aynı fiyat değişiklik değildir; formüllü kalem sabite geçince işaretlenir', () => {
    const k1 = priceItemByCode().K001!;
    expect(diffPrices({ K001: k1.varsayilan! }, {})).toEqual([]);
    const formullu = Object.values(priceItemByCode()).find((k) => !k.sabit)!;
    const d = diffPrices({ [formullu.kod]: 5000 }, {});
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ eski: null, yeni: 5000, oran: null, formulDegisir: true });
    expect(diffPrices({ K001: k1.varsayilan! * 1.1 }, {})[0]!.oran).toBeCloseTo(0.1, 10);
  });

  it('birleştirme mevcut listeyi korur, yenileri üzerine yazar', () => {
    expect(mergePrices({ K001: 1, K002: 2 }, { K002: 3, K004: 4 })).toEqual({ K001: 1, K002: 3, K004: 4 });
    expect(mergePrices(null, { K001: 5 })).toEqual({ K001: 5 });
  });
});
