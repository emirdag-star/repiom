/**
 * Erişilebilir onay penceresi (<dialog>). Kullanım: const onayla = useOnay(); if (await onayla({...})) …
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface OnaySecenekleri {
  baslik: string;
  metin: string;
  evet: string;
  hayir?: string;
  tehlikeli?: boolean;
}

const OnayContext = createContext<((s: OnaySecenekleri) => Promise<boolean>) | null>(null);

export function OnaySaglayici({ children }: { children: ReactNode }) {
  const pencere = useRef<HTMLDialogElement>(null);
  const [secenek, setSecenek] = useState<OnaySecenekleri | null>(null);
  const cozum = useRef<((x: boolean) => void) | null>(null);

  const onayla = useCallback((s: OnaySecenekleri) => {
    setSecenek(s);
    return new Promise<boolean>((resolve) => {
      cozum.current = resolve;
      requestAnimationFrame(() => pencere.current?.showModal());
    });
  }, []);

  const kapat = (sonuc: boolean) => {
    pencere.current?.close();
    cozum.current?.(sonuc);
    cozum.current = null;
  };

  return (
    <OnayContext.Provider value={onayla}>
      {children}
      <dialog
        ref={pencere}
        className="onay-penceresi"
        aria-labelledby="onay-baslik"
        aria-describedby="onay-metin"
        onCancel={(e) => {
          e.preventDefault();
          kapat(false);
        }}
      >
        {secenek && (
          <>
            <h2 id="onay-baslik">{secenek.baslik}</h2>
            <p id="onay-metin">{secenek.metin}</p>
            <div className="satir">
              <button type="button" onClick={() => kapat(false)} autoFocus>
                {secenek.hayir ?? 'Vazgeç'}
              </button>
              <button
                type="button"
                className={secenek.tehlikeli ? 'tehlikeli' : 'birincil'}
                onClick={() => kapat(true)}
              >
                {secenek.evet}
              </button>
            </div>
          </>
        )}
      </dialog>
    </OnayContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnay() {
  const f = useContext(OnayContext);
  if (!f) throw new Error('useOnay, OnaySaglayici içinde kullanılmalı.');
  return f;
}
