/**
 * DXF analiz kuralları: mimari (kat planları, mahaller, kapı/pencere, çevre), statik (kalıp planları, temel,
 * jet grout, beton sınıfı), kaplama kuralları ve hesap motoruna verilecek proje girdisinin üretimi.
 * Prototip kaynak/dxf.js ile aynı kurallar (iki gerçek proje çizimiyle doğrulanmış); farklar açıkça işaretlidir.
 * Tüm ölçüler santimetre (cm) varsayımıyla işlenir; birim farklıysa `normalizeUnits` önce cm'ye çevirir.
 */
import type { ProjectInput } from '../engine/model';
import type { DxfData, DxfLine, DxfText } from './reader';

/* ---------- yardımcılar ---------- */
/** Python round() (bankacı yuvarlaması) — prototip Python'dan taşındığı için aynısı. */
export function pyRound(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

class Counter<K> {
  map = new Map<K, number>();
  add(k: K, n = 1) {
    this.map.set(k, (this.map.get(k) || 0) + n);
  }
  get(k: K) {
    return this.map.get(k) || 0;
  }
  /** En sık görülenler (sayıya göre azalan; eşitlikte ilk görülen önce). */
  mostCommon(n?: number): [K, number][] {
    const a = Array.from(this.map.entries());
    a.sort((x, y) => y[1] - x[1]);
    return n ? a.slice(0, n) : a;
  }
  delete(k: K) {
    this.map.delete(k);
  }
  get size() {
    return this.map.size;
  }
}

type Pt = [number, number];
export function polygonArea(P: Pt[]): number {
  let s = 0;
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i]!;
    const b = P[(i + 1) % n]!;
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}
function perimeter(P: Pt[]): number {
  let s = 0;
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i]!;
    const b = P[(i + 1) % n]!;
    s += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return s;
}
function hullArea(P: Pt[]): number {
  const seen: Record<string, 1> = {};
  const Q: Pt[] = [];
  P.forEach((p) => {
    const k = p[0] + ',' + p[1];
    if (!seen[k]) {
      seen[k] = 1;
      Q.push(p);
    }
  });
  Q.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (Q.length < 3) return 0;
  const cr = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  const up: Pt[] = [];
  Q.forEach((p) => {
    while (lo.length >= 2 && cr(lo[lo.length - 2]!, lo[lo.length - 1]!, p) <= 0) lo.pop();
    lo.push(p);
  });
  for (let i = Q.length - 1; i >= 0; i--) {
    const p = Q[i]!;
    while (up.length >= 2 && cr(up[up.length - 2]!, up[up.length - 1]!, p) <= 0) up.pop();
    up.push(p);
  }
  return polygonArea(lo.slice(0, -1).concat(up.slice(0, -1)));
}
/** "12,30" → 12.3 ; "1.234,5" → 1234.5 ; "12.30" → 12.3 */
function num(s: string): number {
  return /,\d/.test(s) ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s);
}
const spaces = (s: string) => s.replace(/\s+/g, ' ');
const norm = (s: string) => spaces(s.split('%%U').join('').split('%%u').join('')).trim();
const minOf = (a: number[]) => a.reduce((m, x) => (x < m ? x : m), Infinity);
const maxOf = (a: number[]) => a.reduce((m, x) => (x > m ? x : m), -Infinity);

/* ---------- 2. Kat başlıkları ve plan bölgeleri ---------- */
export interface FloorTitle {
  blok: string;
  tur: 'cati' | 'catikati' | 'bodrum' | 'otopark' | 'normal';
  katlar: string[];
  tekrar: number;
}

/** Pafta başlığından katları çıkarır. Ör. "ZEMİN 1-2-3. KAT PLANI" → 4 tekrar. Vaziyet, kesit, depo, lejant elenir. */
export function parseFloorTitle(s: string): FloorTitle | null {
  const u = s
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');
  if (!/PLAN/.test(u) || /VAZIYET|YERLESIM|CEVRE PLAN|DEPOSU|ALAN HESAB|KESIT|GORUNUS|DETAY/.test(u))
    return null;
  if (/KALIP|APLIKASYON|DONATI|TEMEL|JET GROUT|IKSA/.test(u)) return null;
  const bm = /\b([A-Z])\s*BLOK/.exec(u);
  const blok = bm ? bm[1]! : '';
  const gov = u.replace(/\b[A-Z]\s*BLOK\b/g, '');
  if (/CATI\s+PLAN/.test(gov) && !/CATI\s+KATI/.test(gov))
    return { blok, tur: 'cati', katlar: ['ÇATI'], tekrar: 0 };
  if (/CATI\s+KATI/.test(gov)) return { blok, tur: 'catikati', katlar: ['ÇATI KATI'], tekrar: 1 };
  const katlar: string[] = [];
  const re1 = /(\d+)\s*\.?\s*BODRUM/g;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(gov))) katlar.push(m[1] + '. BODRUM');
  if (/BODRUM/.test(gov) && !katlar.length) katlar.push('BODRUM');
  if (/OTOPARK/.test(gov)) katlar.push('OTOPARK');
  if (/ZEMIN/.test(gov)) katlar.push('ZEMİN');
  const g2 = gov.replace(/\d+\s*\.?\s*BODRUM/g, '').replace(/1\s*\/\s*\d+|O\s*:\s*1\s*\/\s*\d+/g, '');
  m = /([\d][\d\s.,\-+VE]*)\s*\.?\s*(N\.\s*)?KAT/.exec(g2);
  if (m) (m[1]!.match(/\d+/g) || []).forEach((n) => katlar.push(n + '. KAT'));
  if (!katlar.length) return null;
  const tur = /BODRUM/.test(gov)
    ? 'bodrum'
    : /OTOPARK/.test(gov) && katlar.length === 1
      ? 'otopark'
      : 'normal';
  return { blok, tur, katlar, tekrar: katlar.length };
}

interface Region {
  baslik: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
function regions(bs: [string, number, number][]): Region[] {
  const rows = new Map<number, [string, number, number][]>();
  bs.forEach((b) => {
    const k = pyRound(b[2] / 500);
    if (!rows.has(k)) rows.set(k, []);
    rows.get(k)!.push(b);
  });
  const ys = Array.from(rows.keys()).sort((a, b) => a - b);
  const out: Region[] = [];
  ys.forEach((k, i) => {
    const s = rows
      .get(k)!
      .slice()
      .sort((a, b) => a[1] - b[1]);
    const y0 = minOf(s.map((b) => b[2]));
    const top =
      (i + 1 < ys.length
        ? minOf(ys.slice(i + 1).map((kk) => minOf(rows.get(kk)!.map((b) => b[2]))))
        : y0 + 6000) - 100;
    s.forEach((b, j) => {
      const left = j ? (s[j - 1]![1] + b[1]) / 2 : b[1] - (s.length > 1 ? (s[1]![1] - b[1]) / 2 : 3000);
      const right =
        j + 1 < s.length ? (s[j + 1]![1] + b[1]) / 2 : b[1] + (j ? (b[1] - s[j - 1]![1]) / 2 : 3000);
      out.push({ baslik: b[0], x0: left, x1: right, y0: y0 - 150, y1: top });
    });
  });
  return out;
}

/* ---------- 3. Mimari ---------- */
export type RoomKind = 'kuru' | 'mutfak' | 'islak' | 'balkon' | 'ortak' | 'teknik' | 'dukkan';
export const ROOM_KINDS: readonly RoomKind[] = [
  'kuru',
  'mutfak',
  'islak',
  'balkon',
  'ortak',
  'teknik',
  'dukkan',
];
export const ROOM_KIND_NAMES: Record<RoomKind, string> = {
  kuru: 'Kuru',
  mutfak: 'Mutfak',
  islak: 'Islak',
  balkon: 'Balkon',
  ortak: 'Ortak',
  teknik: 'Teknik',
  dukkan: 'Dükkan',
};

const ROOMS: [RegExp, string, RoomKind][] = [
  [/^SALON|OTURMA/, 'Salon', 'kuru'],
  [/^E\.?\s*Y\.?\s*ODASI|EBEVEYN/, 'Ebeveyn yatak odası', 'kuru'],
  [/^Y\.?\s*ODASI|YATAK/, 'Yatak odası', 'kuru'],
  [/^ODA\s*\+\s*MUTFAK/, 'Oda + mutfak nişi', 'kuru'],
  [/^ODA/, 'Oda', 'kuru'],
  [/^MUTFAK/, 'Mutfak', 'mutfak'],
  [/^BANYO/, 'Banyo', 'islak'],
  [/^DUŞ|^DUS/, 'Duş / ebeveyn banyosu', 'islak'],
  [/^WC|^W\.C/, 'WC', 'islak'],
  [/^ANTRE|^HOL$|^ANTRE\/HOL|^KORİDOR|^KORIDOR/, 'Antre / hol', 'kuru'],
  [/^BALKON|^BLK|^TERAS/, 'Balkon / teras', 'balkon'],
  [/MER(D)?\.?\s*HOL|MERDİVEN HOL|^MERDİVEN|^MERD/, 'Merdiven / merdiven holü', 'ortak'],
  [/TEC\.?\s*HOL|^HOL\b|GİRİŞ HOL|GIRIS HOL/, 'Kat / giriş holü', 'ortak'],
  [/^ASANSÖR|^ASANSOR/, 'Asansör', 'ortak'],
  [/OTOPARK|GARAJ/, 'Otopark', 'teknik'],
  [/DEPO|KİLER|KILER/, 'Depo', 'teknik'],
  [
    /ENERJİ|ENERJI|TELEKOM|JENERAT|KAZAN|SU DEPOSU|HİDROFOR|POMPA|SIĞINAK|SIGINAK|ELEKTRİK|TRAFO|ÇÖP|COP/,
    'Teknik hacim',
    'teknik',
  ],
  [/DÜKKAN|DUKKAN|MAĞAZA/, 'Dükkan', 'dukkan'],
  [/ÇATI ARASI|CATI ARASI/, 'Çatı arası', 'teknik'],
];
/** Mahal adını standart ada ve türe çevirir; tanınmazsa [null, null]. */
export function classifyRoom(ad: string): [string | null, RoomKind | null] {
  const u = ad.trim().toUpperCase().replace(/i/g, 'İ');
  for (const [re, std, tur] of ROOMS) if (re.test(u)) return [std, tur];
  return [null, null];
}

function lineGroups(Ls: [number, number, number, number][], d: number): [number, number, number, number][][] {
  const par = Ls.map((_, i) => i);
  const find = (i: number) => {
    while (par[i] !== i) {
      par[i] = par[par[i]!]!;
      i = par[i]!;
    }
    return i;
  };
  const cell = new Map<string, number[]>();
  Ls.forEach((l, i) => {
    [
      [l[0], l[1]],
      [l[2], l[3]],
    ].forEach((p) => {
      const k = Math.floor(p[0]! / d) + ',' + Math.floor(p[1]! / d);
      if (!cell.has(k)) cell.set(k, []);
      cell.get(k)!.push(i);
    });
  });
  cell.forEach((ids, k) => {
    const c = k.split(',').map(Number);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        (cell.get(c[0]! + dx + ',' + (c[1]! + dy)) || []).forEach((j) => {
          ids.forEach((i) => {
            par[find(i)] = find(j);
          });
        });
  });
  const gm = new Map<number, [number, number, number, number][]>();
  Ls.forEach((l, i) => {
    const r = find(i);
    if (!gm.has(r)) gm.set(r, []);
    gm.get(r)!.push(l);
  });
  return Array.from(gm.values());
}

/** Kaplama seçimi (kullanıcının kontrol ekranındaki değişikliği). */
export interface FinishChoice {
  zemin?: string;
  duvar?: string;
  tavan?: string;
}

export interface Room {
  ad: string;
  std: string | null;
  tur: RoomKind | null;
  alan: number;
  zemin: string;
  duvar: string;
  tavan: string;
  x: number;
  y: number;
  kaynak: 'birleşik etiket' | 'ad + alan yazısı';
  /** Kapalı sınırdan ölçülen çevre (m); bulunamazsa null (alandan tahmin edilir). */
  cevre: number | null;
  secim?: FinishChoice;
}

export interface ArchFloor {
  baslik: string;
  bolge: [number, number, number, number];
  blok: string;
  tur: FloorTitle['tur'];
  katlar: string[];
  tekrar: number;
  genislik: number;
  mahaller: Room[];
  kapilar: Record<string, number>;
  pencereler: Record<string, number>;
  pencere_yontemi: string;
  /** Kontrol ekranında kullanıcı hesap dışı bıraktı. */
  haric?: boolean;
}

export interface ArchResult {
  hata?: string;
  birim_baslik: string;
  birim: string;
  plan_genisligi: number;
  katlar: ArchFloor[];
}

const UNIT_NAMES: Record<number, string> = { 1: 'inç', 4: 'mm', 5: 'cm', 6: 'm', 0: 'belirsiz' };

export function analyzeArchitecture(d: DxfData): ArchResult {
  const T = d.T.map((t) => ({ ...t, m: spaces(t.m) }));
  const PL = d.L.filter((l) => /PENCERE|PENC/i.test(l[0])).map(
    (l) => l.slice(1) as [number, number, number, number],
  );
  const KP: [Pt[], number, number, number, number, number][] = [];
  d.P.forEach((p) => {
    if (/%30/.test(p.k) || p.P.length < 3) return;
    const a = polygonArea(p.P);
    if (!(a > 5000 && a < 1e7)) return;
    const xs = p.P.map((q) => q[0]);
    const ys = p.P.map((q) => q[1]);
    KP.push([p.P, a, minOf(xs), maxOf(xs), minOf(ys), maxOf(ys)]);
  });
  let plan = T.filter((t) => /PLAN/.test(t.m.toUpperCase()) && t.m.length < 80 && t.h > 0);
  if (!plan.length)
    return {
      hata: 'Mimari dosyada kat planı başlığı bulunamadı.',
      birim_baslik: '?',
      birim: '?',
      plan_genisligi: 0,
      katlar: [],
    };
  const hm = maxOf(plan.map((t) => t.h));
  plan = plan.filter((t) => t.h >= 0.6 * hm);
  const count = new Counter<number>();
  plan.forEach((t) => {
    if (parseFloorTitle(t.m)) count.add(pyRound(t.y / 500));
  });
  plan = plan.filter((t) => count.get(pyRound(t.y / 500)) >= 3);
  const B = regions(plan.map((t) => [t.m, t.x, t.y]));
  const katlar: ArchFloor[] = [];
  B.forEach((r) => {
    const kb = parseFloorTitle(r.baslik);
    if (!kb || kb.tur === 'cati') return;
    const ic = T.filter((t) => r.x0 <= t.x && t.x < r.x1 && r.y0 <= t.y && t.y < r.y1);
    const mh: Room[] = [];
    ic.forEach((t) => {
      if (!/\bA\s*:\s*[\d.,]+\s*m/.test(t.m)) return;
      const parts = t.m.split(/\b(Döşeme|Zemin|Duvar|Tavan|A)\s*:\s*/);
      const ad = parts[0]!.trim();
      const al: Record<string, string> = {};
      for (let i = 1; i < parts.length - 1; i += 2) al[parts[i]!] = parts[i + 1]!.trim();
      const am = /^([\d.,]+)/.exec(al.A || '');
      if (!ad || !am) return;
      const st = classifyRoom(ad);
      mh.push({
        ad,
        std: st[0],
        tur: st[1],
        alan: num(am[1]!),
        zemin: al['Döşeme'] != null ? al['Döşeme'] : al.Zemin || '',
        duvar: al.Duvar || '',
        tavan: al.Tavan || '',
        x: t.x,
        y: t.y,
        kaynak: 'birleşik etiket',
        cevre: null,
      });
    });
    if (!mh.length) {
      const areas = ic.filter((t) => /^\d+[.,]\d+\s*m(²|2)$/.test(t.m));
      const used: Record<number, 1> = {};
      ic.forEach((t) => {
        if (/^[\d.,/+\-±]+/.test(t.m) || t.m.length > 30) return;
        const st = classifyRoom(t.m);
        if (!st[0]) return;
        const cand: [number, number][] = [];
        areas.forEach((a, i) => {
          if (!used[i] && Math.abs(a.x - t.x) < 80 && t.y - a.y > 0 && t.y - a.y < 45)
            cand.push([Math.abs(a.x - t.x) + Math.abs(t.y - a.y - 18), i]);
        });
        if (!cand.length && st[0] !== 'Asansör') return;
        let A = 0;
        if (cand.length) {
          cand.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
          const i = cand[0]![1];
          used[i] = 1;
          A = num(/^([\d.,]+)/.exec(areas[i]!.m)![1]!);
        }
        mh.push({
          ad: t.m.trim(),
          std: st[0],
          tur: st[1],
          alan: A,
          zemin: '',
          duvar: '',
          tavan: '',
          x: t.x,
          y: t.y,
          kaynak: 'ad + alan yazısı',
          cevre: null,
        });
      });
    }
    const doors = new Counter<string>();
    const wins = new Counter<string>();
    ic.forEach((t) => {
      const m = /^([KPD]\d*)?\s*(\d{2,3})\s*\/\s*(\d{2,3})(?:\s*h\s*=\s*(\d+))?$/.exec(t.m);
      if (!m) return;
      const on = (m[1] || '').toUpperCase();
      const en = +m[2]!;
      const boy = +m[3]!;
      if (on[0] === 'K' || (on[0] !== 'P' && boy >= 200)) doors.add(en + '/' + boy);
      else wins.add(en + '/' + boy);
    });
    let py = wins.size ? 'ölçü yazısı' : '';
    if (!wins.size) {
      lineGroups(
        PL.filter((l) => r.x0 <= l[0] && l[0] < r.x1 && r.y0 <= l[1] && l[1] < r.y1),
        40,
      ).forEach((gq) => {
        const xs: number[] = [];
        const ys: number[] = [];
        gq.forEach((l) => {
          xs.push(l[0], l[2]);
          ys.push(l[1], l[3]);
        });
        const dx = maxOf(xs) - minOf(xs);
        const dy = maxOf(ys) - minOf(ys);
        const en = Math.max(dx, dy);
        const kal = Math.min(dx, dy);
        if (en >= 40 && en <= 450 && kal <= 60) wins.add(pyRound(en / 10) * 10 + '/150');
      });
      if (wins.size) py = 'pencere katmanı çizgileri (yükseklik 150 varsayıldı)';
    }
    mh.forEach((m_) => {
      m_.cevre = null;
      if (!m_.alan) return;
      for (const k of KP) {
        if (
          Math.abs(k[1] / 1e4 - m_.alan) / m_.alan < 0.08 &&
          k[2] <= m_.x &&
          m_.x <= k[3] &&
          k[4] - 60 <= m_.y &&
          m_.y <= k[5]
        ) {
          m_.cevre = perimeter(k[0].concat([k[0][0]!])) / 100;
          break;
        }
      }
    });
    katlar.push({
      baslik: r.baslik,
      bolge: [r.x0, r.y0, r.x1, r.y1],
      blok: kb.blok,
      tur: kb.tur,
      katlar: kb.katlar,
      tekrar: kb.tekrar,
      genislik: r.x1 - r.x0,
      mahaller: mh,
      kapilar: Object.fromEntries(doors.map),
      pencereler: Object.fromEntries(wins.map),
      pencere_yontemi: py,
    });
  });
  const gs = katlar.map((k) => k.genislik).sort((a, b) => a - b);
  const gen = gs.length ? gs[Math.floor(gs.length / 2)]! : 0;
  const birim =
    gen >= 800 && gen <= 9000 ? 'cm' : gen > 8000 && gen <= 90000 ? 'mm' : gen >= 8 && gen <= 90 ? 'm' : '?';
  const bu = UNIT_NAMES[parseInt(d.header.$INSUNITS || '0', 10)] || '?';
  return { birim_baslik: bu, birim, plan_genisligi: gen, katlar };
}

/* ---------- 4. Statik ---------- */
function clusters(cz: DxfLine[], h = 150): DxfLine[][] {
  const par = new Map<string, string>();
  const find = (a: string) => {
    while (par.get(a) !== a) {
      par.set(a, par.get(par.get(a)!)!);
      a = par.get(a)!;
    }
    return a;
  };
  const union = (a: string, b: string) => {
    if (!par.has(a)) par.set(a, a);
    if (!par.has(b)) par.set(b, b);
    const ra = find(a);
    const rb = find(b);
    par.set(ra, rb);
  };
  const hk = (x: number, y: number) => Math.floor(x / h) + ',' + Math.floor(y / h);
  cz.forEach((l) => {
    const ax = Math.floor(l[1] / h);
    const ay = Math.floor(l[2] / h);
    const a = ax + ',' + ay;
    union(a, hk(l[3], l[4]));
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const n = ax + dx + ',' + (ay + dy);
        if (par.has(n)) union(a, n);
      }
  });
  const g2 = new Map<string, DxfLine[]>();
  cz.forEach((l) => {
    const r = find(hk(l[1], l[2]));
    if (!g2.has(r)) g2.set(r, []);
    g2.get(r)!.push(l);
  });
  return Array.from(g2.values());
}

/** Çizgilerin oluşturduğu kapalı alanın içi (raster dolgu ile), cm². */
function enclosedArea(
  C: [number, number, number, number][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  h = 20,
): number {
  const nx = Math.floor((x1 - x0) / h) + 3;
  const ny = Math.floor((y1 - y0) / h) + 3;
  const gr = new Uint8Array(nx * ny);
  C.forEach((c) => {
    const n = Math.floor(Math.max(Math.abs(c[2] - c[0]), Math.abs(c[3] - c[1])) / (h / 2)) + 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = Math.trunc((c[0] + (c[2] - c[0]) * t - x0) / h) + 1;
      const y = Math.trunc((c[1] + (c[3] - c[1]) * t - y0) / h) + 1;
      if (x >= 0 && x < nx && y >= 0 && y < ny) gr[y * nx + x] = 1;
    }
  });
  const out = new Uint8Array(nx * ny);
  const q = new Int32Array(nx * ny);
  let head = 0;
  let tail = 0;
  let n2 = 1;
  q[tail++] = 0;
  out[0] = 1;
  while (head < tail) {
    const k = q[head++]!;
    const x = k % nx;
    const y = (k - x) / nx;
    const nb = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (let j = 0; j < 4; j++) {
      const xx = nb[j]![0]!;
      const yy = nb[j]![1]!;
      if (xx >= 0 && xx < nx && yy >= 0 && yy < ny) {
        const jj = yy * nx + xx;
        if (!out[jj] && !gr[jj]) {
          out[jj] = 1;
          q[tail++] = jj;
          n2++;
        }
      }
    }
  }
  return (nx * ny - n2) * h * h;
}

function floorCode(ad: string): string | null {
  let m = /^K(Z|Ç|B)(\d{2,3})$/.exec(ad);
  if (m) return ({ Z: 'Zemin', Ç: 'Çatı', B: 'Bodrum' } as Record<string, string>)[m[1]!]!;
  m = /^K(\d)B(\d{2,3})$/.exec(ad);
  if (m) return m[1] + '. bodrum';
  m = /^K(\d{3,4})$/.exec(ad);
  if (m) return m[1]![0] + '. normal';
  return null;
}
function readRepeat(b: string): number {
  const u = b.toUpperCase();
  let m = /Z\+([\d+]+)\.?\s*N\./.exec(u);
  if (m) return 1 + (m[1]!.match(/\d+/g) || []).length;
  m = /ZEMİN,\s*([\d.,\s]+)\s*NORMAL/.exec(u);
  if (m) return 1 + (m[1]!.match(/\d+/g) || []).length;
  return 1;
}
const ORDER: Record<string, number> = { bodrum: 0, Bodrum: 1, Zemin: 2, normal: 3, Çatı: 4 };

export interface StructPlan {
  x0: number;
  y0: number;
  gen: number;
  yuk: number;
  kat: string | null;
  kiris_cizgi_m: number;
  kiris_adi: number;
  kiris_kesit: [string, number][];
  ort_kiris_h: number | null;
  ort_kiris_b: number | null;
  doseme_kalinlik: [number, number][];
  kolon_adet: number;
  kolon_alan_m2: number;
  kolon_cevre_m: number;
  dis_sinir_m2: number;
  doseme_alan_m2: number;
  alan_yontemi: string;
  baslik: string;
  blok: string;
  tekrar: number;
  kopya: string;
}
export interface Foundation {
  tip: string;
  kalinlik_cm: number | null;
  alan_m2: number;
  alan_kaynagi: string;
}
export interface JetGrout {
  adet: number;
  boy_m: number | null;
  cap_cm: number | null;
}
export interface StructResult {
  planlar: StructPlan[];
  temel: Record<string, Foundation>;
  jet_grout: Record<string, JetGrout>;
  beton_sinifi: string | null;
}

export function analyzeStructure(d: DxfData): StructResult {
  const T = d.T.map((t) => ({ m: norm(t.m), x: t.x, y: t.y, k: t.k }));
  const cz = d.L.filter((l) => /^BEAM/i.test(l[0]));
  const SC: [number, number, number, number][] = [];
  d.L.forEach((l) => {
    if (/^(BEAM|COLUMN[34]$|LGP-SLAB|SLAB)/i.test(l[0]))
      SC.push(l.slice(1) as [number, number, number, number]);
  });
  d.P.forEach((p) => {
    if (/^(BEAM|COLUMN[34]$|LGP-SLAB|SLAB)/i.test(p.k))
      for (let i = 0; i < p.P.length; i++) {
        const a = p.P[i]!;
        const b = p.P[(i + 1) % p.P.length]!;
        SC.push([a[0], a[1], b[0], b[1]]);
      }
  });
  const cols: [number, number, number, number][] = [];
  d.P.forEach((p) => {
    if (!/^COLUMN[34]$/.test(p.k)) return;
    const Q = p.P;
    const a = polygonArea(Q);
    if (a >= 300 && a <= 200000 && Q.length >= 4) {
      const kp = Q[0]![0] !== Q[Q.length - 1]![0] || Q[0]![1] !== Q[Q.length - 1]![1] ? Q.concat([Q[0]!]) : Q;
      cols.push([
        Q.reduce((s, q) => s + q[0], 0) / Q.length,
        Q.reduce((s, q) => s + q[1], 0) / Q.length,
        a,
        perimeter(kp),
      ]);
    }
  });
  const plans: StructPlan[] = [];
  clusters(cz).forEach((gq) => {
    const xs: number[] = [];
    const ys: number[] = [];
    let len = 0;
    gq.forEach((l) => {
      xs.push(l[1], l[3]);
      ys.push(l[2], l[4]);
      len += Math.hypot(l[3] - l[1], l[4] - l[2]);
    });
    const x0 = minOf(xs);
    const x1 = maxOf(xs);
    const y0 = minOf(ys);
    const y1 = maxOf(ys);
    if (len < 5000 || Math.min(x1 - x0, y1 - y0) < 600) return;
    const ic = T.filter((t) => x0 - 50 <= t.x && t.x <= x1 + 50 && y0 - 50 <= t.y && t.y <= y1 + 50);
    const names = ic.filter((t) => /^K[ZÇB\d][\dB]*$|^K[ZÇB\d][\dB]*\s/.test(t.m));
    const sections: [number, number][] = [];
    ic.forEach((t) => {
      const m = /\((\d{2,3})\/(\d{2,3})\)/.exec(t.m);
      if (m && t.k.indexOf('BEAM') === 0 && !/^(P|HATIL)/.test(t.m)) sections.push([+m[1]!, +m[2]!]);
    });
    const code = new Counter<string | null>();
    names.forEach((t) => code.add(floorCode(/^(K\S+)/.exec(t.m)![1]!)));
    code.delete(null);
    const dk = new Counter<number>();
    const dk2 = new Counter<number>();
    ic.forEach((t) => {
      if (/^\d{2}cm$/.test(t.m) && t.k.indexOf('LGP-SLAB') === 0) dk.add(parseInt(t.m, 10));
      const m = /\bd\s*=\s*(\d{2})/.exec(t.m);
      if (m) dk2.add(+m[1]!);
    });
    const kk = cols.filter((k) => x0 <= k[0] && k[0] <= x1 && y0 <= k[1] && k[1] <= y1);
    const kc = new Counter<string>();
    sections.forEach((k) => kc.add(k[0] + '/' + k[1]));
    const nameSet: Record<string, 1> = {};
    names.forEach((t) => {
      nameSet[t.m.split(' ')[0]!] = 1;
    });
    const hp: Pt[] = [];
    gq.forEach((l) => {
      hp.push([pyRound(l[1]), pyRound(l[2])], [pyRound(l[3]), pyRound(l[4])]);
    });
    plans.push({
      x0,
      y0,
      gen: (x1 - x0) / 100,
      yuk: (y1 - y0) / 100,
      kat: code.size ? code.mostCommon(1)[0]![0] : null,
      kiris_cizgi_m: len / 100,
      kiris_adi: Object.keys(nameSet).length,
      kiris_kesit: kc.mostCommon(6),
      ort_kiris_h: sections.length ? sections.reduce((s, k) => s + k[1], 0) / sections.length : null,
      ort_kiris_b: sections.length ? sections.reduce((s, k) => s + k[0], 0) / sections.length : null,
      doseme_kalinlik: (dk.size ? dk : dk2).mostCommon(3),
      kolon_adet: kk.length,
      kolon_alan_m2: kk.reduce((s, k) => s + k[2], 0) / 1e4,
      kolon_cevre_m: kk.reduce((s, k) => s + k[3], 0) / 100,
      dis_sinir_m2: hullArea(hp) / 1e4,
      doseme_alan_m2: 0,
      alan_yontemi: '',
      baslik: '',
      blok: '',
      tekrar: 1,
      kopya: '',
    });
  });
  plans.forEach((p) => {
    const x0 = p.x0 - 100;
    const y0 = p.y0 - 100;
    const x1 = p.x0 + p.gen * 100 + 100;
    const y1 = p.y0 + p.yuk * 100 + 100;
    const a =
      enclosedArea(
        SC.filter((c) => x0 <= c[0] && c[0] <= x1 && y0 <= c[1] && c[1] <= y1),
        x0,
        y0,
        x1,
        y1,
      ) / 1e4;
    if (a >= 0.6 * p.dis_sinir_m2) {
      p.doseme_alan_m2 = a;
      p.alan_yontemi = 'kiriş ve döşeme kenarlarından kapalı alan';
    } else {
      p.doseme_alan_m2 = p.dis_sinir_m2;
      p.alan_yontemi = 'kapalı sınır bulunamadı, dış zarf (fazla çıkabilir)';
    }
  });
  const titles = T.filter((t) => {
    const u = t.m.toUpperCase();
    return /KALIP PLAN/.test(u) && !/KOLON KALIP|KİRİŞ KALIP|DÖŞEME KALIP|MERDİVEN|ÜSTTEN|BACA/.test(u);
  });
  plans.forEach((p) => {
    const ad = titles.filter(
      (t) => p.x0 - 400 <= t.x && t.x <= p.x0 + p.gen * 100 && p.y0 - 900 <= t.y && t.y <= p.y0 + 50,
    );
    ad.sort(
      (a, b) => Math.abs(a.x - p.x0) + Math.abs(a.y - p.y0) - (Math.abs(b.x - p.x0) + Math.abs(b.y - p.y0)),
    );
    p.baslik = ad.length ? ad[0]!.m : '';
    const m = /\b([A-Z]) BLOK/.exec(p.baslik.toUpperCase());
    p.blok = m ? m[1]! : '';
    p.tekrar = p.baslik ? readRepeat(p.baslik) : 1;
  });
  const main: Record<string, StructPlan> = {};
  plans
    .slice()
    .sort((a, b) => b.kiris_adi - a.kiris_adi)
    .forEach((p) => {
      const key = p.blok + '|' + p.kat;
      if (p.kat == null || p.kiris_adi < 5) p.kopya = 'adsız eş çizim (donatı/kalıp eşi)';
      else if (main[key]) p.kopya = 'aynı kat ikinci kez çizilmiş';
      else {
        p.kopya = '';
        main[key] = p;
      }
    });
  const temel: Record<string, Foundation> = {};
  const thick: [number, (typeof T)[number]][] = [];
  T.forEach((t) => {
    const m =
      /^(\d{2,3})\s*cm\s*RADYE/i.exec(t.m) ||
      (t.k.indexOf('MAT_FND') === 0 ? /^(\d{2,3})cm$/.exec(t.m) : null);
    if (m) thick.push([+m[1]!, t]);
  });
  const tb = T.filter((t) => /RADYE TEMEL (KALIP|APL)/.test(t.m.toUpperCase()));
  const cls = new Counter<string>();
  T.forEach((t) => {
    const m = /\b(C\d{2})\b/.exec(t.m);
    if (m) cls.add(m[1]!);
  });
  const blocks = Array.from(new Set(plans.filter((p) => !p.kopya).map((p) => p.blok))).sort();
  const rank = (p: StructPlan) => {
    const k = p.kat || '';
    const base = ORDER[k.replace(/^\d\. /, '')];
    return (base != null ? base : 5) * 10 - (/^\d/.test(k) && k.indexOf('bodrum') >= 0 ? +k[0]! : 0);
  };
  blocks.forEach((blok) => {
    const as = plans.filter((p) => !p.kopya && p.blok === blok);
    const ea = as.reduce((m, p) => (rank(p) < rank(m) ? p : m), as[0]!);
    let d2: number | null = null;
    const bt = blok ? tb.filter((t) => t.m.toUpperCase().indexOf(' ' + blok + ' BLOK') >= 0) : tb;
    if (bt.length && thick.length) {
      const b0 = bt[0]!;
      d2 = thick.reduce((m, k) =>
        Math.abs(k[1].y - b0.y) + Math.abs(k[1].x - b0.x) * 0.3 <
        Math.abs(m[1].y - b0.y) + Math.abs(m[1].x - b0.x) * 0.3
          ? k
          : m,
      )[0];
    } else if (thick.length) {
      const ks = new Counter<number>();
      thick.forEach((k) => ks.add(k[0]));
      d2 = ks.mostCommon(1)[0]![0];
    }
    temel[blok || 'A'] = {
      tip: tb.length || thick.length ? 'Radye' : 'bulunamadı',
      kalinlik_cm: d2,
      alan_m2: Math.round(ea.doseme_alan_m2 * 1.05 * 10) / 10,
      alan_kaynagi: 'en alt kat (' + ea.kat + ') döşeme alanı + %5',
    };
  });
  const jet: Record<string, JetGrout> = {};
  const jb = T.filter((t) => /JET GROUT PLANI/.test(t.m.toUpperCase()));
  T.forEach((t) => {
    const m = /JET-?\s*GROUT ADED[İI]\s*=\s*(\d+)/.exec(t.m.toUpperCase());
    if (!m) return;
    const near = (re: RegExp, dy: number) => {
      for (const u of T) {
        const x = re.exec(u.m.toUpperCase());
        if (x && Math.abs(u.x - t.x) < 50 && u.y - t.y > 0 && u.y - t.y < dy) return +x[1]!;
      }
      return null;
    };
    const len = near(/JET-?\s*GROUT BOYU\s*=\s*(\d+)/, 200);
    const dia = near(/JET-?\s*GROUT [ÇC]API\s*=\s*(\d+)/, 300);
    const yb = jb.length
      ? jb.reduce((a, b) =>
          Math.abs(b.x - t.x) + Math.abs(b.y - t.y) < Math.abs(a.x - t.x) + Math.abs(a.y - t.y) ? b : a,
        )
      : null;
    const mb = yb ? /\b([A-Z]) BLOK/.exec(yb.m.toUpperCase()) : null;
    jet[mb ? mb[1]! : 'A'] = { adet: +m[1]!, boy_m: len != null ? len / 100 : null, cap_cm: dia };
  });
  return { planlar: plans, temel, jet_grout: jet, beton_sinifi: cls.size ? cls.mostCommon(1)[0]![0] : null };
}

/* ---------- 5. Kaplama kuralları (kullanıcı onaylı) ---------- */
export const FINISH_RULES: Record<RoomKind, Required<FinishChoice>> = {
  kuru: { zemin: 'Laminat parke', duvar: 'Plastik boya', tavan: 'Plastik boya' },
  mutfak: { zemin: 'Seramik', duvar: 'Plastik boya', tavan: 'Plastik boya' },
  islak: { zemin: 'Seramik', duvar: 'Seramik', tavan: 'Asma tavan (yeşil alçıpan)' },
  balkon: {
    zemin: 'Seramik (dış mekân, donmaya dayanıklı)',
    duvar: 'Dış cephe kaplaması',
    tavan: 'Plastik boya (dış cephe)',
  },
  ortak: { zemin: 'Mermer', duvar: 'Plastik boya', tavan: 'Plastik boya' },
  teknik: { zemin: 'Perdahlı beton', duvar: 'Kara sıva + boya', tavan: 'Kara sıva + boya' },
  dukkan: { zemin: 'Seramik', duvar: 'Plastik boya', tavan: 'Plastik boya' },
};
export const FINISH_OPTIONS: Required<{ [K in keyof FinishChoice]: string[] }> = {
  zemin: [
    'Laminat parke',
    'Seramik',
    'Seramik (dış mekân, donmaya dayanıklı)',
    'Mermer',
    'Granit seramik',
    'Perdahlı beton',
    'Epoksi',
  ],
  duvar: ['Plastik boya', 'Seramik', 'Kara sıva + boya', 'Dış cephe kaplaması'],
  tavan: ['Plastik boya', 'Badana', 'Asma tavan (alçıpan)', 'Asma tavan (yeşil alçıpan)', 'Kara sıva + boya'],
};
const MATCH: [string, string][] = [
  ['SERAMIK', 'Seramik'],
  ['SERAMİK', 'Seramik'],
  ['GRANİT', 'Granit seramik'],
  ['GRANIT', 'Granit seramik'],
  ['MERMER', 'Mermer'],
  ['LAMİNAT', 'Laminat parke'],
  ['LAMINAT', 'Laminat parke'],
  ['PARKE', 'Laminat parke'],
  ['BOYA', 'Plastik boya'],
  ['PLASTİK BOYA', 'Plastik boya'],
  ['BADANA', 'Badana'],
  ['ŞAP', 'Perdahlı beton'],
  ['SAP', 'Perdahlı beton'],
  ['BETON', 'Perdahlı beton'],
  ['EPOKSİ', 'Epoksi'],
  ['ALÇIPAN', 'Asma tavan (alçıpan)'],
];
/** Çizimdeki kaplama yazısını standart ada çevirir. */
export function standardFinish(s: string): string {
  const u = s.trim().toUpperCase();
  for (const [k, v] of MATCH) if (u.indexOf(k) >= 0) return v;
  return s.trim();
}
/** Geçerli kaplama: kullanıcı seçimi > çizimdeki yazı > kural tablosu. */
export function chosenFinish(m: Room, y: keyof FinishChoice): string {
  if (m.secim && m.secim[y]) return m.secim[y]!;
  const s = m[y];
  return s ? standardFinish(s) : FINISH_RULES[m.tur || 'kuru'][y];
}

/* ---------- 6. Proje girdisi üretimi ---------- */
function floorKind(b: string): 'otopark' | 'bodrum' | 'normal' {
  const u = b.toUpperCase();
  return u.indexOf('OTOPARK') >= 0 ? 'otopark' : u.indexOf('BODRUM') >= 0 ? 'bodrum' : 'normal';
}
function structFloorName(b: string): string | null {
  const u = b.toUpperCase();
  let m: RegExpExecArray | null;
  if (u.indexOf('OTOPARK') >= 0) return null;
  if ((m = /(\d)\.\s*BODRUM/.exec(u))) return m[1] + '. bodrum';
  if (u.indexOf('BODRUM') >= 0) return 'Bodrum';
  if (u.indexOf('ZEMİN') >= 0) return 'Zemin';
  if (u.indexOf('ÇATI') >= 0) return 'Çatı';
  m = /(\d)\.\s*KAT/.exec(u);
  return m ? m[1] + '. normal' : null;
}
/** Yeni kalemlerin başlangıç tahmini birim fiyatları (yapay zekâ yoksa; kullanıcı onaylar). */
export const ESTIMATES = { jetGrout: 2100, betonFark: { C35: 300, C40: 650 } as Record<string, number> };

export interface AnalysisOptions {
  katYuksekligi?: number;
  donatiKgM3?: number;
  il?: string;
}

/** Çizimden üretilen proje girdisi (motorun ProjectInput'u + çizim bilgisi). */
export type DxfProject = ProjectInput & { _dxf: Record<string, unknown> };

export function buildProject(
  ad: string,
  M: ArchResult,
  S: StructResult,
  sec: AnalysisOptions = {},
): DxfProject {
  const H = sec.katYuksekligi || 3;
  const donati = sec.donatiKgM3 || 110;
  const floorsUsed = M.katlar.filter((k) => !k.haric);
  const bl = Array.from(new Set(floorsUsed.map((k) => k.blok || 'A'))).sort();
  const P: DxfProject = {
    ad,
    il: sec.il || 'İstanbul',
    arsa: '',
    blokAdedi: bl.length,
    toplamOturum: '',
    toplamInsaatAlani: '',
    tipler: [],
    bloklar: [],
    sureAy: 18,
    satisOfisi: false,
    ornekDaire: false,
    jenerator: false,
    trafo: false,
    hamam: false,
    sauna: false,
    finHamami: false,
    fitness: false,
    havuz: false,
    havuzM2: 100,
    kdvOrani: 20,
    ongorulemeyenOrani: 2,
    duzeltmeler: {},
    ekKalemler: {},
    _dxf: {},
  };
  const types: Record<string, NonNullable<ProjectInput['tipler']>[number]> = {};
  const typeOrder: NonNullable<ProjectInput['tipler']> = [];
  bl.forEach((b, n) => {
    const katlar = floorsUsed.filter((k) => (k.blok || 'A') === b);
    const sp = S.planlar.filter((p) => !p.kopya && (p.blok || 'A') === b);
    const spm: Record<string, StructPlan> = {};
    sp.forEach((p) => {
      spm[p.kat as string] = p;
    });
    const rows: Record<string, unknown>[] = [];
    const ms_ = new Counter<string>();
    let BIA = 0;
    let beton = 0;
    katlar.forEach((k) => {
      const ms = k.mahaller;
      const tek = k.tekrar;
      let tur: string = floorKind(k.baslik);
      const salon = ms.filter((m) => m.std === 'Salon' || m.std === 'Oda + mutfak nişi').length;
      const roofFloor = k.baslik.toUpperCase().indexOf('ÇATI') >= 0;
      if (tur === 'normal' && salon === 0) tur = roofFloor ? 'cati_kati' : 'bodrum';
      let pl: StructPlan | null = spm[structFloorName(k.baslik) as string] || null;
      if (!pl && tur === 'normal') {
        const kn = /(\d)\.\s*KAT/.exec(k.baslik.toUpperCase());
        const z = spm.Zemin;
        if (z && (k.baslik.toUpperCase().indexOf('ZEMİN') >= 0 || (kn && z.tekrar > +kn[1]!))) pl = z;
      }
      if (!pl && tur === 'otopark') pl = spm['1. bodrum'] || spm.Bodrum || null;
      const ak = pl ? pl.doseme_alan_m2 : ms.reduce((s, m) => s + m.alan, 0) * 1.15;
      BIA += ak * tek;
      const row: Record<string, unknown> & { daireler: { tip: string; adet: number }[] } = {
        tur,
        tekrar: tek,
        yukseklik: H,
        gomulu: tur === 'bodrum' || tur === 'otopark' ? 'EVET' : 'HAYIR',
        m2: Math.round(ak * 10) / 10,
        daireler: [],
        _kaynak: k.baslik,
        _statik: pl ? pl.kat : 'yok',
      };
      if (tur === 'normal') {
        /* Daireler: her daire içi mahal en yakın salona bağlanır; her salon bir daire.
           Aynı oda sayısı ve yakın net alanlı daireler aynı tip olur. */
        const salons = ms.filter((m) => m.std === 'Salon' || m.std === 'Oda + mutfak nişi');
        const grp: Room[][] = salons.map(() => []);
        ms.forEach((m) => {
          if (['kuru', 'mutfak', 'islak', 'balkon'].indexOf(m.tur as string) < 0) return;
          let en = 0;
          let ed = Infinity;
          salons.forEach((sl, i) => {
            const dd = Math.hypot(sl.x - m.x, sl.y - m.y);
            if (dd < ed) {
              ed = dd;
              en = i;
            }
          });
          grp[en]!.push(m);
        });
        const adet: Record<string, number> = {};
        grp.forEach((g3, i) => {
          let oda = Math.max(
            1,
            g3.filter((m) => ['Yatak odası', 'Ebeveyn yatak odası', 'Oda'].indexOf(m.std as string) >= 0)
              .length,
          );
          if (salons[i]!.std === 'Oda + mutfak nişi') oda = 1;
          const net = g3.reduce((s2, m) => s2 + m.alan, 0);
          const eb = g3.filter((m) => m.std === 'Duş / ebeveyn banyosu').length;
          const blk = g3.filter((m) => m.tur === 'balkon').length;
          const key = oda + '|' + pyRound(net / 5) * 5;
          if (!types[key]) {
            const no = typeOrder.length + 1;
            types[key] = {
              id: 'T' + no,
              ad: 'TİP' + no,
              duzen: oda + '+1',
              brut: pyRound(net / 0.85),
              dubleks: false,
              balkon: blk,
              mutfak: '',
              isikBandi: '',
              alaturka: '',
              ebeveynBanyo: eb,
              ankastre: '',
              klima: '',
            };
            typeOrder.push(types[key]!);
          }
          adet[types[key]!.id] = (adet[types[key]!.id] || 0) + 1;
        });
        row.daireler = Object.keys(adet).map((id) => ({ tip: id, adet: adet[id]! }));
      }
      if (tur !== 'cati_kati') rows.push(row);
      ms.forEach((m) => {
        const a = m.alan * tek;
        const c = (m.cevre || 4.4 * Math.sqrt(Math.max(m.alan, 0.1))) * tek;
        const h = H - 0.15;
        const di =
          (tur === 'normal' || tur === 'cati_kati') &&
          ['kuru', 'mutfak', 'islak', 'balkon'].indexOf(m.tur as string) >= 0;
        if (di) ms_.add('DA_NET', a);
        if (m.tur === 'islak') ms_.add('ISLAK_ZEMIN', a);
        if (m.tur === 'mutfak') ms_.add('MUTFAK_ZEMIN', a);
        if (m.tur === 'balkon') ms_.add('BALKON_ALAN', a);
        if (m.tur === 'ortak') ms_.add('HOL_ALAN', a);
        if (
          di &&
          ['Seramik', 'Granit seramik', 'Seramik (dış mekân, donmaya dayanıklı)'].indexOf(
            chosenFinish(m, 'zemin'),
          ) >= 0
        )
          ms_.add('SERAMIK_ZEMIN', a);
        if (di && m.tur !== 'balkon') {
          let dv = chosenFinish(m, 'duvar');
          if (m.tur === 'islak' && dv !== 'Seramik' && !(m.secim && m.secim.duvar)) {
            dv = 'Seramik';
            ms_.add('_islak_boya');
          }
          if (dv === 'Seramik') ms_.add('SERAMIK_DUVAR', Math.max(c * h - 1.9 * tek, 0));
          else ms_.add('DUVAR_YUZEY', Math.max(c * h - 1.9 * tek, 0));
        }
        if (m.cevre) ms_.add('_cevre');
        ms_.add('_mahal');
      });
      Object.keys(k.pencereler).forEach((wh) => {
        const x = wh.split('/').map(Number);
        const s = k.pencereler[wh]!;
        ms_.add('PENCERE_ADET', s * tek);
        ms_.add('PENCERE_ALAN', (s * tek * x[0]! * x[1]!) / 1e4);
      });
      ms_.add('KAPI', Object.keys(k.kapilar).reduce((s, x) => s + k.kapilar[x]!, 0) * tek);
    });
    const ND = rows.reduce(
      (s, r) =>
        s + (r.daireler as { adet: number }[]).reduce((a2, x) => a2 + x.adet, 0) * (r.tekrar as number),
      0,
    );
    ms_.add('SERAMIK_DUVAR', ND * 3);
    sp.forEach((p) => {
      const d = p.doseme_kalinlik.length ? p.doseme_kalinlik[0]![0] : 15;
      const dos = ((p.doseme_alan_m2 - p.kolon_alan_m2) * d) / 100;
      const kir =
        (((p.kiris_cizgi_m / 2) * (p.ort_kiris_b || 25)) / 100) *
        (Math.max((p.ort_kiris_h || 50) - d, 0) / 100);
      const ko = p.kolon_alan_m2 * (H - d / 100);
      beton += (dos + kir + ko) * p.tekrar;
    });
    const tm: Partial<Foundation> = S.temel[b] || {};
    const tb2 = ((tm.alan_m2 || 0) * (tm.kalinlik_cm || 0)) / 100;
    const top = beton + tb2;
    const r2 = (x: number) => Math.round(x * 100) / 100;
    const ovr: Record<string, number> = {};
    ms_.map.forEach((v, k) => {
      if (k[0] !== '_' && k !== 'KAPI') ovr[k] = r2(v);
    });
    ovr.DA_NET = r2(ms_.get('DA_NET'));
    if (tm.alan_m2) ovr.TABAN = r2(tm.alan_m2 / 1.1);
    if (tm.kalinlik_cm) ovr.H_TEMEL = tm.kalinlik_cm / 100;
    ovr.BIA = Math.round(BIA * 10) / 10;
    const blok = {
      ad: b + ' BLOK',
      katlar: rows as unknown as NonNullable<ProjectInput['bloklar']>[number]['katlar'],
      sistem: {
        cephe: '',
        mantoAltiSiva: '',
        asansor: '',
        merdiven: '',
        isitma: '',
        isitmaSekli: '',
        banyoTavan: '',
        cati: '',
        doseme: 'KİRİŞLİ',
        suDeposu: '',
        dilatasyon: '',
      },
      _ovr: ovr,
    };
    P.bloklar!.push(blok);
    P.duzeltmeler!['blok' + n] = {
      '8': { metraj: Math.round(top * 10) / 10 },
      '10': { metraj: r2((top * donati) / 1000) },
    };
    const ek: NonNullable<ProjectInput['ekKalemler']>[string] = [];
    const jg = (S.jet_grout || {})[b];
    if (jg && jg.boy_m)
      ek.push({
        grup: 1,
        ad: 'Jet Grout Zemin İyileştirme Kolonu (Ø' + (jg.cap_cm || 60) + ' cm)',
        birim: 'm',
        metraj: jg.adet * jg.boy_m,
        fiyat: ESTIMATES.jetGrout,
        kaynak: 'tahmini',
        aciklama: 'Çizimden: ' + jg.adet + ' adet × ' + jg.boy_m + ' m',
      });
    const sn = S.beton_sinifi;
    if (sn && sn !== 'C30' && sn !== 'C25')
      ek.push({
        grup: 2,
        ad:
          'Beton Sınıfı Farkı (C30/37 → ' +
          (({ C35: 'C35/45', C40: 'C40/50' } as Record<string, string>)[sn] || sn) +
          ')',
        birim: 'm³',
        metraj: Math.round(top * 10) / 10,
        fiyat: ESTIMATES.betonFark[sn] || 300,
        kaynak: 'tahmini',
        aciklama: 'Statik projede ' + sn + ' yazıyor; listedeki beton C30/37',
      });
    if (ek.length) P.ekKalemler!['blok' + n] = ek;
    P._dxf[blok.ad] = {
      kat_betonu: Math.round(beton * 10) / 10,
      temel_betonu: Math.round(tb2 * 10) / 10,
      temel: tm,
      BIA: ovr.BIA,
      donati_kg_m3: donati,
      kapi: ms_.get('KAPI'),
      islak_boya_duzeltildi: ms_.get('_islak_boya'),
      cevre_olculen: ms_.get('_cevre') + '/' + ms_.get('_mahal'),
      beton_sinifi: S.beton_sinifi,
    };
  });
  P.tipler = typeOrder;
  return P;
}

export const EMPTY_STRUCT: StructResult = { planlar: [], temel: {}, jet_grout: {}, beton_sinifi: null };

/** Statik dosya yoksa ölçülmüş statik değerleri projeden çıkarır (formül kullanılır). */
export function withoutStructure(p: DxfProject): DxfProject {
  p.bloklar!.forEach((b, n) => {
    delete p.duzeltmeler!['blok' + n];
    delete b._ovr!.TABAN;
    delete b._ovr!.H_TEMEL;
    delete b._ovr!.BIA;
  });
  return p;
}

export type TextLike = Pick<DxfText, 'x' | 'y'>;
