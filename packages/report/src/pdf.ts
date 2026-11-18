/**
 * PDF raporu: kapak ("REPİO Akıllı İnşaat Maliyeti Hesaplayıcısı"), özet ve kalem tabloları.
 * Bu modül yalnız pdfmake belge tanımını üretir (saf veri); PDF'e çevirme web'de ve testte yapılır.
 */
import type { CalculationResult, ProjectInput, ResultRow } from '@repiom/core';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { formatDate, formatNumber as n, REPORT_NOTE, REPORT_TITLE } from './common';

const ANTRASIT = '#1F2937';
const TURUNCU = '#C2410C';
const GRI = '#E5E7EB';
const SARI = '#FFF2CC';

const LOGO_SVG =
  '<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="88" height="88" rx="14" fill="#F0692B"/><path d="M28 74 V24 H50 a15 15 0 0 1 0 30 H28 M46 54 L62 74" stroke="#1F2937" stroke-width="10" fill="none"/><rect x="68" y="68" width="16" height="16" fill="#1F2937"/></svg>';

const th = (text: string, right = false): TableCell => ({
  text,
  bold: true,
  color: '#FFFFFF',
  fillColor: ANTRASIT,
  alignment: right ? 'right' : 'left',
});
const num = (text: string, extra: Partial<Record<string, unknown>> = {}): TableCell =>
  ({ text, alignment: 'right', ...extra }) as TableCell;

function itemTable(
  title: string,
  data: { satirlar: ResultRow[]; toplam: { piyasa: number } },
  kdv?: number,
): Content[] {
  const body: TableCell[][] = [
    [
      th('Sıra'),
      th('İş kalemi'),
      th('Birim'),
      th('Yaklaşık metraj', true),
      th('Birim fiyat (TL)', true),
      th('Tutar (TL)', true),
    ],
  ];
  for (const r of data.satirlar) {
    if (r.baslik) {
      body.push([
        { text: r.no ?? '', bold: true, fillColor: GRI },
        { text: r.ad, bold: true, fillColor: GRI, colSpan: 4 },
        {},
        {},
        {},
        num(n(r.piyasaTutar ?? 0), { bold: true, fillColor: GRI }),
      ]);
      continue;
    }
    if (!r.metraj) continue;
    body.push([
      r.no ?? '',
      r.ad,
      r.birim || '',
      num(n(r.metraj, 2), r.metrajElle ? { fillColor: SARI } : {}),
      num(n(r.piyasaFiyat, 2), r.piyasaElle ? { fillColor: SARI } : {}),
      num(n(r.piyasaTutar)),
    ]);
  }
  const total = (label: string, value: number, bold = true): TableCell[] => [
    '',
    { text: label, bold, colSpan: 4 },
    {},
    {},
    {},
    num(n(value), { bold }),
  ];
  body.push(total('TOPLAM (KDV hariç)', data.toplam.piyasa));
  if (kdv !== undefined) {
    body.push(total(`KDV (%${n(kdv * 100)})`, data.toplam.piyasa * kdv, false));
    body.push(total('TOPLAM (KDV dahil)', data.toplam.piyasa * (1 + kdv)));
  }
  return [
    { text: title, style: 'h2', pageBreak: 'before' },
    {
      table: { headerRows: 1, widths: [28, '*', 30, 62, 66, 72], body, dontBreakRows: true },
      layout: 'lightHorizontalLines',
      fontSize: 8,
    },
  ];
}

export interface PdfOptions {
  tarih?: string;
}

/** pdfmake belge tanımı. */
export function buildPdfDefinition(
  s: CalculationResult,
  p: ProjectInput,
  options: PdfOptions = {},
): TDocumentDefinitions {
  const o = s.ozet;
  const name = String(p.ad || 'Proje');
  const big = (label: string, value: string): Content => ({
    stack: [
      { text: label, fontSize: 9, color: '#4B5563' },
      { text: value, fontSize: 16, bold: true, color: ANTRASIT, margin: [0, 2, 0, 10] },
    ],
  });
  const cover: Content[] = [
    { svg: LOGO_SVG, width: 72, margin: [0, 40, 0, 12] },
    {
      text: [
        { text: 'REPİO', color: ANTRASIT },
        { text: '(M)', color: TURUNCU },
      ],
      fontSize: 26,
      bold: true,
    },
    { text: REPORT_TITLE, fontSize: 12, color: '#4B5563', margin: [0, 2, 0, 50] },
    { text: name, fontSize: 24, bold: true, color: ANTRASIT },
    { text: 'Yaklaşık Maliyet Raporu', fontSize: 14, color: TURUNCU, margin: [0, 4, 0, 24] },
    {
      table: {
        widths: [140, '*'],
        body: [
          ['İl', String(p.il || '—')],
          ['Toplam inşaat alanı', n(o.toplamInsaatAlani) + ' m²'],
          ['Daire sayısı', String(o.toplamDaire)],
          ['Blok sayısı', String(s.bloklar.length)],
          ['Rapor tarihi', options.tarih || formatDate()],
        ].map(([a, b]) => [
          { text: a!, color: '#4B5563' },
          { text: b!, bold: true },
        ]),
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 24],
    },
    big('Toplam maliyet (KDV hariç)', n(o.piyasa) + ' TL'),
    big(`Toplam maliyet (KDV dahil, %${n(o.kdvOrani * 100)})`, n(o.piyasaKdvDahil) + ' TL'),
    big('m² maliyeti (KDV hariç)', n(o.m2Piyasa) + ' TL/m²'),
    { text: REPORT_NOTE, italics: true, fontSize: 9, color: '#4B5563', margin: [0, 30, 0, 0] },
  ];

  const groups = s.tumProje.satirlar.filter((r) => r.baslik && r.piyasaTutar);
  const summary: Content[] = [
    { text: 'Özet', style: 'h2', pageBreak: 'before' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 100, 50],
        body: [
          [th('Ana başlık'), th('Tutar (TL)', true), th('Pay', true)],
          ...groups.map((r) => [
            `${r.no}. ${r.ad}`,
            num(n(r.piyasaTutar ?? 0)),
            num('%' + n(o.piyasa ? ((r.piyasaTutar ?? 0) / o.piyasa) * 100 : 0, 1)),
          ]),
          [{ text: 'Toplam (KDV hariç)', bold: true }, num(n(o.piyasa), { bold: true }), num('%100')],
          [`KDV (%${n(o.kdvOrani * 100)})`, num(n(o.piyasaKdv)), ''],
          [{ text: 'Toplam (KDV dahil)', bold: true }, num(n(o.piyasaKdvDahil), { bold: true }), ''],
        ],
      },
      layout: 'lightHorizontalLines',
      fontSize: 9,
    },
    { text: 'Blok ve proje geneli toplamları', style: 'h3' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 80, 40, 90, 60],
        body: [
          [
            th('Bölüm'),
            th('İnşaat alanı m²', true),
            th('Daire', true),
            th('Tutar (TL)', true),
            th('TL/m²', true),
          ],
          ...s.bloklar.map((b) => {
            const bia = b.v.BIA as number;
            return [
              b.ad,
              num(n(bia)),
              num(String(b.v.ND)),
              num(n(b.toplam.piyasa)),
              num(n(bia ? b.toplam.piyasa / bia : 0)),
            ];
          }),
          ['Proje geneli giderler', '', '', num(n(s.projeGeneli.toplam.piyasa)), ''],
        ],
      },
      layout: 'lightHorizontalLines',
      fontSize: 9,
    },
  ];

  return {
    info: { title: `${name} - Yaklaşık Maliyet Raporu`, author: 'REPİO(M)', subject: REPORT_TITLE },
    pageSize: 'A4',
    pageMargins: [36, 44, 36, 44],
    defaultStyle: { fontSize: 10, color: ANTRASIT },
    styles: {
      h2: { fontSize: 15, bold: true, margin: [0, 0, 0, 10] },
      h3: { fontSize: 12, bold: true, margin: [0, 16, 0, 8] },
    },
    header: (page) =>
      page === 1
        ? ''
        : {
            columns: [
              { text: REPORT_TITLE, fontSize: 8, color: '#4B5563' },
              { text: name, fontSize: 8, color: '#4B5563', alignment: 'right' },
            ],
            margin: [36, 18, 36, 0],
          },
    footer: (page, count) => ({
      text: `Sayfa ${page} / ${count}`,
      alignment: 'right',
      fontSize: 8,
      color: '#4B5563',
      margin: [36, 12, 36, 0],
    }),
    content: [
      ...cover,
      ...summary,
      ...itemTable('Tüm Proje Yaklaşık Maliyet Tablosu', s.tumProje, o.kdvOrani),
      ...s.bloklar.flatMap((b) => itemTable(`${b.ad} Yaklaşık Maliyet Tablosu`, b)),
      ...itemTable('Proje Geneli Giderler', s.projeGeneli),
    ],
  };
}
