/* eslint-disable */
// OTOMATİK ÜRETİLDİ: packages/core/scripts/gen-formulas.ts — elle düzenleme.
// Kaynak: packages/core/reference/veri.js (prototip, REPIOM_Hesap_Mantigi_v4.xlsx'ten üretilmiş).
import { B, IF, RND, RUP } from '../engine/runtime';
import type { FormulaFn, InputFormulaFn } from '../engine/types';

/** Formüllerin okuduğu değişkenler. Metin olanlar karşılaştırmada kullanılanlardır. */
export interface FormulaVars {
  ARSA: number;
  ASMA_TAVAN: number;
  A_BOD: number;
  A_DUK: number;
  A_NOR: number;
  A_OTO: number;
  BALKON_ALAN: number;
  BALKON_TOPLAM: number;
  BANYO_TAVAN: string;
  BANYO_TOPLAM: number;
  BAZ_CEVRE: number;
  BAZ_DAIRE: number;
  BAZ_M2: number;
  BIA: number;
  BLOK_ADEDI: number;
  CATI_TIP: string;
  CEPHE_BRUT: number;
  CEPHE_NET: number;
  CEPHE_TIP: string;
  CEVRE_ALAN: number;
  CEVRE_N: number;
  CEVRE_T: number;
  DA: number;
  DA_NET: number;
  DOSEME: string;
  DUVAR_DIS: number;
  DUVAR_IC: number;
  DUVAR_YUZEY: number;
  HAVUZ_M2: number;
  HOL_ALAN: number;
  H_BOD: number;
  H_DUK: number;
  H_NOR: number;
  H_OTO: number;
  H_TEMEL: number;
  H_USTU: number;
  H_YERALTI: number;
  IL_KATSAYI: number;
  ISITMA: string;
  ISITMA_SEKLI: string;
  ISLAK_ZEMIN: number;
  JENERATOR: number;
  KAKS: number;
  KAT_TOPLAM: number;
  KAT_YERALTI: number;
  KLIMA_TOPLAM: number;
  K_ACINIM: number;
  K_ALLRISK: number;
  K_ALU_TAVAN: number;
  K_ANK_BULASIK: number;
  K_ANK_BUZDOLABI: number;
  K_ASANSOR_SOVE: number;
  K_ASMA_TAVAN: number;
  K_ASMOLEN: number;
  K_BACA: number;
  K_BALKON_KORK: number;
  K_BALKON_M2: number;
  K_BANYO_DUVAR: number;
  K_BANYO_M2: number;
  K_BA_CEPHE: number;
  K_BETON_ASM: number;
  K_BETON_KIR: number;
  K_CATI: number;
  K_CATI_CELIK: number;
  K_CEVRE: number;
  K_CEVRE_DUVAR_H: number;
  K_CIMENTO: number;
  K_DAIRE_HOL: number;
  K_DENIZLIK: number;
  K_DERE: number;
  K_DOLGU_H: number;
  K_DONATI: number;
  K_DUVAR_YUZEY: number;
  K_EBANYO_M2: number;
  K_EGIM_H: number;
  K_GERIDOLGU: number;
  K_GRO_H: number;
  K_HOL: number;
  K_HOL_DUVAR: number;
  K_ICDUVAR: number;
  K_ICDUVAR_BODRUM: number;
  K_INSAAT: number;
  K_ISIKLIK: number;
  K_JCB: number;
  K_KABA: number;
  K_KALIP: number;
  K_KANAL: number;
  K_KAZI: number;
  K_KAZI_EK: number;
  K_KORKULUK: number;
  K_KUM_10: number;
  K_KUM_135: number;
  K_LENTO: number;
  K_MAAS: number;
  K_MERD_DUVAR: number;
  K_MERD_MERMER: number;
  K_MOBIL: number;
  K_MUSLUK: number;
  K_MUTFAK_M2: number;
  K_NET: number;
  K_ONGORULEMEYEN: number;
  K_PENCERE: number;
  K_PERDE: number;
  K_PERDELIK: number;
  K_PERSONEL: number;
  K_SAFT: number;
  K_SERAMIK_ZAYIAT: number;
  K_SGK: number;
  K_SIVA_ORAN: number;
  K_SOVE: number;
  K_TASYUNU: number;
  K_TEKNIK_KAPI: number;
  K_TEMEL_A: number;
  K_TEMEL_B: number;
  K_TEMEL_TASMA: number;
  K_TESLIM: number;
  K_TEZGAH_ARASI: number;
  K_TUGLA: number;
  K_WC_DUVAR: number;
  K_WC_M2: number;
  K_XPS: number;
  K_YALITIM: number;
  K_YERDEN: number;
  K_YUKSEK_BINA: number;
  K_ZPROFIL: number;
  MANTO_SIVA: number;
  MUTFAK_ZEMIN: number;
  ND: number;
  N_ASANSOR: number;
  N_BOD: number;
  N_DILATASYON: number;
  N_DUK: number;
  N_MERDIVEN: number;
  N_NOR: number;
  N_OTO: number;
  ODA_TOPLAM: number;
  ORNEK_DAIRE: number;
  ORTAK_DUVAR: number;
  PAY: number;
  PENCERE_ADET: number;
  PENCERE_ALAN: number;
  SATIS_OFISI: number;
  SERAMIK_DUVAR: number;
  SERAMIK_ZEMIN: number;
  SURE_AY: number;
  SU_DEPOSU: string;
  S_FIN: number;
  S_FITNESS: number;
  S_HAMAM: number;
  S_HAVUZ: number;
  S_SAUNA: number;
  TABAN: number;
  TAKS: number;
  TAVAN_SIVA: number;
  TIA: number;
  TOPLAM_DAIRE: number;
  TOPLAM_OTURUM: number;
  TRAFO: number;
}

/** SP(t => …) içindeki daire tipi alanları. */
export interface FormulaApartmentType {
  A: number;
  ALATURKA: number;
  ANKASTRE: number;
  AYRI: number;
  BALKON: number;
  DUBLEKS: number;
  EBANYO: number;
  ISIK: number;
  KLIMA: number;
  N: number;
  ODA: number;
  TIP?: string;
}

export const BLOCK_LAST_INDEX = 151;

export interface ItemDef {
  i: number;
  grup: number;
  ad: string;
  baslik: boolean;
  birim: string;
  aciklama: string;
  fiyatAciklama: string;
  opsiyonel: boolean;
  /** Kaynak formül metni (Excel raporunda canlı formül kurmak için). */
  metrajKaynak: string;
  piyasaKaynak: string;
  metraj: FormulaFn | null;
  piyasa: FormulaFn | null;
}

export const ITEMS: readonly ItemDef[] = [
  { i: 0, grup: 1, ad: "TOPRAK İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 1, grup: 1, ad: "Kazı, Yükleme ve Nakliye", baslik: false, birim: "m³",
    aciklama: "Taban oturumu × 1,25 × (yer altı yüksekliği + temel kalınlığı + 0,40)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.TABAN*v.K_KAZI*(v.H_YERALTI+v.H_TEMEL+v.K_KAZI_EK)", piyasaKaynak: "320",
    metraj: (v, Q, SP) => v.TABAN * v.K_KAZI * (v.H_YERALTI + v.H_TEMEL + v.K_KAZI_EK),
    piyasa: (v, Q, SP) => 320,
  },
  {
    i: 2, grup: 1, ad: "Geri Dolgu (Kazı Malzemesiyle)", baslik: false, birim: "m³",
    aciklama: "Taban çevresi × 1,50 m bant × kazı derinliği", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.CEVRE_T*v.K_GERIDOLGU*(v.H_YERALTI+v.H_TEMEL)", piyasaKaynak: "250",
    metraj: (v, Q, SP) => v.CEVRE_T * v.K_GERIDOLGU * (v.H_YERALTI + v.H_TEMEL),
    piyasa: (v, Q, SP) => 250,
  },
  {
    i: 3, grup: 1, ad: "Temel Altı Kırmataş Dolgu", baslik: false, birim: "m³",
    aciklama: "Radye alanı × 0,30 m", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.TABAN*v.K_TEMEL_TASMA*v.K_DOLGU_H", piyasaKaynak: "650",
    metraj: (v, Q, SP) => v.TABAN * v.K_TEMEL_TASMA * v.K_DOLGU_H,
    piyasa: (v, Q, SP) => 650,
  },
  {
    i: 4, grup: 1, ad: "Parsel Bacası (Altyapı Rögarı)", baslik: false, birim: "adet",
    aciklama: "Taban çevresi / 25 m + 2", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "RUP(v.CEVRE_T/v.K_BACA,0)+2", piyasaKaynak: "12000",
    metraj: (v, Q, SP) => RUP(v.CEVRE_T / v.K_BACA, 0) + 2,
    piyasa: (v, Q, SP) => 12000,
  },
  {
    i: 5, grup: 1, ad: "Ø200 Kanalizasyon Hattı (Kazı + Boru + Dolgu)", baslik: false, birim: "m",
    aciklama: "Taban çevresi × 0,75", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.CEVRE_T*v.K_KANAL", piyasaKaynak: "1400",
    metraj: (v, Q, SP) => v.CEVRE_T * v.K_KANAL,
    piyasa: (v, Q, SP) => 1400,
  },
  {
    i: 6, grup: 1, ad: "Ø150 Drenaj Hattı (Kazı + Boru + Filtre Dolgu)", baslik: false, birim: "m",
    aciklama: "Yer altı katı varsa taban çevresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.KAT_YERALTI>0,v.CEVRE_T,0)", piyasaKaynak: "1100",
    metraj: (v, Q, SP) => IF(B(v.KAT_YERALTI > 0), v.CEVRE_T, 0),
    piyasa: (v, Q, SP) => 1100,
  },
  { i: 7, grup: 2, ad: "BETONARME İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 8, grup: 2, ad: "Hazır Beton Temini (C30/37)", baslik: false, birim: "m³",
    aciklama: "İnşaat alanı × 0,36 (asmolen) veya 0,32 (kirişli) + radye hacmi + bodrum çevre perdesi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.BIA*IF(v.DOSEME==\"ASMOLEN\",v.K_BETON_ASM,v.K_BETON_KIR)+v.TABAN*v.K_TEMEL_TASMA*v.H_TEMEL+v.CEVRE_T*v.H_YERALTI*v.K_PERDE", piyasaKaynak: "3350",
    metraj: (v, Q, SP) => v.BIA * IF(B(v.DOSEME === "ASMOLEN"), v.K_BETON_ASM, v.K_BETON_KIR) + v.TABAN * v.K_TEMEL_TASMA * v.H_TEMEL + v.CEVRE_T * v.H_YERALTI * v.K_PERDE,
    piyasa: (v, Q, SP) => 3350,
  },
  {
    i: 9, grup: 2, ad: "Grobeton Temini (C16/20)", baslik: false, birim: "m³",
    aciklama: "Radye alanı × 0,10 m", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.TABAN*v.K_TEMEL_TASMA*v.K_GRO_H", piyasaKaynak: "2750",
    metraj: (v, Q, SP) => v.TABAN * v.K_TEMEL_TASMA * v.K_GRO_H,
    piyasa: (v, Q, SP) => 2750,
  },
  {
    i: 10, grup: 2, ad: "Betonarme Demiri Temini", baslik: false, birim: "ton",
    aciklama: "Blok inşaat alanı × 0,040 t/m²", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.BIA*v.K_DONATI", piyasaKaynak: "31700",
    metraj: (v, Q, SP) => v.BIA * v.K_DONATI,
    piyasa: (v, Q, SP) => 31700,
  },
  {
    i: 11, grup: 2, ad: "Radye Temel İşçiliği (Kalıp + Demir + Beton Döküm)", baslik: false, birim: "m²",
    aciklama: "Radye alanı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.TABAN*v.K_TEMEL_TASMA", piyasaKaynak: "1200",
    metraj: (v, Q, SP) => v.TABAN * v.K_TEMEL_TASMA,
    piyasa: (v, Q, SP) => 1200,
  },
  {
    i: 12, grup: 2, ad: "Kat Betonarme İşçiliği (Kalıp + Demir, Düz Ölçü)", baslik: false, birim: "m²",
    aciklama: "Blok inşaat alanı × 1,20", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.BIA*v.K_KALIP", piyasaKaynak: "2000",
    metraj: (v, Q, SP) => v.BIA * v.K_KALIP,
    piyasa: (v, Q, SP) => 2000,
  },
  {
    i: 13, grup: 2, ad: "Asmolen Dolgu Bloğu Temini", baslik: false, birim: "m³",
    aciklama: "Asmolen döşemede inşaat alanı × 0,11; kirişlide 0", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.DOSEME==\"ASMOLEN\",v.BIA*v.K_ASMOLEN,0)", piyasaKaynak: "1850",
    metraj: (v, Q, SP) => IF(B(v.DOSEME === "ASMOLEN"), v.BIA * v.K_ASMOLEN, 0),
    piyasa: (v, Q, SP) => 1850,
  },
  {
    i: 14, grup: 2, ad: "PVC Su Tutucu Bant", baslik: false, birim: "m",
    aciklama: "Taban çevresi × (yer altı kat adedi + 1): temel-perde ve kat derzleri", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.KAT_YERALTI>0,v.CEVRE_T*(v.KAT_YERALTI+1),0)", piyasaKaynak: "180",
    metraj: (v, Q, SP) => IF(B(v.KAT_YERALTI > 0), v.CEVRE_T * (v.KAT_YERALTI + 1), 0),
    piyasa: (v, Q, SP) => 180,
  },
  {
    i: 15, grup: 2, ad: "Betonarme Yardımcı Malzemeleri (Nalburiye, Kür, Kalıp Yağı vb.)", baslik: false, birim: "m²",
    aciklama: "Blok inşaat alanı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.BIA", piyasaKaynak: "150",
    metraj: (v, Q, SP) => v.BIA,
    piyasa: (v, Q, SP) => 150,
  },
  { i: 16, grup: 3, ad: "YALITIM İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 17, grup: 3, ad: "Temel Altı Su Yalıtımı (Çift Kat Membran)", baslik: false, birim: "m²",
    aciklama: "Radye alanı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.TABAN*v.K_TEMEL_TASMA", piyasaKaynak: "650",
    metraj: (v, Q, SP) => v.TABAN * v.K_TEMEL_TASMA,
    piyasa: (v, Q, SP) => 650,
  },
  {
    i: 18, grup: 3, ad: "Bodrum Perde Yalıtımı (Sürme Yalıtım + Isı Yalıtım Levhası + Drenaj Levhası)", baslik: false, birim: "m²",
    aciklama: "Taban çevresi × yer altı yüksekliği", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.CEVRE_T*v.H_YERALTI", piyasaKaynak: "750",
    metraj: (v, Q, SP) => v.CEVRE_T * v.H_YERALTI,
    piyasa: (v, Q, SP) => 750,
  },
  {
    i: 19, grup: 3, ad: "Otopark Üstü Su Yalıtımı (Membran + Koruma Betonu)", baslik: false, birim: "m²",
    aciklama: "Otoparkın bina oturumu dışına taşan (üstü açık) kısmı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.N_OTO>0,Math.max(v.A_OTO-v.TABAN,0),0)", piyasaKaynak: "850",
    metraj: (v, Q, SP) => IF(B(v.N_OTO > 0), Math.max(v.A_OTO - v.TABAN, 0), 0),
    piyasa: (v, Q, SP) => 850,
  },
  {
    i: 20, grup: 3, ad: "Su Deposu İç Yalıtımı", baslik: false, birim: "m²",
    aciklama: "Betonarme depoda daire başı 1,5 m² (en az 60 m²); modüler depoda 0", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.SU_DEPOSU==\"BETONARME\",Math.max(60,v.ND*1.5),0)", piyasaKaynak: "600",
    metraj: (v, Q, SP) => IF(B(v.SU_DEPOSU === "BETONARME"), Math.max(60, v.ND * 1.5), 0),
    piyasa: (v, Q, SP) => 600,
  },
  {
    i: 21, grup: 3, ad: "Havuz İçi Su Yalıtımı", baslik: false, birim: "m²",
    aciklama: "Havuz varsa su yüzeyi × 1,6 (duvarlar dahil), blok payı kadar", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.S_HAVUZ*v.PAY*v.HAVUZ_M2*1.6", piyasaKaynak: "900",
    metraj: (v, Q, SP) => v.S_HAVUZ * v.PAY * v.HAVUZ_M2 * 1.6,
    piyasa: (v, Q, SP) => 900,
  },
  {
    i: 22, grup: 3, ad: "Düşey Dilatasyon Derzi", baslik: false, birim: "m",
    aciklama: "Dilatasyon adedi × bina toplam yüksekliği", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.N_DILATASYON*(v.H_USTU+v.H_YERALTI)", piyasaKaynak: "900",
    metraj: (v, Q, SP) => v.N_DILATASYON * (v.H_USTU + v.H_YERALTI),
    piyasa: (v, Q, SP) => 900,
  },
  {
    i: 23, grup: 3, ad: "Yatay (Döşeme) Dilatasyon Profili", baslik: false, birim: "m",
    aciklama: "Dilatasyon adedi × bina genişliği × döşeme adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.N_DILATASYON*Math.sqrt(v.TABAN/1.5)*(v.KAT_TOPLAM+1)", piyasaKaynak: "1300",
    metraj: (v, Q, SP) => v.N_DILATASYON * Math.sqrt(v.TABAN / 1.5) * (v.KAT_TOPLAM + 1),
    piyasa: (v, Q, SP) => 1300,
  },
  { i: 24, grup: 4, ad: "ÇATI İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 25, grup: 4, ad: "Kırma Çatı Kaplaması (OSB + Su Yalıtım Örtüsü + Kiremit)", baslik: false, birim: "m²",
    aciklama: "Kırma çatıda normal kat alanı × 1,20; teras çatıda 0", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.CATI_TIP==\"KIRMA\",v.A_NOR*v.K_CATI,0)", piyasaKaynak: "1600",
    metraj: (v, Q, SP) => IF(B(v.CATI_TIP === "KIRMA"), v.A_NOR * v.K_CATI, 0),
    piyasa: (v, Q, SP) => 1600,
  },
  {
    i: 26, grup: 4, ad: "Çatı CTP Kaplama (Gizli Dere / Teras)", baslik: false, birim: "m²",
    aciklama: "Kırma çatıda gizli dere (çevre × 0,80 m); teras çatıda kat alanı × 1,10", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.CATI_TIP==\"KIRMA\",v.CEVRE_N*v.K_DERE,v.A_NOR*1.1)", piyasaKaynak: "1400",
    metraj: (v, Q, SP) => IF(B(v.CATI_TIP === "KIRMA"), v.CEVRE_N * v.K_DERE, v.A_NOR * 1.1),
    piyasa: (v, Q, SP) => 1400,
  },
  {
    i: 27, grup: 4, ad: "Çatı Çelik Konstrüksiyon Malzemesi", baslik: false, birim: "kg",
    aciklama: "Kırma çatıda normal kat alanı × 12 kg/m²", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.CATI_TIP==\"KIRMA\",v.A_NOR*v.K_CATI_CELIK,0)", piyasaKaynak: "34",
    metraj: (v, Q, SP) => IF(B(v.CATI_TIP === "KIRMA"), v.A_NOR * v.K_CATI_CELIK, 0),
    piyasa: (v, Q, SP) => 34,
  },
  {
    i: 28, grup: 4, ad: "Çatı Çelik Konstrüksiyon Montaj İşçiliği", baslik: false, birim: "götürü",
    aciklama: "Kırma çatıda 1 (blok başı götürü)", fiyatAciklama: "Çatı çeliği kg × 35 TL/kg (listede 450.000 TL sabit götürü idi)", opsiyonel: false,
    metrajKaynak: "IF(v.CATI_TIP==\"KIRMA\",1,0)", piyasaKaynak: "RND(Q(27)*35,-3)",
    metraj: (v, Q, SP) => IF(B(v.CATI_TIP === "KIRMA"), 1, 0),
    piyasa: (v, Q, SP) => RND(Q(27) * 35, -3),
  },
  {
    i: 29, grup: 4, ad: "Teras Çatı Eğim ve Koruma Betonu", baslik: false, birim: "m³",
    aciklama: "Teras çatıda kat alanı × 0,12 m; kırma çatıda 0", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.CATI_TIP==\"TERAS\",v.A_NOR*v.K_EGIM_H,0)", piyasaKaynak: "3800",
    metraj: (v, Q, SP) => IF(B(v.CATI_TIP === "TERAS"), v.A_NOR * v.K_EGIM_H, 0),
    piyasa: (v, Q, SP) => 3800,
  },
  { i: 30, grup: 5, ad: "DUVAR İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 31, grup: 5, ad: "Tuğla Temini - 10 cm (İç Duvar)", baslik: false, birim: "adet",
    aciklama: "İç duvar alanı × 27 adet/m²", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.DUVAR_IC*v.K_TUGLA", piyasaKaynak: "8.5",
    metraj: (v, Q, SP) => v.DUVAR_IC * v.K_TUGLA,
    piyasa: (v, Q, SP) => 8.5,
  },
  {
    i: 32, grup: 5, ad: "Tuğla Temini - 13,5 cm (Dış Duvar)", baslik: false, birim: "adet",
    aciklama: "Dış duvar alanı × 27 adet/m²", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.DUVAR_DIS*v.K_TUGLA", piyasaKaynak: "10.5",
    metraj: (v, Q, SP) => v.DUVAR_DIS * v.K_TUGLA,
    piyasa: (v, Q, SP) => 10.5,
  },
  {
    i: 33, grup: 5, ad: "Kum Temini (Duvar Harcı)", baslik: false, birim: "m³",
    aciklama: "İç duvar × 0,025 + dış duvar × 0,032", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.DUVAR_IC*v.K_KUM_10+v.DUVAR_DIS*v.K_KUM_135", piyasaKaynak: "600",
    metraj: (v, Q, SP) => v.DUVAR_IC * v.K_KUM_10 + v.DUVAR_DIS * v.K_KUM_135,
    piyasa: (v, Q, SP) => 600,
  },
  {
    i: 34, grup: 5, ad: "Çimento Temini (Duvar Harcı)", baslik: false, birim: "ton",
    aciklama: "Kum m³ × 0,27 t", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "Q(33)*v.K_CIMENTO", piyasaKaynak: "3400",
    metraj: (v, Q, SP) => Q(33) * v.K_CIMENTO,
    piyasa: (v, Q, SP) => 3400,
  },
  {
    i: 35, grup: 5, ad: "Lento Temini (Kapı ve Pencere Üstü)", baslik: false, birim: "m³",
    aciklama: "(Pencere + iç kapı + daire kapısı adedi) × 0,03 m³", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "(v.PENCERE_ADET+Q(82)+Q(80))*v.K_LENTO", piyasaKaynak: "9500",
    metraj: (v, Q, SP) => (v.PENCERE_ADET + Q(82) + Q(80)) * v.K_LENTO,
    piyasa: (v, Q, SP) => 9500,
  },
  {
    i: 36, grup: 5, ad: "Tuğla Duvar Örme İşçiliği", baslik: false, birim: "m²",
    aciklama: "İç + dış duvar alanı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.DUVAR_IC+v.DUVAR_DIS", piyasaKaynak: "400",
    metraj: (v, Q, SP) => v.DUVAR_IC + v.DUVAR_DIS,
    piyasa: (v, Q, SP) => 400,
  },
  { i: 37, grup: 6, ad: "İNCE İŞLER", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 38, grup: 6, ad: "Şap (6 cm)", baslik: false, birim: "m²",
    aciklama: "Daire net alanları toplamı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.DA_NET", piyasaKaynak: "380",
    metraj: (v, Q, SP) => v.DA_NET,
    piyasa: (v, Q, SP) => 380,
  },
  {
    i: 39, grup: 6, ad: "Laminat Parke", baslik: false, birim: "m²",
    aciklama: "Daire net alanı - seramik zeminler (ıslak hacim, ayrı mutfak, balkon, daire holü)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.DA_NET-v.SERAMIK_ZEMIN", piyasaKaynak: "650",
    metraj: (v, Q, SP) => v.DA_NET - v.SERAMIK_ZEMIN,
    piyasa: (v, Q, SP) => 650,
  },
  {
    i: 40, grup: 6, ad: "Seramik / Porselen Karo Temini", baslik: false, birim: "m²",
    aciklama: "(Seramik zemin + duvar) × 1,07 zayiat", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "(v.SERAMIK_ZEMIN+v.SERAMIK_DUVAR)*v.K_SERAMIK_ZAYIAT", piyasaKaynak: "450",
    metraj: (v, Q, SP) => (v.SERAMIK_ZEMIN + v.SERAMIK_DUVAR) * v.K_SERAMIK_ZAYIAT,
    piyasa: (v, Q, SP) => 450,
  },
  {
    i: 41, grup: 6, ad: "Seramik Döşeme ve Kaplama İşçiliği", baslik: false, birim: "m²",
    aciklama: "Seramik zemin + duvar", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SERAMIK_ZEMIN+v.SERAMIK_DUVAR", piyasaKaynak: "400",
    metraj: (v, Q, SP) => v.SERAMIK_ZEMIN + v.SERAMIK_DUVAR,
    piyasa: (v, Q, SP) => 400,
  },
  {
    i: 42, grup: 6, ad: "Kaba Alçı Sıva - Duvar", baslik: false, birim: "m²",
    aciklama: "Daire içi duvar yüzeyi + ortak alan duvarları", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.DUVAR_YUZEY+v.ORTAK_DUVAR", piyasaKaynak: "340",
    metraj: (v, Q, SP) => v.DUVAR_YUZEY + v.ORTAK_DUVAR,
    piyasa: (v, Q, SP) => 340,
  },
  {
    i: 43, grup: 6, ad: "Kaba Alçı Sıva - Tavan", baslik: false, birim: "m²",
    aciklama: "Daire net alanı - asma tavanlı alanlar - balkon", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.TAVAN_SIVA", piyasaKaynak: "380",
    metraj: (v, Q, SP) => v.TAVAN_SIVA,
    piyasa: (v, Q, SP) => 380,
  },
  {
    i: 44, grup: 6, ad: "Saten Alçı - Duvar", baslik: false, birim: "m²",
    aciklama: "Kaba alçı duvar ile aynı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "Q(42)", piyasaKaynak: "170",
    metraj: (v, Q, SP) => Q(42),
    piyasa: (v, Q, SP) => 170,
  },
  {
    i: 45, grup: 6, ad: "Saten Alçı - Tavan", baslik: false, birim: "m²",
    aciklama: "Kaba alçı tavan ile aynı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "Q(43)", piyasaKaynak: "190",
    metraj: (v, Q, SP) => Q(43),
    piyasa: (v, Q, SP) => 190,
  },
  {
    i: 46, grup: 6, ad: "İç Cephe Boyası - Duvar", baslik: false, birim: "m²",
    aciklama: "Kaba alçı duvar ile aynı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "Q(42)", piyasaKaynak: "220",
    metraj: (v, Q, SP) => Q(42),
    piyasa: (v, Q, SP) => 220,
  },
  {
    i: 47, grup: 6, ad: "Tavan Boyası", baslik: false, birim: "m²",
    aciklama: "Sıvalı tavan + alçıpan asma tavan", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.TAVAN_SIVA+v.ASMA_TAVAN", piyasaKaynak: "150",
    metraj: (v, Q, SP) => v.TAVAN_SIVA + v.ASMA_TAVAN,
    piyasa: (v, Q, SP) => 150,
  },
  {
    i: 48, grup: 6, ad: "Alçıpan Asma Tavan (Antre, Koridor, Kat Holleri)", baslik: false, birim: "m²",
    aciklama: "Daire başı 6 m² (antre-koridor) + kat holleri", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ASMA_TAVAN", piyasaKaynak: "750",
    metraj: (v, Q, SP) => v.ASMA_TAVAN,
    piyasa: (v, Q, SP) => 750,
  },
  {
    i: 49, grup: 6, ad: "Asma Tavan Gölge Boşluğu (Z Profil)", baslik: false, birim: "m",
    aciklama: "Daire başı 10 m", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND*v.K_ZPROFIL", piyasaKaynak: "120",
    metraj: (v, Q, SP) => v.ND * v.K_ZPROFIL,
    piyasa: (v, Q, SP) => 120,
  },
  {
    i: 50, grup: 6, ad: "Islak Hacim Asma Tavanı (Banyo, WC)", baslik: false, birim: "m²",
    aciklama: "Islak hacim zemin alanı", fiyatAciklama: "Alüminyum panel seçilirse × 1,25", opsiyonel: false,
    metrajKaynak: "v.ISLAK_ZEMIN", piyasaKaynak: "RND(900*IF(v.BANYO_TAVAN==\"YEŞİL ALÇIPAN\",1,v.K_ALU_TAVAN),0)",
    metraj: (v, Q, SP) => v.ISLAK_ZEMIN,
    piyasa: (v, Q, SP) => RND(900 * IF(B(v.BANYO_TAVAN === "YEŞİL ALÇIPAN"), 1, v.K_ALU_TAVAN), 0),
  },
  {
    i: 51, grup: 6, ad: "Kara Sıva - Otopark ve Bodrum (Tavan + Duvar)", baslik: false, birim: "m²",
    aciklama: "Otopark ve bodrum tavanı + çevre perde yüzeyi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.N_OTO*v.A_OTO+v.N_BOD*v.A_BOD+v.CEVRE_T*v.H_YERALTI", piyasaKaynak: "550",
    metraj: (v, Q, SP) => v.N_OTO * v.A_OTO + v.N_BOD * v.A_BOD + v.CEVRE_T * v.H_YERALTI,
    piyasa: (v, Q, SP) => 550,
  },
  {
    i: 52, grup: 6, ad: "Kara Sıva - Seramik Altı Duvarlar ve Şaft İçleri", baslik: false, birim: "m²",
    aciklama: "Seramik altı duvarlar + daire başı 1 m² şaft içi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SERAMIK_DUVAR+v.ND*v.K_SAFT", piyasaKaynak: "550",
    metraj: (v, Q, SP) => v.SERAMIK_DUVAR + v.ND * v.K_SAFT,
    piyasa: (v, Q, SP) => 550,
  },
  {
    i: 53, grup: 6, ad: "Islak Hacim ve Balkon Su Yalıtımı", baslik: false, birim: "m²",
    aciklama: "(Islak zemin + balkon) × 1,30 duvar dönüşü", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "(v.ISLAK_ZEMIN+v.BALKON_ALAN)*v.K_YALITIM", piyasaKaynak: "380",
    metraj: (v, Q, SP) => (v.ISLAK_ZEMIN + v.BALKON_ALAN) * v.K_YALITIM,
    piyasa: (v, Q, SP) => 380,
  },
  {
    i: 54, grup: 6, ad: "Alçıpan Perdelik", baslik: false, birim: "m",
    aciklama: "Oda+salon adedi × 3 m", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ODA_TOPLAM*v.K_PERDELIK", piyasaKaynak: "450",
    metraj: (v, Q, SP) => v.ODA_TOPLAM * v.K_PERDELIK,
    piyasa: (v, Q, SP) => 450,
  },
  {
    i: 55, grup: 6, ad: "Alçıpan Perdelik Saten Alçı ve Boyası", baslik: false, birim: "m²",
    aciklama: "Perdelik m × 0,50 m açınım", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "Q(54)*v.K_ACINIM", piyasaKaynak: "550",
    metraj: (v, Q, SP) => Q(54) * v.K_ACINIM,
    piyasa: (v, Q, SP) => 550,
  },
  {
    i: 56, grup: 6, ad: "Alçıpan Gizli Işıklık (LED Hariç)", baslik: false, birim: "m",
    aciklama: "Işık bandı olan daire adedi × 14 m", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.ISIK))*v.K_ISIKLIK", piyasaKaynak: "600",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.ISIK)) * v.K_ISIKLIK,
    piyasa: (v, Q, SP) => 600,
  },
  {
    i: 57, grup: 6, ad: "Gizli Işıklık Saten Alçı ve Boyası", baslik: false, birim: "m²",
    aciklama: "Işıklık m × 0,50 m açınım", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "Q(56)*v.K_ACINIM", piyasaKaynak: "550",
    metraj: (v, Q, SP) => Q(56) * v.K_ACINIM,
    piyasa: (v, Q, SP) => 550,
  },
  {
    i: 58, grup: 6, ad: "Klima Altyapısı (Bakır Boru, Drenaj, Kablo)", baslik: false, birim: "adet",
    aciklama: "Daire tiplerindeki klima adetleri toplamı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.KLIMA_TOPLAM", piyasaKaynak: "6500",
    metraj: (v, Q, SP) => v.KLIMA_TOPLAM,
    piyasa: (v, Q, SP) => 6500,
  },
  {
    i: 59, grup: 6, ad: "Mermer Zemin ve Merdiven Kaplaması (Kat Holleri, Basamaklar)", baslik: false, birim: "m²",
    aciklama: "Merdiven × kat × 14 m² + kat holü zeminleri", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.N_MERDIVEN*v.KAT_TOPLAM*v.K_MERD_MERMER+v.HOL_ALAN", piyasaKaynak: "4500",
    metraj: (v, Q, SP) => v.N_MERDIVEN * v.KAT_TOPLAM * v.K_MERD_MERMER + v.HOL_ALAN,
    piyasa: (v, Q, SP) => 4500,
  },
  {
    i: 60, grup: 6, ad: "Mermer Denizlik, Söve ve Asansör Kapı Çevresi", baslik: false, birim: "m²",
    aciklama: "Pencere × 0,42 m² + asansör × durak × 1,2 m²", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.PENCERE_ADET*v.K_DENIZLIK+v.N_ASANSOR*v.KAT_TOPLAM*v.K_ASANSOR_SOVE", piyasaKaynak: "5000",
    metraj: (v, Q, SP) => v.PENCERE_ADET * v.K_DENIZLIK + v.N_ASANSOR * v.KAT_TOPLAM * v.K_ASANSOR_SOVE,
    piyasa: (v, Q, SP) => 5000,
  },
  {
    i: 61, grup: 6, ad: "Sürgülü Kapı Sistemi (Masterslide)", baslik: false, birim: "adet",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "45000",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 45000,
  },
  {
    i: 62, grup: 6, ad: "Duvar Kağıdı Uygulama İşçiliği", baslik: false, birim: "m²",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "150",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 150,
  },
  {
    i: 63, grup: 6, ad: "Duvar Kağıdı Yüzey Hazırlığı", baslik: false, birim: "m²",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "120",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 120,
  },
  {
    i: 64, grup: 6, ad: "Duvar Kağıdı Temini", baslik: false, birim: "m²",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "250",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 250,
  },
  {
    i: 65, grup: 6, ad: "Şaft ve Tesisat Boşluklarının Fileli Dolgusu", baslik: false, birim: "adet",
    aciklama: "Daire başı 2 adet şaft/boşluk", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND*2", piyasaKaynak: "1500",
    metraj: (v, Q, SP) => v.ND * 2,
    piyasa: (v, Q, SP) => 1500,
  },
  {
    i: 66, grup: 6, ad: "Bahçe Çevre Duvarı Sıva ve Boyası", baslik: false, birim: "m²",
    aciklama: "Arsa çevresi (4×√arsa) × 1,5 m × 2 yüz, blok payı kadar", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.PAY*4*Math.sqrt(v.ARSA)*v.K_CEVRE_DUVAR_H*2", piyasaKaynak: "800",
    metraj: (v, Q, SP) => v.PAY * 4 * Math.sqrt(v.ARSA) * v.K_CEVRE_DUVAR_H * 2,
    piyasa: (v, Q, SP) => 800,
  },
  {
    i: 67, grup: 6, ad: "Otopark Dilatasyon Profili", baslik: false, birim: "m",
    aciklama: "Dilatasyon adedi × bina genişliği × otopark katı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.N_DILATASYON*Math.sqrt(v.TABAN/1.5)*v.N_OTO", piyasaKaynak: "2800",
    metraj: (v, Q, SP) => v.N_DILATASYON * Math.sqrt(v.TABAN / 1.5) * v.N_OTO,
    piyasa: (v, Q, SP) => 2800,
  },
  {
    i: 68, grup: 6, ad: "Otopark Zemini Yüzey Sertleştirici", baslik: false, birim: "m²",
    aciklama: "Otopark alanı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.N_OTO*v.A_OTO", piyasaKaynak: "280",
    metraj: (v, Q, SP) => v.N_OTO * v.A_OTO,
    piyasa: (v, Q, SP) => 280,
  },
  {
    i: 69, grup: 6, ad: "Merdiven Korkuluğu (Küpeşte Dahil)", baslik: false, birim: "m",
    aciklama: "Merdiven × kat × 7 m", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.N_MERDIVEN*v.KAT_TOPLAM*v.K_KORKULUK", piyasaKaynak: "3500",
    metraj: (v, Q, SP) => v.N_MERDIVEN * v.KAT_TOPLAM * v.K_KORKULUK,
    piyasa: (v, Q, SP) => 3500,
  },
  {
    i: 70, grup: 6, ad: "Cam Korkuluk (Balkon ve Fransız Pencere)", baslik: false, birim: "m",
    aciklama: "Balkon adedi × 4,5 m (balkon korkulukları bu kalemde)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.BALKON_TOPLAM*v.K_BALKON_KORK", piyasaKaynak: "6500",
    metraj: (v, Q, SP) => v.BALKON_TOPLAM * v.K_BALKON_KORK,
    piyasa: (v, Q, SP) => 6500,
  },
  { i: 71, grup: 7, ad: "CEPHE İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 72, grup: 7, ad: "Mantolama - Isı Yalıtımlı Cephe (Dekoratif Sıva ve Boya Dahil)", baslik: false, birim: "m²",
    aciklama: "Net cephe alanı; \"ÖZEL\" seçilirse 0", fiyatAciklama: "EPS baz; XPS × 1,10; taşyünü × 1,30", opsiyonel: false,
    metrajKaynak: "IF(v.CEPHE_TIP==\"ÖZEL\",0,v.CEPHE_NET)", piyasaKaynak: "RND(950*IF(v.CEPHE_TIP==\"XPS\",v.K_XPS,IF(v.CEPHE_TIP==\"TAŞYÜNÜ\",v.K_TASYUNU,1)),0)",
    metraj: (v, Q, SP) => IF(B(v.CEPHE_TIP === "ÖZEL"), 0, v.CEPHE_NET),
    piyasa: (v, Q, SP) => RND(950 * IF(B(v.CEPHE_TIP === "XPS"), v.K_XPS, IF(B(v.CEPHE_TIP === "TAŞYÜNÜ"), v.K_TASYUNU, 1)), 0),
  },
  {
    i: 73, grup: 7, ad: "Parapet ve Pencere Sövesi (Malzeme + İşçilik)", baslik: false, birim: "m",
    aciklama: "Pencere × 4,8 m + çatı parapeti (kat çevresi)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.PENCERE_ADET*v.K_SOVE+v.CEVRE_N", piyasaKaynak: "450",
    metraj: (v, Q, SP) => v.PENCERE_ADET * v.K_SOVE + v.CEVRE_N,
    piyasa: (v, Q, SP) => 450,
  },
  {
    i: 74, grup: 7, ad: "Dış Cephe Sıvası", baslik: false, birim: "m²",
    aciklama: "Mantolama altına sıva yapılıyorsa ya da cephe \"Özel\" ise net cephenin tamamı; mantolama doğrudan duvara yapılıyorsa net cephenin %10'u (balkon ve parapet içleri)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.CEPHE_TIP==\"ÖZEL\",v.CEPHE_NET,IF(v.MANTO_SIVA==1,v.CEPHE_NET,v.CEPHE_NET*v.K_SIVA_ORAN))", piyasaKaynak: "600",
    metraj: (v, Q, SP) => IF(B(v.CEPHE_TIP === "ÖZEL"), v.CEPHE_NET, IF(B(v.MANTO_SIVA === 1), v.CEPHE_NET, v.CEPHE_NET * v.K_SIVA_ORAN)),
    piyasa: (v, Q, SP) => 600,
  },
  {
    i: 75, grup: 7, ad: "Alüminyum Kompozit Cephe Kaplaması", baslik: false, birim: "m²",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "4500",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 4500,
  },
  {
    i: 76, grup: 7, ad: "Cephe Taş Kaplama Şeritleri", baslik: false, birim: "m",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "2200",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 2200,
  },
  {
    i: 77, grup: 7, ad: "Giydirme Cam Cephe (Dükkan Vitrinleri)", baslik: false, birim: "m²",
    aciklama: "Dükkan katı varsa: çevrenin %40'ı (ön cephe) × kat yüksekliği × 0,70", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.N_DUK*v.K_CEVRE*Math.sqrt(v.A_DUK)*0.4*v.H_DUK*0.7", piyasaKaynak: "14000",
    metraj: (v, Q, SP) => v.N_DUK * v.K_CEVRE * Math.sqrt(v.A_DUK) * 0.4 * v.H_DUK * 0.7,
    piyasa: (v, Q, SP) => 14000,
  },
  {
    i: 78, grup: 7, ad: "Dış Cephe Taş / Kültür Tuğlası / Ateş Tuğlası Kaplama", baslik: false, birim: "m²",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "2800",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 2800,
  },
  { i: 79, grup: 8, ad: "KAPI VE PENCERE İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 80, grup: 8, ad: "Daire Giriş Kapısı (Çelik)", baslik: false, birim: "adet",
    aciklama: "Daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "28000",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 28000,
  },
  {
    i: 81, grup: 8, ad: "Yangın Kapısı (Merdiven Kovası)", baslik: false, birim: "adet",
    aciklama: "(Merdiven + 1) × kat adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "(v.N_MERDIVEN+1)*v.KAT_TOPLAM", piyasaKaynak: "18000",
    metraj: (v, Q, SP) => (v.N_MERDIVEN + 1) * v.KAT_TOPLAM,
    piyasa: (v, Q, SP) => 18000,
  },
  {
    i: 82, grup: 8, ad: "Daire İçi Oda Kapıları (Ahşap)", baslik: false, birim: "adet",
    aciklama: "Daire başı: oda sayısı + genel banyo + ebeveyn banyo + alaturka WC", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.ODA+1+t.EBANYO+t.ALATURKA))", piyasaKaynak: "7500",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.ODA + 1 + t.EBANYO + t.ALATURKA)),
    piyasa: (v, Q, SP) => 7500,
  },
  {
    i: 83, grup: 8, ad: "Salon Kapısı", baslik: false, birim: "adet",
    aciklama: "Daire başı 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "12000",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 12000,
  },
  {
    i: 84, grup: 8, ad: "Mutfak Kapısı", baslik: false, birim: "adet",
    aciklama: "Ayrı mutfaklı daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.AYRI))", piyasaKaynak: "9000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.AYRI)),
    piyasa: (v, Q, SP) => 9000,
  },
  {
    i: 85, grup: 8, ad: "Süpürgelik ve Kapı Eşiği (Tolero)", baslik: false, birim: "daire",
    aciklama: "Daire başı 1 takım", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "5000",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 5000,
  },
  {
    i: 86, grup: 8, ad: "Bina Giriş Kapısı (Alüminyum Camlı)", baslik: false, birim: "adet",
    aciklama: "Blok başı 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "120000",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 120000,
  },
  {
    i: 87, grup: 8, ad: "Otopark Giriş Kapısı (Motorlu Seksiyonel)", baslik: false, birim: "adet",
    aciklama: "Otopark katı varsa 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.N_OTO>0,1,0)", piyasaKaynak: "220000",
    metraj: (v, Q, SP) => IF(B(v.N_OTO > 0), 1, 0),
    piyasa: (v, Q, SP) => 220000,
  },
  {
    i: 88, grup: 8, ad: "Teknik Hacim Kapıları (Elektrik, Pano, Depo Odaları vb.)", baslik: false, birim: "adet",
    aciklama: "Yer altı katı × 4 + 2", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.KAT_YERALTI*v.K_TEKNIK_KAPI+2", piyasaKaynak: "12000",
    metraj: (v, Q, SP) => v.KAT_YERALTI * v.K_TEKNIK_KAPI + 2,
    piyasa: (v, Q, SP) => 12000,
  },
  {
    i: 89, grup: 8, ad: "PVC Pencere ve Balkon Kapısı Doğraması (Isıcam Dahil)", baslik: false, birim: "m²",
    aciklama: "Brüt cephe × 0,22", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.PENCERE_ALAN", piyasaKaynak: "6000",
    metraj: (v, Q, SP) => v.PENCERE_ALAN,
    piyasa: (v, Q, SP) => 6000,
  },
  { i: 90, grup: 9, ad: "MOBİLYA VE AHŞAP İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 91, grup: 9, ad: "Mutfak Dolabı - [daire tipi]", baslik: false, birim: "daire",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "14.000 + 1.600 × daire brüt m² (85 m² → 150.000; 110 m² → 190.000)", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"2+1\")*t.N)", piyasaKaynak: "14000+1600*SP(t=>(t.TIP==\"2+1\")*t.A)",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "2+1")) * t.N),
    piyasa: (v, Q, SP) => 14000 + 1600 * SP((t) => (B(t.TIP === "2+1")) * t.A),
  },
  {
    i: 92, grup: 9, ad: "Mutfak Dolabı 3+1", baslik: false, birim: "adet",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "Aynı formül", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"3+1\")*t.N)", piyasaKaynak: "14000+1600*SP(t=>(t.TIP==\"3+1\")*t.A)",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "3+1")) * t.N),
    piyasa: (v, Q, SP) => 14000 + 1600 * SP((t) => (B(t.TIP === "3+1")) * t.A),
  },
  {
    i: 93, grup: 9, ad: "Mutfak Dolabı - Dubleks / Çatı Katı", baslik: false, birim: "daire",
    aciklama: "Dubleks/çatı katı daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.DUBLEKS))", piyasaKaynak: "210000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.DUBLEKS)),
    piyasa: (v, Q, SP) => 210000,
  },
  {
    i: 94, grup: 9, ad: "Banyo Dolabı (Lavabolu) - Genel Banyo", baslik: false, birim: "adet",
    aciklama: "Daire başı 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "22000",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 22000,
  },
  {
    i: 95, grup: 9, ad: "Banyo Dolabı (Lavabolu) - Ebeveyn Banyosu", baslik: false, birim: "adet",
    aciklama: "Ebeveyn banyo adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.EBANYO))", piyasaKaynak: "18000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.EBANYO)),
    piyasa: (v, Q, SP) => 18000,
  },
  {
    i: 96, grup: 9, ad: "Vestiyer - [daire tipi]", baslik: false, birim: "daire",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "1.000 + 400 × daire brüt m² (85 m² → 35.000; 110 m² → 45.000)", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"2+1\")*t.N)", piyasaKaynak: "1000+400*SP(t=>(t.TIP==\"2+1\")*t.A)",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "2+1")) * t.N),
    piyasa: (v, Q, SP) => 1000 + 400 * SP((t) => (B(t.TIP === "2+1")) * t.A),
  },
  {
    i: 97, grup: 9, ad: "Vestiyer Dolabı 3+1", baslik: false, birim: "adet",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "Aynı formül", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"3+1\")*t.N)", piyasaKaynak: "1000+400*SP(t=>(t.TIP==\"3+1\")*t.A)",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "3+1")) * t.N),
    piyasa: (v, Q, SP) => 1000 + 400 * SP((t) => (B(t.TIP === "3+1")) * t.A),
  },
  {
    i: 98, grup: 9, ad: "Giyinme Odası Dolabı", baslik: false, birim: "adet",
    aciklama: "3 ve üzeri odalı daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*((t.ODA>=3)*1))", piyasaKaynak: "70000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * ((B(t.ODA >= 3)) * 1)),
    piyasa: (v, Q, SP) => 70000,
  },
  {
    i: 99, grup: 9, ad: "Örnek Daire Mobilya ve Tefrişatı", baslik: false, birim: "götürü",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer (örnek daire Satış Ofisi bölümünde ayrıca var)", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "1500000",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 1500000,
  },
  {
    i: 100, grup: 9, ad: "Mutfak Tezgahı", baslik: false, birim: "m",
    aciklama: "Daire başı 3 m + 0,5 m × oda sayısı (2+1 → 4,0 m; 3+1 → 4,5 m)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(3+0.5*t.ODA))", piyasaKaynak: "9000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (3 + 0.5 * t.ODA)),
    piyasa: (v, Q, SP) => 9000,
  },
  {
    i: 101, grup: 9, ad: "Ebeveyn Banyosu Tezgahı", baslik: false, birim: "m",
    aciklama: "Ebeveyn banyo × 0,90 m", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.EBANYO))*0.9", piyasaKaynak: "7500",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.EBANYO)) * 0.9,
    piyasa: (v, Q, SP) => 7500,
  },
  {
    i: 102, grup: 9, ad: "Genel Banyo Tezgahı", baslik: false, birim: "m",
    aciklama: "Daire başı 1,00 m", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND*1", piyasaKaynak: "7500",
    metraj: (v, Q, SP) => v.ND * 1,
    piyasa: (v, Q, SP) => 7500,
  },
  {
    i: 103, grup: 9, ad: "Evye", baslik: false, birim: "adet",
    aciklama: "Daire başı 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "6500",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 6500,
  },
  {
    i: 104, grup: 9, ad: "Dubleks İç Merdiveni", baslik: false, birim: "adet",
    aciklama: "Dubleks daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.DUBLEKS))", piyasaKaynak: "180000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.DUBLEKS)),
    piyasa: (v, Q, SP) => 180000,
  },
  {
    i: 105, grup: 9, ad: "Şaft Kapakları", baslik: false, birim: "adet",
    aciklama: "Banyo adedi + mutfak (daire başı 1)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.BANYO_TOPLAM+v.ND", piyasaKaynak: "3500",
    metraj: (v, Q, SP) => v.BANYO_TOPLAM + v.ND,
    piyasa: (v, Q, SP) => 3500,
  },
  {
    i: 106, grup: 9, ad: "Posta Kutusu", baslik: false, birim: "adet",
    aciklama: "Daire başı 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "900",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 900,
  },
  {
    i: 107, grup: 9, ad: "Diğer Ahşap İşleri", baslik: false, birim: "daire",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "25000",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 25000,
  },
  { i: 108, grup: 10, ad: "BANYO VE WC DONANIMI", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 109, grup: 10, ad: "Duşakabin - [daire tipi]", baslik: false, birim: "adet",
    aciklama: "O tipteki banyo adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>((t.TIP==\"2+1\")*t.N*(1+t.EBANYO)))", piyasaKaynak: "14000",
    metraj: (v, Q, SP) => SP((t) => ((B(t.TIP === "2+1")) * t.N * (1 + t.EBANYO))),
    piyasa: (v, Q, SP) => 14000,
  },
  {
    i: 110, grup: 10, ad: "Duşakabin 3+1", baslik: false, birim: "adet",
    aciklama: "O tipteki banyo adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>((t.TIP==\"3+1\")*t.N*(1+t.EBANYO)))", piyasaKaynak: "16000",
    metraj: (v, Q, SP) => SP((t) => ((B(t.TIP === "3+1")) * t.N * (1 + t.EBANYO))),
    piyasa: (v, Q, SP) => 16000,
  },
  {
    i: 111, grup: 10, ad: "Duşakabin - Dubleks / Çatı Katı", baslik: false, birim: "adet",
    aciklama: "Dubleks dairelerdeki banyo adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.DUBLEKS*(1+t.EBANYO)))", piyasaKaynak: "18000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.DUBLEKS * (1 + t.EBANYO))),
    piyasa: (v, Q, SP) => 18000,
  },
  {
    i: 112, grup: 10, ad: "Banyo Takımı (Vitrifiye + Armatür + Aksesuar) - [daire tipi]", baslik: false, birim: "daire",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "25.000 + 30.000 × dairedeki banyo adedi (1 banyo → 55.000; 2 banyo → 85.000)", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"2+1\")*t.N)", piyasaKaynak: "25000+30000*(1+SP(t=>(t.TIP==\"2+1\")*t.EBANYO))",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "2+1")) * t.N),
    piyasa: (v, Q, SP) => 25000 + 30000 * (1 + SP((t) => (B(t.TIP === "2+1")) * t.EBANYO)),
  },
  {
    i: 113, grup: 10, ad: "Banyo Seti(Vitrifiye+Armatür+Aksesuar) 3+1", baslik: false, birim: "adet",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "Aynı formül", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"3+1\")*t.N)", piyasaKaynak: "25000+30000*(1+SP(t=>(t.TIP==\"3+1\")*t.EBANYO))",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "3+1")) * t.N),
    piyasa: (v, Q, SP) => 25000 + 30000 * (1 + SP((t) => (B(t.TIP === "3+1")) * t.EBANYO)),
  },
  {
    i: 114, grup: 10, ad: "Banyo Takımı (Vitrifiye + Armatür + Aksesuar) - Dubleks / Çatı Katı", baslik: false, birim: "daire",
    aciklama: "Dubleks daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.DUBLEKS))", piyasaKaynak: "95000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.DUBLEKS)),
    piyasa: (v, Q, SP) => 95000,
  },
  { i: 115, grup: 11, ad: "BEYAZ EŞYA VE KLİMA", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 116, grup: 11, ad: "Ankastre Fırın", baslik: false, birim: "adet",
    aciklama: "Ankastre \"VAR\" olan daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.ANKASTRE))", piyasaKaynak: "16000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.ANKASTRE)),
    piyasa: (v, Q, SP) => 16000,
  },
  {
    i: 117, grup: 11, ad: "Ankastre Davlumbaz", baslik: false, birim: "adet",
    aciklama: "Ankastre \"VAR\" olan daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.ANKASTRE))", piyasaKaynak: "9000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.ANKASTRE)),
    piyasa: (v, Q, SP) => 9000,
  },
  {
    i: 118, grup: 11, ad: "Ankastre Ocak", baslik: false, birim: "adet",
    aciklama: "Ankastre \"VAR\" olan daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.ANKASTRE))", piyasaKaynak: "9000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.ANKASTRE)),
    piyasa: (v, Q, SP) => 9000,
  },
  {
    i: 119, grup: 11, ad: "Buzdolabı", baslik: false, birim: "adet",
    aciklama: "Ankastre daire adedi × (buzdolabı dahil mi: varsayılan HAYIR)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.ANKASTRE))*v.K_ANK_BUZDOLABI", piyasaKaynak: "45000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.ANKASTRE)) * v.K_ANK_BUZDOLABI,
    piyasa: (v, Q, SP) => 45000,
  },
  {
    i: 120, grup: 11, ad: "Bulaşık Makinesi", baslik: false, birim: "adet",
    aciklama: "Ankastre daire adedi × (bulaşık makinesi dahil mi: varsayılan HAYIR)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.ANKASTRE))*v.K_ANK_BULASIK", piyasaKaynak: "22000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.ANKASTRE)) * v.K_ANK_BULASIK,
    piyasa: (v, Q, SP) => 22000,
  },
  {
    i: 121, grup: 11, ad: "Klima Cihazı (Split, Montaj Dahil)", baslik: false, birim: "adet",
    aciklama: "Ankastre \"VAR\" olan dairelerdeki klima adetleri toplamı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.ANKASTRE)*(t.KLIMA))", piyasaKaynak: "42000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.ANKASTRE) * (t.KLIMA)),
    piyasa: (v, Q, SP) => 42000,
  },
  { i: 122, grup: 12, ad: "ELEKTRİK İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 123, grup: 12, ad: "Daire İçi Elektrik Tesisatı - [daire tipi]", baslik: false, birim: "daire",
    aciklama: "3+1 dışındaki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "18.000 + 1.200 × daire brüt m² (85 m² → 120.000; 110 m² → 150.000)", opsiyonel: false,
    metrajKaynak: "v.ND-SP(t=>(t.TIP==\"3+1\")*t.N)", piyasaKaynak: "18000+1200*SP(t=>(t.TIP==\"2+1\")*t.A)",
    metraj: (v, Q, SP) => v.ND - SP((t) => (B(t.TIP === "3+1")) * t.N),
    piyasa: (v, Q, SP) => 18000 + 1200 * SP((t) => (B(t.TIP === "2+1")) * t.A),
  },
  {
    i: 124, grup: 12, ad: "3+1 Elektrik İşleri", baslik: false, birim: "adet",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "Aynı formül", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"3+1\")*t.N)", piyasaKaynak: "18000+1200*SP(t=>(t.TIP==\"3+1\")*t.A)",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "3+1")) * t.N),
    piyasa: (v, Q, SP) => 18000 + 1200 * SP((t) => (B(t.TIP === "3+1")) * t.A),
  },
  {
    i: 125, grup: 12, ad: "Daire Aydınlatma Armatürleri ve Anahtar-Priz", baslik: false, birim: "daire",
    aciklama: "Daire başı 1 takım", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "40000",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 40000,
  },
  {
    i: 126, grup: 12, ad: "Ortak Alan Elektrik Tesisatı (Kat Holleri, Merdiven)", baslik: false, birim: "blok",
    aciklama: "Blok başı 1", fiyatAciklama: "45.000 TL × toplam kat (listede ≈10 kat için 450.000)", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "45000*v.KAT_TOPLAM",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 45000 * v.KAT_TOPLAM,
  },
  {
    i: 127, grup: 12, ad: "Otopark Katı Elektrik Tesisatı", baslik: false, birim: "kat",
    aciklama: "Otopark katı adedi", fiyatAciklama: "800 TL × otopark kat alanı (VARSAYIM: listedeki 1.200.000 ≈ 1.500 m² kat)", opsiyonel: false,
    metrajKaynak: "v.N_OTO", piyasaKaynak: "800*v.A_OTO",
    metraj: (v, Q, SP) => v.N_OTO,
    piyasa: (v, Q, SP) => 800 * v.A_OTO,
  },
  {
    i: 128, grup: 12, ad: "Bodrum, Sığınak ve Teknik Hacim Elektrik Tesisatı", baslik: false, birim: "götürü",
    aciklama: "Bodrum varsa 1", fiyatAciklama: "60 TL × blok inşaat alanı", opsiyonel: false,
    metrajKaynak: "IF(v.N_BOD>0,1,0)", piyasaKaynak: "RND(900000/v.BAZ_M2,0)*v.BIA",
    metraj: (v, Q, SP) => IF(B(v.N_BOD > 0), 1, 0),
    piyasa: (v, Q, SP) => RND(900000 / v.BAZ_M2, 0) * v.BIA,
  },
  {
    i: 129, grup: 12, ad: "Bina Dağıtım Panosu (Blok Panosu)", baslik: false, birim: "adet",
    aciklama: "Blok başı 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "180000",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 180000,
  },
  {
    i: 130, grup: 12, ad: "Ortak Alan Tali Panoları", baslik: false, birim: "adet",
    aciklama: "Yer altı kat adedi + 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.KAT_YERALTI+1", piyasaKaynak: "120000",
    metraj: (v, Q, SP) => v.KAT_YERALTI + 1,
    piyasa: (v, Q, SP) => 120000,
  },
  {
    i: 131, grup: 12, ad: "Site Ana Dağıtım Panosu (ADP)", baslik: false, birim: "götürü",
    aciklama: "Proje geneli 1 adet; blok payı kadar", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.PAY", piyasaKaynak: "650000",
    metraj: (v, Q, SP) => v.PAY,
    piyasa: (v, Q, SP) => 650000,
  },
  {
    i: 132, grup: 12, ad: "Enerji Bağlantı ve Güvence Bedelleri", baslik: false, birim: "götürü",
    aciklama: "Proje geneli; blok payı kadar", fiyatAciklama: "100 TL × toplam inşaat alanı", opsiyonel: false,
    metrajKaynak: "v.PAY", piyasaKaynak: "RND(1500000/v.BAZ_M2,0)*v.TIA",
    metraj: (v, Q, SP) => v.PAY,
    piyasa: (v, Q, SP) => RND(1500000 / v.BAZ_M2, 0) * v.TIA,
  },
  {
    i: 133, grup: 12, ad: "Jeneratör (Kabinli Dizel)", baslik: false, birim: "götürü",
    aciklama: "Jeneratör seçildiyse blok payı kadar", fiyatAciklama: "28.000 TL × toplam daire (en az 1.200.000)", opsiyonel: false,
    metrajKaynak: "v.JENERATOR*v.PAY", piyasaKaynak: "Math.max(1200000,2800000/v.BAZ_DAIRE*v.TOPLAM_DAIRE)",
    metraj: (v, Q, SP) => v.JENERATOR * v.PAY,
    piyasa: (v, Q, SP) => Math.max(1200000, 2800000 / v.BAZ_DAIRE * v.TOPLAM_DAIRE),
  },
  {
    i: 134, grup: 12, ad: "Trafo Merkezi (Trafo + Köşk + OG Hücre)", baslik: false, birim: "götürü",
    aciklama: "Trafo seçildiyse blok payı kadar", fiyatAciklama: "35.000 TL × toplam daire (en az 2.000.000)", opsiyonel: false,
    metrajKaynak: "v.TRAFO*v.PAY", piyasaKaynak: "Math.max(2000000,3500000/v.BAZ_DAIRE*v.TOPLAM_DAIRE)",
    metraj: (v, Q, SP) => v.TRAFO * v.PAY,
    piyasa: (v, Q, SP) => Math.max(2000000, 3500000 / v.BAZ_DAIRE * v.TOPLAM_DAIRE),
  },
  { i: 135, grup: 13, ad: "MEKANİK TESİSAT İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 136, grup: 13, ad: "Daire İçi Sıhhi Tesisat (Temiz Su + Pis Su)", baslik: false, birim: "daire",
    aciklama: "Daire adedi (fiyat daire başı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "85000",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 85000,
  },
  {
    i: 137, grup: 13, ad: "Ara Musluk ve Bağlantı Elemanları", baslik: false, birim: "adet",
    aciklama: "Daire başı 6 + ebeveyn banyo başı 4", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND*v.K_MUSLUK+SP(t=>(t.N)*(t.EBANYO))*4", piyasaKaynak: "1200",
    metraj: (v, Q, SP) => v.ND * v.K_MUSLUK + SP((t) => (t.N) * (t.EBANYO)) * 4,
    piyasa: (v, Q, SP) => 1200,
  },
  {
    i: 138, grup: 13, ad: "Dubleks / Çatı Katı Sıhhi Tesisat Farkı", baslik: false, birim: "daire",
    aciklama: "Dubleks/çatı katı daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.N)*(t.DUBLEKS))", piyasaKaynak: "110000",
    metraj: (v, Q, SP) => SP((t) => (t.N) * (t.DUBLEKS)),
    piyasa: (v, Q, SP) => 110000,
  },
  {
    i: 139, grup: 13, ad: "Daire İçi Isıtma Tesisatı - [daire tipi]", baslik: false, birim: "daire",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "(4.000 + 600 × brüt m²) × yerden ısıtmada 1,5", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"2+1\")*t.N)", piyasaKaynak: "(4000+600*SP(t=>(t.TIP==\"2+1\")*t.A))*IF(v.ISITMA_SEKLI==\"RADYATÖR\",1,v.K_YERDEN)",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "2+1")) * t.N),
    piyasa: (v, Q, SP) => (4000 + 600 * SP((t) => (B(t.TIP === "2+1")) * t.A)) * IF(B(v.ISITMA_SEKLI === "RADYATÖR"), 1, v.K_YERDEN),
  },
  {
    i: 140, grup: 13, ad: "Isıtma Tesisatı 3+1", baslik: false, birim: "adet",
    aciklama: "O tipteki daire adedi (TİPE BAĞLI SATIR)", fiyatAciklama: "Aynı formül", opsiyonel: false,
    metrajKaynak: "SP(t=>(t.TIP==\"3+1\")*t.N)", piyasaKaynak: "(4000+600*SP(t=>(t.TIP==\"3+1\")*t.A))*IF(v.ISITMA_SEKLI==\"RADYATÖR\",1,v.K_YERDEN)",
    metraj: (v, Q, SP) => SP((t) => (B(t.TIP === "3+1")) * t.N),
    piyasa: (v, Q, SP) => (4000 + 600 * SP((t) => (B(t.TIP === "3+1")) * t.A)) * IF(B(v.ISITMA_SEKLI === "RADYATÖR"), 1, v.K_YERDEN),
  },
  {
    i: 141, grup: 13, ad: "Daire İçi Yangın Tesisatı (Sprinkler) - [daire tipi]", baslik: false, birim: "daire",
    aciklama: "Bina yüksekliği 30,50 m'yi aşıyorsa o tipteki daire adedi; aşmıyorsa 0 (ONAY GEREKLİ)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.H_USTU>v.K_YUKSEK_BINA,SP(t=>(t.TIP==\"2+1\")*t.N),0)", piyasaKaynak: "30000",
    metraj: (v, Q, SP) => IF(B(v.H_USTU > v.K_YUKSEK_BINA), SP((t) => (B(t.TIP === "2+1")) * t.N), 0),
    piyasa: (v, Q, SP) => 30000,
  },
  {
    i: 142, grup: 13, ad: "Yangın Tesisatı 3+1", baslik: false, birim: "adet",
    aciklama: "Aynı kural", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.H_USTU>v.K_YUKSEK_BINA,SP(t=>(t.TIP==\"3+1\")*t.N),0)", piyasaKaynak: "38000",
    metraj: (v, Q, SP) => IF(B(v.H_USTU > v.K_YUKSEK_BINA), SP((t) => (B(t.TIP === "3+1")) * t.N), 0),
    piyasa: (v, Q, SP) => 38000,
  },
  {
    i: 143, grup: 13, ad: "Radyatör, Havlupan ve Vanalar", baslik: false, birim: "daire",
    aciklama: "Radyatörlü sistemde daire adedi; yerden ısıtmada 0", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.ISITMA_SEKLI==\"RADYATÖR\",v.ND,0)", piyasaKaynak: "45000",
    metraj: (v, Q, SP) => IF(B(v.ISITMA_SEKLI === "RADYATÖR"), v.ND, 0),
    piyasa: (v, Q, SP) => 45000,
  },
  {
    i: 144, grup: 13, ad: "Kombi Cihazı (Yoğuşmalı)", baslik: false, birim: "adet",
    aciklama: "Kombili sistemde daire adedi; merkezide 0", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.ISITMA==\"KOMBİ\",v.ND,0)", piyasaKaynak: "38000",
    metraj: (v, Q, SP) => IF(B(v.ISITMA === "KOMBİ"), v.ND, 0),
    piyasa: (v, Q, SP) => 38000,
  },
  {
    i: 145, grup: 13, ad: "Bodrum, Sığınak ve Teknik Hacim Mekanik Tesisatı", baslik: false, birim: "götürü",
    aciklama: "Bodrum varsa 1", fiyatAciklama: "100 TL × blok inşaat alanı", opsiyonel: false,
    metrajKaynak: "IF(v.N_BOD>0,1,0)", piyasaKaynak: "RND(1500000/v.BAZ_M2,0)*v.BIA",
    metraj: (v, Q, SP) => IF(B(v.N_BOD > 0), 1, 0),
    piyasa: (v, Q, SP) => RND(1500000 / v.BAZ_M2, 0) * v.BIA,
  },
  {
    i: 146, grup: 13, ad: "Kazan Dairesi, Otopark Havalandırma ve Yangın Tesisatı", baslik: false, birim: "götürü",
    aciklama: "Blok başı 1 (götürü)", fiyatAciklama: "1.500 TL × otopark alanı (havalandırma+yangın) + merkezi sistemde 25.000 TL × daire (kazan dairesi)", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "1500*v.N_OTO*v.A_OTO+IF(v.ISITMA==\"MERKEZİ\",25000*v.ND,0)",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 1500 * v.N_OTO * v.A_OTO + IF(B(v.ISITMA === "MERKEZİ"), 25000 * v.ND, 0),
  },
  {
    i: 147, grup: 13, ad: "Doğalgaz İç Tesisatı", baslik: false, birim: "daire",
    aciklama: "Daire adedi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.ND", piyasaKaynak: "18000",
    metraj: (v, Q, SP) => v.ND,
    piyasa: (v, Q, SP) => 18000,
  },
  {
    i: 148, grup: 13, ad: "Modüler Su Deposu (Hidrofor)", baslik: false, birim: "götürü",
    aciklama: "Modüler depo seçildiyse blok payı kadar", fiyatAciklama: "4.500 TL × toplam daire", opsiyonel: false,
    metrajKaynak: "IF(v.SU_DEPOSU==\"MODÜLER\",v.PAY,0)", piyasaKaynak: "450000/v.BAZ_DAIRE*v.TOPLAM_DAIRE",
    metraj: (v, Q, SP) => IF(B(v.SU_DEPOSU === "MODÜLER"), v.PAY, 0),
    piyasa: (v, Q, SP) => 450000 / v.BAZ_DAIRE * v.TOPLAM_DAIRE,
  },
  {
    i: 149, grup: 13, ad: "Peyzaj Sulama Deposu", baslik: false, birim: "götürü",
    aciklama: "Çevre düzenleme alanı 1.000 m²'den büyükse blok payı kadar", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "IF(v.CEVRE_ALAN>1000,v.PAY,0)", piyasaKaynak: "200000",
    metraj: (v, Q, SP) => IF(B(v.CEVRE_ALAN > 1000), v.PAY, 0),
    piyasa: (v, Q, SP) => 200000,
  },
  { i: 150, grup: 14, ad: "ASANSÖR İŞLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 151, grup: 14, ad: "Asansör (Temin ve Montaj)", baslik: false, birim: "adet",
    aciklama: "Asansör adedi", fiyatAciklama: "600.000 + 80.000 × durak (10 durak → 1.400.000)", opsiyonel: false,
    metrajKaynak: "v.N_ASANSOR", piyasaKaynak: "600000+80000*v.KAT_TOPLAM",
    metraj: (v, Q, SP) => v.N_ASANSOR,
    piyasa: (v, Q, SP) => 600000 + 80000 * v.KAT_TOPLAM,
  },
  { i: 152, grup: 15, ad: "ÇEVRE DÜZENLEME VE ALTYAPI", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 153, grup: 15, ad: "Atıksu ve Yağmursuyu Hatları", baslik: false, birim: "m",
    aciklama: "Arsa çevresinin %80'i (3,2 × √arsa)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "3.2*Math.sqrt(v.ARSA)", piyasaKaynak: "2200",
    metraj: (v, Q, SP) => 3.2 * Math.sqrt(v.ARSA),
    piyasa: (v, Q, SP) => 2200,
  },
  {
    i: 154, grup: 15, ad: "Elektrik ve Zayıf Akım Altyapısı", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "480 TL × çevre düzenleme alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(1800000/v.BAZ_CEVRE,0)*v.CEVRE_ALAN",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(1800000 / v.BAZ_CEVRE, 0) * v.CEVRE_ALAN,
  },
  {
    i: 155, grup: 15, ad: "Peyzaj (Toprak, Bitkilendirme, Sert Zemin, Çocuk Oyun Alanı)", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "1.600 TL × çevre düzenleme alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(6000000/v.BAZ_CEVRE,0)*v.CEVRE_ALAN",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(6000000 / v.BAZ_CEVRE, 0) * v.CEVRE_ALAN,
  },
  {
    i: 156, grup: 15, ad: "Peyzaj Mobilyaları (Bank, Çöp Kovası, Aydınlatma)", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "160 TL × çevre düzenleme alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(600000/v.BAZ_CEVRE,0)*v.CEVRE_ALAN",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(600000 / v.BAZ_CEVRE, 0) * v.CEVRE_ALAN,
  },
  {
    i: 157, grup: 15, ad: "Kamelya", baslik: false, birim: "adet",
    aciklama: "Her 1.500 m² çevre alanına 1 kamelya", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "RUP(v.CEVRE_ALAN/1500,0)", piyasaKaynak: "180000",
    metraj: (v, Q, SP) => RUP(v.CEVRE_ALAN / 1500, 0),
    piyasa: (v, Q, SP) => 180000,
  },
  {
    i: 158, grup: 15, ad: "Diğer Peyzaj İşleri", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "200 TL × çevre düzenleme alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(750000/v.BAZ_CEVRE,0)*v.CEVRE_ALAN",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(750000 / v.BAZ_CEVRE, 0) * v.CEVRE_ALAN,
  },
  {
    i: 159, grup: 15, ad: "Çevre Güvenlik Kamera Sistemi", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "9.000 TL × toplam daire", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "900000/v.BAZ_DAIRE*v.TOPLAM_DAIRE",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 900000 / v.BAZ_DAIRE * v.TOPLAM_DAIRE,
  },
  {
    i: 160, grup: 15, ad: "Site Girişi (Güvenlik Kulübesi, Bariyer, Giriş Takı)", baslik: false, birim: "götürü",
    aciklama: "1 adet", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "1500000",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 1500000,
  },
  { i: 161, grup: 16, ad: "SOSYAL TESİSLER", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 162, grup: 16, ad: "Hamam", baslik: false, birim: "adet",
    aciklama: "Seçildiyse 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.S_HAMAM", piyasaKaynak: "1800000",
    metraj: (v, Q, SP) => v.S_HAMAM,
    piyasa: (v, Q, SP) => 1800000,
  },
  {
    i: 163, grup: 16, ad: "Sauna", baslik: false, birim: "adet",
    aciklama: "Seçildiyse 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.S_SAUNA", piyasaKaynak: "650000",
    metraj: (v, Q, SP) => v.S_SAUNA,
    piyasa: (v, Q, SP) => 650000,
  },
  {
    i: 164, grup: 16, ad: "Fin Hamamı", baslik: false, birim: "adet",
    aciklama: "Seçildiyse 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.S_FIN", piyasaKaynak: "750000",
    metraj: (v, Q, SP) => v.S_FIN,
    piyasa: (v, Q, SP) => 750000,
  },
  {
    i: 165, grup: 16, ad: "Fitness Salonu (Ekipman Dahil)", baslik: false, birim: "adet",
    aciklama: "Seçildiyse 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.S_FITNESS", piyasaKaynak: "1800000",
    metraj: (v, Q, SP) => v.S_FITNESS,
    piyasa: (v, Q, SP) => 1800000,
  },
  {
    i: 166, grup: 16, ad: "Kapalı Yüzme Havuzu (Mekanik Dahil)", baslik: false, birim: "adet",
    aciklama: "Seçildiyse 1", fiyatAciklama: "45.000 TL × havuz m² (100 m² → 4.500.000)", opsiyonel: false,
    metrajKaynak: "v.S_HAVUZ", piyasaKaynak: "45000*v.HAVUZ_M2",
    metraj: (v, Q, SP) => v.S_HAVUZ,
    piyasa: (v, Q, SP) => 45000 * v.HAVUZ_M2,
  },
  {
    i: 167, grup: 16, ad: "Sosyal Tesis Mobilya ve Tefrişatı", baslik: false, birim: "götürü",
    aciklama: "Herhangi bir sosyal tesis varsa 1", fiyatAciklama: "300.000 TL × seçilen tesis sayısı", opsiyonel: false,
    metrajKaynak: "IF(v.S_HAMAM+v.S_SAUNA+v.S_FIN+v.S_FITNESS+v.S_HAVUZ>0,1,0)", piyasaKaynak: "300000*(v.S_HAMAM+v.S_SAUNA+v.S_FIN+v.S_FITNESS+v.S_HAVUZ)",
    metraj: (v, Q, SP) => IF(B(v.S_HAMAM + v.S_SAUNA + v.S_FIN + v.S_FITNESS + v.S_HAVUZ > 0), 1, 0),
    piyasa: (v, Q, SP) => 300000 * (v.S_HAMAM + v.S_SAUNA + v.S_FIN + v.S_FITNESS + v.S_HAVUZ),
  },
  { i: 168, grup: 17, ad: "GENEL GİDERLER", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 169, grup: 17, ad: "Dolaylı Personel - SGK ve Vergiler", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "Personel sayısı (inşaat alanı / 1.500, en az 4) × 35.000 TL × süre", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "Math.max(4,RUP(v.TIA/v.K_PERSONEL,0))*v.K_SGK*v.SURE_AY",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => Math.max(4, RUP(v.TIA / v.K_PERSONEL, 0)) * v.K_SGK * v.SURE_AY,
  },
  {
    i: 170, grup: 17, ad: "Dolaylı Personel - Maaş ve Diğer Ödemeler", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "Personel sayısı × 70.000 TL × süre", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "Math.max(4,RUP(v.TIA/v.K_PERSONEL,0))*v.K_MAAS*v.SURE_AY",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => Math.max(4, RUP(v.TIA / v.K_PERSONEL, 0)) * v.K_MAAS * v.SURE_AY,
  },
  {
    i: 171, grup: 17, ad: "Şantiye Mobilizasyonu (Konteyner, Ofis, Çevre Çiti vb.)", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "167 TL × toplam inşaat alanı (en az 750.000)", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "Math.max(750000,RND(2500000/v.BAZ_M2,0)*v.TIA)",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => Math.max(750000, RND(2500000 / v.BAZ_M2, 0) * v.TIA),
  },
  {
    i: 172, grup: 17, ad: "İşçi Kampı Mobilizasyonu", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "133 TL × toplam inşaat alanı (en az 500.000)", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "Math.max(500000,RND(2000000/v.BAZ_M2,0)*v.TIA)",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => Math.max(500000, RND(2000000 / v.BAZ_M2, 0) * v.TIA),
  },
  {
    i: 173, grup: 17, ad: "Şantiye Elektrik Gideri", baslik: false, birim: "ay",
    aciklama: "İnşaat süresi", fiyatAciklama: "8 TL × toplam inşaat alanı / ay", opsiyonel: false,
    metrajKaynak: "v.SURE_AY", piyasaKaynak: "120000/v.BAZ_M2*v.TIA",
    metraj: (v, Q, SP) => v.SURE_AY,
    piyasa: (v, Q, SP) => 120000 / v.BAZ_M2 * v.TIA,
  },
  {
    i: 174, grup: 17, ad: "Şantiye Su Gideri", baslik: false, birim: "ay",
    aciklama: "İnşaat süresi", fiyatAciklama: "2,33 TL × toplam inşaat alanı / ay", opsiyonel: false,
    metrajKaynak: "v.SURE_AY", piyasaKaynak: "RND(35000/v.BAZ_M2*v.TIA,-2)",
    metraj: (v, Q, SP) => v.SURE_AY,
    piyasa: (v, Q, SP) => RND(35000 / v.BAZ_M2 * v.TIA, -2),
  },
  {
    i: 175, grup: 17, ad: "Şantiye Doğalgaz Gideri", baslik: false, birim: "ay",
    aciklama: "İnşaat süresi", fiyatAciklama: "1,33 TL × toplam inşaat alanı / ay", opsiyonel: false,
    metrajKaynak: "v.SURE_AY", piyasaKaynak: "RND(20000/v.BAZ_M2*v.TIA,-2)",
    metraj: (v, Q, SP) => v.SURE_AY,
    piyasa: (v, Q, SP) => RND(20000 / v.BAZ_M2 * v.TIA, -2),
  },
  {
    i: 176, grup: 17, ad: "Şantiye İşletme Giderleri", baslik: false, birim: "ay",
    aciklama: "İnşaat süresi", fiyatAciklama: "16,7 TL × toplam inşaat alanı / ay", opsiyonel: false,
    metrajKaynak: "v.SURE_AY", piyasaKaynak: "RND(250000/v.BAZ_M2*v.TIA,-2)",
    metraj: (v, Q, SP) => v.SURE_AY,
    piyasa: (v, Q, SP) => RND(250000 / v.BAZ_M2 * v.TIA, -2),
  },
  {
    i: 177, grup: 17, ad: "Binek Araç Kirası (2 Araç)", baslik: false, birim: "ay",
    aciklama: "İnşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SURE_AY", piyasaKaynak: "110000",
    metraj: (v, Q, SP) => v.SURE_AY,
    piyasa: (v, Q, SP) => 110000,
  },
  {
    i: 178, grup: 17, ad: "Binek Araç Yakıt, Bakım ve Otoyol Giderleri", baslik: false, birim: "ay",
    aciklama: "İnşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SURE_AY", piyasaKaynak: "60000",
    metraj: (v, Q, SP) => v.SURE_AY,
    piyasa: (v, Q, SP) => 60000,
  },
  {
    i: 179, grup: 17, ad: "All Risk İnşaat Sigortası", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "%0,25 × yapım maliyeti (bloklar + çevre + sosyal tesis toplamı); uygulamada otomatik", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "1100000",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 1100000,
  },
  {
    i: 180, grup: 17, ad: "OSGB Hizmeti", baslik: false, birim: "ay",
    aciklama: "İnşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SURE_AY", piyasaKaynak: "25000",
    metraj: (v, Q, SP) => v.SURE_AY,
    piyasa: (v, Q, SP) => 25000,
  },
  {
    i: 181, grup: 17, ad: "İSG - Kişisel Koruyucu Donanım", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "60 TL × toplam inşaat alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(900000/v.BAZ_M2,0)*v.TIA",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(900000 / v.BAZ_M2, 0) * v.TIA,
  },
  {
    i: 182, grup: 17, ad: "İSG - Toplu Koruma (İskele Filesi, Korkuluk, Güvenlik Ağı)", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "120 TL × toplam inşaat alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(1800000/v.BAZ_M2,0)*v.TIA",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(1800000 / v.BAZ_M2, 0) * v.TIA,
  },
  {
    i: 183, grup: 17, ad: "Noter Giderleri", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "250000",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 250000,
  },
  {
    i: 184, grup: 17, ad: "Finansman Giderleri", baslik: false, birim: "götürü",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer (finansman yapısına bağlı)", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "15000000",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 15000000,
  },
  {
    i: 185, grup: 17, ad: "İyileştirme ve Revizyon Giderleri", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "100 TL × toplam inşaat alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(1500000/v.BAZ_M2,0)*v.TIA",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(1500000 / v.BAZ_M2, 0) * v.TIA,
  },
  {
    i: 186, grup: 17, ad: "Vergi ve Harçlar", baslik: false, birim: "götürü",
    aciklama: "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer (kapsamı belirsiz; ONAY GEREKLİ)", fiyatAciklama: "", opsiyonel: true,
    metrajKaynak: "0", piyasaKaynak: "5000000",
    metraj: (v, Q, SP) => 0,
    piyasa: (v, Q, SP) => 5000000,
  },
  {
    i: 187, grup: 17, ad: "Mali Müşavirlik ve Hukuk Hizmetleri", baslik: false, birim: "ay",
    aciklama: "İnşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SURE_AY", piyasaKaynak: "60000",
    metraj: (v, Q, SP) => v.SURE_AY,
    piyasa: (v, Q, SP) => 60000,
  },
  { i: 188, grup: 18, ad: "SATIŞ OFİSİ VE PAZARLAMA GİDERLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 189, grup: 18, ad: "Satış Ofisi - Betonarme İşleri", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "1800000",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 1800000,
  },
  {
    i: 190, grup: 18, ad: "Satış Ofisi - İnce İşler", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "1500000",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 1500000,
  },
  {
    i: 191, grup: 18, ad: "Satış Ofisi - Yalıtım İşleri", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "250000",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 250000,
  },
  {
    i: 192, grup: 18, ad: "Satış Ofisi - Dekorasyon", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "2000000",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 2000000,
  },
  {
    i: 193, grup: 18, ad: "Satış Ofisi - Cephe Kaplama", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "900000",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 900000,
  },
  {
    i: 194, grup: 18, ad: "Satış Ofisi - Elektrik İşleri", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "600000",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 600000,
  },
  {
    i: 195, grup: 18, ad: "Satış Ofisi - Mekanik İşler", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "700000",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 700000,
  },
  {
    i: 196, grup: 18, ad: "Satış Ofisi - Diğer İşler", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "500000",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 500000,
  },
  {
    i: 197, grup: 18, ad: "Örnek Daire Hazırlığı", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi ve örnek daire varsa 1", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI*v.ORNEK_DAIRE", piyasaKaynak: "2500000",
    metraj: (v, Q, SP) => v.SATIS_OFISI * v.ORNEK_DAIRE,
    piyasa: (v, Q, SP) => 2500000,
  },
  {
    i: 198, grup: 18, ad: "Satış Personeli (5 Kişi, Primler Dahil)", baslik: false, birim: "ay",
    aciklama: "Satış ofisi varsa inşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI*v.SURE_AY", piyasaKaynak: "550000",
    metraj: (v, Q, SP) => v.SATIS_OFISI * v.SURE_AY,
    piyasa: (v, Q, SP) => 550000,
  },
  {
    i: 199, grup: 18, ad: "Reklam ve Pazarlama Danışmanlığı", baslik: false, birim: "ay",
    aciklama: "Satış ofisi varsa inşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI*v.SURE_AY", piyasaKaynak: "150000",
    metraj: (v, Q, SP) => v.SATIS_OFISI * v.SURE_AY,
    piyasa: (v, Q, SP) => 150000,
  },
  {
    i: 200, grup: 18, ad: "Reklam ve Medya Bütçesi", baslik: false, birim: "götürü",
    aciklama: "Satış ofisi varsa 1", fiyatAciklama: "60.000 TL × toplam daire", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI", piyasaKaynak: "6000000/v.BAZ_DAIRE*v.TOPLAM_DAIRE",
    metraj: (v, Q, SP) => v.SATIS_OFISI,
    piyasa: (v, Q, SP) => 6000000 / v.BAZ_DAIRE * v.TOPLAM_DAIRE,
  },
  {
    i: 201, grup: 18, ad: "Satış Ofisi İşletme Giderleri", baslik: false, birim: "ay",
    aciklama: "Satış ofisi varsa inşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI*v.SURE_AY", piyasaKaynak: "60000",
    metraj: (v, Q, SP) => v.SATIS_OFISI * v.SURE_AY,
    piyasa: (v, Q, SP) => 60000,
  },
  {
    i: 202, grup: 18, ad: "Satış Ofisi Elektrik Gideri", baslik: false, birim: "ay",
    aciklama: "Satış ofisi varsa inşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI*v.SURE_AY", piyasaKaynak: "15000",
    metraj: (v, Q, SP) => v.SATIS_OFISI * v.SURE_AY,
    piyasa: (v, Q, SP) => 15000,
  },
  {
    i: 203, grup: 18, ad: "Satış Ofisi Su Gideri", baslik: false, birim: "ay",
    aciklama: "Satış ofisi varsa inşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI*v.SURE_AY", piyasaKaynak: "3000",
    metraj: (v, Q, SP) => v.SATIS_OFISI * v.SURE_AY,
    piyasa: (v, Q, SP) => 3000,
  },
  {
    i: 204, grup: 18, ad: "Satış Ofisi Doğalgaz Gideri", baslik: false, birim: "ay",
    aciklama: "Satış ofisi varsa inşaat süresi", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SATIS_OFISI*v.SURE_AY", piyasaKaynak: "6000",
    metraj: (v, Q, SP) => v.SATIS_OFISI * v.SURE_AY,
    piyasa: (v, Q, SP) => 6000,
  },
  { i: 205, grup: 19, ad: "İŞ MAKİNESİ KİRALAMA", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 206, grup: 19, ad: "Beko Loder (JCB) Kiralama", baslik: false, birim: "saat",
    aciklama: "İnşaat süresi × 40 saat/ay", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SURE_AY*v.K_JCB", piyasaKaynak: "1800",
    metraj: (v, Q, SP) => v.SURE_AY * v.K_JCB,
    piyasa: (v, Q, SP) => 1800,
  },
  {
    i: 207, grup: 19, ad: "Mobil Vinç Kiralama", baslik: false, birim: "gün",
    aciklama: "İnşaat süresi × 2 gün/ay", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.SURE_AY*v.K_MOBIL", piyasaKaynak: "22000",
    metraj: (v, Q, SP) => v.SURE_AY * v.K_MOBIL,
    piyasa: (v, Q, SP) => 22000,
  },
  {
    i: 208, grup: 19, ad: "Kule Vinç Kiralama", baslik: false, birim: "ay",
    aciklama: "Her 2 bloğa 1 kule vinç × kaba inşaat süresi (sürenin %55'i)", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "RUP(v.BLOK_ADEDI/2,0)*RND(v.SURE_AY*v.K_KABA,0)", piyasaKaynak: "200000",
    metraj: (v, Q, SP) => RUP(v.BLOK_ADEDI / 2, 0) * RND(v.SURE_AY * v.K_KABA, 0),
    piyasa: (v, Q, SP) => 200000,
  },
  { i: 209, grup: 20, ad: "TESLİM VE BAKIM GİDERLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 210, grup: 20, ad: "Teslim ve Bakım Personeli", baslik: false, birim: "ay",
    aciklama: "6 ay", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.K_TESLIM", piyasaKaynak: "180000",
    metraj: (v, Q, SP) => v.K_TESLIM,
    piyasa: (v, Q, SP) => 180000,
  },
  {
    i: 211, grup: 20, ad: "Teslim ve Bakım Diğer Giderleri", baslik: false, birim: "ay",
    aciklama: "6 ay", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.K_TESLIM", piyasaKaynak: "75000",
    metraj: (v, Q, SP) => v.K_TESLIM,
    piyasa: (v, Q, SP) => 75000,
  },
  { i: 212, grup: 21, ad: "PROJE, RUHSAT VE YAPI DENETİM GİDERLERİ", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 213, grup: 21, ad: "Yapı Denetim Hizmet Bedeli", baslik: false, birim: "m²",
    aciklama: "Toplam inşaat alanı", fiyatAciklama: "", opsiyonel: false,
    metrajKaynak: "v.TIA", piyasaKaynak: "220",
    metraj: (v, Q, SP) => v.TIA,
    piyasa: (v, Q, SP) => 220,
  },
  {
    i: 214, grup: 21, ad: "Yapı Ruhsatı Harç ve Giderleri", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "167 TL × toplam inşaat alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(2500000/v.BAZ_M2,0)*v.TIA",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(2500000 / v.BAZ_M2, 0) * v.TIA,
  },
  {
    i: 215, grup: 21, ad: "İskan (Yapı Kullanma İzni) Giderleri", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "80 TL × toplam inşaat alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(1200000/v.BAZ_M2,0)*v.TIA",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(1200000 / v.BAZ_M2, 0) * v.TIA,
  },
  {
    i: 216, grup: 21, ad: "Proje Hizmetleri (Mimari, Statik, Mekanik, Elektrik)", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "400 TL × toplam inşaat alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(6000000/v.BAZ_M2,0)*v.TIA",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(6000000 / v.BAZ_M2, 0) * v.TIA,
  },
  {
    i: 217, grup: 21, ad: "Test ve Laboratuvar Giderleri", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "40 TL × toplam inşaat alanı", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "RND(600000/v.BAZ_M2,0)*v.TIA",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => RND(600000 / v.BAZ_M2, 0) * v.TIA,
  },
  { i: 218, grup: 22, ad: "ÖNGÖRÜLEMEYEN GİDERLER", baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },
  {
    i: 219, grup: 22, ad: "Öngörülemeyen Giderler", baslik: false, birim: "götürü",
    aciklama: "1 (götürü)", fiyatAciklama: "%5 × diğer tüm kalemlerin toplamı (kullanıcı oranı değiştirebilir); uygulamada otomatik", opsiyonel: false,
    metrajKaynak: "1", piyasaKaynak: "15000000",
    metraj: (v, Q, SP) => 1,
    piyasa: (v, Q, SP) => 15000000,
  },
];

export interface InputDef {
  ad: keyof FormulaVars;
  etiket: string;
  deger: number | string | null;
  not: string;
  formulKaynak: string;
  formul: InputFormulaFn | null;
}

/** v4 "Girdiler" sayfası: sırası önemlidir, formüllü girdiler bu sırayla hesaplanır. */
export const INPUTS: readonly InputDef[] = [
  { ad: "ARSA", etiket: "Arsa m²", deger: 3500, not: "Kullanıcı girer", formulKaynak: "", formul: null },
  { ad: "TAKS", etiket: "TAKS", deger: 0.22, not: "Kullanıcı girer", formulKaynak: "", formul: null },
  { ad: "KAKS", etiket: "KAKS", deger: 2, not: "Kullanıcı girer", formulKaynak: "", formul: null },
  { ad: "K_INSAAT", etiket: "İnşaat alanı katsayısı", deger: 1.56, not: "Varsayılan 1,56; kullanıcı değiştirebilir", formulKaynak: "", formul: null },
  { ad: "BLOK_ADEDI", etiket: "Blok adedi", deger: 2, not: "Kullanıcı girer (en fazla 10)", formulKaynak: "", formul: null },
  { ad: "TOPLAM_OTURUM", etiket: "Toplam blok oturumu m²", deger: null, not: "Otomatik; blok oturumları toplamı bunu aşarsa uyarı", formulKaynak: "v.ARSA*v.TAKS", formul: (v, SP) => v.ARSA * v.TAKS },
  { ad: "CEVRE_ALAN", etiket: "Çevre düzenleme alanı m²", deger: null, not: "Otomatik", formulKaynak: "v.ARSA-v.TOPLAM_OTURUM", formul: (v, SP) => v.ARSA - v.TOPLAM_OTURUM },
  { ad: "TIA", etiket: "Toplam inşaat alanı m²", deger: null, not: "Otomatik; kullanıcı elle de girebilir", formulKaynak: "v.ARSA*v.KAKS*v.K_INSAAT", formul: (v, SP) => v.ARSA * v.KAKS * v.K_INSAAT },
  { ad: "TOPLAM_DAIRE", etiket: "Projedeki toplam daire adedi", deger: 90, not: "Otomatik: tüm blokların daire toplamı (örnekte A+B = 45+45)", formulKaynak: "", formul: null },
  { ad: "IL_KATSAYI", etiket: "İl katsayısı", deger: 1, not: "İl seçimine göre \"İl Katsayıları\" sayfasından gelir; yalnız piyasa fiyatlarına uygulanır", formulKaynak: "", formul: null },
  { ad: "SURE_AY", etiket: "İnşaat süresi (ay)", deger: 18, not: "Kullanıcı girer; varsayılan 18", formulKaynak: "", formul: null },
  { ad: "SATIS_OFISI", etiket: "Satış ofisi yapılacak mı (1=evet, 0=hayır)", deger: 1, not: "Seçmeli", formulKaynak: "", formul: null },
  { ad: "ORNEK_DAIRE", etiket: "Örnek daire yapılacak mı (1/0)", deger: 1, not: "Seçmeli", formulKaynak: "", formul: null },
  { ad: "JENERATOR", etiket: "Jeneratör (1/0)", deger: 1, not: "Seçmeli", formulKaynak: "", formul: null },
  { ad: "TRAFO", etiket: "Trafo (1/0)", deger: 1, not: "Seçmeli", formulKaynak: "", formul: null },
  { ad: "S_HAMAM", etiket: "Hamam (1/0)", deger: 0, not: "Sosyal tesis seçimi", formulKaynak: "", formul: null },
  { ad: "S_SAUNA", etiket: "Sauna (1/0)", deger: 0, not: "Sosyal tesis seçimi", formulKaynak: "", formul: null },
  { ad: "S_FIN", etiket: "Fin hamamı (1/0)", deger: 0, not: "Sosyal tesis seçimi", formulKaynak: "", formul: null },
  { ad: "S_FITNESS", etiket: "Fitness (1/0)", deger: 0, not: "Sosyal tesis seçimi", formulKaynak: "", formul: null },
  { ad: "S_HAVUZ", etiket: "Havuz (1/0)", deger: 0, not: "Sosyal tesis seçimi", formulKaynak: "", formul: null },
  { ad: "HAVUZ_M2", etiket: "Havuz su yüzeyi m²", deger: 100, not: "Havuz varsa kullanıcı girer; varsayılan 100", formulKaynak: "", formul: null },
  { ad: "TABAN", etiket: "Taban oturumu m²", deger: 405, not: "Kullanıcı girer", formulKaynak: "", formul: null },
  { ad: "BIA", etiket: "Blok inşaat alanı m²", deger: 5700, not: "Kullanıcı girer", formulKaynak: "", formul: null },
  { ad: "CEPHE_TIP", etiket: "Dış cephe kaplaması", deger: "EPS", not: "EPS / XPS / TAŞYÜNÜ / ÖZEL", formulKaynak: "", formul: null },
  { ad: "N_ASANSOR", etiket: "Asansör adedi", deger: 2, not: "Kullanıcı girer", formulKaynak: "", formul: null },
  { ad: "N_MERDIVEN", etiket: "Merdiven adedi", deger: 2, not: "Kullanıcı girer", formulKaynak: "", formul: null },
  { ad: "ISITMA", etiket: "Isıtma sistemi", deger: "KOMBİ", not: "KOMBİ / MERKEZİ", formulKaynak: "", formul: null },
  { ad: "ISITMA_SEKLI", etiket: "Isıtma şekli", deger: "RADYATÖR", not: "RADYATÖR / YERDEN ISITMA", formulKaynak: "", formul: null },
  { ad: "BANYO_TAVAN", etiket: "Banyo WC asma tavan", deger: "YEŞİL ALÇIPAN", not: "YEŞİL ALÇIPAN / ALÜMİNYUM PANEL (birim fiyatı etkiler)", formulKaynak: "", formul: null },
  { ad: "CATI_TIP", etiket: "Çatı tipi", deger: "KIRMA", not: "KIRMA (çelik+OSB+kiremit) / TERAS", formulKaynak: "", formul: null },
  { ad: "DOSEME", etiket: "Döşeme sistemi", deger: "ASMOLEN", not: "ASMOLEN / KİRİŞLİ", formulKaynak: "", formul: null },
  { ad: "SU_DEPOSU", etiket: "Su deposu", deger: "MODÜLER", not: "YOK / BETONARME / MODÜLER", formulKaynak: "", formul: null },
  { ad: "N_DILATASYON", etiket: "Dilatasyon adedi", deger: 0, not: "Blokta dilatasyon derzi sayısı; varsayılan 0", formulKaynak: "", formul: null },
  { ad: "MANTO_SIVA", etiket: "Mantolama altına sıva (1=evet, 0=hayır)", deger: 0, not: "Evet ise dış cephe sıvası net cephenin tamamı, hayır ise %10", formulKaynak: "", formul: null },
  { ad: "N_BOD", etiket: "Bodrum kat adedi", deger: 1, not: "", formulKaynak: "", formul: null },
  { ad: "H_BOD", etiket: "Bodrum kat yüksekliği m", deger: 3, not: "", formulKaynak: "", formul: null },
  { ad: "A_BOD", etiket: "Bodrum kat m²", deger: 405, not: "", formulKaynak: "", formul: null },
  { ad: "N_NOR", etiket: "Normal kat adedi", deger: 9, not: "", formulKaynak: "", formul: null },
  { ad: "H_NOR", etiket: "Normal kat yüksekliği m", deger: 3, not: "", formulKaynak: "", formul: null },
  { ad: "A_NOR", etiket: "Normal kat m²", deger: 430, not: "", formulKaynak: "", formul: null },
  { ad: "N_DUK", etiket: "Dükkan katı adedi", deger: 0, not: "", formulKaynak: "", formul: null },
  { ad: "H_DUK", etiket: "Dükkan katı yüksekliği m", deger: 0, not: "", formulKaynak: "", formul: null },
  { ad: "A_DUK", etiket: "Dükkan katı m²", deger: 0, not: "", formulKaynak: "", formul: null },
  { ad: "N_OTO", etiket: "Otopark katı adedi", deger: 1, not: "", formulKaynak: "", formul: null },
  { ad: "H_OTO", etiket: "Otopark katı yüksekliği m", deger: 4, not: "", formulKaynak: "", formul: null },
  { ad: "A_OTO", etiket: "Otopark katı m²", deger: 405, not: "", formulKaynak: "", formul: null },
  { ad: "KAT_YERALTI", etiket: "Yer altı kat adedi", deger: null, not: "VARSAYIM: bodrum ve otopark katları zemin altında", formulKaynak: "v.N_BOD+v.N_OTO", formul: (v, SP) => v.N_BOD + v.N_OTO },
  { ad: "H_YERALTI", etiket: "Yer altı yüksekliği m", deger: null, not: "", formulKaynak: "v.N_BOD*v.H_BOD+v.N_OTO*v.H_OTO", formul: (v, SP) => v.N_BOD * v.H_BOD + v.N_OTO * v.H_OTO },
  { ad: "H_USTU", etiket: "Zemin üstü yükseklik m", deger: null, not: "", formulKaynak: "v.N_NOR*v.H_NOR+v.N_DUK*v.H_DUK", formul: (v, SP) => v.N_NOR * v.H_NOR + v.N_DUK * v.H_DUK },
  { ad: "KAT_TOPLAM", etiket: "Toplam kat adedi", deger: null, not: "", formulKaynak: "v.N_BOD+v.N_NOR+v.N_DUK+v.N_OTO", formul: (v, SP) => v.N_BOD + v.N_NOR + v.N_DUK + v.N_OTO },
  { ad: "H_TEMEL", etiket: "Temel (radye) kalınlığı m", deger: null, not: "Kat sayısına göre tahmin", formulKaynak: "Math.max(0.5,v.K_TEMEL_A+v.K_TEMEL_B*v.KAT_TOPLAM)", formul: (v, SP) => Math.max(0.5, v.K_TEMEL_A + v.K_TEMEL_B * v.KAT_TOPLAM) },
  { ad: "CEVRE_T", etiket: "Taban çevre uzunluğu m", deger: null, not: "Alandan çevre tahmini", formulKaynak: "v.K_CEVRE*Math.sqrt(v.TABAN)", formul: (v, SP) => v.K_CEVRE * Math.sqrt(v.TABAN) },
  { ad: "CEVRE_N", etiket: "Normal kat çevre uzunluğu m", deger: null, not: "", formulKaynak: "v.K_CEVRE*Math.sqrt(v.A_NOR)", formul: (v, SP) => v.K_CEVRE * Math.sqrt(v.A_NOR) },
  { ad: "CEPHE_BRUT", etiket: "Brüt cephe alanı m²", deger: null, not: "Çevre × zemin üstü yükseklik", formulKaynak: "v.CEVRE_N*v.H_USTU", formul: (v, SP) => v.CEVRE_N * v.H_USTU },
  { ad: "PENCERE_ALAN", etiket: "Pencere alanı m²", deger: null, not: "", formulKaynak: "v.CEPHE_BRUT*v.K_PENCERE", formul: (v, SP) => v.CEPHE_BRUT * v.K_PENCERE },
  { ad: "CEPHE_NET", etiket: "Net (dolu) cephe alanı m²", deger: null, not: "", formulKaynak: "v.CEPHE_BRUT-v.PENCERE_ALAN", formul: (v, SP) => v.CEPHE_BRUT - v.PENCERE_ALAN },
  { ad: "ND", etiket: "Bloktaki daire adedi", deger: null, not: "", formulKaynak: "SP(t=>t.N)", formul: (v, SP) => SP((t) => t.N) },
  { ad: "DA", etiket: "Daire brüt alanları toplamı m²", deger: null, not: "", formulKaynak: "SP(t=>(t.N)*(t.A))", formul: (v, SP) => SP((t) => (t.N) * (t.A)) },
  { ad: "DA_NET", etiket: "Daire net alanları toplamı m²", deger: null, not: "", formulKaynak: "v.DA*v.K_NET", formul: (v, SP) => v.DA * v.K_NET },
  { ad: "ODA_TOPLAM", etiket: "Oda+salon toplamı", deger: null, not: "Her dairede oda sayısı + 1 salon", formulKaynak: "SP(t=>(t.N)*(t.ODA))+v.ND", formul: (v, SP) => SP((t) => (t.N) * (t.ODA)) + v.ND },
  { ad: "BANYO_TOPLAM", etiket: "Banyo toplamı (genel+ebeveyn)", deger: null, not: "", formulKaynak: "v.ND+SP(t=>(t.N)*(t.EBANYO))", formul: (v, SP) => v.ND + SP((t) => (t.N) * (t.EBANYO)) },
  { ad: "BALKON_TOPLAM", etiket: "Balkon toplamı", deger: null, not: "", formulKaynak: "SP(t=>(t.N)*(t.BALKON))", formul: (v, SP) => SP((t) => (t.N) * (t.BALKON)) },
  { ad: "KLIMA_TOPLAM", etiket: "Klima toplamı", deger: null, not: "", formulKaynak: "SP(t=>(t.N)*(t.KLIMA))", formul: (v, SP) => SP((t) => (t.N) * (t.KLIMA)) },
  { ad: "PENCERE_ADET", etiket: "Pencere adedi", deger: null, not: "Her oda/salon + ayrı mutfak", formulKaynak: "v.ODA_TOPLAM+SP(t=>(t.N)*(t.AYRI))", formul: (v, SP) => v.ODA_TOPLAM + SP((t) => (t.N) * (t.AYRI)) },
  { ad: "ISLAK_ZEMIN", etiket: "Islak hacim zemin alanı m²", deger: null, not: "", formulKaynak: "v.ND*v.K_BANYO_M2+SP(t=>(t.N)*(t.EBANYO))*v.K_EBANYO_M2+SP(t=>(t.N)*(t.ALATURKA))*v.K_WC_M2", formul: (v, SP) => v.ND * v.K_BANYO_M2 + SP((t) => (t.N) * (t.EBANYO)) * v.K_EBANYO_M2 + SP((t) => (t.N) * (t.ALATURKA)) * v.K_WC_M2 },
  { ad: "MUTFAK_ZEMIN", etiket: "Ayrı mutfak zemin alanı m²", deger: null, not: "Amerikan mutfakta zemin parke kabul edildi", formulKaynak: "SP(t=>(t.N)*(t.AYRI))*v.K_MUTFAK_M2", formul: (v, SP) => SP((t) => (t.N) * (t.AYRI)) * v.K_MUTFAK_M2 },
  { ad: "BALKON_ALAN", etiket: "Balkon zemin alanı m²", deger: null, not: "", formulKaynak: "v.BALKON_TOPLAM*v.K_BALKON_M2", formul: (v, SP) => v.BALKON_TOPLAM * v.K_BALKON_M2 },
  { ad: "SERAMIK_ZEMIN", etiket: "Seramik zemin m²", deger: null, not: "Islak hacim + ayrı mutfak + balkon + daire holü", formulKaynak: "v.ISLAK_ZEMIN+v.MUTFAK_ZEMIN+v.BALKON_ALAN+v.ND*v.K_DAIRE_HOL", formul: (v, SP) => v.ISLAK_ZEMIN + v.MUTFAK_ZEMIN + v.BALKON_ALAN + v.ND * v.K_DAIRE_HOL },
  { ad: "SERAMIK_DUVAR", etiket: "Seramik duvar m²", deger: null, not: "", formulKaynak: "v.BANYO_TOPLAM*v.K_BANYO_DUVAR+SP(t=>(t.N)*(t.ALATURKA))*v.K_WC_DUVAR+v.ND*v.K_TEZGAH_ARASI", formul: (v, SP) => v.BANYO_TOPLAM * v.K_BANYO_DUVAR + SP((t) => (t.N) * (t.ALATURKA)) * v.K_WC_DUVAR + v.ND * v.K_TEZGAH_ARASI },
  { ad: "HOL_ALAN", etiket: "Kat holü alanı m²", deger: null, not: "Normal kat alanı - daireler; en az %12", formulKaynak: "Math.max(v.N_NOR*v.A_NOR-v.DA,v.K_HOL*v.N_NOR*v.A_NOR)", formul: (v, SP) => Math.max(v.N_NOR * v.A_NOR - v.DA, v.K_HOL * v.N_NOR * v.A_NOR) },
  { ad: "DUVAR_IC", etiket: "İç duvar alanı m²", deger: null, not: "", formulKaynak: "v.N_NOR*v.A_NOR*v.K_ICDUVAR+(v.N_BOD*v.A_BOD+v.N_DUK*v.A_DUK)*v.K_ICDUVAR_BODRUM", formul: (v, SP) => v.N_NOR * v.A_NOR * v.K_ICDUVAR + (v.N_BOD * v.A_BOD + v.N_DUK * v.A_DUK) * v.K_ICDUVAR_BODRUM },
  { ad: "DUVAR_DIS", etiket: "Dış duvar alanı m²", deger: null, not: "Dolu cepheden kolon-kiriş-perde payı düşülür", formulKaynak: "v.CEPHE_NET*(1-v.K_BA_CEPHE)", formul: (v, SP) => v.CEPHE_NET * (1 - v.K_BA_CEPHE) },
  { ad: "DUVAR_YUZEY", etiket: "Daire içi duvar yüzeyi m²", deger: null, not: "Sıva-boya yapılacak yüzey (seramik hariç)", formulKaynak: "v.DA_NET*v.K_DUVAR_YUZEY*v.H_NOR/3-v.SERAMIK_DUVAR", formul: (v, SP) => v.DA_NET * v.K_DUVAR_YUZEY * v.H_NOR / 3 - v.SERAMIK_DUVAR },
  { ad: "ORTAK_DUVAR", etiket: "Ortak alan duvar yüzeyi m²", deger: null, not: "Kat holleri + merdiven kovaları", formulKaynak: "v.HOL_ALAN*v.K_HOL_DUVAR+v.N_MERDIVEN*v.KAT_TOPLAM*v.K_MERD_DUVAR", formul: (v, SP) => v.HOL_ALAN * v.K_HOL_DUVAR + v.N_MERDIVEN * v.KAT_TOPLAM * v.K_MERD_DUVAR },
  { ad: "ASMA_TAVAN", etiket: "Alçıpan asma tavan alanı m²", deger: null, not: "Daire antre/koridor + kat holleri", formulKaynak: "v.ND*v.K_ASMA_TAVAN+v.HOL_ALAN", formul: (v, SP) => v.ND * v.K_ASMA_TAVAN + v.HOL_ALAN },
  { ad: "TAVAN_SIVA", etiket: "Sıvalı tavan alanı m²", deger: null, not: "", formulKaynak: "v.DA_NET-v.ISLAK_ZEMIN-v.ND*v.K_ASMA_TAVAN-v.BALKON_ALAN", formul: (v, SP) => v.DA_NET - v.ISLAK_ZEMIN - v.ND * v.K_ASMA_TAVAN - v.BALKON_ALAN },
  { ad: "PAY", etiket: "Bloğun proje payı", deger: null, not: "Proje geneli kalemler bloklara inşaat alanı oranında paylaştırılır", formulKaynak: "v.BIA/v.TIA", formul: (v, SP) => v.BIA / v.TIA },
];

export interface CoefficientDef {
  ad: keyof FormulaVars;
  etiket: string;
  deger: number;
  not: string;
}

export const COEFFICIENTS: readonly CoefficientDef[] = [
  { ad: "K_CEVRE", etiket: "Çevre katsayısı", deger: 4.5, not: "Çevre = 4,5 × √alan. Kare planda 4,0; 1:2 dikdörtgende 4,24; girinti-çıkıntı payıyla 4,5" },
  { ad: "K_PENCERE", etiket: "Pencere oranı", deger: 0.22, not: "Pencere alanı / brüt cephe alanı" },
  { ad: "K_BA_CEPHE", etiket: "Cephede betonarme oranı", deger: 0.25, not: "Dolu cephede kolon-kiriş-perde payı (tuğla örülmeyen kısım)" },
  { ad: "K_NET", etiket: "Net/brüt daire oranı", deger: 0.85, not: "Daire net alanı / brüt alanı" },
  { ad: "K_HOL", etiket: "Kat holü asgari oranı", deger: 0.12, not: "Kat holü + merdiven + asansör önü / normal kat alanı" },
  { ad: "K_KAZI", etiket: "Kazı genişleme katsayısı", deger: 1.25, not: "Kazı taban alanı / taban oturumu (çalışma boşluğu + şev)" },
  { ad: "K_KAZI_EK", etiket: "Kazı ek derinliği m", deger: 0.4, not: "Grobeton + temel altı dolgu için" },
  { ad: "K_GERIDOLGU", etiket: "Geri dolgu genişliği m", deger: 1.5, not: "Perde çevresinde doldurulan bant genişliği" },
  { ad: "K_DOLGU_H", etiket: "Temel altı dolgu kalınlığı m", deger: 0.3, not: "" },
  { ad: "K_TEMEL_TASMA", etiket: "Temel taşma katsayısı", deger: 1.1, not: "Radye alanı / taban oturumu" },
  { ad: "K_TEMEL_A", etiket: "Temel kalınlığı sabiti m", deger: 0.3, not: "Radye kalınlığı = 0,30 + 0,05 × toplam kat (en az 0,50)" },
  { ad: "K_TEMEL_B", etiket: "Temel kalınlığı kat çarpanı m", deger: 0.05, not: "" },
  { ad: "K_GRO_H", etiket: "Grobeton kalınlığı m", deger: 0.1, not: "" },
  { ad: "K_BACA", etiket: "Bina bacası aralığı m", deger: 25, not: "Bina çevresinde her 25 m için 1 baca + 2" },
  { ad: "K_KANAL", etiket: "Ø200 kanal katsayısı", deger: 0.75, not: "Kanal uzunluğu / taban çevresi" },
  { ad: "K_BETON_ASM", etiket: "Beton - asmolen döşeme m³/m²", deger: 0.36, not: "Kat betonu (kolon+perde+kiriş+döşeme) / blok inşaat alanı; temel ve bodrum perdesi ayrı" },
  { ad: "K_BETON_KIR", etiket: "Beton - kirişli döşeme m³/m²", deger: 0.32, not: "Aynı tanım, kirişli plak sistem" },
  { ad: "K_PERDE", etiket: "Bodrum perde kalınlığı m", deger: 0.3, not: "Çevre perdesi" },
  { ad: "K_DONATI", etiket: "Donatı t/m²", deger: 0.04, not: "Ton donatı / m² blok inşaat alanı (senin düzeltmen)" },
  { ad: "K_KALIP", etiket: "Kat betonarme işçiliği alan katsayısı", deger: 1.2, not: "Düz ölçü metrajı / blok inşaat alanı (senin düzeltmen)" },
  { ad: "K_ASMOLEN", etiket: "Asmolen m³/m²", deger: 0.11, not: "Asmolen blok hacmi / blok inşaat alanı" },
  { ad: "K_CATI", etiket: "Çatı eğim+saçak katsayısı", deger: 1.2, not: "Çatı yüzeyi / normal kat alanı" },
  { ad: "K_CATI_CELIK", etiket: "Çatı çeliği kg/m²", deger: 12, not: "Kg çelik / normal kat alanı" },
  { ad: "K_DERE", etiket: "Gizli dere genişliği m", deger: 0.8, not: "Kırma çatıda CTP uygulanan dere bandı" },
  { ad: "K_EGIM_H", etiket: "Eğim+koruma betonu kalınlığı m", deger: 0.12, not: "Teras çatıda ortalama" },
  { ad: "K_ICDUVAR", etiket: "İç duvar m²/m²", deger: 0.9, not: "İç bölme duvar alanı / normal kat alanı" },
  { ad: "K_ICDUVAR_BODRUM", etiket: "Bodrum-dükkan iç duvar m²/m²", deger: 0.3, not: "" },
  { ad: "K_TUGLA", etiket: "Tuğla adet/m²", deger: 27, not: "19×19 yatay delikli tuğla, %5 zayiat dahil" },
  { ad: "K_KUM_10", etiket: "Kum - 10 cm duvar m³/m²", deger: 0.025, not: "Örgü harcı kumu" },
  { ad: "K_KUM_135", etiket: "Kum - 13,5 cm duvar m³/m²", deger: 0.032, not: "" },
  { ad: "K_CIMENTO", etiket: "Çimento t/m³ kum", deger: 0.27, not: "Ton çimento / m³ kum (300 dozlu harç)" },
  { ad: "K_LENTO", etiket: "Lento m³/boşluk", deger: 0.03, not: "Kapı ve pencere başına" },
  { ad: "K_BANYO_M2", etiket: "Genel banyo zemin m²", deger: 4.5, not: "" },
  { ad: "K_EBANYO_M2", etiket: "Ebeveyn banyo zemin m²", deger: 3.5, not: "" },
  { ad: "K_WC_M2", etiket: "Alaturka WC zemin m²", deger: 1.5, not: "" },
  { ad: "K_MUTFAK_M2", etiket: "Ayrı mutfak zemin m²", deger: 10, not: "" },
  { ad: "K_BALKON_M2", etiket: "Balkon zemin m²", deger: 5, not: "Balkon başına" },
  { ad: "K_DAIRE_HOL", etiket: "Daire holü (antre) seramik zemin m²", deger: 6, not: "Daire başına; parkeden düşülür, seramiğe eklenir (senin düzeltmen; m² değeri önerimdir)" },
  { ad: "K_BANYO_DUVAR", etiket: "Banyo duvar seramiği m²", deger: 22, not: "Banyo başına" },
  { ad: "K_WC_DUVAR", etiket: "Alaturka WC duvar seramiği m²", deger: 12, not: "" },
  { ad: "K_TEZGAH_ARASI", etiket: "Tezgah arası seramik m²", deger: 3, not: "Daire başına" },
  { ad: "K_SERAMIK_ZAYIAT", etiket: "Seramik zayiat", deger: 1.07, not: "" },
  { ad: "K_DUVAR_YUZEY", etiket: "Duvar yüzeyi katsayısı", deger: 2.6, not: "m² duvar yüzeyi / m² net daire alanı (3,00 m kat yüksekliğinde)" },
  { ad: "K_HOL_DUVAR", etiket: "Kat holü duvar katsayısı", deger: 2.2, not: "m² duvar / m² hol" },
  { ad: "K_MERD_DUVAR", etiket: "Merdiven kovası duvar m²/kat", deger: 30, not: "Merdiven başına, kat başına" },
  { ad: "K_ASMA_TAVAN", etiket: "Daire içi asma tavan m²", deger: 6, not: "Antre-koridor, daire başına" },
  { ad: "K_ZPROFIL", etiket: "Z profil m/daire", deger: 10, not: "" },
  { ad: "K_YALITIM", etiket: "Su yalıtımı duvar dönüş katsayısı", deger: 1.3, not: "Islak zeminde duvara dönüş payı" },
  { ad: "K_PERDELIK", etiket: "Perdelik m/oda", deger: 3, not: "Oda ve salon başına" },
  { ad: "K_ACINIM", etiket: "Perdelik/ışıklık açınım m", deger: 0.5, not: "Saten+boya için m → m² çevirimi" },
  { ad: "K_ISIKLIK", etiket: "Gizli ışıklık m/daire", deger: 14, not: "Işık bandı olan dairede salon çevresi" },
  { ad: "K_SAFT", etiket: "Şaft kara sıva m²/daire", deger: 1, not: "(senin düzeltmen)" },
  { ad: "K_MERD_MERMER", etiket: "Merdiven mermeri m²/kat", deger: 14, not: "Basamak+rıht+sahanlık, merdiven başına kat başına" },
  { ad: "K_DENIZLIK", etiket: "Denizlik m²/pencere", deger: 0.42, not: "1,40 m × 0,30 m" },
  { ad: "K_ASANSOR_SOVE", etiket: "Asansör kapı sövesi m²/durak", deger: 1.2, not: "" },
  { ad: "K_KORKULUK", etiket: "Merdiven korkuluk m/kat", deger: 7, not: "Merdiven başına kat başına" },
  { ad: "K_BALKON_KORK", etiket: "Balkon cam korkuluk m", deger: 4.5, not: "Balkon başına" },
  { ad: "K_CEVRE_DUVAR_H", etiket: "Çevre duvarı yüksekliği m", deger: 1.5, not: "Arsa çevre duvarı; iki yüzü sıva-boya" },
  { ad: "K_SOVE", etiket: "Söve m/pencere", deger: 4.8, not: "Pencere çevresi" },
  { ad: "K_SIVA_ORAN", etiket: "Mantolama dışı sıva oranı", deger: 0.1, not: "Mantolama yapılan binada sıvalı kalan yüzey (balkon içi, parapet)" },
  { ad: "K_TEKNIK_KAPI", etiket: "Teknik hacim kapısı adet/yer altı kat", deger: 4, not: "+2 sabit" },
  { ad: "K_MUSLUK", etiket: "Ara musluk adet/daire", deger: 6, not: "+4 her ebeveyn banyo için" },
  { ad: "K_ANK_BUZDOLABI", etiket: "Ankastre sette buzdolabı (1/0)", deger: 0, not: "ONAY: Ankastre \"VAR\" seçilince buzdolabı dahil mi?" },
  { ad: "K_ANK_BULASIK", etiket: "Ankastre sette bulaşık makinesi (1/0)", deger: 0, not: "Ankastre \"VAR\" seçilince bulaşık makinesi dahil mi? (senin düzeltmen: HAYIR)" },
  { ad: "K_YUKSEK_BINA", etiket: "Yüksek bina sınırı m", deger: 30.5, not: "ONAY: Daire içi yangın tesisatı yalnız bu yüksekliğin üstünde hesaplanır" },
  { ad: "K_YERDEN", etiket: "Yerden ısıtma fiyat çarpanı", deger: 1.5, not: "Isıtma tesisatı birim fiyatına uygulanır" },
  { ad: "K_XPS", etiket: "XPS fiyat çarpanı", deger: 1.1, not: "Mantolama birim fiyatına" },
  { ad: "K_TASYUNU", etiket: "Taşyünü fiyat çarpanı", deger: 1.3, not: "Mantolama birim fiyatına" },
  { ad: "K_ALU_TAVAN", etiket: "Alüminyum panel tavan fiyat çarpanı", deger: 1.25, not: "Islak zemin asma tavan birim fiyatına" },
  { ad: "K_PERSONEL", etiket: "Dolaylı personel: m²/kişi", deger: 1500, not: "Personel sayısı = toplam inşaat alanı / 1.500 (en az 4)" },
  { ad: "K_SGK", etiket: "Personel işveren yükü TL/ay", deger: 35000, not: "Kişi başı SGK+vergi (fiyat listesindeki varsayım)" },
  { ad: "K_MAAS", etiket: "Personel ortalama maaş TL/ay", deger: 70000, not: "Kişi başı (fiyat listesindeki varsayım)" },
  { ad: "K_KABA", etiket: "Kaba inşaat süre oranı", deger: 0.55, not: "Kule vinç kira süresi / inşaat süresi" },
  { ad: "K_JCB", etiket: "JCB saat/ay", deger: 40, not: "" },
  { ad: "K_MOBIL", etiket: "Mobil vinç gün/ay", deger: 2, not: "" },
  { ad: "K_TESLIM", etiket: "Teslim-bakım süresi ay", deger: 6, not: "" },
  { ad: "K_ALLRISK", etiket: "All risk sigorta oranı", deger: 0.0025, not: "Yapım maliyeti üzerinden" },
  { ad: "K_ONGORULEMEYEN", etiket: "Öngörülemeyen oranı", deger: 0.02, not: "Diğer tüm kalemlerin toplamı üzerinden; kullanıcı değiştirebilir" },
  { ad: "BAZ_M2", etiket: "Fiyat listesinin baz inşaat alanı m²", deger: 15000, not: "Götürü fiyatlar bu büyüklüğe göre verilmişti; m² başına çevirmek için" },
  { ad: "BAZ_DAIRE", etiket: "Fiyat listesinin baz daire adedi", deger: 100, not: "" },
  { ad: "BAZ_CEVRE", etiket: "Baz çevre düzenleme alanı m²", deger: 3750, not: "VARSAYIM: 15.000 m² inşaat ≈ 4.800 m² arsa, TAKS 0,22 → 3.750 m² açık alan" },
];

/** İl katsayıları (İstanbul = 1). Yalnız piyasa fiyatlarına uygulanır. */
export const PROVINCES: readonly { ad: string; k: number }[] = [
  { ad: "Adana", k: 0.9 },
  { ad: "Adıyaman", k: 0.85 },
  { ad: "Afyonkarahisar", k: 0.85 },
  { ad: "Ağrı", k: 0.88 },
  { ad: "Aksaray", k: 0.85 },
  { ad: "Amasya", k: 0.85 },
  { ad: "Ankara", k: 0.95 },
  { ad: "Antalya", k: 0.95 },
  { ad: "Ardahan", k: 0.88 },
  { ad: "Artvin", k: 0.88 },
  { ad: "Aydın", k: 0.9 },
  { ad: "Balıkesir", k: 0.9 },
  { ad: "Bartın", k: 0.85 },
  { ad: "Batman", k: 0.85 },
  { ad: "Bayburt", k: 0.88 },
  { ad: "Bilecik", k: 0.85 },
  { ad: "Bingöl", k: 0.88 },
  { ad: "Bitlis", k: 0.88 },
  { ad: "Bolu", k: 0.85 },
  { ad: "Burdur", k: 0.85 },
  { ad: "Bursa", k: 0.95 },
  { ad: "Çanakkale", k: 0.9 },
  { ad: "Çankırı", k: 0.85 },
  { ad: "Çorum", k: 0.85 },
  { ad: "Denizli", k: 0.9 },
  { ad: "Diyarbakır", k: 0.9 },
  { ad: "Düzce", k: 0.85 },
  { ad: "Edirne", k: 0.85 },
  { ad: "Elazığ", k: 0.85 },
  { ad: "Erzincan", k: 0.85 },
  { ad: "Erzurum", k: 0.85 },
  { ad: "Eskişehir", k: 0.9 },
  { ad: "Gaziantep", k: 0.9 },
  { ad: "Giresun", k: 0.85 },
  { ad: "Gümüşhane", k: 0.88 },
  { ad: "Hakkari", k: 0.88 },
  { ad: "Hatay", k: 0.9 },
  { ad: "Iğdır", k: 0.88 },
  { ad: "Isparta", k: 0.85 },
  { ad: "İstanbul", k: 1 },
  { ad: "İzmir", k: 0.95 },
  { ad: "Kahramanmaraş", k: 0.9 },
  { ad: "Karabük", k: 0.85 },
  { ad: "Karaman", k: 0.85 },
  { ad: "Kars", k: 0.88 },
  { ad: "Kastamonu", k: 0.85 },
  { ad: "Kayseri", k: 0.9 },
  { ad: "Kırıkkale", k: 0.85 },
  { ad: "Kırklareli", k: 0.85 },
  { ad: "Kırşehir", k: 0.85 },
  { ad: "Kilis", k: 0.85 },
  { ad: "Kocaeli", k: 0.95 },
  { ad: "Konya", k: 0.9 },
  { ad: "Kütahya", k: 0.85 },
  { ad: "Malatya", k: 0.9 },
  { ad: "Manisa", k: 0.9 },
  { ad: "Mardin", k: 0.85 },
  { ad: "Mersin", k: 0.9 },
  { ad: "Muğla", k: 0.95 },
  { ad: "Muş", k: 0.88 },
  { ad: "Nevşehir", k: 0.85 },
  { ad: "Niğde", k: 0.85 },
  { ad: "Ordu", k: 0.85 },
  { ad: "Osmaniye", k: 0.85 },
  { ad: "Rize", k: 0.85 },
  { ad: "Sakarya", k: 0.9 },
  { ad: "Samsun", k: 0.9 },
  { ad: "Siirt", k: 0.88 },
  { ad: "Sinop", k: 0.85 },
  { ad: "Sivas", k: 0.85 },
  { ad: "Şanlıurfa", k: 0.9 },
  { ad: "Şırnak", k: 0.88 },
  { ad: "Tekirdağ", k: 0.9 },
  { ad: "Tokat", k: 0.85 },
  { ad: "Trabzon", k: 0.9 },
  { ad: "Tunceli", k: 0.88 },
  { ad: "Uşak", k: 0.85 },
  { ad: "Van", k: 0.88 },
  { ad: "Yalova", k: 0.9 },
  { ad: "Yozgat", k: 0.85 },
  { ad: "Zonguldak", k: 0.85 },
];
