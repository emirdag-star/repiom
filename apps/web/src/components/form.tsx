/**
 * Proje girdisi form alanları. Hepsi etiketli ve erişilebilir; boş bırakılabilir ('' = girilmedi).
 */
import { useId, useState, type ReactNode } from 'react';
import type { RawValue } from '@repiom/core';
import { sayiOku } from '../lib/sayi';

interface Ortak {
  etiket: string;
  aciklama?: ReactNode;
}

function Kap({
  id,
  etiket,
  aciklama,
  hata,
  children,
}: Ortak & { id: string; hata?: string | null; children: ReactNode }) {
  return (
    <div className="alan">
      <label htmlFor={id}>{etiket}</label>
      {children}
      {aciklama && (
        <p id={`${id}-aciklama`} className="alan-aciklama">
          {aciklama}
        </p>
      )}
      {hata && (
        <p id={`${id}-hata`} className="alan-hata" role="alert">
          {hata}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, aciklama: unknown, hata: unknown) =>
  [aciklama ? `${id}-aciklama` : '', hata ? `${id}-hata` : ''].filter(Boolean).join(' ') || undefined;

const sayiYaz = (x: RawValue) =>
  x === '' || x === null || x === undefined ? '' : String(x).replace('.', ',');

export function SayiAlani({
  etiket,
  aciklama,
  deger,
  degistir,
  min = 0,
  max,
  tamSayi = false,
  ipucu,
}: Ortak & {
  deger: RawValue;
  degistir: (x: number | '') => void;
  min?: number;
  max?: number;
  tamSayi?: boolean;
  ipucu?: string;
}) {
  const id = useId();
  const [metin, setMetin] = useState(sayiYaz(deger));
  const [hata, setHata] = useState<string | null>(null);
  // Dışarıdan değer değişirse (şablon, kopyalama) alan güncellenir — render sırasında eşitleme (React önerisi).
  const [oncekiDeger, setOncekiDeger] = useState(deger);
  if (!Object.is(oncekiDeger, deger)) {
    setOncekiDeger(deger);
    const d = deger === '' || deger === null || deger === undefined ? null : Number(deger);
    if (sayiOku(metin) !== d) setMetin(sayiYaz(deger));
  }

  const yaz = (s: string) => {
    setMetin(s);
    const x = sayiOku(s);
    if (x === null) {
      setHata(null);
      return degistir('');
    }
    if (Number.isNaN(x)) return setHata('Geçerli bir sayı yaz (ör. 120 ya da 2,5).');
    if (tamSayi && !Number.isInteger(x)) return setHata('Tam sayı yaz.');
    if (x < min) return setHata(`En az ${String(min).replace('.', ',')} olmalı.`);
    if (max !== undefined && x > max) return setHata(`En çok ${String(max).replace('.', ',')} olabilir.`);
    setHata(null);
    degistir(x);
  };

  return (
    <Kap id={id} etiket={etiket} aciklama={aciklama} hata={hata}>
      <input
        id={id}
        type="text"
        inputMode={tamSayi ? 'numeric' : 'decimal'}
        autoComplete="off"
        value={metin}
        placeholder={ipucu}
        aria-invalid={hata ? true : undefined}
        aria-describedby={describedBy(id, aciklama, hata)}
        onChange={(e) => yaz(e.target.value)}
      />
    </Kap>
  );
}

export function MetinAlani({
  etiket,
  aciklama,
  deger,
  degistir,
  enCok = 200,
}: Ortak & { deger: RawValue; degistir: (x: string) => void; enCok?: number }) {
  const id = useId();
  return (
    <Kap id={id} etiket={etiket} aciklama={aciklama}>
      <input
        id={id}
        type="text"
        maxLength={enCok}
        value={deger === null || deger === undefined ? '' : String(deger)}
        aria-describedby={describedBy(id, aciklama, null)}
        onChange={(e) => degistir(e.target.value)}
      />
    </Kap>
  );
}

export type Secenek = readonly [string, string] | string;

export function SecimAlani({
  etiket,
  aciklama,
  deger,
  degistir,
  secenekler,
  bosSecenek = true,
}: Ortak & {
  deger: RawValue;
  degistir: (x: string) => void;
  secenekler: readonly Secenek[];
  /** "Seçilmedi" seçeneği: varsayılan açık (boş = uygulama tamamlar). */
  bosSecenek?: boolean;
}) {
  const id = useId();
  return (
    <Kap id={id} etiket={etiket} aciklama={aciklama}>
      <select
        id={id}
        value={deger === null || deger === undefined ? '' : String(deger)}
        aria-describedby={describedBy(id, aciklama, null)}
        onChange={(e) => degistir(e.target.value)}
      >
        {bosSecenek && <option value="">Seçilmedi</option>}
        {secenekler.map((s) => {
          const [v, t] = typeof s === 'string' ? [s, s] : s;
          return (
            <option key={v} value={v}>
              {t}
            </option>
          );
        })}
      </select>
    </Kap>
  );
}

export function OnayKutusu({
  etiket,
  deger,
  degistir,
}: {
  etiket: string;
  deger: RawValue;
  degistir: (x: boolean) => void;
}) {
  const id = useId();
  return (
    <label className="onay" htmlFor={id}>
      <input id={id} type="checkbox" checked={Boolean(deger)} onChange={(e) => degistir(e.target.checked)} />
      {etiket}
    </label>
  );
}
