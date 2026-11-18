import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { HataKutusu } from '../components/HataKutusu';
import { Yukleniyor } from '../components/Yukleniyor';
import { turkceHata } from '../lib/hatalar';
import { supabase } from '../lib/supabase';

interface ProjeSatiri {
  id: string;
  ad: string;
  guncelleme: string;
}

const tarihBicimi = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

export function ProjelerimSayfasi() {
  const projeler = useQuery({
    queryKey: ['projeler'],
    queryFn: async (): Promise<ProjeSatiri[]> => {
      const { data, error } = await supabase!
        .from('projeler')
        .select('id, ad, guncelleme')
        .order('guncelleme', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section aria-labelledby="projelerim-baslik">
      <div className="sayfa-baslik">
        <h1 id="projelerim-baslik">Projelerim</h1>
        <Link className="dugme birincil" to="/proje/yeni/proje">
          Yeni proje
        </Link>
      </div>
      {projeler.isPending && <Yukleniyor metin="Projeler yükleniyor…" />}
      {projeler.isError && <HataKutusu mesaj={turkceHata(projeler.error)} />}
      {projeler.data && projeler.data.length === 0 && (
        <div className="kart bos-durum">
          <h2>Henüz projen yok</h2>
          <p>
            "Yeni proje" ile ilk projeni oluştur. Hesap için toplam inşaat alanını girmen yeterli; kat ve
            daire bilgisini istersen sonra eklersin.
          </p>
        </div>
      )}
      {projeler.data && projeler.data.length > 0 && (
        <ul className="proje-listesi">
          {projeler.data.map((p) => (
            <li key={p.id} className="kart">
              <Link to={`/proje/${p.id}/proje`}>{p.ad || 'Adsız proje'}</Link>
              <span className="not">Son değişiklik: {tarihBicimi.format(new Date(p.guncelleme))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
