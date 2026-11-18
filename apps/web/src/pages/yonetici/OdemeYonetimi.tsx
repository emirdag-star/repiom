/** Yönetici: bekleyen ödemeler, cayma talepleri, paket ayarları, elle hak tanımlama, hesap silme talepleri. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { HataKutusu } from '../../components/HataKutusu';
import { useOnay } from '../../components/OnayPenceresi';
import { Yukleniyor } from '../../components/Yukleniyor';
import { MetinAlani, SayiAlani } from '../../components/form';
import {
  caymaKarar,
  hakTanimla,
  hesapSilmeListesi,
  hesapSilOnayla,
  odemeListesi,
  odemeOnayla,
  odemeReddet,
  paketGuncelle,
  paketler,
  tarihGunSaat,
  type Paket,
  type YoneticiOdeme,
} from '../../lib/abonelik';
import { tl } from '../../lib/bicim';
import { turkceHata } from '../../lib/hatalar';

export function OdemeYonetimi() {
  const istemci = useQueryClient();
  const onayla = useOnay();
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const bekleyen = useQuery({
    queryKey: ['yonetim', 'odeme', 'bekliyor'],
    queryFn: () => odemeListesi('bekliyor'),
  });
  const cayma = useQuery({
    queryKey: ['yonetim', 'odeme', 'iade_bekliyor'],
    queryFn: () => odemeListesi('iade_bekliyor'),
  });
  const silme = useQuery({ queryKey: ['yonetim', 'silme'], queryFn: hesapSilmeListesi });
  const yenile = () => istemci.invalidateQueries({ queryKey: ['yonetim'] });
  const islem = useMutation({
    mutationFn: async (f: () => Promise<unknown>) => f(),
    onSuccess: async () => {
      await yenile();
      await istemci.invalidateQueries({ queryKey: ['paketler'] });
    },
    onError: (e) => setHata(turkceHata(e)),
  });
  const yap = (f: () => Promise<unknown>, m: string) => {
    setHata(null);
    setMesaj(null);
    islem.mutate(f, { onSuccess: () => setMesaj(m) });
  };

  return (
    <>
      {mesaj && (
        <div className="basari" role="status">
          {mesaj}
        </div>
      )}
      <HataKutusu mesaj={hata} />
      <section className="kart" aria-labelledby="bekleyen-baslik">
        <h2 id="bekleyen-baslik">Bekleyen ödemeler</h2>
        <OdemeTablosu
          liste={bekleyen}
          bos="Onay bekleyen ödeme yok."
          islemler={(o) => (
            <RetliIslem
              onayEtiket="Onayla"
              onay={async () => {
                if (
                  await onayla({
                    baslik: `${o.referans} onaylansın mı?`,
                    metin: `${tl(o.tutar)} ödemesi alındıysa onayla; kullanıcıya hak tanımlanır.`,
                    evet: 'Onayla ve hak tanımla',
                  })
                )
                  yap(() => odemeOnayla(o.id), `${o.referans} onaylandı; hak tanımlandı.`);
              }}
              ret={(neden) => yap(() => odemeReddet(o.id, neden), `${o.referans} reddedildi.`)}
              retEtiket="Reddet"
              varsayilan="Dekont bulunamadı"
              ad={o.referans}
            />
          )}
        />
      </section>

      <section className="kart" aria-labelledby="cayma-baslik">
        <h2 id="cayma-baslik">Cayma talepleri</h2>
        <p className="not">
          Talep anında paketin hakları askıya alındı. Onaylarsan ödemeyi iyzico panelinden ya da havaleyle
          iade et; reddedersen haklar geri verilir.
        </p>
        <OdemeTablosu
          liste={cayma}
          bos="Bekleyen cayma talebi yok."
          islemler={(o) => (
            <RetliIslem
              onayEtiket="İade edildi"
              onay={async () => {
                if (
                  await onayla({
                    baslik: `${o.referans} iadesi onaylansın mı?`,
                    metin: `${tl(o.tutar)} kullanıcıya iade edildiyse onayla. Bu işlem geri alınamaz.`,
                    evet: 'İade edildi olarak işaretle',
                  })
                )
                  yap(
                    () => caymaKarar(o.id, true, 'İade yapıldı'),
                    `${o.referans} iade edildi olarak işaretlendi.`,
                  );
              }}
              ret={(neden) =>
                yap(
                  () => caymaKarar(o.id, false, neden),
                  `${o.referans} cayma talebi reddedildi; haklar geri verildi.`,
                )
              }
              retEtiket="Talebi reddet"
              varsayilan="Cayma koşulları sağlanmıyor"
              ad={o.referans}
            />
          )}
        />
      </section>

      <PaketAyarlari yap={yap} />
      <HakTanimla yap={yap} />

      <section className="kart" aria-labelledby="silme-baslik">
        <h2 id="silme-baslik">Hesap silme talepleri</h2>
        {silme.isPending && <Yukleniyor />}
        {silme.data && silme.data.length === 0 && <p>Bekleyen silme talebi yok.</p>}
        {silme.data && silme.data.length > 0 && (
          <div className="kaydir" tabIndex={0} role="region" aria-label="Hesap silme talepleri">
            <table>
              <thead>
                <tr>
                  <th scope="col">E-posta</th>
                  <th scope="col">Talep tarihi</th>
                  <th scope="col">
                    <span className="gizli">İşlem</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {silme.data.map((t) => (
                  <tr key={t.id}>
                    <td>{t.eposta}</td>
                    <td>{tarihGunSaat(t.talep_tarihi)}</td>
                    <td>
                      <button
                        type="button"
                        className="kucuk tehlikeli"
                        aria-label={`${t.eposta} hesabını sil`}
                        onClick={async () => {
                          if (
                            await onayla({
                              baslik: 'Hesap kalıcı olarak silinsin mi?',
                              metin: `${t.eposta} hesabı, projeleri ve kişisel verileri silinir; ödeme kayıtları anonim olarak kalır. Bu işlem geri alınamaz.`,
                              evet: 'Kalıcı olarak sil',
                              tehlikeli: true,
                            })
                          )
                            yap(() => hesapSilOnayla(t.id), `${t.eposta} hesabı silindi.`);
                        }}
                      >
                        Onayla ve sil
                      </button>
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

function OdemeTablosu({
  liste,
  bos,
  islemler,
}: {
  liste: { isPending: boolean; isError: boolean; error: unknown; data?: YoneticiOdeme[] };
  bos: string;
  islemler: (o: YoneticiOdeme) => React.ReactNode;
}) {
  if (liste.isPending) return <Yukleniyor />;
  if (liste.isError) return <HataKutusu mesaj={turkceHata(liste.error)} />;
  if (!liste.data?.length) return <p>{bos}</p>;
  return (
    <div className="kaydir" tabIndex={0} role="region" aria-label="Ödemeler">
      <table className="sikisik">
        <thead>
          <tr>
            <th scope="col">Referans</th>
            <th scope="col">Kullanıcı</th>
            <th scope="col">Paket</th>
            <th scope="col" className="s">
              Tutar
            </th>
            <th scope="col">Yöntem</th>
            <th scope="col">Fatura</th>
            <th scope="col">Tarih</th>
            <th scope="col">
              <span className="gizli">İşlem</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {liste.data.map((o) => (
            <tr key={o.id}>
              <td>{o.referans}</td>
              <td>{o.email ?? '—'}</td>
              <td>
                {o.paket}
                {o.adet > 1 ? ` × ${o.adet}` : ''}
              </td>
              <td className="s">{tl(o.tutar)}</td>
              <td>{o.yontem === 'havale' ? 'Havale/EFT' : o.yontem === 'kart' ? 'Kart' : o.yontem}</td>
              <td>
                {o.fatura.anonim
                  ? 'anonim'
                  : `${o.fatura.ad ?? ''} · ${o.fatura.no ?? ''}${o.fatura.vergiDairesi ? ' · ' + o.fatura.vergiDairesi : ''}`}
              </td>
              <td>{tarihGunSaat(o.olusturma)}</td>
              <td>{islemler(o)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Onay düğmesi + gerekçeli red. */
function RetliIslem(o: {
  ad: string;
  onayEtiket: string;
  onay: () => void;
  retEtiket: string;
  ret: (neden: string) => void;
  varsayilan: string;
}) {
  const [acik, setAcik] = useState(false);
  const [neden, setNeden] = useState(o.varsayilan);
  return (
    <div className="islemler">
      <button
        type="button"
        className="kucuk birincil"
        onClick={o.onay}
        aria-label={`${o.ad}: ${o.onayEtiket}`}
      >
        {o.onayEtiket}
      </button>
      {!acik ? (
        <button
          type="button"
          className="kucuk"
          onClick={() => setAcik(true)}
          aria-label={`${o.ad}: ${o.retEtiket}`}
        >
          {o.retEtiket}
        </button>
      ) : (
        <>
          <input
            className="hucre"
            style={{ width: 200, textAlign: 'left' }}
            value={neden}
            maxLength={300}
            aria-label={`${o.ad} red gerekçesi (kullanıcı görür)`}
            onChange={(e) => setNeden(e.target.value)}
          />
          <button type="button" className="kucuk tehlikeli" onClick={() => o.ret(neden)}>
            Gönder
          </button>
        </>
      )}
    </div>
  );
}

function PaketAyarlari({ yap }: { yap: (f: () => Promise<unknown>, m: string) => void }) {
  const liste = useQuery({ queryKey: ['yonetim', 'paketler'], queryFn: paketler });
  return (
    <section className="kart" aria-labelledby="paket-ayar-baslik">
      <h2 id="paket-ayar-baslik">Paket ayarları</h2>
      <p className="not">
        Fiyatı 0 olan ya da satışta olmayan paket kullanıcılara görünmez. Fiyatlar KDV dahildir.
      </p>
      {liste.isPending && <Yukleniyor />}
      {liste.data?.map((p) => (
        <PaketSatiri key={p.id} p={p} yap={yap} />
      ))}
    </section>
  );
}

function PaketSatiri({ p, yap }: { p: Paket; yap: (f: () => Promise<unknown>, m: string) => void }) {
  const [fiyat, setFiyat] = useState<number | ''>(p.fiyat);
  const [aktif, setAktif] = useState(p.aktif);
  return (
    <div className="altkart">
      <div className="altbaslik">
        <h3>
          {p.ad}{' '}
          <span className="not">
            ({p.analiz_hakki} analiz · {p.sure_gun} gün)
          </span>
        </h3>
      </div>
      <div className="izgara">
        <SayiAlani etiket={`${p.ad} fiyatı (TL)`} deger={fiyat} max={10_000_000} degistir={setFiyat} />
        <label className="onay">
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          Satışta
        </label>
        <div>
          <button
            type="button"
            disabled={fiyat === ''}
            onClick={() => yap(() => paketGuncelle(p.id, Number(fiyat), aktif), `${p.ad} güncellendi.`)}
            aria-label={`${p.ad} paketini kaydet`}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function HakTanimla({ yap }: { yap: (f: () => Promise<unknown>, m: string) => void }) {
  const [eposta, setEposta] = useState('');
  const [miktar, setMiktar] = useState<number | ''>(1);
  const [gun, setGun] = useState<number | ''>(30);
  const [aciklama, setAciklama] = useState('');
  return (
    <section className="kart" aria-labelledby="hak-baslik">
      <h2 id="hak-baslik">Elle hak tanımla</h2>
      <p className="not">Kampanya, telafi ya da elle iade için. Kullanıcı kayıtlı olmalı.</p>
      <div className="izgara">
        <MetinAlani etiket="Kullanıcı e-postası" deger={eposta} degistir={setEposta} />
        <SayiAlani etiket="Hak adedi" deger={miktar} tamSayi min={1} max={1000} degistir={setMiktar} />
        <SayiAlani etiket="Geçerlilik (gün)" deger={gun} tamSayi min={1} max={3660} degistir={setGun} />
        <MetinAlani etiket="Açıklama (kullanıcı görür)" deger={aciklama} enCok={300} degistir={setAciklama} />
      </div>
      <button
        type="button"
        className="birincil"
        disabled={!eposta || miktar === '' || gun === ''}
        onClick={() =>
          yap(
            () => hakTanimla(eposta, Number(miktar), Number(gun), aciklama),
            `${eposta} hesabına ${miktar} hak tanımlandı.`,
          )
        }
      >
        Hak tanımla
      </button>
    </section>
  );
}
