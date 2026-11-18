/**
 * Kurgusal örnek çizim üreticisi (gerçek bir projeye ait değildir). Prototipteki araclar/ornek_dxf_uret.py'nin
 * karşılığı; varsayılan ayarlarla onunla bayt bayt aynı çıktıyı verir. Ücretsiz deneme ve testler için kullanılır.
 * Testler için çeşitlemeler: birim/ölçek, ayrı yazılı mahal etiketleri, yazısız pencereler, iki kez çizilmiş kat,
 * birden çok blok, statik dosyada kopya ve donatı eşi plan.
 */

type Entity = string[];

function dxf(entities: Entity[], insunits: number): string {
  const s = [
    '0',
    'SECTION',
    '2',
    'HEADER',
    '9',
    '$ACADVER',
    '1',
    'AC1021',
    '9',
    '$INSUNITS',
    '70',
    String(insunits),
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES',
  ];
  for (const v of entities) s.push(...v);
  s.push('0', 'ENDSEC', '0', 'EOF');
  return s.join('\r\n') + '\r\n';
}

class Drawing {
  readonly V: Entity[] = [];
  /** Koordinat yazımı: cm/mm'de 2 ondalık (prototip üreticisiyle aynı); metrede 6 ondalık (cm hassasiyeti korunsun). */
  private readonly f2: (x: number) => string;
  constructor(private readonly k: number) {
    this.f2 = k >= 1 ? (x) => x.toFixed(2) : (x) => x.toFixed(6);
  }
  text(m: string, x: number, y: number, h = 15, layer = 'YAZI') {
    this.V.push([
      '0',
      'TEXT',
      '8',
      layer,
      '10',
      this.f2(x * this.k),
      '20',
      this.f2(y * this.k),
      '30',
      '0',
      '40',
      String(Math.round(h * this.k * 1e6) / 1e6),
      '1',
      m,
    ]);
  }
  line(x1: number, y1: number, x2: number, y2: number, layer = 'DUVAR') {
    const k = this.k;
    this.V.push([
      '0',
      'LINE',
      '8',
      layer,
      '10',
      this.f2(x1 * k),
      '20',
      this.f2(y1 * k),
      '30',
      '0',
      '11',
      this.f2(x2 * k),
      '21',
      this.f2(y2 * k),
      '31',
      '0',
    ]);
  }
  poly(P: [number, number][], layer: string) {
    const v = ['0', 'LWPOLYLINE', '8', layer, '90', String(P.length), '70', '1'];
    for (const [x, y] of P) v.push('10', this.f2(x * this.k), '20', this.f2(y * this.k));
    this.V.push(v);
  }
  rect(x: number, y: number, w: number, h: number, layer: string) {
    this.poly(
      [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      layer,
    );
  }
}

/** [ad, en, boy, zemin, duvar, tavan, pencere adedi, pencere yazısı] — ölçüler cm. */
type RoomDef = [string, number, number, string, string, string, number, string];

export const EXAMPLE_3_1: RoomDef[] = [
  ['SALON', 600, 500, 'Laminat', 'Boya', 'Boya', 2, 'P1 160/140'],
  ['MUTFAK', 400, 250, 'Seramik', 'Seramik', 'Boya', 1, 'P2 120/140'],
  ['Y.ODASI', 400, 300, 'Laminat', 'Boya', 'Boya', 1, 'P2 120/140'],
  ['Y.ODASI', 350, 320, 'Laminat', 'Boya', 'Boya', 1, 'P2 120/140'],
  ['E.Y.ODASI', 450, 340, 'Laminat', 'Boya', 'Boya', 1, 'P1 160/140'],
  ['BANYO', 250, 200, 'Seramik', 'Seramik', 'Boya', 1, 'P3 60/60'],
  ['DUŞ', 200, 200, 'Seramik', 'Seramik', 'Boya', 1, 'P3 60/60'],
  ['WC', 150, 140, 'Seramik', 'Seramik', 'Boya', 0, ''],
  ['ANTRE', 400, 200, 'Seramik', 'Boya', 'Boya', 0, ''],
  ['BALKON', 400, 150, 'Seramik', 'Dış cephe', 'Boya', 0, ''],
];
export const EXAMPLE_2_1: RoomDef[] = [
  ['SALON', 520, 500, 'Laminat', 'Boya', 'Boya', 2, 'P1 160/140'],
  ['MUTFAK', 360, 250, 'Seramik', 'Seramik', 'Boya', 1, 'P2 120/140'],
  ['Y.ODASI', 400, 300, 'Laminat', 'Boya', 'Boya', 1, 'P2 120/140'],
  ['E.Y.ODASI', 420, 330, 'Laminat', 'Boya', 'Boya', 1, 'P1 160/140'],
  ['BANYO', 250, 200, 'Seramik', 'Seramik', 'Boya', 1, 'P3 60/60'],
  ['ANTRE', 350, 200, 'Seramik', 'Boya', 'Boya', 0, ''],
  ['BALKON', 350, 150, 'Seramik', 'Dış cephe', 'Boya', 0, ''],
];
const COMMON: RoomDef[] = [
  ['MERDİVEN HOLÜ', 400, 450, 'Mermer', 'Boya', 'Boya', 0, ''],
  ['ASANSÖR', 180, 180, 'Mermer', 'Boya', 'Boya', 0, ''],
];
const BASEMENT: RoomDef[] = [
  ['DEPO', 600, 500, 'Şap', 'Boya', 'Boya', 0, ''],
  ['SIĞINAK', 700, 600, 'Şap', 'Boya', 'Boya', 0, ''],
  ['ENERJİ ODASI', 400, 300, 'Şap', 'Boya', 'Boya', 0, ''],
  ['SU DEPOSU', 400, 400, 'Şap', 'Boya', 'Boya', 0, ''],
  ['MERDİVEN HOLÜ', 400, 450, 'Mermer', 'Boya', 'Boya', 0, ''],
  ['ASANSÖR', 180, 180, 'Mermer', 'Boya', 'Boya', 0, ''],
];

export interface ExampleFloor {
  baslik: string;
  plan: 'bodrum' | 'konut';
}
export interface ExampleStructPlan {
  baslik: string;
  /** Kiriş adı öneki (KZ, K1B, K3…). Boş: adsız eş çizim (donatı planı eşi). */
  onek: string;
}

export interface ExampleOptions {
  /** Dosya başlığındaki $INSUNITS (5 = cm). Ölçüden bağımsız; yanlış yazılmış birim testi için. */
  insunits?: number;
  /** Koordinat çarpanı: 1 = cm, 10 = mm, 0.01 = m. */
  olcek?: number;
  /** 'etiket': "AD Döşeme : … A: 12,30 m²"; 'ayri': ad ve altında ayrı alan yazısı. */
  mahalYazisi?: 'etiket' | 'ayri';
  /** Pencere ölçü yazısı yerine PENCERE katmanında çizgi çifti. */
  pencereCizgi?: boolean;
  /** Mimari paftalar (varsayılan: 1. bodrum, zemin, 1-2-3. kat). */
  katlar?: ExampleFloor[];
  /** Statik kalıp planları (varsayılan: 1. bodrum, zemin+1+2, 3. kat). */
  kalip?: ExampleStructPlan[];
  /** Radye kalınlığı (cm) ve beton sınıfı. */
  radyeCm?: number;
  betonSinifi?: string;
  jetGrout?: boolean;
}

const DEFAULT_FLOORS: ExampleFloor[] = [
  { baslik: '1. BODRUM KAT PLANI Ö:1/50', plan: 'bodrum' },
  { baslik: 'ZEMİN KAT PLANI Ö:1/50', plan: 'konut' },
  { baslik: '1-2-3. KAT PLANI Ö:1/50', plan: 'konut' },
];
const DEFAULT_STRUCT: ExampleStructPlan[] = [
  { baslik: '(-3.00) 1. BODRUM KAT TAVANI KALIP PLANI (1/50)', onek: 'K1B' },
  { baslik: '(+0.00) ZEMİN, 1., 2. NORMAL KAT TAVANI KALIP PLANI (1/50)', onek: 'KZ' },
  { baslik: '(+9.00) 3. NORMAL KAT TAVANI KALIP PLANI (1/50)', onek: 'K3' },
];

function place(
  D: Drawing,
  rooms: RoomDef[],
  x0: number,
  y0: number,
  width: number,
  o: ExampleOptions,
  doors = true,
) {
  let x = x0;
  let y = y0;
  let rowH = 0;
  for (const [ad, w, h, z, d, t, pen, pyazi] of rooms) {
    if (x + w > x0 + width) {
      x = x0;
      y += rowH + 20;
      rowH = 0;
    }
    D.rect(x, y, w, h, 'ALAN HESABI');
    for (const a of [
      [x, y, x + w, y],
      [x + w, y, x + w, y + h],
      [x + w, y + h, x, y + h],
      [x, y + h, x, y],
    ] as const)
      D.line(a[0], a[1], a[2], a[3]);
    const area = ((w * h) / 1e4).toFixed(2);
    if (o.mahalYazisi === 'ayri') {
      D.text(ad, x + 20, y + h / 2, 12, 'MAHAL ADI');
      D.text(area.replace('.', ',') + ' m²', x + 20, y + h / 2 - 20, 10, 'MAHAL ALANI');
    } else {
      D.text(
        `${ad} Döşeme : ${z} Duvar : ${d} Tavan : ${t} A: ${area} m²`,
        x + 20,
        y + h / 2,
        12,
        'Yazı+DETAY',
      );
    }
    if (doors && ad !== 'BALKON' && ad !== 'ASANSÖR')
      D.text(
        ['WC', 'BANYO', 'DUŞ'].includes(ad) ? 'K2 80/220' : 'K2 90/220',
        x + 30,
        y + 20,
        10,
        'Yazı+DETAY',
      );
    for (let i = 0; i < pen; i++) {
      if (o.pencereCizgi) {
        const en = +/(\d+)\//.exec(pyazi)![1]!;
        const px = x + 40 + i * (en + 100);
        D.line(px, y + h - 25, px + en, y + h - 25, 'PENCERE');
        D.line(px, y + h - 15, px + en, y + h - 15, 'PENCERE');
      } else D.text(pyazi, x + 40 + i * 120, y + h - 25, 10, 'Yazı+DETAY');
    }
    x += w + 20;
    rowH = Math.max(rowH, h);
  }
}

export function exampleArchitectureDxf(o: ExampleOptions = {}): string {
  const D = new Drawing(o.olcek ?? 1);
  (o.katlar ?? DEFAULT_FLOORS).forEach((f, i) => {
    const tx = 1500 + i * 3500;
    D.text(f.baslik, tx, 0, 40, 'Yazı+DETAY');
    const x0 = tx - 1300;
    const y0 = 150;
    for (const a of [
      [x0, y0, x0 + 2600, y0],
      [x0 + 2600, y0, x0 + 2600, y0 + 1700],
      [x0 + 2600, y0 + 1700, x0, y0 + 1700],
      [x0, y0 + 1700, x0, y0],
    ] as const)
      D.line(a[0], a[1], a[2], a[3]);
    if (f.plan === 'bodrum') place(D, BASEMENT, x0 + 30, y0 + 30, 2500, o);
    else {
      place(D, EXAMPLE_3_1, x0 + 30, y0 + 30, 1100, o);
      place(D, COMMON, x0 + 1150, y0 + 30, 420, o);
      place(D, EXAMPLE_2_1, x0 + 1600, y0 + 30, 980, o);
    }
  });
  return dxf(D.V, o.insunits ?? 5);
}

export function exampleStructureDxf(o: ExampleOptions = {}): string {
  const D = new Drawing(o.olcek ?? 1);
  (o.kalip ?? DEFAULT_STRUCT).forEach(({ baslik, onek }, i) => {
    const x0 = i * 4000;
    const y0 = 0;
    D.text(baslik, x0 + 100, y0 - 300, 30, 'hs_YAZI');
    let no = 1;
    const X = [0, 500, 1000, 1500, 2000, 2500];
    const Y = [0, 550, 1100, 1650];
    const name = () => {
      const s = onek ? onek + String(no).padStart(2, '0') : '';
      no++;
      return s;
    };
    for (const xa of X) {
      D.line(x0 + xa - 15, y0, x0 + xa - 15, y0 + Y.at(-1)!, 'BEAM3');
      D.line(x0 + xa + 15, y0, x0 + xa + 15, y0 + Y.at(-1)!, 'BEAM3');
      for (let j = 0; j < Y.length - 1; j++) {
        const n = name();
        if (n) D.text(n, x0 + xa + 25, y0 + (Y[j]! + Y[j + 1]!) / 2, 12, 'BEAM4');
        D.text('(30/50)', x0 + xa + 25, y0 + (Y[j]! + Y[j + 1]!) / 2 - 20, 10, 'BEAM4');
      }
    }
    for (const ya of Y) {
      D.line(x0, y0 + ya - 15, x0 + X.at(-1)!, y0 + ya - 15, 'BEAM3');
      D.line(x0, y0 + ya + 15, x0 + X.at(-1)!, y0 + ya + 15, 'BEAM3');
      for (let j = 0; j < X.length - 1; j++) {
        const n = name();
        if (n) D.text(n, x0 + (X[j]! + X[j + 1]!) / 2, y0 + ya + 25, 12, 'BEAM4');
        D.text(
          ya === 0 || ya === Y.at(-1) ? '(30/60)' : '(30/50)',
          x0 + (X[j]! + X[j + 1]!) / 2,
          y0 + ya + 45,
          10,
          'BEAM4',
        );
      }
    }
    for (const xa of X) for (const ya of Y) D.rect(x0 + xa - 15, y0 + ya - 30, 30, 60, 'COLUMN4');
    // konsol balkon döşemesi (kuzey cephe) ve döşeme kalınlıkları
    const top = Y.at(-1)!;
    D.poly(
      [
        [x0, y0],
        [x0 + X.at(-1)!, y0],
        [x0 + X.at(-1)!, y0 + top],
        [x0 + 2000, y0 + top],
        [x0 + 2000, y0 + top + 150],
        [x0 + 500, y0 + top + 150],
        [x0 + 500, y0 + top],
        [x0, y0 + top],
      ],
      'LGP-SLAB3',
    );
    for (const xa of X.slice(0, -1))
      for (const ya of Y.slice(0, -1)) D.text('15cm', x0 + xa + 200, y0 + ya + 250, 12, 'LGP-SLAB3');
  });
  // temel ve zemin iyileştirme
  D.text('(-3.60) RADYE TEMEL KALIP PLANI (1/50)', 12000, -300, 30, 'hs_YAZI');
  D.text(`${o.radyeCm ?? 60} cm RADYE TEMEL (${o.betonSinifi ?? 'C30'} BETON)`, 12500, 800, 20, 'YAZ3');
  if (o.jetGrout !== false) {
    D.text('(-3.60) JET GROUT PLANI (1/100)', 16000, -300, 30, 'hs_YAZI');
    D.text('JET-GROUT ADEDİ =48', 16500, 500, 15, 'YAZ3');
    D.text('JET-GROUT BOYU  = 1000 cm.', 16500, 590, 15, 'YAZ3');
    D.text('JET-GROUT ÇAPI = 60 cm', 16500, 690, 15, 'YAZ3');
  }
  D.text(`MALZEME : ${o.betonSinifi ?? 'C30'} (fck:30MPa)`, 12500, 1200, 15, 'MATERIAL3');
  return dxf(D.V, o.insunits ?? 5);
}

/** Ücretsiz deneme için örnek çizim: 1 blok, 1 bodrum + zemin + 3 normal kat. */
export function exampleDrawings(o: ExampleOptions = {}): { mimari: string; statik: string } {
  return { mimari: exampleArchitectureDxf(o), statik: exampleStructureDxf(o) };
}
