import type { ProjectInput } from '../src';

/** v4 örneği yeni düzende. v4'te blok alanları kat düzeninden bağımsız girildiği için _ovr ile aynen verilir. */
export function v4Project(): ProjectInput {
  const t = [
    {
      id: 'a',
      ad: '',
      duzen: '3+1',
      brut: 110,
      balkon: 2,
      mutfak: 'KAPALI',
      isikBandi: 'VAR',
      alaturka: 'YOK',
      ebeveynBanyo: 1,
      ankastre: 'VAR',
      klima: 2,
    },
    {
      id: 'b',
      ad: '',
      duzen: '2+1',
      brut: 85,
      balkon: 1,
      mutfak: 'AMERİKAN',
      isikBandi: 'VAR',
      alaturka: 'YOK',
      ebeveynBanyo: 0,
      ankastre: 'VAR',
      klima: 1,
    },
  ];
  // v4 referansı mantolama altı sıva için %10 kuralıyla (HAYIR) hesaplandı.
  const sis = {
    cephe: 'EPS',
    asansor: 2,
    merdiven: 2,
    isitma: 'KOMBİ',
    isitmaSekli: 'RADYATÖR',
    banyoTavan: 'YEŞİL ALÇIPAN',
    cati: 'KIRMA',
    doseme: 'ASMOLEN',
    suDeposu: 'MODÜLER',
    dilatasyon: 0,
    mantoAltiSiva: 'HAYIR',
  };
  const daire = [
    { tip: 'a', adet: 15 },
    { tip: 'b', adet: 30 },
  ];
  return {
    ad: 'YENİKENT',
    il: 'İstanbul',
    arsa: 3500,
    tipler: t,
    sureAy: 18,
    satisOfisi: true,
    ornekDaire: true,
    jenerator: true,
    trafo: true,
    kdvOrani: 20,
    ongorulemeyenOrani: 2,
    _ovr: { TIA: 10920 },
    bloklar: [
      {
        ad: 'A BLOK',
        sistem: sis,
        katlar: [
          { tur: 'bodrum', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: 405 },
          { tur: 'otopark', tekrar: 1, yukseklik: 4, gomulu: 'EVET', m2: 405 },
          { tur: 'normal', tekrar: 1, yukseklik: 3, daireler: daire },
        ],
        _ovr: {
          N_NOR: 9,
          A_NOR: 430,
          H_NOR: 3,
          BIA: 5700,
          TABAN: 405,
          H_USTU: 27,
          H_YERALTI: 7,
          KAT_YERALTI: 2,
        },
      },
      {
        ad: 'B BLOK',
        sistem: sis,
        katlar: [
          { tur: 'bodrum', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: 365 },
          { tur: 'otopark', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: 365 },
          { tur: 'dukkan', tekrar: 1, yukseklik: 4, gomulu: 'HAYIR', m2: 365 },
          { tur: 'normal', tekrar: 1, yukseklik: 3, daireler: daire },
        ],
        _ovr: {
          N_NOR: 8,
          A_NOR: 400,
          H_NOR: 3,
          BIA: 5220,
          TABAN: 365,
          H_USTU: 28,
          H_YERALTI: 6,
          KAT_YERALTI: 2,
        },
      },
    ],
  };
}
