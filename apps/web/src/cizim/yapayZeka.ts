/**
 * Çizim analizinin isteğe bağlı yapay zekâ adımı (istemci tarafı).
 * Gönderilen: en çok 6 YAZISIZ kat planı görseli + core'daki gizlilik özeti (aiSummary) + sistemin ürettiği yeni
 * kalem adları. Proje adı, pafta başlıkları, çizimdeki yazılar (antet, isimler, ada-parsel) gönderilmez.
 * Sunucu: supabase/functions/dxf-yz (rıza ve analiz başına tek çağrı orada denetlenir).
 */
import { dxf } from '@repiom/core';
import { supabase } from '../lib/supabase';
import type { EkKalem } from './KontrolEkrani';
import type { AnalizSonucu } from './mesajlar';

export interface YzDurumu {
  durum: 'bekliyor' | 'tamam' | 'hata';
  notlar: string[];
  mesaj?: string;
}

export interface YzFiyat {
  ad: string;
  fiyat: number;
  gerekce: string;
}

type Onizle = (
  bolge: [number, number, number, number],
  isaret: { x: number; y: number }[],
  yazi?: boolean,
) => Promise<Blob | null>;

async function base64(b: Blob): Promise<string> {
  const bayt = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < bayt.length; i += 0x8000) s += String.fromCharCode(...bayt.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Hesaba dahil katlardan en çok 6 yazısız plan görseli (PNG, base64). */
export async function yazisizGorseller(a: AnalizSonucu, onizle: Onizle): Promise<string[]> {
  const katlar = a.mimari.katlar.filter((k) => !k.haric).slice(0, dxf.AI_MAX_IMAGES);
  const l: string[] = [];
  for (const k of katlar) {
    const b = await onizle(k.bolge, [], false);
    if (b) l.push(await base64(b));
  }
  return l;
}

export async function yzKontrol(
  analizId: number,
  a: AnalizSonucu,
  il: string,
  ekler: EkKalem[],
  onizle: Onizle,
): Promise<{ notlar: string[]; fiyatlar: YzFiyat[] }> {
  if (!supabase) throw new Error('Sunucu bağlantı ayarı eksik.');
  const yeni = new Map<string, dxf.AiNewItem>();
  ekler.forEach((e) => {
    const v = yeni.get(e.ad);
    yeni.set(e.ad, { ad: e.ad, birim: e.birim ?? '', metraj: (v?.metraj ?? 0) + e.metraj });
  });
  const { data, error } = await supabase.functions.invoke('dxf-yz', {
    body: {
      analiz_id: analizId,
      il,
      gorseller: await yazisizGorseller(a, onizle),
      ozet: dxf.aiSummary(a.mimari, a.statik),
      yeni_kalemler: [...yeni.values()],
    },
  });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const govde = ctx ? await ctx.json().catch(() => null) : null;
    throw new Error(govde?.message ?? 'Yapay zekâ servisine ulaşılamadı.');
  }
  const d = data as { notlar?: string[]; fiyatlar?: YzFiyat[] };
  return { notlar: d.notlar ?? [], fiyatlar: d.fiyatlar ?? [] };
}

/** Yapay zekâ fiyatlarını, kullanıcının henüz değiştirmediği (varsayılan tahminli) kalemlere uygular. */
export function fiyatlariUygula(ekler: EkKalem[], varsayilan: EkKalem[], fiyatlar: YzFiyat[]): EkKalem[] {
  const f = new Map(fiyatlar.map((x) => [x.ad, x]));
  return ekler.map((e, i) => {
    const y = f.get(e.ad);
    if (!y || e.fiyat !== varsayilan[i]?.fiyat) return e;
    return {
      ...e,
      fiyat: y.fiyat,
      aciklama: [e.aciklama, `Yapay zekâ tahmini: ${y.gerekce}`].filter(Boolean).join(' · '),
    };
  });
}
