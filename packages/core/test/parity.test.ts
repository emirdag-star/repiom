/**
 * Prototip motoru (reference/hesap.js) ile yeni motorun aynı girdide BİREBİR aynı sonucu verdiğini doğrular:
 * tüm satırlar, değişkenler, toplamlar ve uyarılar; sayılar bit düzeyinde (Object.is).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  calculate,
  emptyBlock,
  emptyProject,
  exampleProject,
  PROVINCES,
  siteBlockTemplate,
  type ProjectInput,
} from '../src';
import { v4Project } from './fixtures';

type Legacy = { hesapla: (p: unknown, s?: unknown) => unknown };

function loadLegacy(): Legacy {
  const ctx: Record<string, unknown> = {};
  const dir = join(__dirname, '..', 'reference');
  runInNewContext(readFileSync(join(dir, 'veri.js'), 'utf8'), ctx);
  runInNewContext(readFileSync(join(dir, 'hesap.js'), 'utf8'), ctx);
  return ctx.REPIOM as Legacy;
}
const legacy = loadLegacy();

/** İki sonucu derinlemesine karşılaştırır; ilk farkların yolunu döner. */
function diff(a: unknown, b: unknown, path = '$', out: string[] = []): string[] {
  if (out.length >= 10) return out;
  if (typeof a === 'number' && typeof b === 'number') {
    if (!Object.is(a, b)) out.push(`${path}: prototip ${a} / yeni ${b}`);
    return out;
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    if (a !== b) out.push(`${path}: prototip ${JSON.stringify(a)} / yeni ${JSON.stringify(b)}`);
    return out;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    out.push(`${path}: dizi/nesne farkı`);
    return out;
  }
  const ka = Object.keys(a as object).filter((k) => (a as Record<string, unknown>)[k] !== undefined);
  const kb = Object.keys(b as object).filter((k) => (b as Record<string, unknown>)[k] !== undefined);
  const keys = new Set([...ka, ...kb]);
  for (const k of keys)
    diff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`, out);
  return out;
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

function compare(
  p: ProjectInput,
  options?: { fiyatlar?: Record<string, number>; katsayilar?: Record<string, number> },
) {
  const want = legacy.hesapla(clone(p), options && clone(options));
  const got = calculate(clone(p), options && clone(options));
  // Farklı JavaScript "realm"lerinden gelen nesneleri sade veriye çevirmeden doğrudan karşılaştırıyoruz.
  return diff(want, got);
}

/* ---------- Rastgele proje üreteci ---------- */
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

function randomProject(r: () => number): { p: ProjectInput; fiyatlar?: Record<string, number> } {
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!;
  const maybe = <T>(x: T, prob = 0.5): T | '' => (r() < prob ? x : '');
  const types = Array.from({ length: Math.floor(r() * 5) }, (_, i) => ({
    id: 't' + i,
    ad: maybe(pick(['TİP A', 'TİP B', '', 'Köşe'])),
    duzen: maybe(pick(['1+1', '2+1', '3+1', '4+1', '5+1', '6+2']), 0.85),
    brut: maybe(Math.round(50 + r() * 250), 0.7),
    dubleks: r() < 0.15,
    balkon: maybe(Math.floor(r() * 4)),
    mutfak: pick(['', 'AMERİKAN', 'KAPALI']),
    isikBandi: pick(['', 'VAR', 'YOK']),
    alaturka: pick(['', 'VAR', 'YOK']),
    ebeveynBanyo: maybe(Math.floor(r() * 2)),
    ankastre: pick(['', 'VAR', 'YOK']),
    klima: maybe(Math.floor(r() * 4)),
  }));
  const nBlock = 1 + Math.floor(r() * 3);
  const blocks = Array.from({ length: nBlock }, (_, n) => {
    const b = emptyBlock(n);
    if (r() < 0.75) {
      b.katlar = Array.from({ length: Math.floor(r() * 5) }, () => {
        const tur = pick(['bodrum', 'otopark', 'dukkan', 'normal', 'normal', 'dubleks'] as const);
        const konut = tur === 'normal' || tur === 'dubleks';
        return {
          tur,
          tekrar: maybe(1 + Math.floor(r() * 9), 0.8),
          yukseklik: maybe(+(2.6 + r() * 2).toFixed(2), 0.4),
          gomulu: pick(['', 'EVET', 'YARI', 'HAYIR']),
          m2: konut ? maybe(Math.round(200 + r() * 600), 0.2) : maybe(Math.round(200 + r() * 600), 0.7),
          daireler:
            konut && types.length
              ? Array.from({ length: 1 + Math.floor(r() * 3) }, () => ({
                  tip: pick(types).id,
                  adet: maybe(1 + Math.floor(r() * 4), 0.85),
                }))
              : [],
        };
      });
    }
    b.sistem = {
      cephe: pick(['', 'EPS', 'XPS', 'TAŞYÜNÜ', 'ÖZEL']),
      mantoAltiSiva: pick(['', 'EVET', 'HAYIR']),
      asansor: maybe(Math.floor(r() * 3), 0.4),
      merdiven: maybe(1 + Math.floor(r() * 2), 0.3),
      isitma: pick(['', 'KOMBİ', 'MERKEZİ']),
      isitmaSekli: pick(['', 'RADYATÖR', 'YERDEN ISITMA']),
      banyoTavan: pick(['', 'YEŞİL ALÇIPAN', 'ALÜMİNYUM PANEL']),
      cati: pick(['', 'KIRMA', 'TERAS']),
      doseme: pick(['', 'ASMOLEN', 'KİRİŞLİ']),
      suDeposu: pick(['', 'YOK', 'BETONARME', 'MODÜLER']),
      dilatasyon: maybe(Math.floor(r() * 3), 0.3),
    };
    return b;
  });
  const p: ProjectInput = Object.assign(emptyProject(), {
    ad: 'Rastgele',
    il: pick(PROVINCES).ad,
    arsa: maybe(Math.round(500 + r() * 8000), 0.5),
    blokAdedi: nBlock,
    toplamOturum: maybe(Math.round(300 + r() * 2000), 0.4),
    toplamInsaatAlani: maybe(Math.round(1000 + r() * 30000), 0.6),
    tipler: types,
    bloklar: blocks,
    sureAy: maybe(6 + Math.floor(r() * 30), 0.5),
    satisOfisi: r() < 0.5,
    ornekDaire: r() < 0.5,
    jenerator: r() < 0.5,
    trafo: r() < 0.5,
    hamam: r() < 0.3,
    sauna: r() < 0.3,
    finHamami: r() < 0.3,
    fitness: r() < 0.3,
    havuz: r() < 0.3,
    havuzM2: maybe(Math.round(50 + r() * 200), 0.5),
    kdvOrani: pick([20, 10, 1, 0, '']),
    ongorulemeyenOrani: pick([2, 0, 5, '']),
  });
  // Elle düzeltmeler ve ek kalemler.
  if (r() < 0.4) {
    p.duzeltmeler = {
      blok0: { '1': { metraj: Math.round(r() * 1000) }, '5': { piyasa: Math.round(r() * 5000) } },
      proje: { '179': { piyasa: Math.round(r() * 1e6) }, '160': { metraj: 2 } },
    };
  }
  if (r() < 0.3) {
    p.ekKalemler = {
      blok0: [
        { grup: 3, ad: 'Jet grout', birim: 'm', metraj: 120, fiyat: 2100, kaynak: 'tahmini' },
        { grup: 99, ad: 'Grubu olmayan', birim: 'ad', metraj: 1, fiyat: 1 },
      ],
    };
  }
  const fiyatlar =
    r() < 0.4
      ? Object.fromEntries(
          Array.from({ length: 30 }, () => {
            const i = Math.floor(r() * 220);
            return ['K' + ('00' + i).slice(-3), Math.round(r() * 100000) / 100];
          }),
        )
      : undefined;
  return fiyatlar ? { p, fiyatlar } : { p };
}

describe('prototip motoruyla birebir aynı sonuç', () => {
  const fixed: [string, ProjectInput][] = [
    ['v4 örneği', v4Project()],
    ['boş proje', emptyProject()],
    ['yalnız toplam alan', Object.assign(emptyProject(), { toplamInsaatAlani: 6000 })],
    [
      'toplam alan + 2 blok + oturum',
      Object.assign(emptyProject(), {
        toplamInsaatAlani: 12000,
        blokAdedi: 2,
        toplamOturum: 1000,
        bloklar: [emptyBlock(0), emptyBlock(1)],
      }),
    ],
    ['örnek proje', exampleProject()],
    ['site bloğu', siteBlockTemplate()],
    [
      'site bloğu 2 × 20.000',
      siteBlockTemplate(Object.assign(emptyProject(), { blokAdedi: 2, toplamInsaatAlani: 20000 })),
    ],
  ];
  it.each(fixed)('%s', (_, p) => {
    expect(compare(p)).toEqual([]);
  });

  it('300 rastgele projede (fiyat listesi, düzeltme ve ek kalemlerle) fark yok', () => {
    const r = rng(42);
    const failures: string[] = [];
    let calculated = 0;
    for (let n = 0; n < 300 && failures.length < 5; n++) {
      const { p, fiyatlar } = randomProject(r);
      const d = compare(p, fiyatlar ? { fiyatlar } : undefined);
      if (d.length) failures.push(`Proje ${n}: ${d.slice(0, 3).join(' ; ')}`);
      if (!('hata' in (calculate(clone(p)) as object))) calculated++;
    }
    expect(failures).toEqual([]);
    // Senaryoların çoğu gerçekten hesaplanmış olmalı (yalnız "boş proje" hatası değil).
    expect(calculated).toBeGreaterThan(200);
  });

  it('karşılaştırıcı gerçek bir farkı yakalar (öz kontrol)', () => {
    const p = Object.assign(emptyProject(), { toplamInsaatAlani: 6000 });
    const want = legacy.hesapla(clone(p));
    const got = calculate({ ...clone(p), il: 'Van' });
    expect(diff(want, got).length).toBeGreaterThan(0);
    const got2 = calculate({ ...clone(p), duzeltmeler: { blok0: { '1': { metraj: 1 } } } });
    expect(diff(want, got2).length).toBeGreaterThan(0);
  });

  it('hazır şablonlar prototipteki şablonlarla aynı yapıda', () => {
    const strip = (x: unknown) => JSON.parse(JSON.stringify(x).replace(/"t[a-z0-9]{8,}"/g, '"ID"'));
    const L = legacy as unknown as Record<string, (p?: unknown) => unknown>;
    expect(strip(emptyProject())).toEqual(strip(L.bosProje!()));
    expect(strip(exampleProject())).toEqual(strip(L.ornekProje!()));
    expect(strip(siteBlockTemplate())).toEqual(strip(L.siteBlogu!()));
  });
});
