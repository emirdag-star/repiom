import { describe, expect, it } from 'vitest';
import { girisSemasi, kayitSemasi } from './formlar';

const ONAY = { sozlesme: true, kvkk: true, riza: false, ileti: false };
const kayit = (sifre: string, sifreTekrar = sifre, ek: object = {}) =>
  kayitSemasi.safeParse({ eposta: 'a@b.co', sifre, sifreTekrar, ...ONAY, ...ek });

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
    expect(ilkHata(kayit('kisa1'))).toMatch(/en az 8/);
    expect(ilkHata(kayit('sadeceharf'))).toMatch(/rakam/);
    expect(ilkHata(kayit('Guclu1234', 'Guclu12345'))).toBe('Şifreler aynı değil.');
  });

  it('zorunlu onaylar olmadan kayıt olmaz; isteğe bağlılar zorunlu değil', () => {
    expect(ilkHata(kayit('Guclu1234', 'Guclu1234', { sozlesme: false }))).toMatch(/Kullanıcı Sözleşmesi/);
    expect(ilkHata(kayit('Guclu1234', 'Guclu1234', { kvkk: false }))).toMatch(/KVKK/);
    expect(kayit('Guclu1234').success).toBe(true);
  });

  it('geçerli kaydı kabul eder ve e-postadaki boşlukları temizler', () => {
    const r = kayitSemasi.safeParse({
      eposta: '  ali@ornek.com ',
      sifre: 'Guclu1234',
      sifreTekrar: 'Guclu1234',
      ...ONAY,
    });
    expect(r.success).toBe(true);
    expect(r.data?.eposta).toBe('ali@ornek.com');
  });
});
