/**
 * Çizim analizinin isteğe bağlı yapay zekâ adımı (istemci tarafı).
 * Gönderilen: en çok 6 YAZISIZ kat planı görseli + core'daki gizlilik özeti (aiSummary) + sistemin ürettiği yeni
 * kalem adları. Proje adı, pafta başlıkları, çizimdeki yazılar (antet, isimler, ada-parsel) gönderilmez.
 * Sunucu: supabase/functions/dxf-yz (rıza ve analiz başına tek çağrı orada denetlenir).
 */
import { dxf } from '@repiom/core';
import { fiyatlariUygula, yzIste, type YzFiyat } from '@repiom/istemci/cizim';
import type { EkKalem } from './KontrolEkrani';
import type { AnalizSonucu } from './mesajlar';

export interface YzDurumu {
  durum: 'bekliyor' | 'tamam' | 'hata';
  notlar: string[];
  mesaj?: string;
}

export type { YzFiyat };

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
  return yzIste(analizId, a, il, ekler, await yazisizGorseller(a, onizle));
}

export { fiyatlariUygula };
