import type { ProjectInput } from '@repiom/core';
import type { ProjeEditoru } from '../../lib/useProjeEditoru';

/** Adım bileşenlerinin ortak özellikleri. Girdi yüklenmiş olarak gelir. */
export interface AdimOzellikleri {
  editor: ProjeEditoru;
  girdi: ProjectInput;
  degistir: (fn: (taslak: ProjectInput) => void) => void;
  blok: number;
  blokSec: (n: number) => void;
  adimaGit: (yol: string) => void;
}

/** Blok sekmeleri ve "önceki bloğu kopyala" düğmesi. */
export function BlokSekmeleri({
  girdi,
  blok,
  blokSec,
  kopyala,
  kopyaMetni,
}: {
  girdi: ProjectInput;
  blok: number;
  blokSec: (n: number) => void;
  kopyala: () => void;
  kopyaMetni: string;
}) {
  const bloklar = girdi.bloklar ?? [];
  return (
    <div className="sekmeler" role="tablist" aria-label="Bloklar">
      {bloklar.map((b, n) => (
        <button
          key={n}
          type="button"
          role="tab"
          aria-selected={n === blok}
          className={n === blok ? 'aktif' : ''}
          onClick={() => blokSec(n)}
        >
          {String(b.ad || `Blok ${n + 1}`)}
        </button>
      ))}
      {blok > 0 && (
        <button type="button" className="ikincil-dugme" onClick={kopyala}>
          Önceki bloğun {kopyaMetni} kopyala
        </button>
      )}
    </div>
  );
}
