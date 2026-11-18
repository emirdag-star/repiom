import { sayi } from '../../lib/bicim';
import { type AdimOzellikleri } from './ortak';

export function Uyarilar({ uyarilar }: { uyarilar: string[] }) {
  if (!uyarilar.length) return null;
  return (
    <div role="status">
      {uyarilar.map((u, i) => (
        <div className="uyari" key={i}>
          {u}
        </div>
      ))}
    </div>
  );
}

export function OzetAdimi({ editor, girdi, adimaGit }: AdimOzellikleri) {
  const s = editor.sonuc!;
  if (s.hata !== undefined) {
    return (
      <section className="kart" aria-labelledby="ozet-baslik">
        <h2 id="ozet-baslik">Özet</h2>
        <div className="uyari" role="alert">
          {s.hata}
        </div>
        <div className="satir">
          <button type="button" onClick={() => adimaGit('proje')}>
            Proje bilgilerine dön
          </button>
        </div>
      </section>
    );
  }
  const o = s.ozet;
  return (
    <section className="kart" aria-labelledby="ozet-baslik">
      <h2 id="ozet-baslik">Özet</h2>
      <Uyarilar uyarilar={s.uyarilar} />
      <div className="kaydir">
        <table>
          <caption className="gizli">Blok özetleri</caption>
          <thead>
            <tr>
              <th scope="col">Blok</th>
              <th scope="col" className="s">
                Kat
              </th>
              <th scope="col" className="s">
                Daire
              </th>
              <th scope="col" className="s">
                İnşaat alanı (m²)
              </th>
            </tr>
          </thead>
          <tbody>
            {s.bloklar.map((b, i) => (
              <tr key={i}>
                <td>{b.ad}</td>
                <td className="s">{sayi(b.v.KAT_TOPLAM as number)}</td>
                <td className="s">{sayi(b.v.ND as number)}</td>
                <td className="s">{sayi(b.v.BIA as number)}</td>
              </tr>
            ))}
            <tr className="toplam">
              <td>Toplam</td>
              <td />
              <td className="s">{sayi(o.toplamDaire)}</td>
              <td className="s">{sayi(o.toplamInsaatAlani)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="bilgi">
        <span>
          İl: <b>{String(girdi.il || '—')}</b>
        </span>
        <span>
          Süre: <b>{String(s.proje.SURE_AY)} ay</b>
        </span>
        <span>
          KDV: <b>%{sayi(o.kdvOrani * 100)}</b>
        </span>
      </div>
      <div className="satir">
        <span className="not">Girdileri değiştirmek için üstteki adımlara dönebilirsin.</span>
        <button type="button" className="birincil buyuk" onClick={() => adimaGit('sonuc')}>
          Maliyet hesapla
        </button>
      </div>
    </section>
  );
}
