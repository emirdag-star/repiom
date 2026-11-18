import { describe, expect, it } from 'vitest';
import { girisSemasi, kayitSemasi } from './formlar';

const ilkHata = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe('form doğrulama', () => {
  it('boş girişte Türkçe mesaj verir', () => {
    const r = girisSemasi.safeParse({ eposta: '', sifre: '' });
    expect(r.success).toBe(false);
    expect(ilkHata(r)).toBe('E-posta adresini yaz.');
  });

  it('geçersiz e-postayı reddeder', () => {
    expect(ilkHata(girisSemasi.safeParse({ eposta: 'abc', sifre: 'x' }))).toMatch(/Geçerli bir e-posta/);
  });

  it('kayıtta zayıf ve uyuşmayan şifreyi reddeder', () => {
    expect(
      ilkHata(kayitSemasi.safeParse({ eposta: 'a@b.co', sifre: 'kisa1', sifreTekrar: 'kisa1' })),
    ).toMatch(/en az 8/);
    expect(
      ilkHata(kayitSemasi.safeParse({ eposta: 'a@b.co', sifre: 'sadeceharf', sifreTekrar: 'sadeceharf' })),
    ).toMatch(/rakam/);
    expect(
      ilkHata(kayitSemasi.safeParse({ eposta: 'a@b.co', sifre: 'Guclu1234', sifreTekrar: 'Guclu12345' })),
    ).toBe('Şifreler aynı değil.');
  });

  it('geçerli kaydı kabul eder ve e-postadaki boşlukları temizler', () => {
    const r = kayitSemasi.safeParse({
      eposta: '  ali@ornek.com ',
      sifre: 'Guclu1234',
      sifreTekrar: 'Guclu1234',
    });
    expect(r.success).toBe(true);
    expect(r.data?.eposta).toBe('ali@ornek.com');
  });
});
