/**
 * Sunucu bağlantısı ve platform farkları. Web ve mobil uygulama açılışta `baglan` ile kendi Supabase istemcisini ve
 * platform işlevlerini verir; bu paketteki çağrılar platformdan bağımsızdır.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Platform {
  /** Kullanım sayaçları için platform adı. */
  ad: 'web' | 'ios' | 'android';
  /** Onay kayıtlarında saklanan cihaz/tarayıcı bilgisi (en çok 200 karakter). */
  cihaz(): string;
  /** SHA-256 (onaltılık, küçük harf). */
  sha256(metin: string): Promise<string>;
  /** Uygulama arka plana geçerken / sayfa kapanırken çağrılacak işlevi kaydeder; kaydı silen işlevi döner. */
  kapanisDinle(fn: () => void): () => void;
}

export interface BaglantiAyari {
  url: string;
  anahtar: string;
  platform: Platform;
}

let istemci: SupabaseClient | null = null;
let ayarlar: BaglantiAyari | null = null;

export function baglan(c: SupabaseClient | null, a: BaglantiAyari): void {
  istemci = c;
  ayarlar = a;
}

export const baglandi = () => istemci !== null;

export function db(): SupabaseClient {
  if (!istemci) throw new Error('Sunucu bağlantı ayarı eksik.');
  return istemci;
}

export function ayar(): BaglantiAyari {
  if (!ayarlar) throw new Error('Sunucu bağlantı ayarı eksik.');
  return ayarlar;
}

/** Sunucu fonksiyonu hatasında sunucunun Türkçe mesajını çıkarır. */
export async function fonksiyonHatasi(error: unknown, yedek: string): Promise<Error> {
  const ctx = (error as { context?: Response }).context;
  const govde = ctx ? await ctx.json().catch(() => null) : null;
  return new Error((govde as { message?: string } | null)?.message ?? yedek);
}
