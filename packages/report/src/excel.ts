/**
 * Excel raporu (.xlsx). Sayfalar: Özet, Tüm Proje, her blok, Proje Geneli, Girdiler.
 * Metraj ve birim fiyat değer olarak yazılır; tutar, ara toplamlar, genel toplam, KDV ve özet hücreleri canlı formüldür.
 * Metrajı 0 olan kalemler gizli satırdır (formüller onları da kapsar). KDV oranı Özet sayfasında değiştirilebilir.
 */
import type { CalculationResult, ProjectInput, ResultRow } from '@repiom/core';
import ExcelJS from 'exceljs';
import {
  BURIED_NAMES,
  facilitiesText,
  FLOOR_NAMES,
  formatDate,
  inputText,
  isBlank,
  REPORT_NOTE,
  REPORT_TITLE,
  SYSTEM_NAMES,
} from './common';

/* ---------- Stiller ---------- */
const ANTRASIT = 'FF1F2937';
const GRI = 'FFE5E7EB';
const SARI = 'FFFFF2CC';
const ACIK = 'FFF3F4F6';
const thin = { style: 'thin' as const, color: { argb: 'FFBFBFBF' } };
const box = { top: thin, left: thin, bottom: thin, right: thin };
const solid = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

type StyleName =
  | 'baslikSatiri'
  | 'grup'
  | 'grupSayi'
  | 'metin'
  | 'metinSol'
  | 'ondalik'
  | 'tam'
  | 'anaBaslik'
  | 'altBaslik'
  | 'etiket'
  | 'buyukTL'
  | 'yuzde'
  | 'yuzdeGirdi'
  | 'toplamSayi'
  | 'toplamMetin'
  | 'elle'
  | 'notYazi'
  | 'alan';

const STYLES: Record<StyleName, Partial<ExcelJS.Style>> = {
  baslikSatiri: {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 },
    fill: solid(ANTRASIT),
    border: box,
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  },
  grup: { font: { bold: true, name: 'Arial', size: 10 }, fill: solid(GRI), border: box },
  grupSayi: { font: { bold: true, name: 'Arial', size: 10 }, fill: solid(GRI), border: box, numFmt: '#,##0' },
  metin: { font: { name: 'Arial', size: 10 }, border: box, alignment: { vertical: 'top', wrapText: true } },
  metinSol: { font: { name: 'Arial', size: 10 }, alignment: { horizontal: 'left' } },
  ondalik: { font: { name: 'Arial', size: 10 }, border: box, numFmt: '#,##0.00' },
  tam: { font: { name: 'Arial', size: 10 }, border: box, numFmt: '#,##0' },
  anaBaslik: { font: { bold: true, size: 16, color: { argb: ANTRASIT }, name: 'Arial' } },
  altBaslik: { font: { bold: true, size: 12, color: { argb: ANTRASIT }, name: 'Arial' } },
  etiket: { font: { bold: true, name: 'Arial', size: 10 } },
  buyukTL: { font: { bold: true, size: 12, color: { argb: ANTRASIT }, name: 'Arial' }, numFmt: '#,##0" TL"' },
  yuzde: { font: { name: 'Arial', size: 10 }, border: box, numFmt: '0.0%' },
  yuzdeGirdi: {
    font: { bold: true, color: { argb: 'FFC2410C' }, name: 'Arial', size: 10 },
    fill: solid(SARI),
    border: box,
    numFmt: '0.0%',
  },
  toplamSayi: {
    font: { bold: true, name: 'Arial', size: 10 },
    fill: solid(ACIK),
    border: { top: { style: 'medium', color: { argb: ANTRASIT } } },
    numFmt: '#,##0',
  },
  toplamMetin: {
    font: { bold: true, name: 'Arial', size: 10 },
    fill: solid(ACIK),
    border: { top: { style: 'medium', color: { argb: ANTRASIT } } },
  },
  elle: { font: { name: 'Arial', size: 10 }, fill: solid(SARI), border: box, numFmt: '#,##0.00' },
  notYazi: {
    font: { italic: true, size: 9, color: { argb: 'FF4B5563' }, name: 'Arial' },
    alignment: { wrapText: true, vertical: 'top' },
  },
  alan: { font: { name: 'Arial', size: 10 }, numFmt: '#,##0" m²"', alignment: { horizontal: 'left' } },
};

/** Basit sayfa modeli: önce satırlar kurulur, sonra ExcelJS'e yazılır. */
interface Cell {
  v?: string | number | null;
  f?: string;
  s?: StyleName;
}
type CellInput = Cell | string | number | null | undefined;

class Sheet {
  rows: (CellInput[] | undefined)[] = [];
  widths: number[] = [];
  merges: string[] = [];
  hidden = new Set<number>();
  freeze = 0;
  landscape = false;
  constructor(public readonly name: string) {}
  add(cells: CellInput[], hidden = false): number {
    this.rows.push(cells);
    if (hidden) this.hidden.add(this.rows.length);
    return this.rows.length;
  }
  blank(): number {
    return this.add([]);
  }
  cell(row: number, col: number): Cell {
    return this.rows[row - 1]![col] as Cell;
  }
}

/** Sayfa adı: en çok 31 karakter, yasak karakterler yok, benzersiz. */
function sheetName(name: unknown, used: Set<string>): string {
  const s =
    String(name || 'Sayfa')
      .replace(/[[\]:*?/\\]/g, ' ')
      .trim()
      .slice(0, 31) || 'Sayfa';
  let a = s;
  let n = 2;
  while (used.has(a.toLocaleLowerCase('tr'))) {
    const ek = ' (' + n++ + ')';
    a = s.slice(0, 31 - ek.length) + ek;
  }
  used.add(a.toLocaleLowerCase('tr'));
  return a;
}
const ref = (sheet: string, cell: string) => "'" + sheet.replace(/'/g, "''") + "'!" + cell;

interface ItemSheet {
  sheet: Sheet;
  totalCell: string;
  total: number;
  groupCells: string[];
}

/** Kalem tablosu: metrajı 0 olan satırlar gizlenir; tutar ve ara toplamlar formüldür. */
function itemSheet(
  name: string,
  projectName: string,
  title: string,
  data: { satirlar: ResultRow[] },
  kdv?: { rateRef: string; rate: number },
): ItemSheet {
  const s = new Sheet(name);
  const groups: { row: number; first: number; last: number }[] = [];
  let active: { row: number; first: number; last: number } | null = null;
  s.widths = [8, 62, 9, 15, 16, 18];
  s.add([{ v: projectName + ' - ' + title, s: 'altBaslik' }]);
  s.merges.push('A1:F1');
  s.add([
    {
      v: 'Tutarlar TL, KDV hariç. Metrajı 0 olan kalemler gizlidir. Sarı hücreler kullanıcı tarafından düzeltilmiştir.',
      s: 'notYazi',
    },
  ]);
  s.merges.push('A2:F2');
  s.blank();
  s.add(
    ['Sıra', 'İş Kalemi', 'Birim', 'Yaklaşık Metraj', 'Birim Fiyat (TL)', 'Tutar (TL)'].map((x) => ({
      v: x,
      s: 'baslikSatiri' as const,
    })),
  );
  s.freeze = 4;
  for (const r of data.satirlar) {
    if (r.baslik) {
      if (active) active.last = s.rows.length;
      const n = s.add([
        { v: String(r.no), s: 'grup' },
        { v: r.ad, s: 'grup' },
        { v: '', s: 'grup' },
        { v: '', s: 'grup' },
        { v: '', s: 'grup' },
        { v: 0, s: 'grupSayi' },
      ]);
      active = { row: n, first: n + 1, last: n };
      groups.push(active);
      continue;
    }
    const n = s.rows.length + 1;
    s.add(
      [
        { v: r.no ?? '', s: 'metin' },
        { v: r.ad, s: 'metin' },
        { v: r.birim || '', s: 'metin' },
        { v: r.metraj, s: r.metrajElle ? 'elle' : 'ondalik' },
        { v: r.piyasaFiyat, s: r.piyasaElle ? 'elle' : 'ondalik' },
        { f: `D${n}*E${n}`, v: r.metraj * r.piyasaFiyat, s: 'tam' },
      ],
      !r.metraj,
    );
  }
  if (active) active.last = s.rows.length;
  for (const g of groups) {
    const c = s.cell(g.row, 5);
    c.f = g.last >= g.first ? `SUM(F${g.first}:F${g.last})` : '0';
    c.v = s.rows
      .slice(g.first - 1, g.last)
      .reduce((a, row) => a + (((row?.[5] as Cell | undefined)?.v as number) || 0), 0);
  }
  const total = groups.reduce((a, g) => a + (s.cell(g.row, 5).v as number), 0);
  s.blank();
  const t = s.add([
    { v: '', s: 'toplamMetin' },
    { v: 'TOPLAM (KDV hariç)', s: 'toplamMetin' },
    { v: '', s: 'toplamMetin' },
    { v: '', s: 'toplamMetin' },
    { v: '', s: 'toplamMetin' },
    { f: groups.map((g) => 'F' + g.row).join('+') || '0', v: total, s: 'toplamSayi' },
  ]);
  if (kdv) {
    const k1 = s.add([
      '',
      { v: 'KDV', s: 'etiket' },
      '',
      '',
      { f: kdv.rateRef, v: kdv.rate, s: 'yuzde' },
      { f: `F${t}*E${t + 1}`, v: total * kdv.rate, s: 'tam' },
    ]);
    s.add([
      { v: '', s: 'toplamMetin' },
      { v: 'TOPLAM (KDV dahil)', s: 'toplamMetin' },
      { v: '', s: 'toplamMetin' },
      { v: '', s: 'toplamMetin' },
      { v: '', s: 'toplamMetin' },
      { f: `F${t}+F${k1}`, v: total * (1 + kdv.rate), s: 'toplamSayi' },
    ]);
  }
  return { sheet: s, totalCell: 'F' + t, total, groupCells: groups.map((g) => 'F' + g.row) };
}

function inputsSheet(name: string, p: ProjectInput): Sheet {
  const g = new Sheet(name);
  const typeName: Record<string, string> = {};
  g.widths = [26, 18, 14, 14, 16, 46];
  (p.tipler || []).forEach((t) => {
    typeName[t.id] = String(t.ad || t.duzen || 'Tip') + (t.ad && t.duzen ? ' (' + t.duzen + ')' : '');
  });
  g.add([{ v: 'Girilen bilgiler', s: 'altBaslik' }]);
  g.add([
    {
      v: 'Bu sayfa kullanıcının girdiği bilgileri gösterir. Girilmeyen bilgiler hesapta tipik konut varsayımlarıyla tamamlanmıştır.',
      s: 'notYazi',
    },
  ]);
  g.merges.push('A2:F2');
  g.blank();
  g.add([{ v: 'Proje', s: 'etiket' }]);
  const rows: [string, string][] = [
    ['Proje ismi', inputText(p.ad)],
    ['İl', inputText(p.il)],
    ['Arsa alanı', inputText(p.arsa, 'm²')],
    ['Blok adedi', inputText(p.blokAdedi)],
    ['Toplam oturum alanı', inputText(p.toplamOturum, 'm²')],
    ['Toplam inşaat alanı', inputText(p.toplamInsaatAlani, 'm²')],
    ['İnşaat süresi', inputText(p.sureAy, 'ay')],
    ['KDV oranı', isBlank(p.kdvOrani) ? 'Girilmedi' : '%' + p.kdvOrani],
    ['Öngörülemeyen oranı', isBlank(p.ongorulemeyenOrani) ? 'Girilmedi' : '%' + p.ongorulemeyenOrani],
    ['Tesisler', facilitiesText(p)],
  ];
  rows.forEach(([a, b]) => g.add([a, { v: b, s: 'metinSol' }]));
  g.blank();
  g.add([{ v: 'Daire tipleri', s: 'etiket' }]);
  const types = p.tipler || [];
  if (types.length) {
    g.add(
      ['Tip', 'Oda düzeni', 'Brüt m²', 'Balkon', 'Ebeveyn banyo', 'Diğer'].map((x) => ({
        v: x,
        s: 'baslikSatiri' as const,
      })),
    );
    types.forEach((t) => {
      const low = (x: unknown) => String(x).toLocaleLowerCase('tr');
      const other = [
        t.dubleks ? 'Dubleks' : '',
        t.mutfak ? 'Mutfak: ' + (t.mutfak === 'AMERİKAN' ? 'amerikan' : 'kapalı') : '',
        t.isikBandi ? 'Işık bandı: ' + low(t.isikBandi) : '',
        t.alaturka ? 'Alaturka WC: ' + low(t.alaturka) : '',
        t.ankastre ? 'Ankastre: ' + low(t.ankastre) : '',
        isBlank(t.klima) ? '' : 'Klima: ' + t.klima,
      ]
        .filter(Boolean)
        .join(', ');
      const n = (x: unknown) => (isBlank(x) ? '—' : +(x as number));
      g.add([
        { v: String(t.ad || '—'), s: 'metin' },
        { v: String(t.duzen || '—'), s: 'metin' },
        { v: n(t.brut), s: 'metin' },
        { v: n(t.balkon), s: 'metin' },
        { v: n(t.ebeveynBanyo), s: 'metin' },
        { v: other || '—', s: 'metin' },
      ]);
    });
  } else g.add(['Girilmedi']);
  (p.bloklar || []).forEach((b, n) => {
    g.blank();
    g.add([{ v: String(b.ad || 'Blok ' + (n + 1)) + ' - katlar', s: 'etiket' }]);
    const floors = b.katlar || [];
    if (floors.length) {
      g.add(
        ['Kat', 'Tekrar', 'Yükseklik m', 'Gömülü', 'Kat alanı m²', 'Daireler'].map((x) => ({
          v: x,
          s: 'baslikSatiri' as const,
        })),
      );
      floors.forEach((k) => {
        const d = (k.daireler || [])
          .filter((x) => x.tip && +(x.adet as number) > 0)
          .map((x) => (typeName[x.tip] || 'Tip') + ' × ' + x.adet)
          .join(', ');
        g.add([
          { v: FLOOR_NAMES[k.tur] || k.tur, s: 'metin' },
          { v: isBlank(k.tekrar) ? 1 : +(k.tekrar as number), s: 'metin' },
          { v: isBlank(k.yukseklik) ? '—' : +(k.yukseklik as number), s: 'metin' },
          { v: BURIED_NAMES[String(k.gomulu)] || '—', s: 'metin' },
          { v: isBlank(k.m2) ? '—' : +(k.m2 as number), s: 'metin' },
          { v: d || '—', s: 'metin' },
        ]);
      });
    } else g.add(['Girilmedi; toplam inşaat alanından hesaplandı.']);
    const si = (b.sistem || {}) as Record<string, unknown>;
    const filled = SYSTEM_NAMES.filter(([k]) => !isBlank(si[k])).map(([k, ad]) => ad + ': ' + si[k]);
    g.add([
      { v: 'Diğer bilgiler', s: 'etiket' },
      { v: filled.join(' · ') || 'Girilmedi', s: 'metinSol' },
    ]);
  });
  return g;
}

export interface ExcelOptions {
  /** Rapor tarihi (gg.aa.yyyy). Varsayılan bugün. */
  tarih?: string;
  /**
   * true (varsayılan): formüllerin yanında hesaplanmış değer de yazılır (önizlemelerde sayılar görünsün).
   * false: yalnız formül yazılır; doğrulama testinde LibreOffice'in her şeyi kendisinin hesaplaması için.
   */
  cachedValues?: boolean;
}

/** Excel raporunu üretir; .xlsx dosyasının baytlarını döner. */
export async function buildExcel(
  s: CalculationResult,
  p: ProjectInput,
  options: ExcelOptions = {},
): Promise<Uint8Array> {
  const used = new Set<string>();
  const projectName = String(p.ad || 'Proje');
  const o = s.ozet;
  const summaryName = sheetName('Özet', used);
  const allName = sheetName('Tüm Proje', used);
  const blockNames = s.bloklar.map((b) => sheetName(b.ad, used));
  const pgName = sheetName('Proje Geneli', used);
  const inName = sheetName('Girdiler', used);
  const kdvRef = ref(summaryName, '$B$16');
  const all = itemSheet(allName, projectName, 'Tüm Proje Yaklaşık Maliyet Tablosu', s.tumProje, {
    rateRef: kdvRef,
    rate: o.kdvOrani,
  });
  const blocks = s.bloklar.map((b, i) =>
    itemSheet(blockNames[i]!, projectName, b.ad + ' Yaklaşık Maliyet Tablosu', b),
  );
  const pg = itemSheet(pgName, projectName, 'Proje Geneli Giderler', s.projeGeneli);

  const oz = new Sheet(summaryName);
  oz.widths = [34, 26, 18, 14, 14];
  oz.add([{ v: REPORT_TITLE, s: 'anaBaslik' }]); // 1
  oz.merges.push('A1:E1');
  oz.add([{ v: 'Yaklaşık Maliyet Raporu', s: 'altBaslik' }]); // 2
  oz.blank(); // 3
  oz.add([
    { v: 'Proje', s: 'etiket' },
    { v: projectName, s: 'metinSol' },
  ]); // 4
  oz.add([
    { v: 'İl', s: 'etiket' },
    { v: String(p.il || '—'), s: 'metinSol' },
  ]); // 5
  oz.add([
    { v: 'Rapor tarihi', s: 'etiket' },
    { v: options.tarih || formatDate(), s: 'metinSol' },
  ]); // 6
  oz.add([
    { v: 'Toplam inşaat alanı', s: 'etiket' },
    { v: o.toplamInsaatAlani, s: 'alan' },
  ]); // 7
  oz.add([
    { v: 'Daire sayısı', s: 'etiket' },
    { v: o.toplamDaire, s: 'metinSol' },
  ]); // 8
  oz.add([
    { v: 'Blok sayısı', s: 'etiket' },
    { v: s.bloklar.length, s: 'metinSol' },
  ]); // 9
  oz.add([{ v: 'Maliyet', s: 'altBaslik' }]); // 10
  oz.add([
    { v: 'Toplam maliyet (KDV hariç)', s: 'etiket' },
    { f: ref(allName, all.totalCell), v: all.total, s: 'buyukTL' },
  ]); // 11
  oz.add([
    { v: 'm² maliyeti (KDV hariç)', s: 'etiket' },
    { f: 'IF(B7>0,B11/B7,0)', v: o.toplamInsaatAlani ? all.total / o.toplamInsaatAlani : 0, s: 'buyukTL' },
  ]); // 12
  oz.add([
    { v: 'Daire başı maliyet (KDV hariç)', s: 'etiket' },
    { f: 'IF(B8>0,B11/B8,0)', v: o.toplamDaire ? all.total / o.toplamDaire : 0, s: 'buyukTL' },
  ]); // 13
  oz.blank(); // 14
  oz.add([{ v: 'KDV', s: 'altBaslik' }]); // 15
  oz.add([
    { v: 'KDV oranı (değiştirilebilir)', s: 'etiket' },
    { v: o.kdvOrani, s: 'yuzdeGirdi' },
  ]); // 16
  oz.add([
    { v: 'KDV tutarı', s: 'etiket' },
    { f: 'B11*B16', v: all.total * o.kdvOrani, s: 'buyukTL' },
  ]); // 17
  oz.add([
    { v: 'Toplam maliyet (KDV dahil)', s: 'etiket' },
    { f: 'B11+B17', v: all.total * (1 + o.kdvOrani), s: 'buyukTL' },
  ]); // 18
  oz.add([
    { v: 'm² maliyeti (KDV dahil)', s: 'etiket' },
    {
      f: 'IF(B7>0,B18/B7,0)',
      v: o.toplamInsaatAlani ? (all.total * (1 + o.kdvOrani)) / o.toplamInsaatAlani : 0,
      s: 'buyukTL',
    },
  ]); // 19
  oz.blank();
  oz.add([{ v: 'Ana başlıklara göre dağılım', s: 'altBaslik' }]);
  const h1 = oz.add(
    ['Ana başlık', '', 'Tutar (TL)', 'Pay'].map((x) => ({ v: x, s: 'baslikSatiri' as const })),
  );
  oz.merges.push(`A${h1}:B${h1}`);
  s.tumProje.satirlar
    .filter((r) => r.baslik)
    .forEach((r, i) => {
      const n = oz.rows.length + 1;
      const groupTotal = all.sheet.cell(+all.groupCells[i]!.slice(1), 5).v as number;
      oz.add([
        { v: r.no + '. ' + r.ad, s: 'metin' },
        { v: '', s: 'metin' },
        { f: ref(allName, all.groupCells[i]!), v: groupTotal, s: 'tam' },
        { f: `IF($B$11>0,C${n}/$B$11,0)`, v: all.total ? groupTotal / all.total : 0, s: 'yuzde' },
      ]);
      oz.merges.push(`A${n}:B${n}`);
    });
  oz.blank();
  oz.add([{ v: 'Blok ve proje geneli toplamları', s: 'altBaslik' }]);
  oz.add(
    ['Bölüm', 'İnşaat alanı m²', 'Tutar (TL)', 'Daire', 'TL/m²'].map((x) => ({
      v: x,
      s: 'baslikSatiri' as const,
    })),
  );
  s.bloklar.forEach((b, i) => {
    const n = oz.rows.length + 1;
    const bia = b.v.BIA as number;
    oz.add([
      { v: b.ad, s: 'metin' },
      { v: bia, s: 'tam' },
      { f: ref(blockNames[i]!, blocks[i]!.totalCell), v: blocks[i]!.total, s: 'tam' },
      { v: b.v.ND as number, s: 'tam' },
      { f: `IF(B${n}>0,C${n}/B${n},0)`, v: bia ? blocks[i]!.total / bia : 0, s: 'tam' },
    ]);
  });
  oz.add([
    { v: 'Proje geneli giderler', s: 'metin' },
    { v: '', s: 'metin' },
    { f: ref(pgName, pg.totalCell), v: pg.total, s: 'tam' },
    { v: '', s: 'metin' },
    { v: '', s: 'metin' },
  ]);
  oz.blank();
  const nn = oz.add([{ v: REPORT_NOTE, s: 'notYazi' }]);
  oz.merges.push(`A${nn}:E${nn}`);

  const sheets = [oz, all.sheet, ...blocks.map((b) => b.sheet), pg.sheet, inputsSheet(inName, p)];
  return write(sheets, options.cachedValues !== false);
}

async function write(sheets: Sheet[], cached: boolean): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'REPİO(M)';
  wb.calcProperties.fullCalcOnLoad = true;
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name, {
      pageSetup: {
        paperSize: 9,
        orientation: s.landscape ? 'landscape' : 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
      },
      headerFooter: { oddFooter: `&L${REPORT_TITLE}&RSayfa &P / &N` },
      views: s.freeze ? [{ state: 'frozen', ySplit: s.freeze, topLeftCell: `A${s.freeze + 1}` }] : [],
    });
    s.widths.forEach((w, j) => {
      ws.getColumn(j + 1).width = w;
    });
    s.rows.forEach((row, i) => {
      if (!row) return;
      const r = ws.getRow(i + 1);
      row.forEach((c, j) => {
        if (c === null || c === undefined) return;
        const cell: Cell = typeof c === 'object' ? c : { v: c };
        const x = r.getCell(j + 1);
        if (cell.f) {
          const result = typeof cell.v === 'number' && !Number.isFinite(cell.v) ? 0 : cell.v;
          x.value =
            cached && result !== undefined && result !== null
              ? { formula: cell.f, result }
              : { formula: cell.f };
        } else if (cell.v !== undefined && cell.v !== null && cell.v !== '') {
          x.value = typeof cell.v === 'number' && !Number.isFinite(cell.v) ? 0 : cell.v;
        }
        if (cell.s) x.style = STYLES[cell.s];
      });
      if (s.hidden.has(i + 1)) r.hidden = true;
    });
    s.merges.forEach((m) => ws.mergeCells(m));
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}
