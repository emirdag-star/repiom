/**
 * Üretilen formüllerin, prototipin metin formülleriyle (new Function ile çalıştırılan) aynı sonucu verdiğini
 * rastgele girdilerle doğrular. Ayrıca üretilen dosyanın güncel olduğunu kontrol eder.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generate, loadReference } from '../scripts/gen-formulas';
import { INPUTS, ITEMS } from '../src/generated/formulas';
import { B, IF, RND, RUP } from '../src/engine/runtime';

const ref = loadReference();

/** Basit, tekrarlanabilir rastgele sayı üreteci (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const allExprs = [
  ...ref.kalem.flatMap((k) => [k.metraj, k.piyasa]),
  ...ref.girdi.map((g) => g.formul),
].filter((x): x is string => Boolean(x));

/** Her metin değişkeni için formüllerde geçen olası değerler. */
const stringChoices = new Map<string, Set<string>>();
for (const e of allExprs) {
  for (const m of e.matchAll(/v\.([A-Z_0-9]+)\s*==\s*"([^"]*)"/g)) {
    if (!stringChoices.has(m[1]!)) stringChoices.set(m[1]!, new Set(['DİĞER']));
    stringChoices.get(m[1]!)!.add(m[2]!);
  }
}
const typeChoices = ['1+1', '2+1', '3+1', '4+1'];

function randomVars(r: () => number): Record<string, number | string> {
  const v: Record<string, number | string> = {};
  const names = new Set<string>();
  for (const e of allExprs) for (const m of e.matchAll(/v\.([A-Za-z_0-9]+)/g)) names.add(m[1]!);
  for (const n of names) {
    const choices = stringChoices.get(n);
    if (choices) {
      const arr = [...choices];
      v[n] = arr[Math.floor(r() * arr.length)]!;
    } else {
      // Sıfır, küçük ve büyük değerler; bazen tam sayı (adet), bazen ondalık.
      const k = r();
      v[n] = k < 0.08 ? 0 : k < 0.5 ? Math.round(r() * 12) : r() * 5000;
    }
  }
  return v;
}

function randomTypes(r: () => number) {
  const n = 1 + Math.floor(r() * 4);
  return Array.from({ length: n }, () => ({
    N: Math.round(r() * 40),
    A: 50 + r() * 200,
    ODA: 1 + Math.floor(r() * 4),
    BALKON: Math.floor(r() * 3),
    AYRI: r() < 0.5 ? 1 : 0,
    ISIK: r() < 0.5 ? 1 : 0,
    ALATURKA: r() < 0.3 ? 1 : 0,
    EBANYO: r() < 0.5 ? 1 : 0,
    ANKASTRE: r() < 0.7 ? 1 : 0,
    KLIMA: Math.floor(r() * 4),
    DUBLEKS: r() < 0.2 ? 1 : 0,
    TIP: r() < 0.7 ? typeChoices[Math.floor(r() * typeChoices.length)] : undefined,
  }));
}

const legacy = (expr: string) =>
  // Prototipteki hesap.js'in yaptığının aynısı.
  new Function('v', 'Q', 'SP', 'IF', 'RND', 'RUP', 'return (' + expr + ');') as (...a: unknown[]) => number;

const same = (a: number, b: number) => Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));

describe('formül üretici', () => {
  it('üretilen dosya güncel (pnpm gen:formulas)', () => {
    const current = readFileSync(join(__dirname, '..', 'src', 'generated', 'formulas.ts'), 'utf8');
    expect(current === generate(), 'src/generated/formulas.ts güncel değil; pnpm gen:formulas çalıştır').toBe(
      true,
    );
  });

  it('kalem ve girdi sayıları referansla aynı', () => {
    expect(ITEMS).toHaveLength(ref.kalem.length);
    expect(INPUTS).toHaveLength(ref.girdi.length);
    ITEMS.forEach((k, i) => {
      expect(k.i).toBe(i);
      expect(k.ad).toBe(ref.kalem[i]!.ad);
      expect(Boolean(k.metraj)).toBe(Boolean(ref.kalem[i]!.metraj));
      expect(Boolean(k.piyasa)).toBe(Boolean(ref.kalem[i]!.piyasa));
    });
  });

  it('her formül 300 rastgele girdide prototiple bit düzeyinde aynı sonucu verir', () => {
    const r = rng(20261118);
    let compared = 0;
    const mismatches: string[] = [];
    for (let run = 0; run < 300; run++) {
      const v = randomVars(r);
      const types = randomTypes(r);
      const qVals = new Map<number, number>();
      const Q = (i: number) => {
        if (!qVals.has(i)) qVals.set(i, r() * 1000);
        return qVals.get(i)!;
      };
      const SP = (f: (t: (typeof types)[number]) => number) => types.reduce((a, t) => a + Number(f(t)), 0);
      const check = (where: string, expr: string, gen: (...a: never[]) => number, args: 'item' | 'input') => {
        const want = legacy(expr)(v, Q, SP, IF, RND, RUP);
        const got =
          args === 'item'
            ? (gen as unknown as (v: unknown, q: unknown, sp: unknown) => number)(v, Q, SP)
            : (gen as unknown as (v: unknown, sp: unknown) => number)(v, SP);
        compared++;
        if (!same(Number(want), got) && mismatches.length < 10) mismatches.push(`${where}: ${want} ≠ ${got}`);
      };
      ITEMS.forEach((k, i) => {
        const raw = ref.kalem[i]!;
        if (k.metraj && raw.metraj) check(`K${i} metraj`, raw.metraj, k.metraj, 'item');
        if (k.piyasa && raw.piyasa) check(`K${i} fiyat`, raw.piyasa, k.piyasa, 'item');
      });
      INPUTS.forEach((g, i) => {
        const raw = ref.girdi[i]!;
        if (g.formul && raw.formul) check(`Girdi ${g.ad}`, raw.formul, g.formul, 'input');
      });
    }
    expect(mismatches).toEqual([]);
    expect(compared).toBeGreaterThan(100_000);
  });

  it("B yardımcısı JavaScript'in true/false → 1/0 çevrimiyle aynı", () => {
    expect(B(true) * 7).toBe(Number(true) * 7);
    expect(B(false) * 7).toBe(Number(false) * 7);
  });
});
