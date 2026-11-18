/** Yönetici: son 30 günde yapay zekâ çağrıları ve token kullanımı (maliyet takibi). */
import { useQuery } from '@tanstack/react-query';
import { HataKutusu } from '../../components/HataKutusu';
import { Yukleniyor } from '../../components/Yukleniyor';
import { sayi } from '../../lib/bicim';
import { turkceHata } from '../../lib/hatalar';
import { supabase } from '../../lib/supabase';

interface Ozet {
  cagri: number;
  basarisiz: number;
  girdi_token: number;
  cikti_token: number;
}

async function kullanimOzeti(): Promise<Ozet> {
  if (!supabase) throw new Error('Sunucu bağlantı ayarı eksik.');
  const { data, error } = await supabase.rpc('yz_kullanim_ozeti', { p_gun: 30 });
  if (error) throw error;
  const r = ((data ?? []) as Ozet[])[0];
  return {
    cagri: Number(r?.cagri ?? 0),
    basarisiz: Number(r?.basarisiz ?? 0),
    girdi_token: Number(r?.girdi_token ?? 0),
    cikti_token: Number(r?.cikti_token ?? 0),
  };
}

export function YapayZekaKullanimi() {
  const q = useQuery({ queryKey: ['yz', 'kullanim'], queryFn: kullanimOzeti });
  return (
    <section className="kart" aria-labelledby="yz-kullanim-baslik">
      <h2 id="yz-kullanim-baslik">Yapay zekâ kullanımı (son 30 gün)</h2>
      {q.isPending && <Yukleniyor />}
      {q.error && <HataKutusu mesaj={turkceHata(q.error)} />}
      {q.data && (
        <dl className="kartlar kucuk-kartlar">
          {(
            [
              ['Çağrı', q.data.cagri],
              ['Başarısız', q.data.basarisiz],
              ['Girdi token', q.data.girdi_token],
              ['Çıktı token', q.data.cikti_token],
            ] as [string, number][]
          ).map(([e, d]) => (
            <div className="olcu" key={e}>
              <dt className="e">{e}</dt>
              <dd className="d kucuk-d">{sayi(d, 0)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
