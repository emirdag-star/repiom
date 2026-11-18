/** Ana sayfa ile DXF worker'ı arasındaki mesajlar. */
import type { dxf } from '@repiom/core';

export type IsciIstegi =
  | { tur: 'analiz'; mimari: File | null; statik: File | null; ornek: boolean }
  | {
      tur: 'onizleme';
      istekId: number;
      bolge: [number, number, number, number];
      isaret: { x: number; y: number }[];
      genislik: number;
      yukseklik: number;
      yazi: boolean;
    };

/** Worker'dan dönen analiz (çizim verisi worker'da kalır; yalnız sonuçlar gelir). */
export type AnalizSonucu = Omit<dxf.DxfAnalysis, 'veri'>;

export type IsciYaniti =
  | { tur: 'ilerleme'; asama: 'mimari' | 'statik' | 'cozumleme'; okunan: number; toplam: number }
  | { tur: 'sonuc'; analiz: AnalizSonucu }
  | { tur: 'hata'; mesaj: string }
  | { tur: 'onizleme'; istekId: number; blob: Blob | null };
