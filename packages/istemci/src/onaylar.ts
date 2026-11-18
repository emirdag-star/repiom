/** Belge onayları: eksik/yeniden onay ve onay kaydı. Sürüm ve tarih sunucuda denetlenir. */
import { BELGELER, type BelgeId } from '@repiom/core';
import { ayar, db } from './baglanti';

export interface EksikOnay {
  belge: BelgeId;
  zorunlu: boolean;
  surum: string;
}

export async function eksikOnaylar(): Promise<EksikOnay[]> {
  const { data, error } = await db().rpc('eksik_onaylar');
  if (error) throw error;
  return (data ?? []) as EksikOnay[];
}

/** Onay (ya da geri alma) kaydı: belgenin güncel sürümüyle. */
export async function onayKaydet(belgeler: BelgeId[], onay = true): Promise<void> {
  if (!belgeler.length) return;
  const tarayici = ayar().platform.cihaz().slice(0, 200);
  const { error } = await db()
    .from('onaylar')
    .insert(belgeler.map((belge) => ({ belge, surum: BELGELER[belge].surum, onay, tarayici })));
  if (error) throw error;
}

export interface OnayDurumu {
  belge: BelgeId;
  onay: boolean;
  surum: string;
  tarih: string;
}

/** Her belge için son onay kaydı. */
export async function sonOnaylar(): Promise<Partial<Record<BelgeId, OnayDurumu>>> {
  const { data, error } = await db()
    .from('onaylar')
    .select('belge, onay, surum, tarih')
    .order('tarih', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  const out: Partial<Record<BelgeId, OnayDurumu>> = {};
  for (const r of (data ?? []) as OnayDurumu[]) if (!out[r.belge]) out[r.belge] = r;
  return out;
}
