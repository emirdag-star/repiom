/**
 * Çalışma zamanı ayarı: sunucudaki imaj her ortamda aynıdır; adres ve yayımlanabilir anahtar açılışta /ayar.js'ten
 * (yönlendirici ortam değişkenlerinden üretir) okunur. Geliştirmede ve testlerde Vite ortam değişkenleri kullanılır.
 * Bu değerler gizli değildir (tarayıcıya zaten gider).
 */
interface Ayar {
  supabaseUrl?: string;
  anahtar?: string;
  sentryDsn?: string;
  ortam?: string;
  surum?: string;
}
const calisma = ((globalThis as { REPIOM_AYAR?: Ayar }).REPIOM_AYAR ?? {}) as Ayar;
const dolu = (x: string | undefined) => (x && x.trim() ? x : undefined);

export const AYAR = {
  supabaseUrl: dolu(calisma.supabaseUrl) ?? (import.meta.env.VITE_SUPABASE_URL as string | undefined),
  anahtar: dolu(calisma.anahtar) ?? (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined),
  sentryDsn: dolu(calisma.sentryDsn) ?? (import.meta.env.VITE_SENTRY_DSN as string | undefined),
  ortam: dolu(calisma.ortam) ?? (import.meta.env.VITE_ORTAM as string | undefined) ?? 'uretim',
  surum: dolu(calisma.surum) ?? (import.meta.env.VITE_SURUM as string | undefined),
};
