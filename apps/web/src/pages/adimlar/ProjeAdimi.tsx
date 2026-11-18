import { emptyBlock, PROVINCES, siteBlockTemplate } from '@repiom/core';
import { useOnay } from '../../components/OnayPenceresi';
import { MetinAlani, SayiAlani, SecimAlani } from '../../components/form';
import type { AdimOzellikleri } from './ortak';

const ILLER = PROVINCES.map((p) => p.ad);

export function ProjeAdimi({ girdi, degistir, blokSec }: AdimOzellikleri) {
  const onayla = useOnay();
  const bloklar = girdi.bloklar ?? [];

  const blokAdedi = (n: number | '') =>
    degistir((p) => {
      p.blokAdedi = n;
      const hedef = Math.max(1, Math.min(10, n === '' ? (p.bloklar ?? []).length || 1 : n));
      const b = p.bloklar ?? (p.bloklar = []);
      while (b.length < hedef) b.push(emptyBlock(b.length));
      b.length = hedef;
    });

  const sablon = async () => {
    const dolu = (girdi.tipler ?? []).length > 0 || bloklar.some((b) => (b.katlar ?? []).length > 0);
    if (
      dolu &&
      !(await onayla({
        baslik: 'Şablon uygulansın mı?',
        metin: 'Şablon, girdiğin daire tiplerinin ve katların yerine geçecek.',
        evet: 'Şablonu uygula',
      }))
    )
      return;
    degistir((p) => {
      const yeni = siteBlockTemplate(structuredClone(p));
      Object.assign(p, yeni);
    });
    blokSec(0);
  };

  return (
    <>
      <section className="kart sablon" aria-labelledby="sablon-baslik">
        <div>
          <h2 id="sablon-baslik">Hazır şablon</h2>
          <p className="not">
            Site bloğu: blok başına 1 bodrum, 1 otopark, 10 normal kat; her katta 2 adet 2+1 ve 2 adet 3+1
            daire; 2 asansör. Toplam inşaat alanını girdiysen kat sayısı ona göre ayarlanır.
          </p>
        </div>
        <button type="button" onClick={() => void sablon()}>
          Site bloğu şablonunu uygula
        </button>
      </section>
      <section className="kart" aria-labelledby="proje-bilgi-baslik">
        <h2 id="proje-bilgi-baslik">Proje bilgileri</h2>
        <p className="not">
          Bildiğin kadarını gir. Hesap için toplam inşaat alanı yeterli; kat ve daire bilgisi girersen hesap o
          bilgilere göre yapılır ve toplam inşaat alanı yok sayılır.
        </p>
        <div className="izgara">
          <MetinAlani
            etiket="Proje adı"
            deger={girdi.ad}
            degistir={(x) => degistir((p) => void (p.ad = x))}
          />
          <SecimAlani
            etiket="İl"
            deger={girdi.il}
            secenekler={ILLER}
            bosSecenek={false}
            degistir={(x) => degistir((p) => void (p.il = x))}
          />
          <SayiAlani
            etiket="Toplam inşaat alanı (m²)"
            deger={girdi.toplamInsaatAlani}
            degistir={(x) => degistir((p) => void (p.toplamInsaatAlani = x))}
          />
          <SayiAlani
            etiket="Arsa alanı (m²)"
            deger={girdi.arsa}
            degistir={(x) => degistir((p) => void (p.arsa = x))}
          />
          <SayiAlani
            etiket="Blok adedi"
            deger={girdi.blokAdedi}
            tamSayi
            min={1}
            max={10}
            degistir={blokAdedi}
          />
          <SayiAlani
            etiket="Toplam oturum alanı (m²)"
            deger={girdi.toplamOturum}
            degistir={(x) => degistir((p) => void (p.toplamOturum = x))}
          />
        </div>
        <h3>Blok adları</h3>
        <div className="izgara">
          {bloklar.map((b, n) => (
            <MetinAlani
              key={n}
              etiket={`${n + 1}. blok`}
              deger={b.ad}
              enCok={60}
              degistir={(x) => degistir((p) => void (p.bloklar![n]!.ad = x))}
            />
          ))}
        </div>
      </section>
    </>
  );
}
