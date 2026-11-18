/**
 * Excel raporu testleri.
 * (1) Yapı: sayfalar, canlı formüller, gizli satırlar, önbellek değerlerinin motorla aynılığı.
 * (2) LibreOffice: yalnız formüllerle yazılan dosya LibreOffice'te yeniden hesaplanır; hiçbir hücrede hata yok
 *     ve tüm toplamlar motorla kuruşu kuruşuna aynı.
 */
import {
  calculate,
  emptyBlock,
  emptyProject,
  exampleProject,
  siteBlockTemplate,
  type CalculationResult,
  type ProjectInput,
} from '@repiom/core';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildExcel } from '../src';
import { recalculate, runner } from './libreoffice';

function calc(p: ProjectInput): CalculationResult {
  const r = calculate(p);
  if (r.hata !== undefined) throw new Error(r.hata);
  return r;
}

const scenarios: [string, ProjectInput][] = [
  ['ornek', exampleProject()],
  ['site', siteBlockTemplate(Object.assign(emptyProject(), { blokAdedi: 2, toplamInsaatAlani: 20000 }))],
  [
    'duzeltmeli',
    Object.assign(emptyProject(), {
      ad: "A'nın Projesi: [test]",
      toplamInsaatAlani: 9000,
      blokAdedi: 3,
      kdvOrani: 10,
      bloklar: [
        emptyBlock(0),
        Object.assign(emptyBlock(1), { ad: 'Özet' }),
        Object.assign(emptyBlock(2), { ad: 'Özet' }),
      ],
      duzeltmeler: {
        blok0: { '1': { metraj: 1234.5 }, '5': { piyasa: 999 } },
        proje: { '160': { metraj: 3 } },
      },
      ekKalemler: {
        blok0: [{ grup: 3, ad: 'Jet grout', birim: 'm', metraj: 120, fiyat: 2100, kaynak: 'tahmini' }],
      },
    }),
  ],
];

async function load(bytes: Uint8Array) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  );
  return wb;
}

/** Hücrenin sayısal değeri (formülse sonucu). */
function value(c: ExcelJS.Cell): unknown {
  const v = c.value as unknown;
  // ExcelJS, dosyada <v>0</v> olan formül sonucunu okurken düşürür; sonuç yoksa 0 sayılır (XML ayrıca denetlenir).
  if (v && typeof v === 'object' && ('formula' in (v as object) || 'sharedFormula' in (v as object))) {
    return (v as { result?: unknown }).result ?? 0;
  }
  return v;
}

/** Bir sayfada etiketi verilen satırın F sütunu. */
function totalOf(ws: ExcelJS.Worksheet, label: string, col = 6): number {
  let out: number | undefined;
  ws.eachRow((row) => {
    if (row.getCell(2).value === label) out = value(row.getCell(col)) as number;
  });
  if (out === undefined) throw new Error(`${ws.name}: "${label}" satırı yok`);
  return out;
}

const kurus = (x: number) => Math.round(x * 100);

describe('Excel raporu: yapı', () => {
  it.each(scenarios)('%s: sayfalar, formüller ve önbellek değerleri', async (_, p) => {
    const s = calc(p);
    const wb = await load(await buildExcel(s, p, { tarih: '01.01.2026' }));
    const names = wb.worksheets.map((w) => w.name);
    expect(names[0]).toBe('Özet');
    expect(names[1]).toBe('Tüm Proje');
    expect(names.at(-2)).toBe('Proje Geneli');
    expect(names.at(-1)).toBe('Girdiler');
    expect(names).toHaveLength(s.bloklar.length + 4);
    expect(new Set(names.map((n) => n.toLocaleLowerCase('tr'))).size).toBe(names.length);

    const all = wb.getWorksheet('Tüm Proje')!;
    expect(kurus(totalOf(all, 'TOPLAM (KDV hariç)'))).toBe(kurus(s.ozet.piyasa));
    expect(kurus(totalOf(all, 'TOPLAM (KDV dahil)'))).toBe(kurus(s.ozet.piyasaKdvDahil));
    const oz = wb.getWorksheet('Özet')!;
    expect((oz.getCell('B11').value as { formula: string }).formula).toMatch(/'Tüm Proje'!F\d+/);
    expect(oz.getCell('B16').value).toBe(s.ozet.kdvOrani);
    expect((oz.getCell('B17').value as { formula: string }).formula).toBe('B11*B16');

    // Kalem satırlarında tutar formül; metrajı 0 olanlar gizli.
    let formulas = 0;
    let hidden = 0;
    all.eachRow((row) => {
      const f = row.getCell(6).value as { formula?: string } | null;
      if (f && typeof f === 'object' && f.formula?.startsWith('D')) {
        formulas++;
        if (!row.getCell(4).value) {
          expect(row.hidden).toBe(true);
          hidden++;
        }
      }
    });
    expect(formulas).toBeGreaterThan(100);
    expect(hidden).toBeGreaterThan(0);
  });

  it('elle düzeltilen hücreler sarı', async () => {
    const p = scenarios[2]![1];
    const wb = await load(await buildExcel(calc(p), p));
    const ws = wb.worksheets[2]!; // ilk blok
    let found = false;
    ws.eachRow((row) => {
      if (row.getCell(4).value === 1234.5) {
        found = true;
        expect((row.getCell(4).fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFFFF2CC');
      }
    });
    expect(found).toBe(true);
  });
});

describe.skipIf(!runner && !process.env.REQUIRE_LIBREOFFICE)(
  'Excel raporu: LibreOffice ile yeniden hesap',
  () => {
    it('formül hatası yok ve tüm toplamlar motorla kuruşu kuruşuna aynı', async () => {
      if (!runner) throw new Error('LibreOffice gerekli (REQUIRE_LIBREOFFICE) ama bulunamadı.');
      const inputs: Record<string, Uint8Array> = {};
      const results: Record<string, CalculationResult> = {};
      for (const [name, p] of scenarios) {
        results[name] = calc(p);
        inputs[name + '.xlsx'] = await buildExcel(results[name]!, p, { cachedValues: false });
      }
      const out = recalculate(inputs);
      for (const [name] of scenarios) {
        const s = results[name]!;
        const wb = await load(out[name + '.xlsx']!);
        // Dosyanın XML'inde: hata değeri (t="e": #REF!, #NAME?, #DIV/0!, #VALUE! …) olan ya da sonucu yazılmamış
        // formül hücresi olmamalı. (ExcelJS 0 sonucunu okurken düşürdüğü için kontrol XML üzerinden yapılır.)
        const problems: string[] = [];
        let formulaCells = 0;
        const zip = await JSZip.loadAsync(out[name + '.xlsx']!);
        for (const f of Object.keys(zip.files).filter((x) => /^xl\/worksheets\/sheet\d+\.xml$/.test(x))) {
          const xml = await zip.file(f)!.async('string');
          for (const m of xml.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>(.*?)<\/c>)/g)) {
            const [, addr, attrs, body = ''] = m;
            if (body.includes('<f')) formulaCells++;
            if (/t="e"/.test(attrs!)) problems.push(`${f} ${addr}: hata ${body}`);
            else if (body.includes('<f') && !/<v>[^<]*<\/v>/.test(body))
              problems.push(`${f} ${addr}: sonuç yok`);
          }
        }
        expect(problems, name).toEqual([]);
        expect(formulaCells, name).toBeGreaterThan(300);

        const all = wb.getWorksheet('Tüm Proje')!;
        expect(kurus(totalOf(all, 'TOPLAM (KDV hariç)')), `${name} Tüm Proje`).toBe(kurus(s.ozet.piyasa));
        expect(kurus(totalOf(all, 'TOPLAM (KDV dahil)')), `${name} KDV dahil`).toBe(
          kurus(s.ozet.piyasaKdvDahil),
        );
        s.bloklar.forEach((b, i) => {
          const ws = wb.worksheets[2 + i]!;
          expect(kurus(totalOf(ws, 'TOPLAM (KDV hariç)')), `${name} ${b.ad}`).toBe(kurus(b.toplam.piyasa));
        });
        const pg = wb.getWorksheet('Proje Geneli')!;
        expect(kurus(totalOf(pg, 'TOPLAM (KDV hariç)')), `${name} PG`).toBe(
          kurus(s.projeGeneli.toplam.piyasa),
        );
        const oz = wb.getWorksheet('Özet')!;
        const v = (a: string) => value(oz.getCell(a)) as number;
        expect(kurus(v('B11'))).toBe(kurus(s.ozet.piyasa));
        expect(kurus(v('B12'))).toBe(kurus(s.ozet.m2Piyasa));
        expect(kurus(v('B17'))).toBe(kurus(s.ozet.piyasaKdv));
        expect(kurus(v('B18'))).toBe(kurus(s.ozet.piyasaKdvDahil));
        expect(kurus(v('B19'))).toBe(kurus(s.ozet.m2KdvDahil));
      }
    }, 240_000);
  },
);
