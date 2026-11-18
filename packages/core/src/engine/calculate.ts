/**
 * Hesap motoru. Prototip kaynak/hesap.js'in TypeScript karşılığı; işlem sırası kayan nokta sonuçları
 * birebir aynı çıksın diye korunmuştur. Formüller src/generated/formulas.ts içindedir (otomatik üretilir).
 */
import {
  BLOCK_LAST_INDEX,
  COEFFICIENTS,
  INPUTS,
  ITEMS,
  PROVINCES,
  type FormulaApartmentType,
  type FormulaVars,
  type ItemDef,
} from '../generated/formulas';
import {
  blockArea,
  completeProject,
  floorArea,
  floorLevels,
  isNumeric,
  num,
  VARS,
  type ApartmentType,
  type CompletedBlock,
  type FloorRow,
} from './complete';
import type { CalculateOptions, Corrections, ExtraItem, ProjectInput } from './model';
import type { QFn, SPFn } from './types';

/** Motor değişkenleri: formül değişkenleri + iç alanlar (_FIYAT). */
export type Vars = Record<string, unknown>;

/* ---------- Tipe bağlı satırlar ----------
   Şablondaki "2+1 / 3+1" satırlarının yerine girilen her daire tipi için ayrı satır üretilir. */
interface TypeRowRule {
  ad: string;
  dubleks: boolean;
  metraj: (t: BlockType, v: Vars) => number;
  fiyat: (t: BlockType, v: Vars) => number;
  aciklama: string;
}
const byRooms = (kucuk: number, buyuk: number) => (t: BlockType) => (t.ODA >= 3 ? buyuk : kucuk);
export const TYPE_ROWS: Record<number, TypeRowRule> = {
  91: {
    ad: 'Mutfak Dolabı',
    dubleks: false,
    metraj: (t) => t.N,
    fiyat: (t) => 14000 + 1600 * t.A,
    aciklama: '14.000 + 1.600 × daire brüt m²',
  },
  96: {
    ad: 'Vestiyer Dolabı',
    dubleks: true,
    metraj: (t) => t.N,
    fiyat: (t) => 1000 + 400 * t.A,
    aciklama: '1.000 + 400 × daire brüt m²',
  },
  109: {
    ad: 'Duşakabin',
    dubleks: false,
    metraj: (t) => t.N * (1 + t.EBANYO),
    fiyat: byRooms(14000, 16000),
    aciklama: '2 odaya kadar 14.000; 3 oda ve üzeri 16.000',
  },
  112: {
    ad: 'Banyo Seti (Vitrifiye+Armatür+Aksesuar)',
    dubleks: false,
    metraj: (t) => t.N,
    fiyat: (t) => 25000 + 30000 * (1 + t.EBANYO),
    aciklama: '25.000 + 30.000 × dairedeki banyo adedi',
  },
  123: {
    ad: 'Elektrik İşleri',
    dubleks: true,
    metraj: (t) => t.N,
    fiyat: (t) => 18000 + 1200 * t.A,
    aciklama: '18.000 + 1.200 × daire brüt m²',
  },
  139: {
    ad: 'Isıtma Tesisatı',
    dubleks: true,
    metraj: (t) => t.N,
    fiyat: (t, v) => (4000 + 600 * t.A) * (v.ISITMA_SEKLI === 'RADYATÖR' ? 1 : (v.K_YERDEN as number)),
    aciklama: '(4.000 + 600 × brüt m²) × yerden ısıtmada 1,5',
  },
  141: {
    ad: 'Yangın Tesisatı',
    dubleks: true,
    metraj: (t, v) => ((v.H_USTU as number) > (v.K_YUKSEK_BINA as number) ? t.N : 0),
    fiyat: byRooms(30000, 38000),
    aciklama: 'Yalnız bina yüksekliği 30,50 m üstündeyse; 2 odaya kadar 30.000, 3 oda ve üzeri 38.000',
  },
};
/** Tipe bağlı satırların şablondaki ikinci satırları: atlanır. */
export const TYPE_ROWS_SKIP: Record<number, 1> = { 92: 1, 97: 1, 110: 1, 113: 1, 124: 1, 140: 1, 142: 1 };

/** Bloktaki bir daire tipi (adedi N ile). */
export type BlockType = ApartmentType & { N: number };

export function coefficients(override?: Record<string, number>): Vars {
  const k: Vars = {};
  COEFFICIENTS.forEach((x) => {
    k[x.ad] = x.deger;
  });
  Object.keys(override || {}).forEach((a) => {
    k[a] = override![a];
  });
  return k;
}

export function provinceCoefficient(il: unknown): number {
  const x = PROVINCES.filter((i) => i.ad === il)[0];
  return x ? x.k : 1;
}

/* ---------- Sonuç satırları ---------- */
export interface HeaderRow {
  baslik: true;
  grup: number;
  ad: string;
  no?: string;
  piyasaTutar?: number;
}
export interface ItemRow {
  baslik?: undefined;
  i: number | null;
  grup: number;
  ad: string;
  birim: string;
  metraj: number;
  piyasaFiyat: number;
  piyasaTutar: number;
  aciklama: string;
  fiyatAciklama: string;
  opsiyonel: boolean;
  /** Elle düzeltmelerin anahtarı. */
  anahtar: string;
  no?: string;
  metrajElle?: boolean;
  piyasaElle?: boolean;
  tipSatiri?: boolean;
  tipOda?: number;
  ek?: boolean;
  tahmini?: boolean;
}
export type ResultRow = HeaderRow | ItemRow;

function row(k: ItemDef, ad: string, metraj: number, piyasa: number, extra?: Partial<ItemRow>): ItemRow {
  const fin = (x: number) => (isFinite(x) ? x : 0);
  metraj = fin(metraj);
  piyasa = fin(piyasa);
  return Object.assign(
    {
      i: k.i,
      grup: k.grup,
      ad,
      birim: k.birim,
      metraj,
      piyasaFiyat: piyasa,
      piyasaTutar: metraj * piyasa,
      aciklama: k.aciklama,
      fiyatAciklama: k.fiyatAciklama || '',
      opsiyonel: !!k.opsiyonel,
      anahtar: String(k.i),
    },
    extra || {},
  );
}

/** Fiyat listesindeki kalem kodu: K + 3 haneli kalem sırası. */
export function itemCode(i: number): string {
  return 'K' + ('00' + i).slice(-3);
}
function listPrice(v: Vars, i: number): number | null {
  const prices = v._FIYAT as Record<string, unknown> | null | undefined;
  const f = prices && prices[itemCode(i)];
  return typeof f === 'number' && isFinite(f) ? f : null;
}

function typeLabel(t: BlockType, all: BlockType[]): string {
  const label = (y: BlockType) => (y.ad && y.ad !== y.duzen ? y.ad + ' (' + y.duzen + ')' : y.duzen);
  const ad = label(t);
  const same = all.filter((y) => label(y) === ad).length > 1;
  return ad + (same ? ' ' + Math.round(t.A) + ' m²' : '');
}

/** lo..hi aralığındaki kalemleri hesaplar. Fiyatlar piyasa birim fiyatıdır ve il katsayısıyla çarpılır. */
function calculateItems(
  lo: number,
  hi: number,
  v: Vars,
  T: BlockType[],
  SP: SPFn,
  ek?: { sifirFiyat?: Record<number, 1> },
): ResultRow[] {
  const memo: Record<number, number> = {};
  const il = (v.IL_KATSAYI as number) || 1;
  const out: ResultRow[] = [];
  const fv = v as unknown as FormulaVars;
  const Q: QFn = (i) => {
    if (!(i in memo)) memo[i] = ITEMS[i]!.metraj!(fv, Q, SP);
    return memo[i]!;
  };
  for (let i = lo; i <= hi; i++) {
    const k = ITEMS[i]!;
    if (k.baslik) {
      out.push({ baslik: true, grup: k.grup, ad: k.ad });
      continue;
    }
    if (TYPE_ROWS_SKIP[i]) continue;
    const ts = TYPE_ROWS[i];
    if (ts) {
      T.filter((t) => ts.dubleks || !t.DUBLEKS).forEach((t) => {
        let f = listPrice(v, i);
        const et = typeLabel(t, T);
        if (f === null) f = ts.fiyat(t, v);
        out.push(
          row(k, k.ad.replace('[daire tipi]', et), ts.metraj(t, v), f * il, {
            anahtar: i + '|' + et,
            aciklama: 'Bu tipteki ' + (i === 109 ? 'banyo' : 'daire') + ' adedi',
            fiyatAciklama: ts.aciklama,
            tipSatiri: true,
            tipOda: t.ODA,
          }),
        );
      });
      continue;
    }
    const m = Q(i);
    const sf = listPrice(v, i);
    const pf = ek && ek.sifirFiyat && ek.sifirFiyat[i] ? 0 : (sf !== null ? sf : k.piyasa!(fv, Q, SP)) * il;
    out.push(row(k, k.ad, m, pf));
  }
  return out;
}

function numberRows(rows: ResultRow[]): ResultRow[] {
  let n = 0;
  rows.forEach((r) => {
    if (r.baslik) {
      n = 0;
      r.no = String(r.grup);
    } else {
      n++;
      r.no = r.grup + '.' + n;
    }
  });
  return rows;
}

function applyCorrections(rows: ResultRow[], d?: Corrections): ResultRow[] {
  d = d || {};
  rows.forEach((r) => {
    if (r.baslik) return;
    const x = d![r.anahtar];
    if (!x) return;
    if (x.metraj != null) {
      r.metraj = +x.metraj;
      r.metrajElle = true;
    }
    if (x.piyasa != null) {
      r.piyasaFiyat = +x.piyasa;
      r.piyasaElle = true;
    }
    r.piyasaTutar = r.metraj * r.piyasaFiyat;
  });
  return rows;
}

/** Çizimden gelen ya da kullanıcının eklediği ek kalemler: kendi grubunun sonuna eklenir. */
function addExtraItems(rows: ResultRow[], extras: ExtraItem[] | undefined, il: number): ResultRow[] {
  (extras || []).forEach((e) => {
    let last = -1;
    rows.forEach((r, j) => {
      if (r.grup === e.grup) last = j;
    });
    if (last < 0) return;
    const m = +(e.metraj as number) || 0;
    const f = (+(e.fiyat as number) || 0) * (il || 1);
    rows.splice(last + 1, 0, {
      i: null,
      grup: e.grup,
      ad: e.ad + (e.kaynak === 'tahmini' ? ' (tahmini fiyat)' : ''),
      birim: e.birim || '',
      metraj: m,
      piyasaFiyat: f,
      piyasaTutar: m * f,
      aciklama: e.aciklama || '',
      fiyatAciklama: e.kaynak === 'tahmini' ? 'Tahmini fiyat (yapay zekâ) — kontrol edin' : e.kaynak || '',
      opsiyonel: false,
      anahtar: 'E|' + e.ad + '|' + (e.birim || ''),
      ek: true,
      tahmini: e.kaynak === 'tahmini',
    });
  });
  return rows;
}

export interface Totals {
  piyasa: number;
}
function sumHeaders(rows: ResultRow[]): Totals {
  let cur: HeaderRow | null = null;
  const top = { piyasa: 0 };
  rows.forEach((r) => {
    if (r.baslik) {
      cur = r;
      r.piyasaTutar = 0;
    } else {
      (cur as unknown as HeaderRow).piyasaTutar! += r.piyasaTutar;
      top.piyasa += r.piyasaTutar;
    }
  });
  return top;
}

/** Tamamlanmış bir bloğu hesap motorunun değişkenlerine çevirir. */
function blockVariables(x: CompletedBlock, pv: Vars): { v: Vars; T: BlockType[]; SP: SPFn } {
  const v: Vars = Object.assign({}, pv);
  const rows = x.katlar;
  const s = x.sistem;
  const sum = (tur: string, f: (r: FloorRow) => number) =>
    rows.filter((r) => r.tur === tur).reduce((a, r) => a + f(r), 0);
  (
    [
      ['BOD', 'bodrum'],
      ['OTO', 'otopark'],
      ['DUK', 'dukkan'],
    ] as const
  ).forEach((k) => {
    const n = sum(k[1], (r) => r.tekrar);
    v['N_' + k[0]] = n;
    v['A_' + k[0]] = n ? sum(k[1], (r) => r.tekrar * r.m2) / n : 0;
    v['H_' + k[0]] = n ? sum(k[1], (r) => r.tekrar * r.h) / n : 0;
  });
  const konut = rows.filter((r) => r.tur === 'normal' || r.tur === 'dubleks');
  const nk = konut.reduce((a, r) => a + r.tekrar * floorLevels(r), 0);
  v.N_NOR = nk;
  v.A_NOR = nk ? konut.reduce((a, r) => a + r.tekrar * floorLevels(r) * floorArea(r), 0) / nk : 0;
  v.H_NOR = nk ? konut.reduce((a, r) => a + r.tekrar * floorLevels(r) * r.h, 0) / nk : 0;
  v.BIA = blockArea(rows);
  v.TABAN = rows.reduce((a, r) => Math.max(a, floorArea(r)), 0);
  v.H_YERALTI = rows.reduce((a, r) => a + r.tekrar * floorLevels(r) * r.h * r.g, 0);
  v.H_USTU = rows.reduce((a, r) => a + r.tekrar * floorLevels(r) * r.h * (1 - r.g), 0);
  v.KAT_YERALTI = rows.reduce((a, r) => a + (r.g > 0 ? r.tekrar : 0), 0);
  const katToplam = (v.N_BOD as number) + (v.N_OTO as number) + (v.N_DUK as number) + (v.N_NOR as number);
  v.CEPHE_TIP = s.cephe;
  v.ISITMA = s.isitma;
  v.ISITMA_SEKLI = s.isitmaSekli;
  v.BANYO_TAVAN = s.banyoTavan;
  v.CATI_TIP = s.cati;
  v.DOSEME = s.doseme;
  v.SU_DEPOSU = s.suDeposu;
  v.N_DILATASYON = num(s.dilatasyon);
  v.MANTO_SIVA = s.mantoAltiSiva === 'EVET' ? 1 : 0;
  v.N_MERDIVEN = isNumeric(s.merdiven) ? +(s.merdiven as number) : 1;
  v.N_ASANSOR = isNumeric(s.asansor) ? +(s.asansor as number) : katToplam >= 4 ? v.N_MERDIVEN : 0;
  /* Daire tipleri: aynı tip dubleks katta ve normal katta kullanılmışsa iki ayrı satır olur. */
  const T: BlockType[] = [];
  const tm: Record<string, BlockType> = {};
  konut.forEach((r) => {
    r.daireler.forEach((d) => {
      const dub = d.tip.DUBLEKS || r.tur === 'dubleks' ? 1 : 0;
      const key = d.tip.id + '|' + dub;
      if (!tm[key]) {
        tm[key] = Object.assign({}, d.tip, { N: 0, DUBLEKS: dub });
        T.push(tm[key]);
      }
      tm[key].N += d.adet * r.tekrar;
    });
  });
  const ovr = x.girdi._ovr || {};
  Object.keys(ovr).forEach((a) => {
    v[a] = ovr[a];
  });
  const SP: SPFn = (f) => T.reduce((a, t) => a + Number(f(t as unknown as FormulaApartmentType)), 0);
  const fixed: Record<string, 1> = {
    TOPLAM_OTURUM: 1,
    CEVRE_ALAN: 1,
    TIA: 1,
    KAT_YERALTI: 1,
    H_YERALTI: 1,
    H_USTU: 1,
  };
  const fv = v as unknown as FormulaVars;
  INPUTS.forEach((g) => {
    if (g.formul && !fixed[g.ad]) v[g.ad] = g.formul(fv, SP);
  });
  Object.keys(v).forEach((a) => {
    if (typeof v[a] === 'number' && !isFinite(v[a] as number)) v[a] = 0;
  });
  return { v, T, SP };
}

function projectVariables(p: ProjectInput, k: Vars, nBlok: number): Vars {
  const v: Vars = Object.assign({}, k);
  v.IL_KATSAYI = provinceCoefficient(p.il);
  v.SURE_AY = num(p.sureAy) || 18;
  const e = (x: unknown) => (x === true || x === 'VAR' || x === 'EVET' ? 1 : 0);
  v.SATIS_OFISI = e(p.satisOfisi);
  v.ORNEK_DAIRE = e(p.ornekDaire);
  v.JENERATOR = e(p.jenerator);
  v.TRAFO = e(p.trafo);
  v.S_HAMAM = e(p.hamam);
  v.S_SAUNA = e(p.sauna);
  v.S_FIN = e(p.finHamami);
  v.S_FITNESS = e(p.fitness);
  v.S_HAVUZ = e(p.havuz);
  v.HAVUZ_M2 = num(p.havuzM2) || 100;
  if (isNumeric(p.ongorulemeyenOrani)) v.K_ONGORULEMEYEN = +(p.ongorulemeyenOrani as number) / 100;
  v.BLOK_ADEDI = nBlok;
  return v;
}

function warnings(
  p: ProjectInput,
  m: { uyari: string[]; tumuDetayli: boolean; otGir: number },
  pv: Vars,
): string[] {
  const u = m.uyari.slice();
  const f = (x: number) => Math.round(x).toLocaleString('tr-TR');
  const ot = pv.TOPLAM_OTURUM as number;
  if (m.tumuDetayli && m.otGir && Math.abs(ot - m.otGir) / m.otGir > 0.01) {
    u.push(
      'Kat bilgilerine göre toplam oturum alanı ' +
        f(ot) +
        ' m² çıktı; girdiğin ' +
        f(m.otGir) +
        ' m² yerine bu kullanıldı.',
    );
  }
  if (num(p.arsa) && num(p.arsa) < ot) {
    u.push(
      'Arsa alanı (' +
        f(num(p.arsa)) +
        ' m²) toplam oturum alanından (' +
        f(ot) +
        ' m²) küçük; çevre düzenleme alanı 0 alındı.',
    );
  }
  return u;
}

export interface BlockResult {
  ad: string;
  v: Vars;
  T: BlockType[];
  katlar: FloorRow[];
  satirlar: ResultRow[];
  toplam: Totals;
}

export interface CalculationResult {
  hata?: undefined;
  proje: Vars;
  bloklar: BlockResult[];
  projeGeneli: { satirlar: ResultRow[]; toplam: Totals };
  tumProje: { satirlar: ResultRow[]; toplam: Totals };
  ozet: {
    piyasa: number;
    kdvOrani: number;
    piyasaKdv: number;
    piyasaKdvDahil: number;
    m2Piyasa: number;
    m2KdvDahil: number;
    toplamInsaatAlani: number;
    toplamDaire: number;
  };
  uyarilar: string[];
}

/** All risk ve öngörülemeyen giderler kalem sıraları. */
export const ITEM_ALL_RISK = 179;
export const ITEM_UNFORESEEN = 219;

/** Ana giriş: proje girdilerinden tüm tabloları üretir. Eksik girdide çökmez, Türkçe hata döner. */
export function calculate(
  p: ProjectInput,
  options: CalculateOptions = {},
): CalculationResult | { hata: string } {
  const m = completeProject(p);
  if (m.hata !== undefined) return { hata: m.hata };
  const k = coefficients(options.katsayilar);
  const pv = projectVariables(p, k, m.nBlok);
  const d = p.duzeltmeler || {};
  pv._FIYAT = options.fiyatlar || null;
  /* Proje değişkenleri blok sonuçlarına bağlı: önce bloklar ön hesaplanır, sonra toplamlar kurulur. */
  const on = m.bloklar.map((x) => blockVariables(x, pv));
  pv.TIA = on.reduce((a, o) => a + (o.v.BIA as number), 0);
  pv.TOPLAM_OTURUM = on.reduce((a, o) => a + (o.v.TABAN as number), 0);
  pv.ARSA = num(p.arsa) || (pv.TOPLAM_OTURUM as number) / VARS.taks;
  pv.CEVRE_ALAN = Math.max(0, (pv.ARSA as number) - (pv.TOPLAM_OTURUM as number));
  pv.TOPLAM_DAIRE = on.reduce((a, o) => a + (o.v.ND as number), 0);
  Object.keys(p._ovr || {}).forEach((a) => {
    pv[a] = p._ovr![a];
  });
  const bloklar: BlockResult[] = m.bloklar.map((x, n) => {
    const b = blockVariables(x, pv);
    const rows = calculateItems(0, BLOCK_LAST_INDEX, b.v, b.T, b.SP);
    addExtraItems(rows, (p.ekKalemler || {})['blok' + n], b.v.IL_KATSAYI as number);
    numberRows(rows);
    applyCorrections(rows, d['blok' + n]);
    return { ad: x.ad, v: b.v, T: b.T, katlar: x.katlar, satirlar: rows, toplam: sumHeaders(rows) };
  });
  const bt = { piyasa: bloklar.reduce((s, b) => s + b.toplam.piyasa, 0) };

  /* Proje geneli: all risk ve öngörülemeyen gerçek toplamlar üzerinden iki aşamada hesaplanır. */
  const SP0: SPFn = () => 0;
  const gecici = calculateItems(BLOCK_LAST_INDEX + 1, ITEMS.length - 1, pv, [], SP0, {
    sifirFiyat: { [ITEM_ALL_RISK]: 1, [ITEM_UNFORESEEN]: 1 },
  });
  numberRows(gecici);
  applyCorrections(gecici, d.proje);
  sumHeaders(gecici);
  const groupTotal = (g: number) =>
    (gecici.filter((r) => r.baslik && r.grup === g)[0] as HeaderRow).piyasaTutar as number;
  const ar = gecici.filter((r) => !r.baslik && r.i === ITEM_ALL_RISK)[0] as ItemRow;
  const og = gecici.filter((r) => !r.baslik && r.i === ITEM_UNFORESEEN)[0] as ItemRow;
  if (!ar.piyasaElle)
    ar.piyasaFiyat = (pv.K_ALLRISK as number) * (bt.piyasa + groupTotal(15) + groupTotal(16));
  ar.piyasaTutar = ar.metraj * ar.piyasaFiyat;
  let pt = sumHeaders(gecici);
  if (!og.piyasaElle) og.piyasaFiyat = (pv.K_ONGORULEMEYEN as number) * (bt.piyasa + pt.piyasa);
  og.piyasaTutar = og.metraj * og.piyasaFiyat;
  pt = sumHeaders(gecici);

  /* Tüm proje: blok kalemlerinde metrajlar toplanır, birim fiyat ağırlıklı ortalamadır. */
  const harita: Record<string, ResultRow> = {};
  const sira: string[] = [];
  bloklar.forEach((b) => {
    let sonBaslik: { son: string } | null = null;
    b.satirlar.forEach((r) => {
      const a = r.baslik ? 'B' + r.grup : r.anahtar;
      if (!harita[a]) {
        harita[a] = r.baslik
          ? { baslik: true, grup: r.grup, ad: r.ad }
          : Object.assign({}, r, { metraj: 0, piyasaTutar: 0, metrajElle: false, piyasaElle: false });
        if (r.baslik || !sonBaslik) sira.push(a);
        else sira.splice(sira.lastIndexOf(sonBaslik.son) + 1, 0, a);
      }
      if (r.baslik) sonBaslik = { son: a };
      else {
        sonBaslik!.son = a;
        const h = harita[a] as ItemRow;
        h.metraj += r.metraj;
        h.piyasaTutar += r.piyasaTutar;
      }
    });
  });
  const tum = sira
    .map((a) => {
      const h = harita[a]!;
      if (!h.baslik) h.piyasaFiyat = h.metraj ? h.piyasaTutar / h.metraj : h.piyasaFiyat;
      return h;
    })
    .concat(gecici.map((r) => Object.assign({}, r)));
  numberRows(tum);
  const tt = sumHeaders(tum);

  const kdv = (p.kdvOrani == null || p.kdvOrani === '' ? 20 : +(p.kdvOrani as number)) / 100;
  const tia = pv.TIA as number;
  return {
    proje: pv,
    bloklar,
    projeGeneli: { satirlar: gecici, toplam: pt },
    tumProje: { satirlar: tum, toplam: tt },
    ozet: {
      piyasa: tt.piyasa,
      kdvOrani: kdv,
      piyasaKdv: tt.piyasa * kdv,
      piyasaKdvDahil: tt.piyasa * (1 + kdv),
      m2Piyasa: tia ? tt.piyasa / tia : 0,
      m2KdvDahil: tia ? (tt.piyasa * (1 + kdv)) / tia : 0,
      toplamInsaatAlani: tia,
      toplamDaire: pv.TOPLAM_DAIRE as number,
    },
    uyarilar: warnings(p, m, pv),
  };
}
