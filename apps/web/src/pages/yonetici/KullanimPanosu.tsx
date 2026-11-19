/**
 * Yönetici: çerezsiz kullanım ölçümü. Kayıt, proje, analiz ve ödeme sayıları mevcut kayıtlardan türetilir; adım ve
 * rapor sayıları kişiye bağlanmayan günlük sayaçlardır.
 */
import { ADIMLAR } from '@repiom/istemci/adimlar';
import { kullanimOzeti, type KullanimGunu } from '@repiom/istemci/olcum';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { HataKutusu } from '../../components/HataKutusu';
import { Yukleniyor } from '../../components/Yukleniyor';
import { sayi } from '../../lib/bicim';
import { turkceHata } from '../../lib/hatalar';

const SUTUNLAR: [keyof KullanimGunu, string][] = [
  ['kayit', 'Yeni kayıt'],
  ['proje', 'Yeni proje'],
  ['analiz', 'Çizim analizi'],
  ['deneme', 'Örnek çizim denemesi'],
  ['odeme', 'Web ödemesi'],
  ['magaza', 'Mağaza satın alma'],
];

export function KullanimPanosu() {
  const [gun, setGun] = useState(30);
  const q = useQuery({ queryKey: ['kullanim', gun], queryFn: () => kullanimOzeti(gun) });
  const veri = q.data ?? [];
  const toplam = (k: keyof KullanimGunu) => veri.reduce((s, r) => s + Number(r[k] ?? 0), 0);
  const olay = (o: string) => veri.reduce((s, r) => s + (r.olaylar[o] ?? 0), 0);
  const huni = ADIMLAR.map((a) => [a.ad, olay(`adim:${a.yol}`)] as const);
  const enCok = Math.max(1, ...huni.map(([, n]) => n));

  return (
    <section className="kart" aria-labelledby="kullanim-baslik">
      <div className="altbaslik">
        <h2 id="kullanim-baslik">Kullanım</h2>
        <label className="satir ust-bosluksuz">
          Dönem
          <select value={gun} onChange={(e) => setGun(Number(e.target.value))}>
            <option value={7}>Son 7 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
          </select>
        </label>
      </div>
      <p className="not">
        Çerez kullanılmaz; kişiye bağlı iz tutulmaz. Adım ve rapor sayıları günlük toplamlardır (aynı kişi
        birden çok sayılabilir).
      </p>
      {q.isPending && <Yukleniyor />}
      {q.error && <HataKutusu mesaj={turkceHata(q.error)} />}
      {q.data && (
        <>
          <dl className="kartlar kucuk-kartlar">
            {SUTUNLAR.map(([k, ad]) => (
              <div className="olcu" key={k}>
                <dt className="e">{ad}</dt>
                <dd className="d kucuk-d" data-testid={`kullanim-${k}`}>
                  {sayi(toplam(k))}
                </dd>
              </div>
            ))}
            <div className="olcu">
              <dt className="e">Rapor (Excel / PDF)</dt>
              <dd className="d kucuk-d">
                {sayi(olay('rapor:excel'))} / {sayi(olay('rapor:pdf'))}
              </dd>
            </div>
            <div className="olcu">
              <dt className="e">Uygulama açılışı</dt>
              <dd className="d kucuk-d">{sayi(olay('uygulama_acilis'))}</dd>
            </div>
          </dl>
          <h3>Adımlara ulaşma</h3>
          <ol className="huni" aria-label="Adımlara ulaşma sayıları">
            {huni.map(([ad, n]) => (
              <li key={ad}>
                <span className="huni-ad">{ad}</span>
                <span className="huni-cubuk" aria-hidden="true">
                  <span style={{ width: `${(n / enCok) * 100}%` }} />
                </span>
                <span className="huni-sayi">{sayi(n)}</span>
              </li>
            ))}
          </ol>
          <details>
            <summary>Günlük tablo</summary>
            <div className="kaydir" tabIndex={0} role="region" aria-label="Günlük kullanım">
              <table className="sikisik">
                <thead>
                  <tr>
                    <th scope="col">Gün</th>
                    {SUTUNLAR.map(([k, ad]) => (
                      <th scope="col" className="s" key={k}>
                        {ad}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...veri].reverse().map((r) => (
                    <tr key={r.gun}>
                      <td>{new Date(r.gun).toLocaleDateString('tr-TR')}</td>
                      {SUTUNLAR.map(([k]) => (
                        <td className="s" key={k}>
                          {sayi(Number(r[k]))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
