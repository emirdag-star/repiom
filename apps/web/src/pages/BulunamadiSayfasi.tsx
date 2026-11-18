import { Link } from 'react-router';

export function BulunamadiSayfasi() {
  return (
    <section className="kart dar" aria-labelledby="bulunamadi-baslik">
      <h1 id="bulunamadi-baslik">Sayfa bulunamadı</h1>
      <p>Aradığın sayfa yok ya da taşınmış olabilir.</p>
      <Link className="dugme birincil" to="/">
        Projelerime dön
      </Link>
    </section>
  );
}
