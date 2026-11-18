/// <reference lib="webworker" />
/**
 * DXF okuma ve analizi tarayıcıda, ana sayfayı kilitlemeden. Dosya parça parça okunur (100 MB+ dosyalar);
 * çizimin kendisi hiçbir yere gönderilmez. Çizim verisi burada tutulur; önizleme de burada çizilir.
 */
import { dxf } from '@repiom/core';
import type { IsciIstegi, IsciYaniti } from './mesajlar';

declare const self: DedicatedWorkerGlobalScope;
const gonder = (m: IsciYaniti) => self.postMessage(m);

let veri: dxf.DxfData | null = null;

async function dosyaOku(f: File, asama: 'mimari' | 'statik'): Promise<dxf.DxfData> {
  const okuyucu = f.stream().getReader();
  const parcalar: AsyncIterable<Uint8Array> = {
    [Symbol.asyncIterator]: () => ({
      next: async () => {
        const r = await okuyucu.read();
        return r.done ? { done: true, value: undefined } : { done: false, value: r.value };
      },
    }),
  };
  let son = 0;
  return dxf.readDxf(parcalar, (n) => {
    // Çok sık mesaj göndermemek için her ~2 MB'da bir.
    if (n - son > 2_000_000 || n === f.size) {
      son = n;
      gonder({ tur: 'ilerleme', asama, okunan: n, toplam: f.size });
    }
  });
}

async function analiz(m: Extract<IsciIstegi, { tur: 'analiz' }>) {
  let dm: dxf.DxfData;
  let ds: dxf.DxfData | null = null;
  if (m.ornek) {
    const o = dxf.exampleDrawings();
    dm = await dxf.readDxfBytes(o.mimari);
    ds = await dxf.readDxfBytes(o.statik);
  } else {
    if (!m.mimari) throw new Error('Mimari DXF dosyasını seç.');
    dm = await dosyaOku(m.mimari, 'mimari');
    if (m.statik) ds = await dosyaOku(m.statik, 'statik');
  }
  gonder({ tur: 'ilerleme', asama: 'cozumleme', okunan: 0, toplam: 0 });
  const a = dxf.analyzeDrawings(dm, ds);
  if (a.hata !== undefined) throw new Error(a.hata);
  veri = a.veri.mimari;
  const { veri: _veri, ...sonuc } = a;
  void _veri;
  gonder({ tur: 'sonuc', analiz: sonuc });
}

async function onizleme(m: Extract<IsciIstegi, { tur: 'onizleme' }>) {
  if (!veri) return gonder({ tur: 'onizleme', istekId: m.istekId, blob: null });
  const tuval = new OffscreenCanvas(m.genislik, m.yukseklik);
  const c = tuval.getContext('2d')!;
  dxf.renderPlan(c as unknown as dxf.Canvas2D, m.genislik, m.yukseklik, veri, m.bolge, {
    isaret: m.isaret,
    yazi: m.yazi,
  });
  gonder({ tur: 'onizleme', istekId: m.istekId, blob: await tuval.convertToBlob({ type: 'image/png' }) });
}

self.onmessage = (e: MessageEvent<IsciIstegi>) => {
  const m = e.data;
  const is = m.tur === 'analiz' ? analiz(m) : onizleme(m);
  is.catch((err: unknown) => {
    const mesaj = err instanceof Error ? err.message : String(err);
    gonder({
      tur: 'hata',
      mesaj: /[çğıöşüİ]/i.test(mesaj)
        ? mesaj
        : "Çizim okunamadı. Dosyanın AutoCAD'den alınmış bir DXF olduğundan emin ol.",
    });
  });
};
