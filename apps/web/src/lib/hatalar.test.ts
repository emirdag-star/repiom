import { describe, expect, it } from 'vitest';
import { AG_HATASI, GENEL_HATA, turkceHata } from './hatalar';

describe('turkceHata', () => {
  it('bilinen giriş hatalarını Türkçeye çevirir', () => {
    expect(turkceHata({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'E-posta ya da şifre hatalı.',
    );
    expect(turkceHata({ code: 'user_already_exists' })).toMatch(/zaten var/);
    expect(turkceHata({ code: 'weak_password' })).toMatch(/en az 8/i);
  });

  it('kodsuz eski mesajları da tanır', () => {
    expect(turkceHata({ message: 'Invalid login credentials' })).toBe('E-posta ya da şifre hatalı.');
    expect(turkceHata({ message: 'User already registered' })).toMatch(/zaten var/);
  });

  it('ağ hatasında bağlantı mesajı verir', () => {
    expect(turkceHata(new TypeError('Failed to fetch'))).toBe(AG_HATASI);
    expect(turkceHata({ name: 'AuthRetryableFetchError', status: 0 })).toBe(AG_HATASI);
  });

  it('sunucu fonksiyonunun Türkçe mesajını korur, İngilizceyi gizler', () => {
    expect(turkceHata({ code: '42501', message: 'Bu işlem için yönetici yetkisi gerekir.' })).toBe(
      'Bu işlem için yönetici yetkisi gerekir.',
    );
    expect(turkceHata({ code: '42501', message: 'permission denied for table projeler' })).toBe(
      'Bu işlem için yetkin yok.',
    );
  });

  it('bilinmeyen ya da boş hatada çökmez, genel mesaj verir', () => {
    expect(turkceHata(undefined)).toBe(GENEL_HATA);
    expect(turkceHata(null)).toBe(GENEL_HATA);
    expect(turkceHata(42)).toBe(GENEL_HATA);
    expect(turkceHata({ message: 'some internal stack trace' })).toBe(GENEL_HATA);
  });
});
