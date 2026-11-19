/**
 * Çizim analizi (DXF) ortak mantığı: yeni kalem listesi, projeye aktarma ve yapay zekâ çağrısı.
 * Çizimin okunması ve görseller platforma özgüdür (web: Worker + OffscreenCanvas; mobil: dosya sistemi + SVG).
 */
import { calculate, dxf, type ProjectInput } from '@repiom/core';
import { analizProjeyeBagla } from './abonelik';
import { db, fonksiyonHatasi } from './baglanti';
import { aktifFiyatListesi } from './fiyat';
import { ozetCikar, projeOlustur } from './projeler';

/** Çizim analizinin sonucu (çizim verisi hariç). */
export type AnalizSonucu = Omit<dxf.DxfAnalysis, 'veri'>;

export interface Varsayimlar {
  ad: string;
  il: string;
  H: number;
  donati: number;
}

export interface EkKalem {
  bk: string;
  blok: string;
  grup: number;
  ad: string;
  birim?: string;
  metraj: number;
  fiyat: number;
  kaynak?: string;
  aciklama?: string;
  dahil: boolean;
}

const proje = (a: AnalizSonucu, v: Varsayimlar, ad = v.ad) =>
  dxf.projectFromAnalysis(a, ad, { katYuksekligi: v.H, donatiKgM3: v.donati, il: v.il });

/** Fiyat listesinde olmayan yeni kalemler (kontrol ekranında dahil/hariç ve fiyat düzenleme için). */
export function ekListesi(a: AnalizSonucu, v: Varsayimlar): EkKalem[] {
  const p = proje(a, v);
  const l: EkKalem[] = [];
  Object.keys(p.ekKalemler ?? {}).forEach((bk) => {
    const n = +bk.slice(4);
    (p.ekKalemler![bk] ?? []).forEach((e) =>
      l.push({
        ...e,
        metraj: Number(e.metraj) || 0,
        fiyat: Number(e.fiyat) || 0,
        blok: String(p.bloklar![n]!.ad),
        bk,
        dahil: true,
      }),
    );
  });
  return l;
}

/** Kontrol ekranındaki son hâliyle projeyi oluşturur ve analize bağlar; proje kimliğini döner. */
export async function projeyeAktar(
  a: AnalizSonucu,
  v: Varsayimlar,
  ekler: EkKalem[],
  analizId: number | null,
): Promise<string> {
  const ad = v.ad.trim() || 'Çizim analizi';
  const p = proje(a, v, ad);
  const ek: NonNullable<ProjectInput['ekKalemler']> = {};
  ekler
    .filter((e) => e.dahil)
    .forEach((e) =>
      (ek[e.bk] ??= []).push({
        grup: e.grup,
        ad: e.ad,
        birim: e.birim,
        metraj: e.metraj,
        fiyat: e.fiyat,
        kaynak: 'tahmini',
        aciklama: e.aciklama,
      }),
    );
  p.ekKalemler = ek;
  p.ad = ad;
  const liste = await aktifFiyatListesi().catch(() => null);
  const ozet = ozetCikar(calculate(p, { fiyatlar: liste?.fiyatlar ?? null }));
  const id = await projeOlustur(p, liste?.id ?? null, ozet);
  if (analizId)
    await analizProjeyeBagla(analizId, id, {
      kat: a.mimari.katlar.filter((k) => !k.haric).length,
      mahal: a.mimari.katlar.reduce((t, k) => t + k.mahaller.length, 0),
      toplam: ozet?.toplam ?? null,
    }).catch(() => {
      /* bağlantı kaydı ikincil */
    });
  return id;
}

export interface YzFiyat {
  ad: string;
  fiyat: number;
  gerekce: string;
}

/**
 * Yapay zekâ kontrolü (analiz başına tek çağrı; rıza sunucuda denetlenir). Gönderilen: en çok 6 yazısız PNG
 * (base64), gizlilik özeti (aiSummary) ve sistemin ürettiği yeni kalem adları.
 */
export async function yzIste(
  analizId: number,
  a: AnalizSonucu,
  il: string,
  ekler: EkKalem[],
  gorseller: string[],
): Promise<{ notlar: string[]; fiyatlar: YzFiyat[] }> {
  const yeni = new Map<string, dxf.AiNewItem>();
  ekler.forEach((e) =>
    yeni.set(e.ad, { ad: e.ad, birim: e.birim ?? '', metraj: (yeni.get(e.ad)?.metraj ?? 0) + e.metraj }),
  );
  const { data, error } = await db().functions.invoke('dxf-yz', {
    body: {
      analiz_id: analizId,
      il,
      gorseller: gorseller.slice(0, dxf.AI_MAX_IMAGES),
      ozet: dxf.aiSummary(a.mimari, a.statik),
      yeni_kalemler: [...yeni.values()],
    },
  });
  if (error) throw await fonksiyonHatasi(error, 'Yapay zekâ servisine ulaşılamadı.');
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
