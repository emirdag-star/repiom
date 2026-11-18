/**
 * Boş girdi nesneleri, hazır şablon (Site bloğu) ve örnek proje. Prototip kaynak/hesap.js ile aynı.
 */
import { isBlank, num, VARS } from './complete';
import type {
  ApartmentTypeInput,
  BlockInput,
  BlockSystemInput,
  FloorInput,
  FloorKind,
  ProjectInput,
} from './model';

let sid = 0;
function newId(): string {
  sid++;
  return 't' + Date.now().toString(36) + sid;
}

export function emptyType(ad?: string, duzen?: string, brut?: number | ''): ApartmentTypeInput {
  return {
    id: newId(),
    ad: ad || '',
    duzen: duzen || '',
    brut: isBlank(brut) ? '' : brut,
    dubleks: false,
    balkon: '',
    mutfak: '',
    isikBandi: '',
    alaturka: '',
    ebeveynBanyo: '',
    ankastre: '',
    klima: '',
  };
}

export function emptySystem(): BlockSystemInput {
  return {
    cephe: '',
    mantoAltiSiva: '',
    asansor: '',
    merdiven: '',
    isitma: '',
    isitmaSekli: '',
    banyoTavan: '',
    cati: '',
    doseme: '',
    suDeposu: '',
    dilatasyon: '',
  };
}

export function emptyFloor(tur: FloorKind): FloorInput {
  return {
    tur,
    tekrar: 1,
    yukseklik: '',
    gomulu: '',
    m2: '',
    daireler: tur === 'normal' || tur === 'dubleks' ? [{ tip: '', adet: '' }] : [],
  };
}

export function emptyBlock(n: number): BlockInput {
  return { ad: String.fromCharCode(65 + n) + ' BLOK', katlar: [], sistem: emptySystem() };
}

export function emptyProject(): ProjectInput {
  return {
    ad: '',
    il: 'İstanbul',
    arsa: '',
    blokAdedi: '',
    toplamOturum: '',
    toplamInsaatAlani: '',
    tipler: [],
    bloklar: [emptyBlock(0)],
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
  };
}

/**
 * Site bloğu: blok başına 1 bodrum + 1 otopark (gömülü), 10 normal kat; her katta 2 × 2+1 (100 m²) ve
 * 2 × 3+1 (130 m²); 2 asansör; kombi. Toplam inşaat alanı girilmişse normal kat adedi ona göre ayarlanır.
 */
export function siteBlockTemplate(p?: ProjectInput): ProjectInput {
  p = p || emptyProject();
  const t1 = emptyType('TİP1', '2+1', 100);
  const t2 = emptyType('TİP2', '3+1', 130);
  const katM2 = Math.round((2 * 100 + 2 * 130) * (1 + VARS.ortakAlan));
  const nBlok = Math.max(1, num(p.blokAdedi) || (p.bloklar || []).length || 1);
  let nNor = 10;
  if (num(p.toplamInsaatAlani)) nNor = Math.max(1, Math.round(num(p.toplamInsaatAlani) / nBlok / katM2 - 2));
  p.tipler = [t1, t2];
  p.bloklar = [];
  for (let n = 0; n < nBlok; n++) {
    const b = emptyBlock(n);
    b.katlar = [
      { tur: 'bodrum', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: katM2, daireler: [] },
      { tur: 'otopark', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: katM2, daireler: [] },
      {
        tur: 'normal',
        tekrar: nNor,
        yukseklik: 3,
        gomulu: 'HAYIR',
        m2: '',
        daireler: [
          { tip: t1.id, adet: 2 },
          { tip: t2.id, adet: 2 },
        ],
      },
    ];
    b.sistem = Object.assign(emptySystem(), {
      cephe: 'EPS',
      asansor: 2,
      merdiven: 1,
      isitma: 'KOMBİ',
      isitmaSekli: 'RADYATÖR',
    });
    p.bloklar.push(b);
  }
  if (!isBlank(p.blokAdedi)) p.blokAdedi = nBlok;
  return p;
}

/** Örnek proje: ilk şablondaki Yenikent Sitesi (A blok detaylı, B blok yalnız toplamdan). */
export function exampleProject(): ProjectInput {
  const p = emptyProject();
  const t = [
    emptyType('TİP1', '2+1', 100),
    emptyType('TİP2', '3+1', 120),
    emptyType('TİP3', '1+1', 70),
    emptyType('TİP4', '4+1', 200),
    emptyType('TİPDUBLEKS5', '3+1', 180),
  ];
  t[4]!.dubleks = true;
  (
    [
      [2, 1, 1],
      [3, 2, 2],
      [1, 1, 1],
      [3, 3, 3],
      [4, 3, 3],
    ] as const
  ).forEach((x, i) => {
    t[i]!.balkon = x[0];
    t[i]!.ebeveynBanyo = x[1];
    t[i]!.klima = x[2];
  });
  Object.assign(p, {
    ad: 'YENİKENT SİTESİ',
    arsa: 2000,
    blokAdedi: 2,
    toplamOturum: 800,
    toplamInsaatAlani: 4000,
    tipler: t,
  });
  const a = emptyBlock(0);
  a.katlar = [
    { tur: 'bodrum', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: 400, daireler: [] },
    { tur: 'otopark', tekrar: 1, yukseklik: 2.6, gomulu: 'YARI', m2: 400, daireler: [] },
    { tur: 'dukkan', tekrar: 1, yukseklik: 4.5, gomulu: 'HAYIR', m2: 400, daireler: [] },
    {
      tur: 'normal',
      tekrar: 1,
      yukseklik: 2.97,
      gomulu: 'HAYIR',
      m2: '',
      daireler: [
        { tip: t[0]!.id, adet: 2 },
        { tip: t[1]!.id, adet: 2 },
      ],
    },
    {
      tur: 'normal',
      tekrar: 1,
      yukseklik: 2.97,
      gomulu: 'HAYIR',
      m2: '',
      daireler: [{ tip: t[2]!.id, adet: 4 }],
    },
    {
      tur: 'normal',
      tekrar: 1,
      yukseklik: 2.97,
      gomulu: 'HAYIR',
      m2: '',
      daireler: [{ tip: t[3]!.id, adet: 2 }],
    },
    {
      tur: 'dubleks',
      tekrar: 1,
      yukseklik: 2.8,
      gomulu: 'HAYIR',
      m2: '',
      daireler: [{ tip: t[4]!.id, adet: 2 }],
    },
  ];
  a.sistem = Object.assign(emptySystem(), { asansor: 2, merdiven: 2 });
  p.bloklar = [a, emptyBlock(1)];
  return p;
}
