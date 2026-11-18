/**
 * Çizimden maliyet (DXF analizi): yükleme → tarayıcıda okuma (Web Worker) → kontrol ekranı → projeye aktarma.
 * Çizim sunucuya gönderilmez.
 */
import { calculate, dxf, PROVINCES, type ProjectInput } from '@repiom/core';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { EkranHatasi } from '../cizim/EkranHatasi';
import { KontrolEkrani, type EkKalem } from '../cizim/KontrolEkrani';
import type { AnalizSonucu } from '../cizim/mesajlar';
import { useDxfIsci, type Ilerleme } from '../cizim/useDxfIsci';
import { HataKutusu } from '../components/HataKutusu';
import { MetinAlani, SayiAlani, SecimAlani } from '../components/form';
import { analizBaslat, analizIade, analizProjeyeBagla, sha256, useHak } from '../lib/abonelik';
import { aktifFiyatListesi } from '../lib/fiyat';
import { turkceHata } from '../lib/hatalar';
import { ozetCikar, projeOlustur } from '../lib/projeler';

const ILLER = PROVINCES.map((p) => p.ad);
const MB = (n: number) => `${(n / 1048576).toFixed(n < 10 * 1048576 ? 1 : 0).replace('.', ',')} MB`;

export interface Varsayimlar {
  ad: string;
  il: string;
  H: number;
  donati: number;
}

function ilerlemeMetni(i: Ilerleme): string {
  if (i.asama === 'cozumleme') return 'Planlar çözümleniyor…';
  return `${i.asama === 'mimari' ? 'Mimari' : 'Statik'} okunuyor: ${MB(i.okunan)} / ${MB(i.toplam)}`;
}

/** Proje girdisinden yeni kalem listesi (kontrol ekranında dahil/hariç ve fiyat düzenleme için). */
function ekListesi(p: dxf.DxfProject): EkKalem[] {
  const l: EkKalem[] = [];
  Object.keys(p.ekKalemler ?? {}).forEach((bk) => {
    const n = +bk.slice(4);
    (p.ekKalemler![bk] ?? []).forEach((e) =>
      l.push({
        ...e,
        metraj: Number(e.metraj) || 0,
        fiyat: Number(e.fiyat) || 0,
        blok: String(p.bloklar![n]!.ad),
        bk,
        dahil: true,
      }),
    );
  });
  return l;
}

export function CizimSayfasi() {
  const [arama] = useSearchParams();
  const ornek = arama.get('ornek') === '1';
  const navigate = useNavigate();
  const { analizEt, onizle, ilerleme } = useDxfIsci();
  const [v, setV] = useState<Varsayimlar>({
    ad: ornek ? 'Örnek çizim analizi' : '',
    il: 'İstanbul',
    H: 3,
    donati: 110,
  });
  const [mimari, setMimari] = useState<File | null>(null);
  const [statik, setStatik] = useState<File | null>(null);
  const [analiz, setAnaliz] = useState<AnalizSonucu | null>(null);
  const [ekler, setEkler] = useState<EkKalem[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [aktariliyor, setAktariliyor] = useState(false);
  const [analizId, setAnalizId] = useState<number | null>(null);
  const istemci = useQueryClient();
  const hak = useHak(!ornek);

  const baslat = async () => {
    setHata(null);
    if (!ornek && !mimari) return setHata('Mimari DXF dosyasını seç.');
    try {
      const a = await analizEt({ tur: 'analiz', mimari, statik, ornek });
      // Çizim başarıyla okundu: kontrol ekranı açılmadan hemen önce hak sunucuda düşer
      // (deneme yalnız hazır örnek çizimin parmak izleriyle ücretsiz). Hak yoksa ekran açılmaz.
      const o = dxf.exampleDrawings();
      const ozetler = ornek ? await Promise.all([sha256(o.mimari), sha256(o.statik)]) : [];
      const dosyalar = [mimari, statik]
        .filter((f): f is File => Boolean(f))
        .map((f) => ({ ad: f.name, boyut: f.size }));
      setAnalizId(await analizBaslat(v.ad.trim() || 'Çizim analizi', ornek ? [] : dosyalar, ornek, ozetler));
      void istemci.invalidateQueries({ queryKey: ['hak'] });
      setAnaliz(a);
      setEkler(
        ekListesi(dxf.projectFromAnalysis(a, v.ad, { katYuksekligi: v.H, donatiKgM3: v.donati, il: v.il })),
      );
      window.scrollTo(0, 0);
    } catch (e) {
      setHata(turkceHata(e));
    }
  };

  const aktar = async () => {
    if (!analiz) return;
    setHata(null);
    setAktariliyor(true);
    try {
      const ad = v.ad.trim() || 'Çizim analizi';
      const p = dxf.projectFromAnalysis(analiz, ad, { katYuksekligi: v.H, donatiKgM3: v.donati, il: v.il });
      const ek: NonNullable<ProjectInput['ekKalemler']> = {};
      ekler
        .filter((e) => e.dahil)
        .forEach((e) => {
          (ek[e.bk] ??= []).push({
            grup: e.grup,
            ad: e.ad,
            birim: e.birim,
            metraj: e.metraj,
            fiyat: e.fiyat,
            kaynak: 'tahmini',
            aciklama: e.aciklama,
          });
        });
      p.ekKalemler = ek;
      p.ad = ad;
      const liste = await aktifFiyatListesi().catch(() => null);
      const ozet = ozetCikar(calculate(p, { fiyatlar: liste?.fiyatlar ?? null }));
      const id = await projeOlustur(p, liste?.id ?? null, ozet);
      if (analizId)
        await analizProjeyeBagla(analizId, id, {
          kat: analiz.mimari.katlar.filter((k) => !k.haric).length,
          mahal: analiz.mimari.katlar.reduce((t, k) => t + k.mahaller.length, 0),
          toplam: ozet?.toplam ?? null,
        }).catch(() => {
          /* bağlantı kaydı ikincil */
        });
      navigate(`/proje/${id}/sonuc`);
    } catch (e) {
      setHata(turkceHata(e));
      setAktariliyor(false);
    }
  };

  if (analiz) {
    return (
      <>
        <HataKutusu mesaj={hata} />
        <EkranHatasi
          hataOlunca={() => {
            // Hak düştükten sonra kontrol ekranı açılamadı: hak otomatik iade edilir.
            if (analizId)
              void analizIade(analizId).then(() => istemci.invalidateQueries({ queryKey: ['hak'] }));
          }}
        >
          <KontrolEkrani
            analiz={analiz}
            setAnaliz={setAnaliz}
            ornek={ornek}
            v={v}
            setV={setV}
            ekler={ekler}
            setEkler={setEkler}
            onizle={onizle}
            aktar={() => void aktar()}
            aktariliyor={aktariliyor}
          />
        </EkranHatasi>
      </>
    );
  }

  return (
    <section className="kart" aria-labelledby="cizim-baslik">
      <h1 id="cizim-baslik">{ornek ? 'Örnek çizimle dene' : 'Çizimden maliyet analizi'}</h1>
      <HataKutusu mesaj={hata} />
      {hata?.startsWith('Analiz hakkın kalmadı') && (
        <p>
          <Link to="/paketler">Paketlere git</Link>
        </p>
      )}
      {!ornek && hak.data && (
        <p>
          Kalan analiz hakkın: <b>{hak.data.kalan}</b>. Hak, çizim başarıyla okunup kontrol ekranı açılınca
          düşer; çizim okunamazsa düşmez.
        </p>
      )}
      {ornek && <p className="not">Örnek çizimle deneme ücretsizdir; analiz hakkından düşmez.</p>}
      <div className="izgara">
        <MetinAlani etiket="Proje adı" deger={v.ad} degistir={(ad) => setV({ ...v, ad })} />
        <SecimAlani
          etiket="İl"
          deger={v.il}
          secenekler={ILLER}
          bosSecenek={false}
          degistir={(il) => setV({ ...v, il })}
        />
        <SayiAlani
          etiket="Kat yüksekliği (m)"
          deger={v.H}
          min={2.4}
          max={6}
          degistir={(H) => H !== '' && setV({ ...v, H })}
        />
        <SayiAlani
          etiket="Donatı oranı (kg / m³ beton)"
          deger={v.donati}
          min={60}
          max={200}
          degistir={(donati) => donati !== '' && setV({ ...v, donati })}
        />
      </div>
      {ornek ? (
        <p>
          Hazır kurgusal çizim kullanılır: 1 blok, 1 bodrum + zemin + 3 normal kat, mimari ve statik. Gerçek
          bir projeye ait değildir.
        </p>
      ) : (
        <>
          <div className="izgara">
            <div className="alan">
              <label htmlFor="dx-mimari">Mimari DXF (zorunlu)</label>
              <input
                id="dx-mimari"
                type="file"
                accept=".dxf"
                onChange={(e) => setMimari(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="alan">
              <label htmlFor="dx-statik">Statik DXF (önerilir: beton, kalıp, temel)</label>
              <input
                id="dx-statik"
                type="file"
                accept=".dxf"
                onChange={(e) => setStatik(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <p className="not">
            AutoCAD'den DXF olarak kaydet. Tüm katlar tek dosyada yan yana olabilir. Çizim bu cihazda okunur;
            sunucuya gönderilmez.
          </p>
        </>
      )}
      {ilerleme && (
        <div className="basari" role="status" aria-live="polite">
          {ilerlemeMetni(ilerleme)}
          {ilerleme.toplam > 0 && (
            <progress value={ilerleme.okunan} max={ilerleme.toplam} aria-label="Okuma ilerlemesi" />
          )}
        </div>
      )}
      <div className="satir">
        <Link className="dugme" to="/">
          Vazgeç
        </Link>
        <button type="button" className="birincil" disabled={Boolean(ilerleme)} onClick={() => void baslat()}>
          {ilerleme ? 'Okunuyor…' : 'Analizi başlat'}
        </button>
      </div>
    </section>
  );
}
