/** SAHTE mağaza (yalnız yerel/test): sahte App Store / Google Play servisinde satın alma oluşturup sunucuya doğrulatır. */
import { magazaDogrula, sahteMagazaSatinAl } from '@repiom/istemci/abonelik';
import { tl } from '@repiom/istemci/bicim';
import { turkceHata } from '@repiom/istemci/hatalar';
import { Platform } from 'react-native';
import type { MagazaKancasi } from './tur';

export const useSahteMagaza: MagazaKancasi = (urunler, geri, webFiyatlari) => ({
  hazir: true,
  sahte: true,
  fiyatlar: Object.fromEntries(urunler.map((u) => [u, tl(webFiyatlari[u] ?? 0)])),
  satinAl: async (urun) => {
    try {
      const islem = await sahteMagazaSatinAl(Platform.OS === 'ios' ? 'ios' : 'android', urun);
      const r = await magazaDogrula(islem);
      geri.tamam(r.yeni);
    } catch (e) {
      geri.hata(turkceHata(e));
    }
  },
});
