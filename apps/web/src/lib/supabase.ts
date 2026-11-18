import { baglan } from '@repiom/istemci/baglanti';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** Ayar eksikse uygulama çökmez; giriş ekranında anlaşılır bir uyarı gösterilir. */
export const supabaseAyarHatasi: string | null =
  url && key
    ? null
    : 'Sunucu bağlantı ayarı eksik. Geliştirme ortamında "pnpm env:yerel" komutunu çalıştırıp uygulamayı yeniden başlat.';

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

// Ortak istemci paketine tarayıcı bağlantısı ve platform işlevleri.
baglan(supabase, {
  url: url ?? '',
  anahtar: key ?? '',
  platform: {
    cihaz: () => navigator.userAgent,
    sha256: async (metin) => {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metin));
      return Array.from(new Uint8Array(b))
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');
    },
    kapanisDinle: (fn) => {
      const gorunurluk = () => {
        if (document.visibilityState === 'hidden') fn();
      };
      window.addEventListener('pagehide', fn);
      document.addEventListener('visibilitychange', gorunurluk);
      return () => {
        window.removeEventListener('pagehide', fn);
        document.removeEventListener('visibilitychange', gorunurluk);
      };
    },
  },
});
