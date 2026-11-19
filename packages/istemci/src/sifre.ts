/**
 * Şifremi unuttum: sıfırlama bağlantısı e-postayla gelir ve WEB'deki /sifre-yenile sayfasında yeni şifre belirlenir
 * (mobil uygulama da aynı web sayfasını kullanır). Hesabın var olup olmadığı dışarıya söylenmez (aynı yanıt).
 */
import { db } from './baglanti';

export async function sifreSifirlamaIste(eposta: string, donusAdresi: string): Promise<void> {
  const { error } = await db().auth.resetPasswordForEmail(eposta.trim(), { redirectTo: donusAdresi });
  // Sık istek sınırı dışında hata kullanıcıya gösterilmez (hesap varlığı sızdırılmaz).
  if (error && /rate|seconds|too many/i.test(error.message)) throw error;
}

export async function yeniSifreBelirle(sifre: string): Promise<void> {
  const { error } = await db().auth.updateUser({ password: sifre });
  if (error) throw error;
}
