/**
 * Kullanıcı girdisi (proje) modeli. Alan adları prototiple aynıdır: prototipte kaydedilmiş projeler ve
 * veritabanındaki `projeler.girdi` JSON'u değiştirilmeden okunabilsin.
 * Form alanları boş bırakılabildiği için değerler metin, sayı ya da boş olabilir; motor eksikleri tamamlar.
 */

/** Formdan gelen ham değer: sayı, metin ('' = boş), evet/hayır ya da hiç. */
export type RawValue = string | number | boolean | null | undefined;

export type FloorKind = 'bodrum' | 'otopark' | 'dukkan' | 'normal' | 'dubleks';

export interface ApartmentTypeInput {
  id: string;
  ad?: RawValue;
  /** Oda düzeni, ör. "3+1". */
  duzen?: RawValue;
  brut?: RawValue;
  dubleks?: RawValue;
  balkon?: RawValue;
  /** 'AMERİKAN' ise açık mutfak; diğer her değer ayrı mutfak. */
  mutfak?: RawValue;
  isikBandi?: RawValue;
  alaturka?: RawValue;
  ebeveynBanyo?: RawValue;
  ankastre?: RawValue;
  klima?: RawValue;
}

export interface FloorApartmentInput {
  tip: string;
  adet: RawValue;
}

export interface FloorInput {
  tur: FloorKind | string;
  tekrar?: RawValue;
  yukseklik?: RawValue;
  /** 'EVET' | 'YARI' | 'HAYIR' */
  gomulu?: RawValue;
  m2?: RawValue;
  daireler?: FloorApartmentInput[];
  /** İç kullanım: bilinen kat alanı (çizimden ya da hesaptan). */
  _m2?: RawValue;
}

export interface BlockSystemInput {
  cephe?: RawValue;
  mantoAltiSiva?: RawValue;
  asansor?: RawValue;
  merdiven?: RawValue;
  isitma?: RawValue;
  isitmaSekli?: RawValue;
  banyoTavan?: RawValue;
  cati?: RawValue;
  doseme?: RawValue;
  suDeposu?: RawValue;
  dilatasyon?: RawValue;
}

/** Elle düzeltme: metraj ve/veya birim fiyat. */
export interface Correction {
  metraj?: number | string | null;
  piyasa?: number | string | null;
}
export type Corrections = Record<string, Correction>;

/** Çizimden ya da kullanıcıdan gelen ek kalem. */
export interface ExtraItem {
  grup: number;
  ad: string;
  birim?: string;
  metraj?: number | string;
  fiyat?: number | string;
  kaynak?: string;
  aciklama?: string;
}

export interface BlockInput {
  ad?: RawValue;
  katlar?: FloorInput[];
  sistem?: BlockSystemInput;
  /** Ölçülmüş değerler (DXF) ya da doğrulama için motor değişkenlerinin üzerine yazılır. */
  _ovr?: Record<string, number | string>;
}

export interface ProjectInput {
  ad?: RawValue;
  il?: RawValue;
  arsa?: RawValue;
  blokAdedi?: RawValue;
  toplamOturum?: RawValue;
  toplamInsaatAlani?: RawValue;
  tipler?: ApartmentTypeInput[];
  bloklar?: BlockInput[];
  sureAy?: RawValue;
  satisOfisi?: RawValue;
  ornekDaire?: RawValue;
  jenerator?: RawValue;
  trafo?: RawValue;
  hamam?: RawValue;
  sauna?: RawValue;
  finHamami?: RawValue;
  fitness?: RawValue;
  havuz?: RawValue;
  havuzM2?: RawValue;
  kdvOrani?: RawValue;
  ongorulemeyenOrani?: RawValue;
  /** Anahtar: 'blok0', 'blok1', … ve 'proje'. */
  duzeltmeler?: Record<string, Corrections>;
  ekKalemler?: Record<string, ExtraItem[]>;
  _ovr?: Record<string, number | string>;
}

export interface CalculateOptions {
  /** Katsayıların üzerine yazılacak değerler (ör. yönetici ayarı). */
  katsayilar?: Record<string, number>;
  /** Aktif fiyat listesi: {"K001": 320, …}. İl katsayısı ayrıca uygulanır. */
  fiyatlar?: Record<string, number> | null;
}
