/**
 * Yönetici fiyat güncelleme tablosu (Excel): üretme ve doldurulmuş dosyayı okuma.
 */
import { effectivePrice, priceItems, type PriceList, type SheetRows } from '@repiom/core';
import ExcelJS from 'exceljs';

const ANTRASIT = 'FF1F2937';
const solid = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const thin = { style: 'thin' as const, color: { argb: 'FFBFBFBF' } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

export const PRICE_SHEET_NAME = 'Birim Fiyatlar';

/** Güncelleme tablosu: mevcut fiyatlar ve boş, sarı "YENİ Birim Fiyat" sütunu. */
export async function buildPriceUpdateTable(
  list: PriceList | null | undefined,
  info = '',
): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'REPİO(M)';
  const ws = wb.addWorksheet(PRICE_SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 4, topLeftCell: 'A5' }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  [8, 8, 58, 9, 11, 18, 46, 18].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  const font = { name: 'Arial', size: 10 };
  ws.getCell('A1').value = 'REPİO(M) birim fiyat güncelleme tablosu';
  ws.getCell('A1').font = { bold: true, size: 12, color: { argb: ANTRASIT }, name: 'Arial' };
  ws.mergeCells('A2:H2');
  ws.getCell('A2').value =
    `${info ? info + ' ' : ''}Yalnız sarı "YENİ Birim Fiyat" sütununu doldur; boş bıraktığın kalemin fiyatı değişmez. ` +
    'Kod sütununa dokunma, satır ekleyip silme. Fiyatlar TL, KDV hariç, İstanbul bazı.';
  ws.getCell('A2').font = { italic: true, size: 9, color: { argb: 'FF4B5563' }, name: 'Arial' };
  ws.getCell('A2').alignment = { wrapText: true, vertical: 'top' };
  ws.getRow(2).height = 30;
  const head = ws.getRow(4);
  [
    'Kod',
    'Sıra',
    'İş Kalemi',
    'Birim',
    'Fiyat türü',
    'Mevcut Birim Fiyat',
    'Formül (formüllü kalemlerde)',
    'YENİ Birim Fiyat',
  ].forEach((t, i) => {
    const c = head.getCell(i + 1);
    c.value = t;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 };
    c.fill = solid(ANTRASIT);
    c.border = box;
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  let r = 5;
  for (const k of priceItems()) {
    const row = ws.getRow(r++);
    if (k.baslik) {
      row.values = ['', k.sira, k.ad];
      for (let i = 1; i <= 8; i++) {
        const c = row.getCell(i);
        c.font = { ...font, bold: true };
        c.fill = solid('FFE5E7EB');
        c.border = box;
      }
      continue;
    }
    const f = effectivePrice(k, list);
    const special = typeof list?.[k.kod] === 'number' && !k.sabit;
    row.values = [
      k.kod,
      k.sira,
      k.ad,
      k.birim || '',
      k.sabit || special ? 'Sabit' : 'Formül',
      f === null ? '' : f,
      k.sabit ? '' : (special ? 'Sabit fiyatla değiştirilmiş. Formül: ' : '') + k.formul,
      null,
    ];
    for (let i = 1; i <= 8; i++) {
      const c = row.getCell(i);
      c.font = font;
      c.border = box;
      if (i === 3 || i === 7) c.alignment = { wrapText: true, vertical: 'top' };
    }
    row.getCell(6).numFmt = '#,##0.00';
    row.getCell(8).numFmt = '#,##0.00';
    row.getCell(8).fill = solid('FFFFF2CC');
  }
  r++;
  const note = (t: string) => {
    const c = ws.getCell(`A${r++}`);
    c.value = t;
    c.font = { italic: true, size: 9, color: { argb: 'FF4B5563' }, name: 'Arial' };
  };
  note(
    'All risk sigortası ve öngörülemeyen giderler toplam maliyetin yüzdesi olduğu için bu tabloda yer almaz.',
  );
  note(
    'Formüllü kalemlere rakam yazarsan o kalem proje büyüklüğünden bağımsız sabit fiyatla hesaplanır. Formülün kendisini değiştirmek için geliştiriciye bildir.',
  );
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

export const NOT_XLSX_ERROR = 'Dosya okunamadı. Bir Excel (.xlsx) dosyası seç.';

/** Excel dosyasındaki sayfaları satır dizileri olarak döner (hücre değeri: sayı, metin ya da null). */
export async function readWorkbookRows(bytes: Uint8Array | ArrayBuffer): Promise<SheetRows> {
  const wb = new ExcelJS.Workbook();
  const buf =
    bytes instanceof Uint8Array
      ? (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
      : bytes;
  try {
    await wb.xlsx.load(buf);
  } catch {
    throw new Error(NOT_XLSX_ERROR);
  }
  const out: SheetRows = {};
  wb.eachSheet((ws) => {
    const rows: unknown[][] = [];
    ws.eachRow({ includeEmpty: false }, (row, n) => {
      const cells: unknown[] = [];
      row.eachCell({ includeEmpty: false }, (c, col) => {
        cells[col - 1] = cellValue(c.value);
      });
      rows[n - 1] = cells;
    });
    out[ws.name] = rows;
  });
  return out;
}

function cellValue(v: ExcelJS.CellValue): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('result' in v) return (v as { result?: unknown }).result ?? null; // formül
    if ('richText' in v) return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join('');
    if ('text' in v) return (v as { text: string }).text; // bağlantı
    if ('error' in v) return null;
  }
  return null;
}
