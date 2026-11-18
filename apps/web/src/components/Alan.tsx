import { useId, type InputHTMLAttributes, type Ref } from 'react';

interface AlanOzellikleri extends InputHTMLAttributes<HTMLInputElement> {
  etiket: string;
  hata?: string | undefined;
  aciklama?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Etiketli, erişilebilir form alanı: hata ve açıklama ekran okuyucuya bağlanır. */
export function Alan({ etiket, hata, aciklama, ...girdi }: AlanOzellikleri) {
  const id = useId();
  const aciklamaId = aciklama ? `${id}-aciklama` : undefined;
  const hataId = hata ? `${id}-hata` : undefined;
  return (
    <div className="alan">
      <label htmlFor={id}>{etiket}</label>
      <input
        id={id}
        aria-invalid={hata ? true : undefined}
        aria-describedby={[aciklamaId, hataId].filter(Boolean).join(' ') || undefined}
        {...girdi}
      />
      {aciklama && (
        <p id={aciklamaId} className="alan-aciklama">
          {aciklama}
        </p>
      )}
      {hata && (
        <p id={hataId} className="alan-hata">
          {hata}
        </p>
      )}
    </div>
  );
}
