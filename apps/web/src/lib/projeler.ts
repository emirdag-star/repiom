/**
 * Proje kayıtları (Supabase `projeler` tablosu). Erişim RLS ile sınırlıdır: kullanıcı yalnız kendi projelerini görür.
 */
import { emptyBlock, emptyProject, type CalculationResult, type ProjectInput } from '@repiom/core';
import { supabase } from './supabase';

/** Projelerim listesinde gösterilen özet (hesaplandıkça kaydedilir). */
export interface ProjeOzeti {
  toplam: number;
  m2: number;
  alan: number;
  daire: number;
  kdvDahil: number;
}

export interface ProjeSatiri {
  id: string;
  ad: string;
  ozet: ProjeOzeti | null;
  fiyat_listesi_id: number | null;
  guncelleme: string;
}

export interface ProjeKaydi extends ProjeSatiri {
  girdi: ProjectInput;
}

const db = () => {
  if (!supabase) throw new Error('Sunucu bağlantı ayarı eksik.');
  return supabase;
};

/** Eski ya da eksik kaydı tam bir girdi nesnesine çevirir (prototip projeleri dahil). */
export function girdiyiTamamla(g: Partial<ProjectInput> | null | undefined): ProjectInput {
  const p = Object.assign(emptyProject(), g || {});
  if (!p.bloklar || !p.bloklar.length) p.bloklar = [emptyBlock(0)];
  if (!p.tipler) p.tipler = [];
  p.bloklar.forEach((b) => {
    if (!b.katlar) b.katlar = [];
    b.katlar.forEach((k) => {
      if (!k.daireler) k.daireler = [];
    });
    if (!b.sistem) b.sistem = {};
  });
  return p;
}

export function ozetCikar(s: CalculationResult | { hata: string }): ProjeOzeti | null {
  if (s.hata !== undefined) return null;
  const o = s.ozet;
  return {
    toplam: o.piyasa,
    m2: o.m2Piyasa,
    alan: o.toplamInsaatAlani,
    daire: o.toplamDaire,
    kdvDahil: o.piyasaKdvDahil,
  };
}

export async function projeleriListele(): Promise<ProjeSatiri[]> {
  const { data, error } = await db()
    .from('projeler')
    .select('id, ad, ozet, fiyat_listesi_id, guncelleme')
    .order('guncelleme', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjeSatiri[];
}

export async function projeGetir(id: string): Promise<ProjeKaydi> {
  const { data, error } = await db()
    .from('projeler')
    .select('id, ad, girdi, ozet, fiyat_listesi_id, guncelleme')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Proje bulunamadı. Silinmiş ya da başka bir hesaba ait olabilir.');
  return { ...(data as ProjeKaydi), girdi: girdiyiTamamla((data as ProjeKaydi).girdi) };
}

export async function projeOlustur(
  girdi: ProjectInput,
  fiyatListesiId: number | null,
  ozet: ProjeOzeti | null = null,
): Promise<string> {
  const { data, error } = await db()
    .from('projeler')
    .insert({ ad: String(girdi.ad || ''), girdi, ozet, fiyat_listesi_id: fiyatListesiId })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export interface ProjeGuncellemesi {
  ad: string;
  girdi: ProjectInput;
  ozet: ProjeOzeti | null;
  fiyat_listesi_id: number | null;
}

export async function projeGuncelle(id: string, d: ProjeGuncellemesi): Promise<void> {
  const { error } = await db().from('projeler').update(d).eq('id', id);
  if (error) throw error;
}

/**
 * Sayfa kapanırken kayıt: tarayıcı sayfayı kapatsa da isteği tamamlar (fetch keepalive).
 * keepalive gövdesi 64 KB ile sınırlı; daha büyük projelerde normal istek denenir.
 */
export function projeyiKapanirkenKaydet(id: string, d: ProjeGuncellemesi, erisimAnahtari: string): void {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!url || !key) return;
  const govde = JSON.stringify(d);
  void fetch(`${url}/rest/v1/projeler?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    keepalive: govde.length < 60_000,
    headers: {
      apikey: key,
      Authorization: `Bearer ${erisimAnahtari}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: govde,
  }).catch(() => {
    /* sayfa kapanıyor; hata gösterilemez */
  });
}

export async function projeSil(id: string): Promise<void> {
  const { error } = await db().from('projeler').delete().eq('id', id);
  if (error) throw error;
}

export async function projeKopyala(id: string): Promise<string> {
  const p = await projeGetir(id);
  const girdi = { ...p.girdi, ad: `${p.girdi.ad || p.ad || 'Adsız proje'} (kopya)` };
  return projeOlustur(girdi, p.fiyat_listesi_id, p.ozet);
}
