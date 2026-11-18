/**
 * Metni sayıya çevirir. Türkçe yazım esas alınır: virgül ondalık, nokta binlik ayırıcıdır.
 * "1.234,5" → 1234,5 · "6.000" → 6000 · "2,5" → 2,5 · "2.5" → 2,5 (binlik grubu olmayan tek nokta ondalık sayılır).
 */
export function sayiOku(s: string): number | null {
  const t = s.trim().replace(/\s/g, '');
  if (!t) return null;
  let normal: string;
  if (/,/.test(t)) normal = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) normal = t.replace(/\./g, '');
  else normal = t;
  if (!/^-?\d*\.?\d+$|^-?\d+\.?$/.test(normal)) return NaN;
  return Number(normal);
}

/** Var/Yok seçenekleri. */
export const VAR_YOK = [
  ['VAR', 'Var'],
  ['YOK', 'Yok'],
] as const;
