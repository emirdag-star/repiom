export function Yukleniyor({ metin = 'Yükleniyor…' }: { metin?: string }) {
  return (
    <p className="yukleniyor" role="status" aria-live="polite">
      {metin}
    </p>
  );
}
