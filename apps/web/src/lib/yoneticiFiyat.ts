/** Yönetici fiyat listesi işlemleri. Yetki sunucuda (yonetici_mi) denetlenir. */
import type { PriceList } from '@repiom/core';
import { supabase } from './supabase';

export interface FiyatSurumu {
  id: number;
  aciklama: string;
  aktif: boolean;
  olusturma: string;
  yayin_tarihi: string | null;
  kalem_sayisi: number;
  olusturan_eposta: string | null;
}

const db = () => {
  if (!supabase) throw new Error('Sunucu bağlantı ayarı eksik.');
  return supabase;
};

export async function fiyatSurumleri(): Promise<FiyatSurumu[]> {
  const { data, error } = await db().rpc('fiyat_listesi_surumleri');
  if (error) throw error;
  return (data ?? []) as FiyatSurumu[];
}

export async function fiyatListesiEkleYayinla(aciklama: string, fiyatlar: PriceList): Promise<number> {
  const { data, error } = await db().rpc('fiyat_listesi_ekle_yayinla', {
    p_aciklama: aciklama,
    p_fiyatlar: fiyatlar,
  });
  if (error) throw error;
  return data as number;
}

export async function fiyatListesiYayinla(id: number): Promise<void> {
  const { error } = await db().rpc('fiyat_listesi_yayinla', { p_id: id });
  if (error) throw error;
}

export function dosyaIndir(veri: Uint8Array, ad: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([veri as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  a.download = ad;
  // Bağlantı sayfaya eklenmeden tıklanır (ekran okuyucular metinsiz bir bağlantı görmesin).
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
