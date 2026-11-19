import { calculate, emptyProject, exampleProject, type ProjectInput } from '@repiom/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { HataKutusu } from '../components/HataKutusu';
import { useOnay } from '../components/OnayPenceresi';
import { Yukleniyor } from '../components/Yukleniyor';
import { aktifFiyatListesi } from '../lib/fiyat';
import { turkceHata } from '../lib/hatalar';
import {
  ozetCikar,
  projeKopyala,
  projeleriListele,
  projeOlustur,
  projeSil,
  type ProjeSatiri,
} from '../lib/projeler';
import { sayi, tl } from '../lib/bicim';

const tarih = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

export function ProjelerimSayfasi() {
  const navigate = useNavigate();
  const onayla = useOnay();
  const istemci = useQueryClient();
  const konum = useLocation();
  const [mesaj, setMesaj] = useState<string | null>(
    (konum.state as { mesaj?: string } | null)?.mesaj ?? null,
  );
  const projeler = useQuery({ queryKey: ['projeler'], queryFn: projeleriListele });

  const olustur = useMutation({
    mutationFn: async (girdi: ProjectInput) => {
      const liste = await aktifFiyatListesi().catch(() => null);
      // Liste özetinin hemen görünmesi için özet oluştururken hesaplanır (boş projede özet yoktur).
      const ozet = ozetCikar(calculate(girdi, { fiyatlar: liste?.fiyatlar ?? null }));
      return projeOlustur(girdi, liste?.id ?? null, ozet);
    },
    onSuccess: (id) => navigate(`/proje/${id}/proje`),
  });
  const kopyala = useMutation({
    mutationFn: projeKopyala,
    onSuccess: async () => {
      setMesaj('Projenin kopyası oluşturuldu.');
      await istemci.invalidateQueries({ queryKey: ['projeler'] });
    },
  });
  const sil = useMutation({
    mutationFn: projeSil,
    onSuccess: async () => {
      setMesaj('Proje silindi.');
      await istemci.invalidateQueries({ queryKey: ['projeler'] });
    },
  });
  const silOnay = async (p: ProjeSatiri) => {
    if (
      await onayla({
        baslik: 'Proje silinsin mi?',
        metin: `"${p.ad || 'Adsız proje'}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
        evet: 'Kalıcı olarak sil',
        tehlikeli: true,
      })
    ) {
      setMesaj(null);
      sil.mutate(p.id);
    }
  };
  const islemHatasi = olustur.error ?? kopyala.error ?? sil.error;
  const mesgul = olustur.isPending || kopyala.isPending || sil.isPending;

  return (
    <section aria-labelledby="projelerim-baslik">
      <div className="sayfa-baslik">
        <h1 id="projelerim-baslik">Projelerim</h1>
        <div className="ekle">
          <button type="button" disabled={mesgul} onClick={() => olustur.mutate(exampleProject())}>
            Örnek projeyi aç
          </button>
          <button
            type="button"
            className="birincil"
            disabled={mesgul}
            onClick={() => olustur.mutate(emptyProject())}
          >
            Yeni proje
          </button>
        </div>
      </div>
      <section className="kart vurgu" aria-labelledby="cizim-kart-baslik">
        <div className="altbaslik">
          <div>
            <h2 id="cizim-kart-baslik">
              Çizimden maliyet <span className="etiket">ücretli modül</span>
            </h2>
            <p className="not">
              Mimari ve statik DXF'ini yükle: katlar, mahal listesi, kaplamalar, beton-kalıp-donatı ve
              kapı-pencere çizimden çıkarılır, maliyet buna göre hesaplanır. Çizim bu cihazda okunur.
            </p>
          </div>
          <div className="ekle">
            <Link className="dugme" to="/cizim?ornek=1">
              Örnek çizimle dene
            </Link>
            <Link className="dugme birincil" to="/cizim">
              Çizim yükle
            </Link>
          </div>
        </div>
      </section>
      {mesaj && (
        <div className="basari" role="status">
          {mesaj}
        </div>
      )}
      {islemHatasi && <HataKutusu mesaj={turkceHata(islemHatasi)} />}
      {projeler.isPending && <Yukleniyor metin="Projeler yükleniyor…" />}
      {projeler.isError && <HataKutusu mesaj={turkceHata(projeler.error)} />}
      {projeler.data && projeler.data.length === 0 && (
        <div className="kart bos-durum">
          <h2>Henüz projen yok</h2>
          <p>
            "Yeni proje" ile ilk projeni oluştur ya da örnek projeyi aç. Hesap için toplam inşaat alanını
            girmen yeterli; kat ve daire bilgisini istersen sonra eklersin.
          </p>
        </div>
      )}
      {projeler.data && projeler.data.length > 0 && (
        <ul className="proje-listesi">
          {projeler.data.map((p) => {
            const o = p.ozet;
            const ad = p.ad || 'Adsız proje';
            return (
              <li key={p.id} className="kart proje-karti">
                <div className="proje-karti-ust">
                  <h2>
                    <Link to={`/proje/${p.id}/proje`}>{ad}</Link>
                  </h2>
                  <span className="not">Son değişiklik: {tarih.format(new Date(p.guncelleme))}</span>
                </div>
                <dl className="proje-ozeti">
                  <div>
                    <dt>Toplam (KDV hariç)</dt>
                    <dd>{o?.toplam ? tl(o.toplam) : '—'}</dd>
                  </div>
                  <div>
                    <dt>m² maliyeti</dt>
                    <dd>{o?.m2 ? `${sayi(o.m2)} TL` : '—'}</dd>
                  </div>
                  <div>
                    <dt>İnşaat alanı</dt>
                    <dd>{o?.alan ? `${sayi(o.alan)} m²` : '—'}</dd>
                  </div>
                  <div>
                    <dt>Daire</dt>
                    <dd>{o?.daire ? sayi(o.daire) : '—'}</dd>
                  </div>
                </dl>
                <div className="islemler">
                  <Link className="dugme kucuk" to={`/proje/${p.id}/proje`} aria-label={`${ad} projesini aç`}>
                    Aç
                  </Link>
                  <button
                    type="button"
                    className="kucuk"
                    disabled={mesgul}
                    aria-label={`${ad} projesini kopyala`}
                    onClick={() => {
                      setMesaj(null);
                      kopyala.mutate(p.id);
                    }}
                  >
                    Kopyala
                  </button>
                  <button
                    type="button"
                    className="kucuk"
                    disabled={mesgul}
                    aria-label={`${ad} projesini sil`}
                    onClick={() => void silOnay(p)}
                  >
                    Sil
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
