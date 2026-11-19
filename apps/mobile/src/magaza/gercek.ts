/**
 * Gerçek mağaza (expo-iap): tüm paketler TEK SEFERLİK (tüketilebilir) ürün; ürün kimliği = paket kimliği.
 * Akış: satın al → sunucu mağazadan doğrular ve hakkı tanımlar → işlem mağazada bitirilir (tüketilir).
 * Doğrulama başarısızsa işlem bitirilmez; uygulama yeniden açılınca mağaza onu tekrar bildirir ve yeniden denenir.
 */
import { magazaDogrula } from '@repiom/istemci/abonelik';
import { turkceHata } from '@repiom/istemci/hatalar';
import { ErrorCode, useIAP, type Purchase } from 'expo-iap';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { MagazaKancasi } from './tur';

export const useGercekMagaza: MagazaKancasi = (urunler, geri) => {
  const geriRef = useRef(geri);
  const bitir = useRef<((p: Purchase) => Promise<void>) | null>(null);
  const islenen = useRef(new Set<string>());

  const isle = async (p: Purchase) => {
    const anahtar = p.purchaseToken ?? p.id;
    if (islenen.current.has(anahtar)) return;
    islenen.current.add(anahtar);
    try {
      const r = await magazaDogrula(
        Platform.OS === 'ios'
          ? {
              platform: 'ios',
              urun: p.productId,
              islem: (p as { transactionId?: string }).transactionId ?? p.id,
            }
          : { platform: 'android', urun: p.productId, jeton: p.purchaseToken ?? '' },
      );
      await bitir.current?.(p);
      geriRef.current.tamam(r.yeni);
    } catch (e) {
      islenen.current.delete(anahtar);
      geriRef.current.hata(turkceHata(e));
    }
  };

  const iap = useIAP({
    onPurchaseSuccess: (p) => void isle(p),
    onPurchaseError: (e) => {
      if (e.code !== ErrorCode.UserCancelled)
        geriRef.current.hata('Satın alma tamamlanamadı. Ücret alınmadıysa tekrar deneyebilirsin.');
    },
  });
  useEffect(() => {
    geriRef.current = geri;
    bitir.current = (p) => iap.finishTransaction({ purchase: p, isConsumable: true });
  });

  const skuAnahtari = urunler.join(',');
  useEffect(() => {
    if (!iap.connected || !skuAnahtari) return;
    void iap.fetchProducts({ skus: skuAnahtari.split(','), type: 'in-app' });
    // Önceden tamamlanmamış (doğrulanmamış) satın almalar yeniden işlenir.
    void iap.getAvailablePurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iap.connected, skuAnahtari]);
  useEffect(() => {
    iap.availablePurchases.filter((p) => urunler.includes(p.productId)).forEach((p) => void isle(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iap.availablePurchases]);

  return {
    hazir: iap.connected,
    sahte: false,
    fiyatlar: Object.fromEntries(iap.products.map((p) => [p.id, p.displayPrice])),
    satinAl: async (urun) => {
      try {
        await iap.requestPurchase({
          request: { apple: { sku: urun }, google: { skus: [urun] } },
          type: 'in-app',
        });
      } catch {
        /* sonuç onPurchaseError ile bildirilir */
      }
    },
  };
};
