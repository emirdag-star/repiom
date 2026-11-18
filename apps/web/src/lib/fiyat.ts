/** Fiyat listeleri: aynı anda yalnız biri aktiftir. Her proje hesaplandığı listeyle saklanır. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export interface FiyatListesi {
  id: number;
  aciklama: string;
  fiyatlar: Record<string, number>;
  olusturma: string;
  yayin_tarihi: string | null;
}

const ALANLAR = 'id, aciklama, fiyatlar, olusturma, yayin_tarihi';

export async function aktifFiyatListesi(): Promise<FiyatListesi | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('fiyat_listeleri')
    .select(ALANLAR)
    .eq('aktif', true)
    .maybeSingle();
  if (error) throw error;
  return (data as FiyatListesi) ?? null;
}

export async function fiyatListesiGetir(id: number): Promise<FiyatListesi | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('fiyat_listeleri').select(ALANLAR).eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as FiyatListesi) ?? null;
}

export function useAktifFiyatListesi() {
  return useQuery({ queryKey: ['fiyat', 'aktif'], queryFn: aktifFiyatListesi, staleTime: 5 * 60_000 });
}

export function useFiyatListesi(id: number | null | undefined) {
  return useQuery({
    queryKey: ['fiyat', id],
    queryFn: () => fiyatListesiGetir(id!),
    enabled: id != null,
    staleTime: Infinity,
  });
}

export const tarihGun = (t: string | null | undefined) => (t ? new Date(t).toLocaleDateString('tr-TR') : '');
