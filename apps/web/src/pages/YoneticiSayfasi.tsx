import { HataKutusu } from '../components/HataKutusu';
import { Yukleniyor } from '../components/Yukleniyor';
import { turkceHata } from '../lib/hatalar';
import { useYoneticiMi } from '../lib/yonetici';

/** Yönetici ekranı. Yetki sunucuda denetlenir; burada yalnız gösterim yapılır. İçerik Faz 4 ve 6'da. */
export function YoneticiSayfasi() {
  const yonetici = useYoneticiMi();
  if (yonetici.isPending) return <Yukleniyor />;
  if (yonetici.isError) return <HataKutusu mesaj={turkceHata(yonetici.error)} />;
  if (!yonetici.data) {
    return (
      <section className="kart" aria-labelledby="yonetici-baslik">
        <h1 id="yonetici-baslik">Yönetici</h1>
        <p>Bu sayfayı görmek için yönetici yetkisi gerekir.</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="yonetici-baslik">
      <h1 id="yonetici-baslik">Yönetici</h1>
      <div className="izgara">
        <div className="kart">
          <h2>Fiyat listeleri</h2>
          <p className="not">Excel ile fiyat yükleme, farkları görme ve yayınlama burada olacak.</p>
        </div>
        <div className="kart">
          <h2>Bekleyen ödemeler</h2>
          <p className="not">Havale/EFT onayları burada olacak.</p>
        </div>
        <div className="kart">
          <h2>Paketler ve haklar</h2>
          <p className="not">Paket fiyatları ve elle hak tanımlama burada olacak.</p>
        </div>
      </div>
    </section>
  );
}
