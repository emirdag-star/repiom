import { describe, expect, it } from 'vitest';
import { sayiOku } from './sayi';

describe('sayiOku (Türkçe sayı yazımı)', () => {
  it.each([
    ['6000', 6000],
    ['6.000', 6000],
    ['1.234.567', 1234567],
    ['1.234,5', 1234.5],
    ['2,5', 2.5],
    ['2.5', 2.5],
    [' 120 ', 120],
    ['0', 0],
    ['12.', 12],
  ])('%s → %d', (girdi, beklenen) => {
    expect(sayiOku(girdi)).toBe(beklenen);
  });

  it('boş metin girilmedi demektir', () => {
    expect(sayiOku('')).toBeNull();
    expect(sayiOku('   ')).toBeNull();
  });

  it.each(['abc', '1,2,3', '--5', '1.2.3,4,5', '12a'])('%s geçersiz', (girdi) => {
    expect(Number.isNaN(sayiOku(girdi))).toBe(true);
  });
});
