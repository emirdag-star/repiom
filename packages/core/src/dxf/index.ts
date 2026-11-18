/**
 * Çizimden maliyet (DXF analizi): okuma, birim tespiti, analiz, uyarılar ve proje girdisi.
 */
import {
  analyzeArchitecture,
  analyzeStructure,
  buildProject,
  EMPTY_STRUCT,
  withoutStructure,
  type AnalysisOptions,
  type ArchResult,
  type DxfProject,
  type StructResult,
} from './analysis';
import type { DxfData } from './reader';

export * from './analysis';
export * from './reader';
export * from './preview';
export * from './example';
export * from './yz';

/* ---------- Birim ---------- */
export type Unit = 'cm' | 'mm' | 'm';
const FACTOR: Record<Unit, number> = { cm: 1, mm: 0.1, m: 100 };

/** Tüm koordinatları ve yazı yüksekliklerini çarpanla ölçekler (analiz kuralları cm varsayar). */
export function scaleDxf(d: DxfData, f: number): DxfData {
  if (f === 1) return d;
  return {
    header: d.header,
    T: d.T.map((t) => ({ ...t, x: t.x * f, y: t.y * f, h: t.h * f })),
    I: d.I.map((i) => ({ ...i, x: i.x * f, y: i.y * f })),
    L: d.L.map((l) => [l[0], l[1] * f, l[2] * f, l[3] * f, l[4] * f]),
    P: d.P.map((p) => ({ k: p.k, P: p.P.map((q) => [q[0] * f, q[1] * f] as [number, number]) })),
  };
}

/**
 * Statik dosyanın birimi: kolon/perde kesitlerinin (COLUMN katmanı) kısa kenarının ortancasından.
 * Kolon kısa kenarı cm'de ~25–100; mm'de 10 kat, m'de 100'de bir. Kolon yoksa null (mimari dosyanın birimi kullanılır).
 */
export function detectStructureUnit(d: DxfData): Unit | null {
  const sides = d.P.filter((p) => /^COLUMN/i.test(p.k) && p.P.length >= 4)
    .map((p) => {
      const xs = p.P.map((q) => q[0]);
      const ys = p.P.map((q) => q[1]);
      return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    })
    .filter((x) => x > 0)
    .sort((a, b) => a - b);
  if (sides.length < 3) return null;
  const med = sides[Math.floor(sides.length / 2)]!;
  if (med >= 15 && med < 150) return 'cm';
  if (med >= 150 && med <= 1500) return 'mm';
  if (med >= 0.15 && med < 1.5) return 'm';
  return null;
}

/* ---------- Analiz ---------- */
export interface DxfAnalysis {
  hata?: undefined;
  mimari: ArchResult;
  statik: StructResult;
  /** Ölçülerden tespit edilen birimler ve dosya başlığındaki birim. */
  birim: { mimari: Unit; statik: Unit | null; baslik: string };
  statikVar: boolean;
  /** Ölçeklenmiş (cm) çizim verisi — önizleme için. */
  veri: { mimari: DxfData; statik: DxfData | null };
}

export const NO_FLOOR_PLAN = 'Mimari dosyada okunabilir kat planı bulunamadı.';

/**
 * İki DXF'in analizi: mimari zorunlu, statik isteğe bağlı. Birim, dosya başlığına güvenilmeden çizim ölçülerinden
 * tespit edilir ve gerekiyorsa çizim santimetreye çevrilir.
 */
export function analyzeDrawings(dm: DxfData, ds: DxfData | null): DxfAnalysis | { hata: string } {
  let M = analyzeArchitecture(dm);
  if (M.hata) return { hata: M.hata };
  let unit: Unit = M.birim === 'mm' || M.birim === 'm' ? M.birim : 'cm';
  let mData = dm;
  if (unit !== 'cm') {
    mData = scaleDxf(dm, FACTOR[unit]);
    const M2 = analyzeArchitecture(mData);
    if (M2.hata || !M2.katlar.length) {
      unit = 'cm';
      mData = dm;
    } else M = { ...M2, birim: unit, birim_baslik: M.birim_baslik };
  }
  if (!M.katlar.length) return { hata: NO_FLOOR_PLAN };
  let S = EMPTY_STRUCT;
  let sUnit: Unit | null = null;
  let sData: DxfData | null = null;
  if (ds) {
    sUnit = detectStructureUnit(ds) ?? unit;
    sData = scaleDxf(ds, FACTOR[sUnit]);
    S = analyzeStructure(sData);
  }
  return {
    mimari: M,
    statik: S,
    birim: { mimari: unit, statik: sUnit, baslik: M.birim_baslik },
    statikVar: Boolean(ds),
    veri: { mimari: mData, statik: sData },
  };
}

/** Kontrol ekranındaki seçimlerle (kat hariç, mahal türü/kaplama, kat yüksekliği, donatı) proje girdisi. */
export function projectFromAnalysis(
  a: Pick<DxfAnalysis, 'mimari' | 'statik' | 'statikVar'>,
  ad: string,
  sec: AnalysisOptions,
): DxfProject {
  const p = buildProject(ad, a.mimari, a.statik, sec);
  return a.statikVar ? p : withoutStructure(p);
}

/** Kat planlarından aynı kat(lar)ı tekrar gösterenler: [ilk, tekrar] dizin çiftleri. */
export function duplicateFloors(M: ArchResult): [number, number][] {
  const seen = new Map<string, number>();
  const out: [number, number][] = [];
  M.katlar.forEach((k, i) => {
    const key = (k.blok || 'A') + '|' + k.katlar.join(',');
    const first = seen.get(key);
    if (first === undefined) seen.set(key, i);
    else out.push([first, i]);
  });
  return out;
}

/** Kontrol ekranı uyarıları. */
export function analysisWarnings(a: DxfAnalysis): string[] {
  const M = a.mimari;
  const S = a.statik;
  const u: string[] = [];
  const unitNames: Record<string, string> = { cm: 'santimetre', mm: 'milimetre', m: 'metre' };
  if (M.birim_baslik !== a.birim.mimari)
    u.push(
      `Dosya başlığında birim "${M.birim_baslik}" yazıyor; çizim ölçülerine göre birim ${unitNames[a.birim.mimari]} alındı.`,
    );
  if (a.birim.statik && a.birim.statik !== a.birim.mimari)
    u.push(`Statik dosya ${unitNames[a.birim.statik]} ile çizilmiş görünüyor; ölçüler buna göre okundu.`);
  for (const [i, j] of duplicateFloors(M)) {
    const k = M.katlar[j]!;
    if (!k.haric)
      u.push(
        `"${k.baslik}" ile "${M.katlar[i]!.baslik}" aynı katları gösteriyor; aynı kat iki kez çizilmiş olabilir. Katlar sekmesinden birini hariç bırakabilirsin.`,
      );
  }
  let wetPaint = 0;
  let unknown = 0;
  let noPerimeter = 0;
  M.katlar.forEach((k) =>
    k.mahaller.forEach((m) => {
      if (m.tur === 'islak' && m.duvar && !/SERAM/i.test(m.duvar) && !(m.secim && m.secim.duvar)) wetPaint++;
      if (!m.std) unknown++;
      if (m.alan && !m.cevre) noPerimeter++;
    }),
  );
  if (wetPaint)
    u.push(
      `${wetPaint} ıslak hacimde duvar kaplaması çizimde "boya" yazıyor; kurala göre seramik alındı. Gerekirse Mahaller sekmesinden değiştir.`,
    );
  if (unknown) u.push(`${unknown} mahal adı tanınmadı, "kuru mahal" kabul edildi.`);
  if (noPerimeter) u.push(`${noPerimeter} mahalin kapalı sınırı bulunamadı; çevresi alandan tahmin edildi.`);
  const main = S.planlar.filter((p) => !p.kopya);
  if (!a.statikVar) u.push('Statik DXF yüklenmedi: beton, kalıp ve temel formülle tahmin edilir.');
  else if (!main.length)
    u.push('Statik dosyada kalıp planı bulunamadı: beton ve kalıp formülle tahmin edilir.');
  Object.keys(S.temel || {}).forEach((b) => {
    if (!S.temel[b]!.kalinlik_cm) u.push(`${b} blok radye kalınlığı çizimde bulunamadı; formül kullanılır.`);
  });
  return u;
}
