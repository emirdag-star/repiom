/** Rapor ortak metinleri ve yardımcıları. */
import type { ProjectInput } from '@repiom/core';

export { REPORT_TITLE } from '@repiom/core';
export const REPORT_NOTE =
  'Tutarlar piyasa birim fiyatlarıyla ve KDV hariç hesaplanmıştır. Bu rapor yaklaşık maliyettir; kesin keşif yerine geçmez.';
export const FLOOR_NAMES: Record<string, string> = {
  bodrum: 'Bodrum kat',
  otopark: 'Otopark katı',
  dukkan: 'Dükkan katı',
  normal: 'Normal kat',
  dubleks: 'Dubleks kat',
};
export const BURIED_NAMES: Record<string, string> = { EVET: 'Evet', YARI: 'Yarı gömülü', HAYIR: 'Hayır' };

export function formatDate(d: Date = new Date()): string {
  const p = (x: number) => (x < 10 ? '0' : '') + x;
  return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear();
}

export const isBlank = (x: unknown) => x === undefined || x === null || x === '';
export const inputText = (x: unknown, unit?: string) =>
  isBlank(x) ? 'Girilmedi' : String(x) + (unit ? ' ' + unit : '');

/** Türkçe sayı biçimi: 1.234.567 ya da 1.234,56 */
export function formatNumber(x: number, digits = 0): string {
  return (Number.isFinite(x) ? x : 0).toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** İndirilen dosyanın adı: REPIOM_<Proje>_<YYYYAAGG>.<uzantı> */
export function reportFileName(p: ProjectInput, extension: 'xlsx' | 'pdf', d: Date = new Date()): string {
  const name =
    String(p.ad || 'Proje')
      .replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü]+/g, '_')
      .replace(/^_|_$/g, '') || 'Proje';
  const z = (x: number) => (x < 10 ? '0' : '') + x;
  return `REPIOM_${name}_${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}.${extension}`;
}

/** Tesis seçimlerinin okunur listesi. */
export function facilitiesText(p: ProjectInput): string {
  const list: [keyof ProjectInput, string][] = [
    ['satisOfisi', 'Satış ofisi'],
    ['ornekDaire', 'Örnek daire'],
    ['jenerator', 'Jeneratör'],
    ['trafo', 'Trafo'],
    ['hamam', 'Hamam'],
    ['sauna', 'Sauna'],
    ['finHamami', 'Fin hamamı'],
    ['fitness', 'Fitness'],
    ['havuz', 'Havuz'],
  ];
  return (
    list
      .filter(([k]) => p[k])
      .map(([, ad]) => ad)
      .join(', ') || 'Yok'
  );
}

export const SYSTEM_NAMES: [string, string][] = [
  ['cephe', 'Dış cephe'],
  ['mantoAltiSiva', 'Mantolama altına sıva'],
  ['asansor', 'Asansör'],
  ['merdiven', 'Merdiven'],
  ['isitma', 'Isıtma sistemi'],
  ['isitmaSekli', 'Isıtma şekli'],
  ['banyoTavan', 'Banyo-WC tavanı'],
  ['cati', 'Çatı'],
  ['doseme', 'Döşeme'],
  ['suDeposu', 'Su deposu'],
  ['dilatasyon', 'Dilatasyon'],
];
