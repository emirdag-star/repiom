import type { BlockSystemInput } from '@repiom/core';
import { SayiAlani, SecimAlani } from '../../components/form';
import { BlokSekmeleri, type AdimOzellikleri } from './ortak';

export function DigerBilgilerAdimi({ girdi, degistir, blok, blokSec }: AdimOzellikleri) {
  const s = girdi.bloklar![blok]!.sistem ?? {};
  const set = (alan: keyof BlockSystemInput) => (x: string | number) =>
    degistir((p) => {
      const b = p.bloklar![blok]!;
      (b.sistem ??= {})[alan] = x;
    });
  return (
    <section className="kart" aria-labelledby="diger-baslik">
      <h2 id="diger-baslik">Diğer bilgiler</h2>
      <BlokSekmeleri
        girdi={girdi}
        blok={blok}
        blokSec={blokSec}
        kopyaMetni="bilgilerini"
        kopyala={() =>
          degistir(
            (p) => void (p.bloklar![blok]!.sistem = structuredClone(p.bloklar![blok - 1]!.sistem ?? {})),
          )
        }
      />
      <p className="not">Bilmediklerini "Seçilmedi" bırakabilirsin; tipik konut değerleri kullanılır.</p>
      <div className="izgara">
        <SecimAlani
          etiket="Dış cephe kaplaması"
          deger={s.cephe}
          secenekler={[
            ['EPS', 'EPS'],
            ['XPS', 'XPS'],
            ['TAŞYÜNÜ', 'Taşyünü'],
            ['ÖZEL', 'Özel'],
          ]}
          degistir={set('cephe')}
        />
        <SecimAlani
          etiket="Mantolama altına sıva yapılacak mı?"
          aciklama="Seçilmezse Evet sayılır."
          deger={s.mantoAltiSiva}
          secenekler={[
            ['EVET', 'Evet'],
            ['HAYIR', 'Hayır'],
          ]}
          degistir={set('mantoAltiSiva')}
        />
        <SayiAlani etiket="Asansör adedi" deger={s.asansor} tamSayi max={20} degistir={set('asansor')} />
        <SayiAlani
          etiket="Merdiven adedi"
          deger={s.merdiven}
          tamSayi
          min={1}
          max={20}
          degistir={set('merdiven')}
        />
        <SecimAlani
          etiket="Isıtma sistemi"
          deger={s.isitma}
          secenekler={[
            ['KOMBİ', 'Kombi'],
            ['MERKEZİ', 'Merkezi'],
          ]}
          degistir={set('isitma')}
        />
        <SecimAlani
          etiket="Isıtma şekli"
          deger={s.isitmaSekli}
          secenekler={[
            ['RADYATÖR', 'Radyatör'],
            ['YERDEN ISITMA', 'Yerden ısıtma'],
          ]}
          degistir={set('isitmaSekli')}
        />
        <SecimAlani
          etiket="Banyo-WC asma tavan"
          deger={s.banyoTavan}
          secenekler={[
            ['YEŞİL ALÇIPAN', 'Yeşil alçıpan'],
            ['ALÜMİNYUM PANEL', 'Alüminyum panel'],
          ]}
          degistir={set('banyoTavan')}
        />
        <SecimAlani
          etiket="Çatı tipi"
          deger={s.cati}
          secenekler={[
            ['KIRMA', 'Kırma çatı'],
            ['TERAS', 'Teras çatı'],
          ]}
          degistir={set('cati')}
        />
        <SecimAlani
          etiket="Döşeme sistemi"
          deger={s.doseme}
          secenekler={[
            ['ASMOLEN', 'Asmolen'],
            ['KİRİŞLİ', 'Kirişli'],
          ]}
          degistir={set('doseme')}
        />
        <SecimAlani
          etiket="Su deposu"
          deger={s.suDeposu}
          secenekler={[
            ['YOK', 'Yok'],
            ['BETONARME', 'Betonarme'],
            ['MODÜLER', 'Modüler'],
          ]}
          degistir={set('suDeposu')}
        />
        <SayiAlani
          etiket="Dilatasyon adedi"
          deger={s.dilatasyon}
          tamSayi
          max={20}
          degistir={set('dilatasyon')}
        />
      </div>
    </section>
  );
}
