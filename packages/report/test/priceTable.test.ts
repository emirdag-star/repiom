/** Fiyat güncelleme tablosu: üret → Excel'de doldur (ExcelJS ve LibreOffice ile kaydet) → oku → ayıkla. */
import { extractNewPrices, priceItemByCode, priceItems } from '@repiom/core';
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { buildPriceUpdateTable, NOT_XLSX_ERROR, PRICE_SHEET_NAME, readWorkbookRows } from '../src';
import { recalculate, runner } from './libreoffice';

async function fill(bytes: Uint8Array, values: Record<string, unknown>): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  );
  const ws = wb.getWorksheet(PRICE_SHEET_NAME)!;
  ws.eachRow((row) => {
    const kod = row.getCell(1).value;
    if (typeof kod === 'string' && kod in values) row.getCell(8).value = values[kod] as ExcelJS.CellValue;
  });
  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

describe('fiyat güncelleme tablosu', () => {
  it('tüm kalemler, mevcut fiyatlarla; YENİ sütunu boş', async () => {
    const list = { K001: 999 };
    const rows = (await readWorkbookRows(await buildPriceUpdateTable(list, 'Yayındaki liste: Test.')))[
      PRICE_SHEET_NAME
    ]!;
    expect(rows[3]).toEqual([
      'Kod',
      'Sıra',
      'İş Kalemi',
      'Birim',
      'Fiyat türü',
      'Mevcut Birim Fiyat',
      'Formül (formüllü kalemlerde)',
      'YENİ Birim Fiyat',
    ]);
    const codes = rows.filter((r) => typeof r?.[0] === 'string' && /^K\d{3}$/.test(r[0] as string));
    expect(codes).toHaveLength(Object.keys(priceItemByCode()).length);
    expect(codes.find((r) => r[0] === 'K001')![5]).toBe(999);
    expect(codes.every((r) => r[7] === undefined || r[7] === null)).toBe(true);
    expect(rows.filter(Boolean).length).toBeGreaterThan(priceItems().length);
  });

  it('doldurulan değerler (sayı ve Türkçe metin) okunur; boş bırakılanlar değişmez', async () => {
    const filled = await fill(await buildPriceUpdateTable({}), { K001: 350, K002: '1.250,50', K003: '' });
    const r = extractNewPrices(await readWorkbookRows(filled));
    expect(r).toEqual({ fiyatlar: { K001: 350, K002: 1250.5 }, hatalar: [] });
  });

  it.skipIf(!runner)(
    'LibreOffice ile kaydedilmiş dosya da okunur',
    async () => {
      const filled = await fill(await buildPriceUpdateTable({}), { K001: 410, K005: 1500.25 });
      const lo = recalculate({ 'fiyat.xlsx': filled })['fiyat.xlsx']!;
      expect(extractNewPrices(await readWorkbookRows(lo))).toEqual({
        fiyatlar: { K001: 410, K005: 1500.25 },
        hatalar: [],
      });
    },
    120_000,
  );

  it('Excel olmayan dosyada Türkçe hata', async () => {
    await expect(readWorkbookRows(new TextEncoder().encode('bu bir excel değil'))).rejects.toThrow(
      NOT_XLSX_ERROR,
    );
  });
});
