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
