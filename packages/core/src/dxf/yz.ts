/**
 * Yapay zekâ adımına gidecek veri. GİZLİLİK KURALI: yapay zekâya yalnız yazısız plan görselleri (en çok 6) ve bu
 * dosyadaki mahal/alan özeti gider. Proje adı, pafta başlıkları, çizimdeki serbest yazılar (antet, isimler,
 * ada-parsel) ASLA gönderilmez: özet yalnız standart türlerden, standart kaplama adlarından ve sayılardan kurulur.
 */
import type { ArchResult, FinishChoice, Room, StructResult } from './analysis';
import { chosenFinish, FINISH_OPTIONS, ROOM_KIND_NAMES } from './analysis';

export const AI_MAX_IMAGES = 6;
export const AI_MAX_NOTES = 8;

export interface AiRoom {
  /** Standart mahal adı (sözlükten) ya da "Tanınmayan mahal". */
  mahal: string;
  tur: string;
  alan_m2: number;
  zemin: string;
  duvar: string;
  tavan: string;
}
export interface AiFloor {
  /** Sıra numarası (pafta başlığı gönderilmez). */
  kat: number;
  tur: string;
  tekrar: number;
  mahaller: AiRoom[];
  kapi_adet: number;
  pencere_adet: number;
}
export interface AiSummary {
  katlar: AiFloor[];
  statik: {
    kat_turu: string;
    tekrar: number;
    doseme_m2: number;
    doseme_kalinlik_cm: number | null;
    kiris_kesitleri: string[];
    kolon_perde_m2: number;
  }[];
  temel: { kalinlik_cm: number | null; alan_m2: number }[];
  jet_grout: { adet: number; boy_m: number | null; cap_cm: number | null }[];
  beton_sinifi: string | null;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const sum = (o: Record<string, number>) => Object.values(o).reduce((s, x) => s + x, 0);

/** Kaplama: yalnız standart seçeneklerden biri; değilse "Diğer" (çizimdeki serbest yazı gönderilmez). */
function finish(m: Room, y: keyof FinishChoice): string {
  const s = chosenFinish(m, y);
  return (FINISH_OPTIONS[y] as string[]).includes(s) ||
    /^Plastik boya \(dış cephe\)$|^Dış cephe kaplaması$/.test(s)
    ? s
    : 'Diğer';
}

const FLOOR_KIND: Record<string, string> = {
  bodrum: 'Bodrum',
  otopark: 'Otopark',
  normal: 'Normal kat',
  catikati: 'Çatı katı',
  cati: 'Çatı',
};

/** Hesaba dahil katlardan gizlilik kurallarına uygun özet. */
export function aiSummary(M: ArchResult, S: StructResult): AiSummary {
  const katlar = M.katlar
    .filter((k) => !k.haric)
    .map((k, i) => ({
      kat: i + 1,
      tur: FLOOR_KIND[k.tur] ?? 'Kat',
      tekrar: k.tekrar,
      mahaller: k.mahaller.map((m) => ({
        mahal: m.std ?? 'Tanınmayan mahal',
        tur: ROOM_KIND_NAMES[m.tur ?? 'kuru'],
        alan_m2: r1(m.alan),
        zemin: finish(m, 'zemin'),
        duvar: finish(m, 'duvar'),
        tavan: finish(m, 'tavan'),
      })),
      kapi_adet: sum(k.kapilar),
      pencere_adet: sum(k.pencereler),
    }));
  const statik = S.planlar
    .filter((p) => !p.kopya)
    .map((p) => ({
      kat_turu: /bodrum/i.test(p.kat ?? '')
        ? 'Bodrum'
        : p.kat === 'Zemin'
          ? 'Zemin'
          : p.kat === 'Çatı'
            ? 'Çatı'
            : 'Normal kat',
      tekrar: p.tekrar,
      doseme_m2: r1(p.doseme_alan_m2),
      doseme_kalinlik_cm: p.doseme_kalinlik[0]?.[0] ?? null,
      kiris_kesitleri: p.kiris_kesit
        .slice(0, 3)
        .map((k) => k[0])
        .filter((k) => /^\d{2,3}\/\d{2,3}$/.test(k)),
      kolon_perde_m2: Math.round(p.kolon_alan_m2 * 100) / 100,
    }));
  return {
    katlar,
    statik,
    temel: Object.values(S.temel).map((t) => ({ kalinlik_cm: t.kalinlik_cm, alan_m2: t.alan_m2 })),
    jet_grout: Object.values(S.jet_grout).map((j) => ({ adet: j.adet, boy_m: j.boy_m, cap_cm: j.cap_cm })),
    beton_sinifi: S.beton_sinifi && /^C\d{2}$/.test(S.beton_sinifi) ? S.beton_sinifi : null,
  };
}

/** Yapay zekâya fiyatı sorulacak yeni kalemler: ad sistemin ürettiği addır (çizimden serbest yazı içermez). */
export interface AiNewItem {
  ad: string;
  birim: string;
  metraj: number;
}
