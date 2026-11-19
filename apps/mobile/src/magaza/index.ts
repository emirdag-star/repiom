/**
 * Uygulama içi satın alma. Gerçek mağaza (App Store / Google Play, expo-iap) yalnız geliştirme ya da mağaza derlemesinde
 * vardır; Expo Go'da, web önizlemesinde ve EXPO_PUBLIC_SAHTE_MAGAZA=1 iken SAHTE mağaza kullanılır (yerel test servisi).
 * Her iki yolda da hak, sunucu satın almayı mağazadan doğruladıktan sonra tanımlanır.
 */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type { MagazaKancasi } from './tur';

export type { MagazaKancasi } from './tur';

export const GERCEK_MAGAZA =
  Platform.OS !== 'web' &&
  process.env.EXPO_PUBLIC_SAHTE_MAGAZA !== '1' &&
  requireOptionalNativeModule('ExpoIap') !== null;

// Gerçek mağaza modülü yalnız gerekiyorsa yüklenir (Expo Go'da yerel modül yoktur): koşullu require bilinçli.
/* eslint-disable @typescript-eslint/no-require-imports */
export const useMagaza: MagazaKancasi = GERCEK_MAGAZA
  ? (require('./gercek') as { useGercekMagaza: MagazaKancasi }).useGercekMagaza
  : (require('./sahte') as { useSahteMagaza: MagazaKancasi }).useSahteMagaza;
