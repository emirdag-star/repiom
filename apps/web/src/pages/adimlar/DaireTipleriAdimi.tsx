import { emptyType } from '@repiom/core';
import { useOnay } from '../../components/OnayPenceresi';
import { MetinAlani, OnayKutusu, SayiAlani, SecimAlani } from '../../components/form';
import { VAR_YOK } from '../../lib/sayi';
import { tipEtiketi } from '../../lib/bicim';
import { type AdimOzellikleri } from './ortak';

const DUZENLER = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1', '6+1'];

export function DaireTipleriAdimi({ girdi, degistir }: AdimOzellikleri) {
  const onayla = useOnay();
  const tipler = girdi.tipler ?? [];

  const sil = async (n: number) => {
    const id = tipler[n]!.id;
    const kullaniliyor = (girdi.bloklar ?? []).some((b) =>
      (b.katlar ?? []).some((k) => (k.daireler ?? []).some((d) => d.tip === id)),
    );
    if (
      kullaniliyor &&
      !(await onayla({
        baslik: 'Daire tipi silinsin mi?',
        metin: 'Bu tip bazı katlarda kullanılıyor; o katlardan da çıkarılacak.',
        evet: 'Sil',
        tehlikeli: true,
      }))
    )
      return;
    degistir((p) => {
      p.tipler!.splice(n, 1);
      (p.bloklar ?? []).forEach((b) =>
        (b.katlar ?? []).forEach((k) => {
          k.daireler = (k.daireler ?? []).filter((d) => d.tip !== id);
        }),
      );
    });
  };

  return (
    <section className="kart" aria-labelledby="tipler-baslik">
      <h2 id="tipler-baslik">Daire tipleri</h2>
      <p className="not">
        Tipler bütün bloklarda ortaktır. Katlar adımında her kata bu tiplerden daire yerleştirirsin. Bu adımı
        boş bırakabilirsin; daireler kat alanından tahmin edilir.
      </p>
      {!tipler.length && <p>Henüz daire tipi yok.</p>}
      {tipler.map((t, n) => {
        const tip = (fn: (x: (typeof tipler)[number]) => void) => degistir((p) => fn(p.tipler![n]!));
        return (
          <div className="altkart" key={t.id}>
            <div className="altbaslik">
              <h3>{tipEtiketi(t)}</h3>
              <button
                type="button"
                className="kucuk"
                onClick={() => void sil(n)}
                aria-label={`${tipEtiketi(t)} tipini sil`}
              >
                Sil
              </button>
            </div>
            <div className="izgara">
              <MetinAlani
                etiket="Tip adı (ör. TİP1)"
                deger={t.ad}
                enCok={40}
                degistir={(x) => tip((y) => void (y.ad = x))}
              />
              <SecimAlani
                etiket="Oda düzeni"
                deger={t.duzen}
                secenekler={DUZENLER}
                degistir={(x) => tip((y) => void (y.duzen = x))}
              />
              <SayiAlani
                etiket="Brüt alan (m²)"
                deger={t.brut}
                degistir={(x) => tip((y) => void (y.brut = x))}
              />
              <SayiAlani
                etiket="Balkon adedi"
                deger={t.balkon}
                tamSayi
                max={10}
                degistir={(x) => tip((y) => void (y.balkon = x))}
              />
              <SecimAlani
                etiket="Mutfak"
                deger={t.mutfak}
                secenekler={[
                  ['KAPALI', 'Kapalı'],
                  ['AMERİKAN', 'Amerikan'],
                ]}
                degistir={(x) => tip((y) => void (y.mutfak = x))}
              />
              <SecimAlani
                etiket="Işık bandı"
                deger={t.isikBandi}
                secenekler={VAR_YOK}
                degistir={(x) => tip((y) => void (y.isikBandi = x))}
              />
              <SecimAlani
                etiket="Alaturka WC"
                deger={t.alaturka}
                secenekler={VAR_YOK}
                degistir={(x) => tip((y) => void (y.alaturka = x))}
              />
              <SayiAlani
                etiket="Ebeveyn banyo adedi"
                deger={t.ebeveynBanyo}
                tamSayi
                max={5}
                degistir={(x) => tip((y) => void (y.ebeveynBanyo = x))}
              />
              <SecimAlani
                etiket="Ankastre"
                deger={t.ankastre}
                secenekler={VAR_YOK}
                degistir={(x) => tip((y) => void (y.ankastre = x))}
              />
              <SayiAlani
                etiket="Klima adedi"
                deger={t.klima}
                tamSayi
                max={20}
                degistir={(x) => tip((y) => void (y.klima = x))}
              />
            </div>
            <OnayKutusu
              etiket="Dubleks daire"
              deger={t.dubleks}
              degistir={(x) => tip((y) => void (y.dubleks = x))}
            />
          </div>
        );
      })}
      <div className="satir">
        <button
          type="button"
          onClick={() => degistir((p) => void p.tipler!.push(emptyType(`TİP${(p.tipler ?? []).length + 1}`)))}
        >
          Daire tipi ekle
        </button>
      </div>
    </section>
  );
}
