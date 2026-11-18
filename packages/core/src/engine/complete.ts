/**
 * Girdi modeli ve eksik bilgiyi tamamlama. Prototip kaynak/hesap.js ile birebir aynı mantık:
 * kullanıcı yalnız bildiği kadarını girer; boş bırakılan her şey gizli varsayımlarla (VARS) tamamlanır.
 * Varsayımlar kullanıcıya gösterilmez.
 */
import type { ApartmentTypeInput, BlockInput, FloorInput, ProjectInput, RawValue } from './model';

export const VARS = {
  normalKat: 5,
  ortakAlan: 0.12,
  taks: 0.3,
  katM2: 450,
  yukseklik: { bodrum: 3, otopark: 3, dukkan: 4.5, normal: 3, dubleks: 2.8 },
  gomulu: { bodrum: 'EVET', otopark: 'EVET', dukkan: 'HAYIR', normal: 'HAYIR', dubleks: 'HAYIR' },
  brut: { 1: 70, 2: 100, 3: 130, 4: 170, 5: 220 } as Record<number, number>,
  dubleksCarpan: 1.4,
  sistem: {
    cephe: 'EPS',
    isitma: 'KOMBİ',
    isitmaSekli: 'RADYATÖR',
    banyoTavan: 'YEŞİL ALÇIPAN',
    cati: 'KIRMA',
    doseme: 'ASMOLEN',
    suDeposu: 'MODÜLER',
    dilatasyon: 0,
    merdiven: 1,
    mantoAltiSiva: 'EVET',
  },
} as const;

export const FLOOR_KINDS = ['bodrum', 'otopark', 'dukkan', 'normal', 'dubleks'] as const;
type Kind = (typeof FLOOR_KINDS)[number];

/* ---------- Değer yardımcıları (prototipteki bos / sayiMi / num ile aynı) ---------- */
export const isBlank = (x: unknown): boolean => x === undefined || x === null || x === '';
export const isNumeric = (x: unknown): boolean => !isBlank(x) && isFinite(+(x as number));
export const num = (x: unknown): number => (isNumeric(x) ? +(x as number) : 0);
const buriedValue = (x: unknown): number =>
  x === 'EVET' ? 1 : x === 'YARI' || x === 'YARI GÖMÜLÜ' ? 0.5 : 0;
const yesNo = (x: unknown, fallback: number): number =>
  x === 'VAR' || x === true ? 1 : x === 'YOK' || x === false ? 0 : fallback;

/** Tamamlanmış daire tipi: formüllerin SP(t => …) içinde okuduğu alanlar. */
export interface ApartmentType {
  id: string;
  ad: string;
  duzen: string;
  ODA: number;
  A: number;
  BALKON: number;
  AYRI: number;
  ISIK: number;
  ALATURKA: number;
  EBANYO: number;
  ANKASTRE: number;
  KLIMA: number;
  DUBLEKS: number;
}

export function completeType(t: ApartmentTypeInput): ApartmentType {
  let oda = parseInt(String(t.duzen || '').split('+')[0] as string, 10);
  if (!(oda > 0)) oda = 2;
  const dub = t.dubleks === true || t.dubleks === 'VAR' || t.dubleks === 'EVET';
  const brut =
    isNumeric(t.brut) && +(t.brut as number) > 0
      ? +(t.brut as number)
      : VARS.brut[Math.min(oda, 5)]! * (dub ? VARS.dubleksCarpan : 1);
  return {
    id: t.id,
    ad: String(t.ad || '').trim(),
    duzen: String(t.duzen || oda + '+1').trim(),
    ODA: oda,
    A: brut,
    BALKON: isNumeric(t.balkon) ? +(t.balkon as number) : oda >= 3 ? 2 : 1,
    AYRI: t.mutfak === 'AMERİKAN' ? 0 : 1,
    ISIK: yesNo(t.isikBandi, 0),
    ALATURKA: yesNo(t.alaturka, 0),
    EBANYO: isNumeric(t.ebeveynBanyo) ? +(t.ebeveynBanyo as number) : oda >= 3 ? 1 : 0,
    ANKASTRE: yesNo(t.ankastre, 1),
    KLIMA: num(t.klima),
    DUBLEKS: dub ? 1 : 0,
  };
}

/** Kat bilgisi girilmeyen yerlerde kullanılan üretilmiş daire tipleri. */
const GENERATED = {
  v2: completeType({ id: '_v2', duzen: '2+1', brut: 100 }),
  v3: completeType({ id: '_v3', duzen: '3+1', brut: 130 }),
  vd: completeType({ id: '_vd', duzen: '4+1', dubleks: true }),
};

export interface FloorApartment {
  tip: ApartmentType;
  adet: number;
}

/** Tamamlanmış kat satırı. */
export interface FloorRow {
  tur: Kind;
  tekrar: number;
  h: number;
  g: number;
  m2: number;
  _m2: number;
  daireler: FloorApartment[];
}

function distributeApartments(katM2: number, dubleks: boolean): FloorApartment[] {
  const daireAlan = katM2 / (1 + VARS.ortakAlan);
  if (dubleks) {
    const n = Math.max(1, Math.round((daireAlan * 2) / GENERATED.vd.A));
    return [{ tip: GENERATED.vd, adet: n }];
  }
  let n2 = Math.round((daireAlan * 0.5) / GENERATED.v2.A);
  const n3 = Math.round((daireAlan * 0.5) / GENERATED.v3.A);
  if (n2 + n3 === 0) n2 = 1;
  return [
    { tip: GENERATED.v2, adet: n2 },
    { tip: GENERATED.v3, adet: n3 },
  ].filter((d) => d.adet > 0);
}

function isDetailed(b: BlockInput): boolean {
  return (b.katlar || []).some(
    (k) => num(k.m2) > 0 || (k.daireler || []).some((d) => num(d.adet) > 0 && d.tip),
  );
}

/** Bir kat satırının alanı: normal katta daireler + ortak alan; dubleks katta bu toplam iki seviyeye bölünür. */
export function floorArea(r: FloorRow): number {
  if (r.tur !== 'normal' && r.tur !== 'dubleks') return r.m2;
  if (r._m2) return r._m2;
  const d = r.daireler.reduce((s, x) => s + x.adet * x.tip.A, 0) * (1 + VARS.ortakAlan);
  return r.tur === 'dubleks' ? d / 2 : d;
}
export const floorLevels = (r: FloorRow): number => (r.tur === 'dubleks' ? 2 : 1);
export const blockArea = (rows: FloorRow[]): number =>
  rows.reduce((s, r) => s + r.tekrar * floorLevels(r) * floorArea(r), 0);

function completeFloors(b: BlockInput, typeMap: Record<string, ApartmentType>, otBlok: number): FloorRow[] {
  const raw = (b.katlar || []).filter(
    (k: FloorInput) =>
      (FLOOR_KINDS as readonly string[]).includes(k.tur) &&
      !(isNumeric(k.tekrar) && +(k.tekrar as number) <= 0),
  );
  const rows: FloorRow[] = raw.map((k) => {
    const tur = k.tur as Kind;
    return {
      tur,
      tekrar: isNumeric(k.tekrar) ? Math.round(+(k.tekrar as number)) : 1,
      h:
        isNumeric(k.yukseklik) && +(k.yukseklik as number) > 0
          ? +(k.yukseklik as number)
          : VARS.yukseklik[tur],
      g: buriedValue(isBlank(k.gomulu) ? VARS.gomulu[tur] : k.gomulu),
      m2: num(k.m2),
      _m2: num(k._m2),
      daireler: (k.daireler || [])
        .filter((d) => num(d.adet) > 0 && typeMap[d.tip])
        .map((d) => ({ tip: typeMap[d.tip]!, adet: num(d.adet) })),
    };
  });
  /* Bilinen bir kat alanı: önce girilen m², sonra dairelerden çıkan kat alanı, sonra toplam oturumdan blok payı. */
  let bilinen = 0;
  rows.forEach((r) => {
    if (r.tur === 'normal' || r.tur === 'dubleks') {
      if (r.daireler.length || r._m2) bilinen = Math.max(bilinen, floorArea(r));
    } else bilinen = Math.max(bilinen, r.m2);
  });
  if (!bilinen) bilinen = otBlok || VARS.katM2;
  rows.forEach((r) => {
    if ((r.tur === 'normal' || r.tur === 'dubleks') && !r.daireler.length) {
      r._m2 = r._m2 || bilinen;
      r.daireler = distributeApartments(r._m2, r.tur === 'dubleks');
    }
    if (r.tur !== 'normal' && r.tur !== 'dubleks' && !(r.m2 > 0)) r.m2 = bilinen;
  });
  return rows;
}

function generateFloors(hedef: number, ot: number): FloorRow[] {
  let n: number, katM2: number, bodM2: number;
  if (ot > 0 && hedef > ot * 1.5) {
    n = Math.max(1, Math.round(hedef / ot - 1));
    katM2 = (hedef - ot) / n;
    bodM2 = ot;
  } else {
    n = VARS.normalKat;
    katM2 = hedef / (n + 1);
    bodM2 = katM2;
  }
  return [
    { tur: 'bodrum', tekrar: 1, h: VARS.yukseklik.bodrum, g: 1, m2: bodM2, _m2: 0, daireler: [] },
    {
      tur: 'normal',
      tekrar: n,
      h: VARS.yukseklik.normal,
      g: 0,
      m2: 0,
      _m2: katM2,
      daireler: distributeApartments(katM2, false),
    },
  ];
}

export interface CompletedSystem {
  cephe: RawValue;
  isitma: RawValue;
  isitmaSekli: RawValue;
  banyoTavan: RawValue;
  cati: RawValue;
  doseme: RawValue;
  suDeposu: RawValue;
  dilatasyon: RawValue;
  merdiven: RawValue;
  mantoAltiSiva: RawValue;
  asansor: RawValue;
}

export interface CompletedBlock {
  ad: string;
  girdi: BlockInput;
  detayli: boolean;
  katlar: FloorRow[];
  sistem: CompletedSystem;
}

export type CompletedProject =
  | { hata: string }
  | {
      hata?: undefined;
      bloklar: CompletedBlock[];
      uyari: string[];
      nBlok: number;
      otGir: number;
      tia: number;
      tumuDetayli: boolean;
    };

const formatTr = (x: number) => Math.round(x).toLocaleString('tr-TR');

export const EMPTY_PROJECT_ERROR =
  'Hesap için en az toplam inşaat alanını ya da bir bloğun kat bilgilerini gir.';

/** Kullanıcının girdiğini tam bir modele çevirir. Dönen nesnede her bloğun kat satırları eksiksizdir. */
export function completeProject(p: ProjectInput): CompletedProject {
  const typeMap: Record<string, ApartmentType> = {};
  (p.tipler || []).forEach((t) => {
    if (t && t.id) typeMap[t.id] = completeType(t);
  });
  const gir: BlockInput[] = p.bloklar && p.bloklar.length ? p.bloklar : [{}];
  const nBlok = gir.length;
  const otGir = num(p.toplamOturum);
  const otBlok = otGir ? otGir / nBlok : 0;
  const tia = num(p.toplamInsaatAlani);
  const bl = gir.map((b, n) => ({
    ad: String(b.ad || '').trim() || 'Blok ' + (n + 1),
    girdi: b,
    detayli: isDetailed(b),
    katlar: [] as FloorRow[],
    sistem: {} as CompletedSystem,
  }));
  bl.forEach((x) => {
    if (x.detayli) x.katlar = completeFloors(x.girdi, typeMap, otBlok);
  });
  const detaylar = bl.filter((x) => x.detayli);
  const detAlan = detaylar.reduce((s, x) => s + blockArea(x.katlar), 0);
  const eksik = bl.filter((x) => !x.detayli);
  const uyari: string[] = [];
  if (eksik.length) {
    let hedef = tia > detAlan ? (tia - detAlan) / eksik.length : 0;
    if (!hedef && detaylar.length) hedef = detAlan / detaylar.length;
    if (!hedef && otBlok) hedef = otBlok * (VARS.normalKat + 1);
    if (!hedef) return { hata: EMPTY_PROJECT_ERROR };
    if (tia && tia <= detAlan) {
      uyari.push(
        'Girdiğin toplam inşaat alanı (' +
          formatTr(tia) +
          ' m²) kat bilgisi girilen blokların alanından (' +
          formatTr(detAlan) +
          ' m²) küçük; kat bilgisi girilmeyen bloklar diğer blokların ortalamasıyla hesaplandı.',
      );
    }
    eksik.forEach((x) => {
      x.katlar = generateFloors(hedef, otBlok);
    });
  } else if (tia && Math.abs(detAlan - tia) / tia > 0.01) {
    uyari.push(
      'Kat ve daire bilgilerine göre toplam inşaat alanı ' +
        formatTr(detAlan) +
        ' m² çıktı; girdiğin ' +
        formatTr(tia) +
        ' m² yerine bu kullanıldı.',
    );
  }
  bl.forEach((x) => {
    const s = (x.girdi.sistem || {}) as Record<string, RawValue>;
    const d: Record<string, RawValue> = {};
    (Object.keys(VARS.sistem) as (keyof typeof VARS.sistem)[]).forEach((a) => {
      d[a] = isBlank(s[a]) ? VARS.sistem[a] : s[a];
    });
    d.asansor = s.asansor;
    x.sistem = d as unknown as CompletedSystem;
  });
  return { bloklar: bl, uyari, nBlok, otGir, tia, tumuDetayli: !eksik.length };
}
