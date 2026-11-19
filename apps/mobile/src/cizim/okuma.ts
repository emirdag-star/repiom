/**
 * Mobilde DXF okuma: dosya cihazda parça parça okunur (en çok 30 MB) ve core'daki aynı analizle çözümlenir.
 * Çizim hiçbir yere gönderilmez. Parçalar arasında arayüze nefes aldırılır (ilerleme gösterilir).
 */
import { dxf } from '@repiom/core';
import type { AnalizSonucu } from '@repiom/istemci/cizim';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export const MOBIL_EN_COK = 30 * 1024 * 1024;
const PARCA = 512 * 1024;

export interface SecilenDosya {
  uri: string;
  ad: string;
  boyut: number;
  /** Web önizlemesinde tarayıcı dosyası. */
  webDosyasi?: Blob;
}

export type Ilerleme = { asama: 'mimari' | 'statik' | 'cozumleme'; okunan: number; toplam: number };

const nefes = () => new Promise((r) => setTimeout(r, 0));

async function* parcalar(d: SecilenDosya, bildir: (n: number) => void): AsyncGenerator<Uint8Array> {
  let n = 0;
  if (Platform.OS === 'web' && d.webDosyasi) {
    const b = new Uint8Array(await d.webDosyasi.arrayBuffer());
    for (let i = 0; i < b.length; i += PARCA) {
      const p = b.subarray(i, i + PARCA);
      n += p.length;
      bildir(n);
      yield p;
      await nefes();
    }
    return;
  }
  const h = new File(d.uri).open();
  try {
    for (;;) {
      const p = await h.readBytes(PARCA);
      if (!p.length) break;
      n += p.length;
      bildir(n);
      yield p;
      await nefes();
    }
  } finally {
    h.close();
  }
}

async function oku(d: SecilenDosya, asama: 'mimari' | 'statik', ilerle: (i: Ilerleme) => void) {
  if (d.boyut > MOBIL_EN_COK)
    throw new Error(
      `Dosya telefonda okunamayacak kadar büyük (en çok 30 MB). Büyük çizimleri web uygulamasında analiz et.`,
    );
  return dxf.readDxf(parcalar(d, (n) => ilerle({ asama, okunan: n, toplam: d.boyut })));
}

export interface OkunanCizim {
  analiz: AnalizSonucu;
  /** Önizleme için mimari çizim verisi (cihazda kalır). */
  veri: dxf.DxfData;
}

export async function cizimiOku(
  mimari: SecilenDosya | null,
  statik: SecilenDosya | null,
  ornek: boolean,
  ilerle: (i: Ilerleme) => void,
): Promise<OkunanCizim> {
  try {
    let dm: dxf.DxfData;
    let ds: dxf.DxfData | null = null;
    if (ornek) {
      ilerle({ asama: 'cozumleme', okunan: 0, toplam: 0 });
      await nefes();
      const o = dxf.exampleDrawings();
      dm = await dxf.readDxfBytes(o.mimari);
      ds = await dxf.readDxfBytes(o.statik);
    } else {
      if (!mimari) throw new Error('Mimari DXF dosyasını seç.');
      dm = await oku(mimari, 'mimari', ilerle);
      if (statik) ds = await oku(statik, 'statik', ilerle);
    }
    ilerle({ asama: 'cozumleme', okunan: 0, toplam: 0 });
    await nefes();
    const a = dxf.analyzeDrawings(dm, ds);
    if (a.hata !== undefined) throw new Error(a.hata);
    const { veri, ...analiz } = a;
    return { analiz, veri: veri.mimari };
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(
      /[çğıöşüİ]/i.test(m) ? m : "Çizim okunamadı. Dosyanın AutoCAD'den alınmış bir DXF olduğundan emin ol.",
      { cause: e },
    );
  }
}
