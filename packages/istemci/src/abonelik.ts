/** Paketler, ödemeler, analiz hakları ve hesap işlemleri. Kurallar sunucuda; burada yalnız çağrılar var. */
import { useQuery } from '@tanstack/react-query';
import { ayar, db, fonksiyonHatasi } from './baglanti';

async function rpc<T>(ad: string, arg: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db().rpc(ad, arg);
  if (error) throw error;
  return data as T;
}

export interface Paket {
  id: string;
  ad: string;
  aciklama: string;
  sure_gun: number;
  analiz_hakki: number;
  fiyat: number;
  tur: 'abonelik' | 'ek_analiz';
  aktif: boolean;
  sira: number;
}
export interface Hak {
  kalan: number;
  abonelik: { paket: string; bitis: string } | null;
  bekleyen_odeme: number;
}
export type OdemeDurumu = 'bekliyor' | 'onaylandi' | 'reddedildi' | 'iptal' | 'iade_bekliyor' | 'iade_edildi';
export interface Odeme {
  id: number;
  paket_id: string;
  adet: number;
  tutar: number;
  yontem: 'kart' | 'havale' | 'iap' | 'yonetici';
  durum: OdemeDurumu;
  referans: string;
  olusturma: string;
  karar_tarihi: string | null;
  red_nedeni: string | null;
}
export interface Fatura {
  ad: string;
  no: string;
  vergiDairesi: string;
  adres: string;
  il: string;
}

export const ODEME_DURUMU: Record<OdemeDurumu, string> = {
  bekliyor: 'Onay bekliyor',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
  iptal: 'İptal',
  iade_bekliyor: 'Cayma talebi inceleniyor',
  iade_edildi: 'İade edildi',
};

export async function paketler(): Promise<Paket[]> {
  const { data, error } = await db().from('paketler').select('*').order('sira');
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, fiyat: Number(p.fiyat) })) as Paket[];
}
export const hak = () => rpc<Hak>('analiz_hakki');
export function useHak(enabled = true) {
  return useQuery({ queryKey: ['hak'], queryFn: hak, enabled });
}
export async function odemelerim(): Promise<Odeme[]> {
  const { data, error } = await db().from('odemeler').select('*').order('olusturma', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o) => ({ ...o, tutar: Number(o.tutar) })) as Odeme[];
}

export const havaleBildir = (paket: string, adet: number, fatura: Fatura) =>
  rpc<{ id: number; referans: string; tutar: number }>('odeme_olustur', {
    p_paket: paket,
    p_adet: adet,
    p_fatura: fatura,
    p_yontem: 'havale',
  });

/** Kartla ödeme: sunucu fonksiyonu iyzico ödeme sayfasını başlatır; kullanıcı oraya yönlendirilir. */
export async function kartlaOde(paket: string, adet: number, fatura: Fatura, donus: string): Promise<string> {
  const { data, error } = await db().functions.invoke('odeme-baslat', {
    body: { paket, adet, fatura, donus },
  });
  if (error) {
    // Sunucunun Türkçe mesajı
    const ctx = (error as { context?: Response }).context;
    const govde = ctx ? await ctx.json().catch(() => null) : null;
    throw new Error(govde?.message ?? 'Ödeme başlatılamadı. Lütfen tekrar dene.');
  }
  return (data as { odemeSayfasi: string }).odemeSayfasi;
}

export const odemeIptal = (id: number) => rpc<void>('odeme_iptal', { p_id: id });
export const caymaTalebi = (id: number) => rpc<void>('cayma_talebi', { p_odeme: id });

/** DXF analizi: hak sunucuda düşer (deneme yalnız örnek çizimin parmak izleriyle ücretsiz). */
export const analizBaslat = (
  ad: string,
  dosyalar: { ad: string; boyut: number }[],
  deneme: boolean,
  ozetler: string[],
) => rpc<number>('analiz_baslat', { p_ad: ad, p_dosyalar: dosyalar, p_deneme: deneme, p_ozetler: ozetler });
export const analizIade = (id: number) => rpc<void>('analiz_iade', { p_id: id });
export const analizProjeyeBagla = (id: number, proje: string, ozet: unknown) =>
  rpc<void>('analiz_projeye_bagla', { p_id: id, p_proje: proje, p_ozet: ozet });

/* ---------- Hesap ---------- */
export const verilerim = () => rpc<unknown>('verilerim');
export const hesapSilmeTalep = () => rpc<void>('hesap_silme_talep_et');
export const hesapSilmeIptal = () => rpc<void>('hesap_silme_iptal');
export const hesapKilitli = () => rpc<boolean>('hesap_kilitli');

/* ---------- Yönetici ---------- */
export interface YoneticiOdeme {
  id: number;
  email: string | null;
  paket: string;
  adet: number;
  tutar: number;
  yontem: string;
  durum: OdemeDurumu;
  referans: string;
  fatura: Partial<Fatura> & { anonim?: boolean };
  olusturma: string;
  karar_tarihi: string | null;
  red_nedeni: string | null;
}
export const odemeListesi = (durum: OdemeDurumu | null) =>
  rpc<YoneticiOdeme[]>('odeme_listesi', { p_durum: durum });
export const odemeOnayla = (id: number) => rpc<void>('odeme_onayla', { p_id: id });
export const odemeReddet = (id: number, neden: string) =>
  rpc<void>('odeme_reddet', { p_id: id, p_neden: neden });
export const caymaKarar = (id: number, onay: boolean, not: string) =>
  rpc<void>('cayma_karar', { p_odeme: id, p_onay: onay, p_not: not });
export const paketGuncelle = (id: string, fiyat: number, aktif: boolean) =>
  rpc<void>('paket_guncelle', { p_id: id, p_fiyat: fiyat, p_aktif: aktif });
export const hakTanimla = (email: string, miktar: number, gun: number, aciklama: string) =>
  rpc<void>('hak_tanimla', { p_email: email, p_miktar: miktar, p_gun: gun, p_aciklama: aciklama });
export interface SilmeTalebi {
  id: number;
  kullanici: string;
  eposta: string | null;
  durum: string;
  talep_tarihi: string;
}
export const hesapSilmeListesi = () => rpc<SilmeTalebi[]>('hesap_silme_listesi');
export async function hesapSilOnayla(talep: number): Promise<void> {
  const { error } = await db().functions.invoke('hesap-sil', { body: { talep } });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const govde = ctx ? await ctx.json().catch(() => null) : null;
    throw new Error(govde?.message ?? 'Hesap silinemedi. Lütfen tekrar dene.');
  }
}

/** SHA-256 (onaltılık): ücretsiz deneme çiziminin parmak izi. */
export const sha256 = (metin: string): Promise<string> => ayar().platform.sha256(metin);

export const tarihGunSaat = (t: string | null | undefined) =>
  t ? new Date(t).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const YONTEM_ADI: Record<string, string> = {
  kart: 'Kart',
  havale: 'Havale/EFT',
  iap: 'Mağaza (App Store / Google Play)',
  yonetici: 'Yönetici',
};

/* ---------- Mobil: uygulama içi satın alma ---------- */
export interface MagazaIslemi {
  platform: 'ios' | 'android';
  /** Mağaza ürün kimliği = paket kimliği. */
  urun: string;
  /** iOS: transactionId */
  islem?: string;
  /** Android: purchaseToken */
  jeton?: string;
}

/** Satın almayı sunucuda mağazadan doğrular ve hakkı tanımlatır. Aynı işlem tekrar gönderilirse yeniden hak vermez. */
export async function magazaDogrula(m: MagazaIslemi): Promise<{ yeni: boolean }> {
  const { data, error } = await db().functions.invoke('magaza-dogrula', { body: m });
  if (error) throw await fonksiyonHatasi(error, 'Satın alma doğrulanamadı. Lütfen tekrar dene.');
  return data as { yeni: boolean };
}

/** YALNIZ YEREL/TEST: sahte mağazada satın alma oluşturur (gerçek mağaza bağlı değilken). */
export async function sahteMagazaSatinAl(platform: 'ios' | 'android', urun: string): Promise<MagazaIslemi> {
  const { data, error } = await db().functions.invoke('test-magaza/sahte/satin-al', {
    body: { platform, urun },
  });
  if (error) throw await fonksiyonHatasi(error, 'Sahte mağaza kullanılamıyor.');
  const d = data as { islem?: string; jeton?: string };
  return { platform, urun, ...d };
}
