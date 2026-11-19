/**
 * Çerezsiz kullanım ölçümü: yalnız izinli olay adı + platform sunucuda günlük sayaca eklenir.
 * Kullanıcı kimliği, IP ya da cihaz kimliği gönderilmez/saklanmaz. Hata olursa sessizce geçilir (uygulamayı etkilemez).
 */
import { ayar, baglandi, db } from './baglanti';

export type Olay =
  | 'uygulama_acilis'
  | `adim:${'proje' | 'daire-tipleri' | 'katlar' | 'diger-bilgiler' | 'proje-geneli' | 'ozet' | 'sonuc'}`
  | 'rapor:excel'
  | 'rapor:pdf'
  | 'paketler_goruntuleme';

export function olaySay(olay: Olay): void {
  if (!baglandi()) return;
  void Promise.resolve(db().rpc('olay_say', { p_olay: olay, p_platform: ayar().platform.ad })).catch(
    () => {},
  );
}

export interface KullanimGunu {
  gun: string;
  kayit: number;
  proje: number;
  analiz: number;
  deneme: number;
  odeme: number;
  magaza: number;
  olaylar: Record<string, number>;
}

/** Yönetici: son N gün. */
export async function kullanimOzeti(gun = 30): Promise<KullanimGunu[]> {
  const { data, error } = await db().rpc('kullanim_ozeti', { p_gun: gun });
  if (error) throw error;
  return ((data ?? []) as KullanimGunu[]).map((r) => ({
    ...r,
    kayit: Number(r.kayit),
    proje: Number(r.proje),
    analiz: Number(r.analiz),
    deneme: Number(r.deneme),
    odeme: Number(r.odeme),
    magaza: Number(r.magaza),
  }));
}
