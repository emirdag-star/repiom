export interface MagazaDurumu {
  /** Mağaza bağlantısı hazır mı? */
  hazir: boolean;
  /** Ürün kimliği → mağazanın gösterdiği fiyat (ör. "₺499,99"). Gerçek mağazada bilinmeyen ürün listede olmaz. */
  fiyatlar: Record<string, string>;
  /** Satın almayı başlatır; sonuç `tamam` / `hata` geri çağrılarıyla gelir. */
  satinAl: (urun: string) => Promise<void>;
  sahte: boolean;
}

export type MagazaKancasi = (
  urunler: string[],
  geri: { tamam: (yeni: boolean) => void; hata: (mesaj: string) => void },
  webFiyatlari: Record<string, number>,
) => MagazaDurumu;
