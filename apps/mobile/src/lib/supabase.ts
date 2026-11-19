/**
 * Mobil Supabase istemcisi ve ortak pakete (packages/istemci) platform bağlantısı.
 * Oturum, cihazdaki expo-sqlite tabanlı localStorage'da tutulur. Ayarlar EXPO_PUBLIC_ değişkenlerinden gelir
 * (yerelde `pnpm env:yerel` yazar); bunlar gizli değildir (yayımlanabilir anahtar).
 */
import 'expo-sqlite/localStorage/install';
import { baglan } from '@repiom/istemci/baglanti';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import { AppState, Platform } from 'react-native';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const ANAHTAR = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabaseAyarHatasi: string | null =
  SUPABASE_URL && ANAHTAR
    ? null
    : 'Sunucu bağlantı ayarı eksik. Geliştirme ortamında "pnpm env:yerel" komutunu çalıştırıp uygulamayı yeniden başlat.';

export const supabase: SupabaseClient | null =
  SUPABASE_URL && ANAHTAR
    ? createClient(SUPABASE_URL, ANAHTAR, {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// Uygulama ön plandayken oturum yenilenir; arka planda durur.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (d) => {
    if (d === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });
}

baglan(supabase, {
  url: SUPABASE_URL,
  anahtar: ANAHTAR,
  platform: {
    cihaz: () => `REPİO(M) mobil · ${Platform.OS} ${String(Platform.Version)}`,
    sha256: (metin) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, metin),
    kapanisDinle: (fn) => {
      const a = AppState.addEventListener('change', (d) => {
        if (d !== 'active') fn();
      });
      return () => a.remove();
    },
  },
});
