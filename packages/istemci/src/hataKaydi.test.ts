import { describe, expect, it } from 'vitest';
import { adresiAyikla, kiritiyiAyikla, metniAyikla, olayiAyikla } from './hataKaydi';

describe('hata kaydı kişisel veri süzgeci', () => {
  it('e-posta, kimlik, belirteç ve uzun sayıları maskeler', () => {
    expect(
      metniAyikla(
        'ali.veli@ornek.com 7a916706-d041-4f6c-acb2-9237139c2349 TCKN 12345678901 eyJhbGciOi.eyJzdWIi.abc-_1',
      ),
    ).toBe('[e-posta] [kimlik] TCKN [sayı] [belirteç]');
    expect(metniAyikla('Kat 3, 120 m²')).toBe('Kat 3, 120 m²');
  });

  it('adresten sorgu dizgisini atar', () => {
    expect(
      adresiAyikla(
        'https://x.supabase.co/rest/v1/projeler?id=eq.7a916706-d041-4f6c-acb2-9237139c2349&select=*',
      ),
    ).toBe('https://x.supabase.co/rest/v1/projeler');
    expect(adresiAyikla('/proje/7a916706-d041-4f6c-acb2-9237139c2349/sonuc#x')).toBe('/proje/[kimlik]/sonuc');
  });

  it('olaydan kullanıcı, istek gövdesi, ek veri ve özel bağlamı siler', () => {
    const o = olayiAyikla({
      user: { email: 'a@b.co', ip_address: '1.2.3.4' },
      request: {
        url: 'https://site/a?token=1',
        data: '{"sifre":"x"}',
        cookies: 'c',
        headers: { Authorization: 'B' },
      },
      extra: { proje: 'GİZLİ' },
      message: 'Hata: a@b.co',
      exception: { values: [{ type: 'Error', value: 'TCKN 12345678901 geçersiz' }] },
      breadcrumbs: [
        { category: 'fetch', data: { url: 'https://site/rest?x=1', body: 'gizli' }, message: 'a@b.co' },
      ],
      contexts: { os: { name: 'iOS' }, proje: { ad: 'GİZLİ' } },
    });
    expect(o).toEqual({
      request: { url: 'https://site/a', method: undefined },
      message: 'Hata: [e-posta]',
      exception: { values: [{ type: 'Error', value: 'TCKN [sayı] geçersiz' }] },
      breadcrumbs: [
        {
          category: 'fetch',
          data: { url: 'https://site/rest', status_code: undefined, method: undefined },
          message: '[e-posta]',
        },
      ],
      contexts: { os: { name: 'iOS' } },
    });
  });

  it('veri adressiz kırıntıda veriyi tamamen atar', () => {
    expect(kiritiyiAyikla({ category: 'ui.click', data: { hedef: 'GİZLİ PROJE' } })).toEqual({
      category: 'ui.click',
      data: undefined,
    });
  });
});
