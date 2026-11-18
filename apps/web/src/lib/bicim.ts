import type { ApartmentTypeInput } from '@repiom/core';

export const KAT_ADI: Record<string, string> = {
  bodrum: 'Bodrum kat',
  otopark: 'Otopark katı',
  dukkan: 'Dükkan katı',
  normal: 'Normal kat',
  dubleks: 'Dubleks kat',
};

export function tipEtiketi(t: ApartmentTypeInput): string {
  const a = String(t.ad || '').trim();
  const d = String(t.duzen || '').trim();
  const s = a && d ? `${a} (${d})` : a || d || 'Adsız tip';
  return s + (t.brut ? ` · ${t.brut} m²` : '') + (t.dubleks ? ' · dubleks' : '');
}

export const sayi = (x: number, basamak = 0) =>
  (Number.isFinite(x) ? x : 0).toLocaleString('tr-TR', {
    minimumFractionDigits: basamak,
    maximumFractionDigits: basamak,
  });
export const tl = (x: number) => `${sayi(x)} TL`;
