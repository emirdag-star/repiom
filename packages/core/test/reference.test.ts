import { describe, expect, it } from 'vitest';
import expected from '../reference/beklenen_v4.json';

interface ReferenceData {
  girdi: unknown[];
  katsayi: unknown[];
  kalem: unknown[];
  il: unknown[];
  blokSon: number;
}

describe('prototip referans verisi', () => {
  it('veri.js beklenen boyutta (220 kalem, 77 girdi, 81 katsayı, 81 il)', async () => {
    await import('../reference/veri.js');
    const data = (globalThis as unknown as { REPIOM_VERI: ReferenceData }).REPIOM_VERI;
    expect(data.kalem).toHaveLength(220);
    expect(data.girdi).toHaveLength(77);
    expect(data.katsayi).toHaveLength(81);
    expect(data.il).toHaveLength(81);
    expect(data.blokSon).toBe(151);
  });

  it('v4 beklenen değerler dosyası okunabiliyor', () => {
    expect(Object.keys(expected).length).toBeGreaterThan(0);
  });
});
