/**
 * Performans: ~100 MB'lık DXF 60 saniyenin altında okunup analiz edilmeli.
 * Gerçek çizimlere benzer şekilde dosyanın büyük kısmı detay çizgileri (mobilya, tarama, aks) ve ölçü yazılarıdır.
 */
import { describe, expect, it } from 'vitest';
import { dxf } from '../src';

const HEDEF_MB = 100;

/** Örnek mimari çizimin ENTITIES bölümüne parçalar halinde dolgu ekler (bellekte tek büyük metin oluşturmadan). */
function* bigDxf(): Generator<Uint8Array> {
  const enc = new TextEncoder();
  const base = dxf.exampleArchitectureDxf();
  const end = base.lastIndexOf('0\r\nENDSEC');
  yield enc.encode(base.slice(0, end));
  let size = end;
  let n = 0;
  while (size < HEDEF_MB * 1024 * 1024) {
    const parts: string[] = [];
    for (let i = 0; i < 5000; i++, n++) {
      const x = (n * 37) % 9000;
      const y = 150 + ((n * 53) % 1700);
      if (n % 12 === 0)
        parts.push(
          `0\r\nTEXT\r\n8\r\nOLCU\r\n10\r\n${x}.25\r\n20\r\n${y}.75\r\n30\r\n0\r\n40\r\n8\r\n1\r\n${(n % 500) + 10}\r\n`,
        );
      else
        parts.push(
          `0\r\nLINE\r\n8\r\nMOBILYA\r\n10\r\n${x}.125\r\n20\r\n${y}.5\r\n30\r\n0\r\n11\r\n${x + 35}.875\r\n21\r\n${y + 12}.25\r\n31\r\n0\r\n`,
        );
    }
    const chunk = enc.encode(parts.join(''));
    size += chunk.length;
    yield chunk;
  }
  yield enc.encode(base.slice(end));
}

describe('performans', () => {
  it(`${HEDEF_MB} MB DXF 60 saniyenin altında okunur ve analiz edilir`, async () => {
    const t0 = performance.now();
    let bytes = 0;
    const d = await dxf.readDxf(bigDxf(), (n) => (bytes = n));
    const t1 = performance.now();
    const a = dxf.analyzeDrawings(d, await dxf.readDxfBytes(dxf.exampleStructureDxf()));
    const t2 = performance.now();
    if (a.hata !== undefined) throw new Error(a.hata);
    console.info(
      `DXF ${(bytes / 1048576).toFixed(0)} MB: okuma ${((t1 - t0) / 1000).toFixed(1)} sn, analiz ${((t2 - t1) / 1000).toFixed(1)} sn, ${d.L.length} çizgi, ${d.T.length} yazı`,
    );
    expect(bytes).toBeGreaterThan(HEDEF_MB * 1024 * 1024);
    expect(a.mimari.katlar).toHaveLength(3);
    expect((t2 - t0) / 1000).toBeLessThan(60);
  }, 180_000);
});
