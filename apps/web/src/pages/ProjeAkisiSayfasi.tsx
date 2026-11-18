import { Link, Navigate, NavLink, useParams } from 'react-router';

/** Talimattaki 7 adımlı akış. İçerikler Faz 3'te doldurulacak. */
export const ADIMLAR = [
  { yol: 'proje', ad: 'Proje' },
  { yol: 'daire-tipleri', ad: 'Daire tipleri' },
  { yol: 'katlar', ad: 'Katlar' },
  { yol: 'diger-bilgiler', ad: 'Diğer bilgiler' },
  { yol: 'proje-geneli', ad: 'Proje geneli' },
  { yol: 'ozet', ad: 'Özet' },
  { yol: 'sonuc', ad: 'Sonuç' },
] as const;

export function ProjeAkisiSayfasi() {
  const { projeId = 'yeni', adim = 'proje' } = useParams();
  const sira = ADIMLAR.findIndex((a) => a.yol === adim);
  if (sira < 0) return <Navigate to={`/proje/${projeId}/proje`} replace />;
  const aktif = ADIMLAR[sira]!;
  const onceki = ADIMLAR[sira - 1];
  const sonraki = ADIMLAR[sira + 1];

  return (
    <section aria-labelledby="adim-baslik">
      <nav className="adimlar" aria-label="Hesap adımları">
        <ol>
          {ADIMLAR.map((a, i) => (
            <li key={a.yol}>
              <NavLink to={`/proje/${projeId}/${a.yol}`}>
                <span className="adim-no" aria-hidden="true">
                  {i + 1}
                </span>
                {a.ad}
              </NavLink>
            </li>
          ))}
        </ol>
      </nav>
      <div className="kart">
        <h1 id="adim-baslik">
          {sira + 1}. {aktif.ad}
        </h1>
        <p className="not">Bu ekran hazırlanıyor. Hesap adımları bir sonraki aşamada eklenecek.</p>
        <div className="satir">
          {onceki ? (
            <Link className="dugme" to={`/proje/${projeId}/${onceki.yol}`}>
              ← {onceki.ad}
            </Link>
          ) : (
            <Link className="dugme" to="/">
              ← Projelerim
            </Link>
          )}
          {sonraki && (
            <Link className="dugme birincil" to={`/proje/${projeId}/${sonraki.yol}`}>
              {sonraki.ad} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
