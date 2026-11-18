export function HataKutusu({ mesaj }: { mesaj: string | null | undefined }) {
  if (!mesaj) return null;
  return (
    <div className="hata-kutusu" role="alert">
      {mesaj}
    </div>
  );
}
