import { diffPrices, extractNewPrices, mergePrices, type PriceDiff, type PriceList } from '@repiom/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { HataKutusu } from '../components/HataKutusu';
import { useOnay } from '../components/OnayPenceresi';
import { Yukleniyor } from '../components/Yukleniyor';
import { sayi } from '../lib/bicim';
import { tarihGun, useAktifFiyatListesi } from '../lib/fiyat';
import { turkceHata } from '../lib/hatalar';
import { useYoneticiMi } from '../lib/yonetici';
import { OdemeYonetimi } from './yonetici/OdemeYonetimi';
import { KullanimPanosu } from './yonetici/KullanimPanosu';
import { YapayZekaKullanimi } from './yonetici/YapayZekaKullanimi';
import {
  dosyaIndir,
  fiyatListesiEkleYayinla,
  fiyatListesiYayinla,
  fiyatSurumleri,
} from '../lib/yoneticiFiyat';

const tarihSaat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

interface Yukleme {
  dosya: string;
  hatalar: string[];
  farklar: PriceDiff[];
  birlesik: PriceList;
}

const yuzde = (x: number) => `${x > 0 ? '+' : ''}${sayi(x * 100, 1)}%`;

/** Yönetici ekranı. Yetki sunucuda denetlenir; burada yalnız gösterim yapılır. */
export function YoneticiSayfasi() {
  const yonetici = useYoneticiMi();
  if (yonetici.isPending) return <Yukleniyor />;
  if (yonetici.isError) return <HataKutusu mesaj={turkceHata(yonetici.error)} />;
  if (!yonetici.data) {
    return (
      <section className="kart" aria-labelledby="yonetici-baslik">
        <h1 id="yonetici-baslik">Yönetici</h1>
        <p>Bu sayfayı görmek için yönetici yetkisi gerekir.</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="yonetici-baslik">
      <h1 id="yonetici-baslik">Yönetici</h1>
      <KullanimPanosu />
      <FiyatListeleri />
      <OdemeYonetimi />
      <YapayZekaKullanimi />
    </section>
  );
}

function FiyatListeleri() {
  const istemci = useQueryClient();
  const onayla = useOnay();
  const dosyaId = useId();
  const aciklamaId = useId();
  const aktif = useAktifFiyatListesi();
  const surumler = useQuery({ queryKey: ['fiyat', 'surumler'], queryFn: fiyatSurumleri });
  const [yukleme, setYukleme] = useState<Yukleme | null>(null);
  const [aciklama, setAciklama] = useState('');
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [okuniyor, setOkunuyor] = useState(false);
  const [dosyaAnahtari, setDosyaAnahtari] = useState(0);

  const yenile = async () => {
    await istemci.invalidateQueries({ queryKey: ['fiyat'] });
  };

  const tabloIndir = async () => {
    setHata(null);
    try {
      const { buildPriceUpdateTable } = await import('@repiom/report');
      const a = aktif.data;
      const bilgi = a
        ? `Yayındaki liste: ${a.aciklama || `Sürüm ${a.id}`} (${tarihGun(a.yayin_tarihi ?? a.olusturma)}).`
        : '';
      dosyaIndir(
        await buildPriceUpdateTable(a?.fiyatlar ?? null, bilgi),
        `REPIOM_Fiyat_Guncelleme_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (e) {
      setHata(`Tablo hazırlanamadı. ${turkceHata(e)}`);
    }
  };

  const dosyaSecildi = async (f: File | undefined) => {
    setHata(null);
    setMesaj(null);
    setYukleme(null);
    if (!f) return;
    setOkunuyor(true);
    try {
      const { readWorkbookRows } = await import('@repiom/report');
      const y = extractNewPrices(await readWorkbookRows(await f.arrayBuffer()));
      const mevcut = aktif.data?.fiyatlar ?? {};
      setYukleme({
        dosya: f.name,
        hatalar: y.hatalar,
        farklar: diffPrices(y.fiyatlar, mevcut),
        birlesik: mergePrices(mevcut, y.fiyatlar),
      });
      setAciklama(`Fiyat güncellemesi ${new Date().toLocaleDateString('tr-TR')}`);
    } catch (e) {
      setHata(turkceHata(e));
    } finally {
      setOkunuyor(false);
    }
  };

  const vazgec = () => {
    setYukleme(null);
    setDosyaAnahtari((k) => k + 1);
  };

  const yayinla = useMutation({
    mutationFn: () => fiyatListesiEkleYayinla(aciklama, yukleme!.birlesik),
    onSuccess: async (id) => {
      setYukleme(null);
      setDosyaAnahtari((k) => k + 1);
      setMesaj(
        `Sürüm ${id} yayında. Yeni projeler bu fiyatlarla hesaplanır; mevcut projeler açıldığında güncel fiyatlara geçmek için onay ister.`,
      );
      await yenile();
    },
    onError: (e) => setHata(turkceHata(e)),
  });

  const surumYayinla = useMutation({
    mutationFn: fiyatListesiYayinla,
    onSuccess: async (_, id) => {
      setMesaj(`Sürüm ${id} yayında.`);
      await yenile();
    },
    onError: (e) => setHata(turkceHata(e)),
  });

  const geriAl = async (id: number) => {
    if (
      await onayla({
        baslik: `Sürüm ${id} yayına alınsın mı?`,
        metin:
          'Yeni projeler bu sürümün fiyatlarıyla hesaplanır. Mevcut projeler kendi fiyat listeleriyle kalır.',
        evet: 'Yayına al',
      })
    ) {
      setMesaj(null);
      setHata(null);
      surumYayinla.mutate(id);
    }
  };

  const a = aktif.data;
  return (
    <>
      {mesaj && (
        <div className="basari" role="status">
          {mesaj}
        </div>
      )}
      <HataKutusu mesaj={hata} />
      <section className="kart" aria-labelledby="yayindaki-baslik">
        <h2 id="yayindaki-baslik">Yayındaki fiyat listesi</h2>
        {aktif.isPending ? (
          <Yukleniyor />
        ) : a ? (
          <p>
            <b>{a.aciklama || `Sürüm ${a.id}`}</b> · sürüm {a.id} · {tarihGun(a.yayin_tarihi ?? a.olusturma)}{' '}
            · {Object.keys(a.fiyatlar).length} kalem fiyatı
          </p>
        ) : (
          <p>Yayında fiyat listesi yok; uygulamanın varsayılan fiyatları kullanılıyor.</p>
        )}
        <div className="satir">
          <span className="not">
            1) Güncelleme tablosunu indir, 2) sarı "YENİ Birim Fiyat" sütununu doldur, 3) aşağıdan yükle.
          </span>
          <button type="button" onClick={() => void tabloIndir()}>
            Güncelleme tablosunu indir (Excel)
          </button>
        </div>
      </section>

      <section className="kart" aria-labelledby="yukle-baslik">
        <h2 id="yukle-baslik">Yeni fiyatları yükle</h2>
        <div className="alan">
          <label htmlFor={dosyaId}>Doldurulmuş güncelleme tablosu (.xlsx)</label>
          <input
            key={dosyaAnahtari}
            id={dosyaId}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => void dosyaSecildi(e.target.files?.[0])}
          />
        </div>
        {okuniyor && <Yukleniyor metin="Dosya okunuyor…" />}
        {yukleme && (
          <>
            {yukleme.hatalar.length > 0 && (
              <div className="uyari" role="status">
                Okunamayan satırlar (yayına alınmaz): {yukleme.hatalar.join('; ')}
              </div>
            )}
            {!yukleme.farklar.length ? (
              <p>{yukleme.dosya} dosyasında yayındaki listeden farklı fiyat bulunamadı.</p>
            ) : (
              <>
                <h3>{yukleme.farklar.length} kalemde fiyat değişiyor</h3>
                <div className="kaydir" tabIndex={0} role="region" aria-label="Fiyat farkları">
                  <table className="fark-tablosu">
                    <thead>
                      <tr>
                        <th scope="col">Kod</th>
                        <th scope="col">Sıra</th>
                        <th scope="col">İş kalemi</th>
                        <th scope="col">Birim</th>
                        <th scope="col" className="s">
                          Mevcut
                        </th>
                        <th scope="col" className="s">
                          Yeni
                        </th>
                        <th scope="col" className="s">
                          Değişim
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {yukleme.farklar.map((f) => (
                        <tr key={f.kod}>
                          <td>{f.kod}</td>
                          <td>{f.sira}</td>
                          <td>
                            {f.ad}
                            {f.formulDegisir && <span className="etiket">formül yerine sabit fiyat</span>}
                          </td>
                          <td>{f.birim}</td>
                          <td className="s">{f.eski === null ? 'Formül' : sayi(f.eski, 2)}</td>
                          <td className="s">{sayi(f.yeni, 2)}</td>
                          <td
                            className={`s${f.oran !== null && Math.abs(f.oran) >= 0.5 ? ' buyuk-degisim' : ''}`}
                          >
                            {f.oran === null ? '—' : yuzde(f.oran)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="izgara">
                  <div className="alan">
                    <label htmlFor={aciklamaId}>Sürüm açıklaması</label>
                    <input
                      id={aciklamaId}
                      type="text"
                      maxLength={500}
                      value={aciklama}
                      onChange={(e) => setAciklama(e.target.value)}
                    />
                  </div>
                </div>
                <div className="satir">
                  <button type="button" onClick={vazgec}>
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    className="birincil"
                    disabled={yayinla.isPending}
                    onClick={() => {
                      setHata(null);
                      yayinla.mutate();
                    }}
                  >
                    {yayinla.isPending ? 'Yayınlanıyor…' : 'Yeni sürüm olarak kaydet ve yayınla'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section className="kart" aria-labelledby="surum-baslik">
        <h2 id="surum-baslik">Sürümler</h2>
        {surumler.isPending && <Yukleniyor />}
        {surumler.isError && <HataKutusu mesaj={turkceHata(surumler.error)} />}
        {surumler.data && (
          <div className="kaydir" tabIndex={0} role="region" aria-label="Fiyat listesi sürümleri">
            <table>
              <thead>
                <tr>
                  <th scope="col">Sürüm</th>
                  <th scope="col">Açıklama</th>
                  <th scope="col">Oluşturma</th>
                  <th scope="col" className="s">
                    Kalem
                  </th>
                  <th scope="col">Yayınlayan</th>
                  <th scope="col">Durum</th>
                </tr>
              </thead>
              <tbody>
                {surumler.data.map((v) => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.aciklama}</td>
                    <td>{tarihSaat.format(new Date(v.olusturma))}</td>
                    <td className="s">{v.kalem_sayisi}</td>
                    <td>{v.olusturan_eposta ?? '—'}</td>
                    <td>
                      {v.aktif ? (
                        <b>Yayında</b>
                      ) : (
                        <button
                          type="button"
                          className="kucuk"
                          disabled={surumYayinla.isPending}
                          aria-label={`Sürüm ${v.id}'i yayına al`}
                          onClick={() => void geriAl(v.id)}
                        >
                          Yayına al
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
