/** DXF worker'ını yöneten kanca: analiz başlatma, ilerleme ve plan önizlemesi. */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalizSonucu, IsciIstegi, IsciYaniti } from './mesajlar';

export interface Ilerleme {
  asama: 'mimari' | 'statik' | 'cozumleme';
  okunan: number;
  toplam: number;
}

export function useDxfIsci() {
  const isci = useRef<Worker | null>(null);
  const [ilerleme, setIlerleme] = useState<Ilerleme | null>(null);
  const bekleyen = useRef<{ coz: (a: AnalizSonucu) => void; reddet: (e: Error) => void } | null>(null);
  const onizlemeler = useRef(new Map<number, (b: Blob | null) => void>());
  const sayac = useRef(0);

  const al = useCallback(() => {
    if (!isci.current) {
      const w = new Worker(new URL('./dxf.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<IsciYaniti>) => {
        const m = e.data;
        if (m.tur === 'ilerleme') setIlerleme({ asama: m.asama, okunan: m.okunan, toplam: m.toplam });
        else if (m.tur === 'sonuc') {
          setIlerleme(null);
          bekleyen.current?.coz(m.analiz);
          bekleyen.current = null;
        } else if (m.tur === 'hata') {
          setIlerleme(null);
          bekleyen.current?.reddet(new Error(m.mesaj));
          bekleyen.current = null;
        } else if (m.tur === 'onizleme') {
          onizlemeler.current.get(m.istekId)?.(m.blob);
          onizlemeler.current.delete(m.istekId);
        }
      };
      w.onerror = () => {
        setIlerleme(null);
        bekleyen.current?.reddet(new Error('Çizim okunurken beklenmeyen bir sorun oluştu.'));
        bekleyen.current = null;
      };
      isci.current = w;
    }
    return isci.current;
  }, []);

  useEffect(() => () => isci.current?.terminate(), []);

  const analizEt = useCallback(
    (istek: Extract<IsciIstegi, { tur: 'analiz' }>) =>
      new Promise<AnalizSonucu>((coz, reddet) => {
        bekleyen.current = { coz, reddet };
        setIlerleme({
          asama: istek.ornek ? 'cozumleme' : 'mimari',
          okunan: 0,
          toplam: istek.mimari?.size ?? 0,
        });
        al().postMessage(istek);
      }),
    [al],
  );

  const onizle = useCallback(
    (bolge: [number, number, number, number], isaret: { x: number; y: number }[], yazi = true) =>
      new Promise<Blob | null>((coz) => {
        const istekId = ++sayac.current;
        onizlemeler.current.set(istekId, coz);
        const istek: IsciIstegi = {
          tur: 'onizleme',
          istekId,
          bolge,
          isaret,
          genislik: 1100,
          yukseklik: 700,
          yazi,
        };
        al().postMessage(istek);
      }),
    [al],
  );

  return { analizEt, onizle, ilerleme };
}
