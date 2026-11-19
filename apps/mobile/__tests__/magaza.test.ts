/** Sahte mağaza: önce sahte satın alma, sonra sunucu doğrulaması; hata Türkçe iletilir. Gerçek modül Expo Go'da yüklenmez. */
const mockSahteSatinAl = jest.fn();
const mockDogrula = jest.fn();
jest.mock('@repiom/istemci/abonelik', () => ({
  sahteMagazaSatinAl: (...a: unknown[]) => mockSahteSatinAl(...a),
  magazaDogrula: (...a: unknown[]) => mockDogrula(...a),
}));

// Expo Go / test: yerel ExpoIap modülü yok.
jest.mock('expo', () => ({ requireOptionalNativeModule: () => null }));

import { GERCEK_MAGAZA } from '../src/magaza';
import { useSahteMagaza } from '../src/magaza/sahte';

test('yerel modül yokken gerçek mağaza seçilmez', () => {
  expect(GERCEK_MAGAZA).toBe(false);
});

test('satın alma doğrulanınca hak bildirilir; fiyat web fiyatından gösterilir', async () => {
  mockSahteSatinAl.mockResolvedValue({ platform: 'ios', urun: 'ek_analiz', islem: '1' });
  mockDogrula.mockResolvedValue({ yeni: true });
  const tamam = jest.fn();
  const hata = jest.fn();
  const m = useSahteMagaza(['ek_analiz'], { tamam, hata }, { ek_analiz: 450 });
  expect(m.fiyatlar.ek_analiz).toBe('450 TL');
  await m.satinAl('ek_analiz');
  expect(mockDogrula).toHaveBeenCalledWith({ platform: 'ios', urun: 'ek_analiz', islem: '1' });
  expect(tamam).toHaveBeenCalledWith(true);
  expect(hata).not.toHaveBeenCalled();
});

test('doğrulama reddedilirse hak verilmez ve mesaj gösterilir', async () => {
  mockSahteSatinAl.mockResolvedValue({ platform: 'ios', urun: 'ek_analiz', islem: '2' });
  mockDogrula.mockRejectedValue(new Error('Bu satın alma başka bir hesaba ait.'));
  const tamam = jest.fn();
  const hata = jest.fn();
  await useSahteMagaza(['ek_analiz'], { tamam, hata }, {}).satinAl('ek_analiz');
  expect(tamam).not.toHaveBeenCalled();
  expect(hata).toHaveBeenCalledWith('Bu satın alma başka bir hesaba ait.');
});
