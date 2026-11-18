/**
 * Belge sürümü değişince (ya da onay eksikse) giriş sonrası onay ekranı. Zorunlu belgeler onaylanmadan uygulama
 * kullanılamaz; isteğe bağlı izinler önceden işaretli olmaz.
 */
import { BELGELER } from '@repiom/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { BelgeBaglantisi } from '../components/Belge';
import { HataKutusu } from '../components/HataKutusu';
import { turkceHata } from '../lib/hatalar';
import { eksikOnaylar, onayKaydet } from '../lib/onaylar';
import { useAuth } from './useAuth';

export function YenidenOnay({ children }: { children: ReactNode }) {
  const { oturum, cikisYap } = useAuth();
  const istemci = useQueryClient();
  const eksik = useQuery({
    queryKey: ['eksik-onaylar', oturum?.user.id],
    queryFn: eksikOnaylar,
    enabled: Boolean(oturum),
  });
  const [secili, setSecili] = useState<Record<string, boolean>>({});
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);

  if (!eksik.data?.length) return <>{children}</>;
  const liste = eksik.data;
  const tamam = liste.filter((e) => e.zorunlu).every((e) => secili[e.belge]);

  const gonder = async () => {
    setHata(null);
    setMesgul(true);
    try {
      await onayKaydet(liste.filter((e) => secili[e.belge]).map((e) => e.belge));
      // İşaretlenmeyen isteğe bağlı izinler (eski sürümle verilmişti) geri alınmış sayılır.
      await onayKaydet(
        liste.filter((e) => !e.zorunlu && !secili[e.belge]).map((e) => e.belge),
        false,
      );
      await istemci.invalidateQueries({ queryKey: ['eksik-onaylar'] });
    } catch (e) {
      setHata(turkceHata(e));
    } finally {
      setMesgul(false);
    }
  };

  return (
    <section className="kart dar" aria-labelledby="yeniden-onay-baslik">
      <h1 id="yeniden-onay-baslik">Güncellenen metinler</h1>
      <p>Devam etmek için aşağıdaki metinleri okuyup onaylaman gerekiyor.</p>
      <HataKutusu mesaj={hata} />
      <fieldset className="onaylar-kutusu">
        <legend>Onaylar</legend>
        {liste.map((e) => (
          <div className="onay-satiri" key={e.belge}>
            <input
              id={`yo-${e.belge}`}
              type="checkbox"
              checked={Boolean(secili[e.belge])}
              onChange={(x) => setSecili((s) => ({ ...s, [e.belge]: x.target.checked }))}
            />
            <label htmlFor={`yo-${e.belge}`}>
              {BELGELER[e.belge].ad} (sürüm {BELGELER[e.belge].surum}){' '}
              {e.zorunlu ? (
                <span className="zorunlu">(zorunlu)</span>
              ) : (
                <span className="not">(isteğe bağlı)</span>
              )}
            </label>
          </div>
        ))}
      </fieldset>
      <p className="not">
        Metinleri oku:{' '}
        {liste.map((e, i) => (
          <span key={e.belge}>
            {i > 0 && ' · '}
            <BelgeBaglantisi id={e.belge} />
          </span>
        ))}
      </p>
      <div className="satir">
        <button type="button" onClick={() => void cikisYap()}>
          Çıkış yap
        </button>
        <button type="button" className="birincil" disabled={!tamam || mesgul} onClick={() => void gonder()}>
          Onayla ve devam et
        </button>
      </div>
    </section>
  );
}
