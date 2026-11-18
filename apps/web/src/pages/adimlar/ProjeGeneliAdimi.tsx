import type { ProjectInput } from '@repiom/core';
import { OnayKutusu, SayiAlani } from '../../components/form';
import type { AdimOzellikleri } from './ortak';

type Onay =
  'satisOfisi' | 'ornekDaire' | 'jenerator' | 'trafo' | 'hamam' | 'sauna' | 'finHamami' | 'fitness' | 'havuz';

export function ProjeGeneliAdimi({ girdi, degistir }: AdimOzellikleri) {
  const onay = (alan: Onay, etiket: string) => (
    <OnayKutusu
      etiket={etiket}
      deger={girdi[alan]}
      degistir={(x) => degistir((p: ProjectInput) => void (p[alan] = x))}
    />
  );
  return (
    <section className="kart" aria-labelledby="pg-baslik">
      <h2 id="pg-baslik">Proje geneli</h2>
      <div className="izgara">
        <SayiAlani
          etiket="İnşaat süresi (ay)"
          aciklama="Boş bırakılırsa 18 ay."
          deger={girdi.sureAy}
          tamSayi
          min={1}
          max={120}
          degistir={(x) => degistir((p) => void (p.sureAy = x))}
        />
        <SayiAlani
          etiket="KDV oranı (%)"
          aciklama="Boş bırakılırsa %20."
          deger={girdi.kdvOrani}
          max={100}
          degistir={(x) => degistir((p) => void (p.kdvOrani = x))}
        />
        <SayiAlani
          etiket="Öngörülemeyen giderler oranı (%)"
          aciklama="Boş bırakılırsa %2."
          deger={girdi.ongorulemeyenOrani}
          max={100}
          degistir={(x) => degistir((p) => void (p.ongorulemeyenOrani = x))}
        />
      </div>
      <h3>Tesisler</h3>
      <div className="izgara onaylar">
        {onay('satisOfisi', 'Satış ofisi yapılacak')}
        {onay('ornekDaire', 'Örnek daire yapılacak')}
        {onay('jenerator', 'Jeneratör')}
        {onay('trafo', 'Trafo')}
      </div>
      <h3>Sosyal tesisler</h3>
      <div className="izgara onaylar">
        {onay('hamam', 'Hamam')}
        {onay('sauna', 'Sauna')}
        {onay('finHamami', 'Fin hamamı')}
        {onay('fitness', 'Fitness')}
        {onay('havuz', 'Havuz')}
      </div>
      {girdi.havuz && (
        <div className="izgara">
          <SayiAlani
            etiket="Havuz su yüzeyi (m²)"
            deger={girdi.havuzM2}
            degistir={(x) => degistir((p) => void (p.havuzM2 = x))}
          />
        </div>
      )}
    </section>
  );
}
