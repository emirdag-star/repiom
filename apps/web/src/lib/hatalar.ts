/**
 * Sunucudan ya da tarayıcıdan gelen hataları kullanıcıya gösterilecek Türkçe metne çevirir.
 * Bilinmeyen hatalarda teknik ayrıntı gösterilmez.
 */
const AUTH_KODLARI: Record<string, string> = {
  invalid_credentials: 'E-posta ya da şifre hatalı.',
  email_exists: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Giriş yapmayı dene.',
  user_already_exists: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Giriş yapmayı dene.',
  weak_password: 'Şifre çok zayıf. En az 8 karakter olmalı, harf ve rakam içermeli.',
  email_not_confirmed: 'E-posta adresin henüz doğrulanmamış. Gelen kutundaki bağlantıya tıkla.',
  over_request_rate_limit: 'Çok sık deneme yapıldı. Lütfen birkaç dakika sonra tekrar dene.',
  over_email_send_rate_limit: 'Çok sık e-posta istendi. Lütfen birkaç dakika sonra tekrar dene.',
  signup_disabled: 'Şu anda yeni kayıt alınmıyor.',
  email_address_invalid: 'E-posta adresi geçersiz.',
  validation_failed: 'Girilen bilgiler geçersiz. Lütfen kontrol et.',
  session_not_found: 'Oturumun sona ermiş. Lütfen tekrar giriş yap.',
  refresh_token_not_found: 'Oturumun sona ermiş. Lütfen tekrar giriş yap.',
  user_not_found: 'Bu e-posta adresiyle kayıtlı hesap bulunamadı.',
};

/** Postgres hata kodları (RLS ve sunucu fonksiyonlarından). */
const PG_KODLARI: Record<string, string> = {
  '42501': 'Bu işlem için yetkin yok.',
  P0002: 'Kayıt bulunamadı.',
};

export const GENEL_HATA = 'Beklenmeyen bir sorun oluştu. Lütfen tekrar dene; sorun sürerse bize bildir.';
export const AG_HATASI = 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';

interface HataBenzeri {
  code?: unknown;
  status?: unknown;
  message?: unknown;
  name?: unknown;
}

export function turkceHata(hata: unknown): string {
  if (!hata) return GENEL_HATA;
  const h = (typeof hata === 'object' ? hata : {}) as HataBenzeri;
  const kod = typeof h.code === 'string' ? h.code : '';
  const mesaj = typeof h.message === 'string' ? h.message : typeof hata === 'string' ? hata : '';

  if (kod && AUTH_KODLARI[kod]) return AUTH_KODLARI[kod];
  // Türkçe yazılmış hata: uygulamanın ya da sunucu fonksiyonlarımızın kendi mesajıdır (kod ne olursa olsun) —
  // olduğu gibi gösterilir. Veritabanının İngilizce teknik mesajları gösterilmez.
  if (/[çğıöşüİ]/i.test(mesaj)) return mesaj;
  if (kod && PG_KODLARI[kod]) return PG_KODLARI[kod];
  if (
    h.name === 'AuthRetryableFetchError' ||
    h.status === 0 ||
    /failed to fetch|networkerror|load failed/i.test(mesaj)
  ) {
    return AG_HATASI;
  }
  if (/invalid login credentials/i.test(mesaj)) return AUTH_KODLARI.invalid_credentials!;
  if (/already registered/i.test(mesaj)) return AUTH_KODLARI.user_already_exists!;
  if (h.status === 429) return AUTH_KODLARI.over_request_rate_limit!;
  return GENEL_HATA;
}
