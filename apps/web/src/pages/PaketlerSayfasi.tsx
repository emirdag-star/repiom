/**
 * Paketler ve ödeme: kalan hak, satıştaki paketler (fiyatı 0 olan görünmez), kart (iyzico) ya da havale/EFT,
 * fatura bilgileri, ödeme belgeleri onayı, ödemelerim (iptal, cayma talebi).
 */
import { SIRKET } from '@repiom/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { olaySay } from '@repiom/istemci/olcum';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BelgeBaglantisi } from '../components/Belge';
import { HataKutusu } from '../components/HataKutusu';
import { useOnay } from '../components/OnayPenceresi';
import { Yukleniyor } from '../components/Yukleniyor';
import { MetinAlani, SecimAlani } from '../components/form';
import {
  caymaTalebi,
  havaleBildir,
  kartlaOde,
  ODEME_DURUMU,
  YONTEM_ADI,
  odemeIptal,
  odemelerim,
  paketler,
  tarihGunSaat,
  useHak,
  type Fatura,
  type Odeme,
  type Paket,
} from '../lib/abonelik';
import { tl } from '../lib/bicim';
import { turkceHata } from '../lib/hatalar';
import { onayKaydet } from '../lib/onaylar';
import { PROVINCES } from '@repiom/core';

const ILLER = PROVINCES.map((p) => p.ad);
const BOS_FATURA: Fatura = { ad: '', no: '', vergiDairesi: '', adres: '', il: 'İstanbul' };
const GUN = 24 * 3600 * 1000;

function faturaHatasi(f: Fatura): string | null {
  if (f.ad.trim().length < 2) return 'Fatura için ad soyad ya da unvan yaz.';
  if (!/^\d{10,11}$/.test(f.no)) return 'TC kimlik no 11, vergi no 10 haneli olmalı.';
  if (f.no.length === 10 && f.vergiDairesi.trim().length < 2)
    return 'Vergi numarasıyla birlikte vergi dairesini yaz.';
  if (f.adres.trim().length < 5) return 'Fatura adresini yaz.';
  return null;
}

export function PaketlerSayfasi() {
  const [arama] = useSearchParams();
  const odemeDonus = arama.get('odeme');
  const istemci = useQueryClient();
  const onayla = useOnay();
  const hak = useHak();
  useEffect(() => olaySay('paketler_goruntuleme'), []);
  const liste = useQuery({ queryKey: ['paketler'], queryFn: paketler });
  const gecmis = useQuery({ queryKey: ['odemelerim'], queryFn: odemelerim });
  const [secili, setSecili] = useState<Paket | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  // Cayma süresi hesabı için sayfa açıldığı an (render sırasında Date.now() çağrılmaz).
  const [simdi] = useState(() => Date.now());

  const yenile = () =>
    Promise.all([
      istemci.invalidateQueries({ queryKey: ['hak'] }),
      istemci.invalidateQueries({ queryKey: ['odemelerim'] }),
    ]);
  const iptal = useMutation({
    mutationFn: odemeIptal,
    onSuccess: async () => {
      setMesaj('Havale bildirimi iptal edildi.');
      await yenile();
    },
    onError: (e) => setHata(turkceHata(e)),
  });
  const cayma = useMutation({
    mutationFn: caymaTalebi,
    onSuccess: async () => {
      setMesaj(
        'Cayma talebin alındı. Paketin hakları askıya alındı; ödeme iadesi onaylanınca bilgilendirileceksin.',
      );
      await yenile();
    },
    onError: (e) => setHata(turkceHata(e)),
  });
  const caymaOnay = async (o: Odeme) => {
    if (
      await onayla({
        baslik: 'Cayma talebi oluşturulsun mu?',
        metin: 'Bu paketin hakları hemen kullanılamaz olur; ödeme iadesi yönetici onayıyla yapılır.',
        evet: 'Cayma talebi oluştur',
        tehlikeli: true,
      })
    ) {
      setHata(null);
      cayma.mutate(o.id);
    }
  };

  const h = hak.data;
  return (
    <section aria-labelledby="paket-baslik">
      <h1 id="paket-baslik">Paketler ve analiz hakları</h1>
      {odemeDonus === 'tamam' && (
        <div className="basari" role="status">
          Ödemen alındı; analiz hakların tanımlandı.
        </div>
      )}
      {odemeDonus === 'hata' && (
        <div className="hata-kutusu" role="alert">
          Ödeme tamamlanamadı. Kartından çekim yapılmadıysa tekrar deneyebilir ya da havale/EFT ile
          ödeyebilirsin.
        </div>
      )}
      {mesaj && (
        <div className="basari" role="status">
          {mesaj}
        </div>
      )}
      <HataKutusu mesaj={hata} />
      <div className="kart">
        {hak.isPending ? (
          <Yukleniyor />
        ) : h ? (
          <p>
            Kalan analiz hakkın: <b data-testid="kalan-hak">{h.kalan}</b>
            {h.abonelik && (
              <>
                {' '}
                · {h.abonelik.paket}, bitiş {new Date(h.abonelik.bitis).toLocaleDateString('tr-TR')}
              </>
            )}
            {h.bekleyen_odeme > 0 && <> · onay bekleyen ödeme: {h.bekleyen_odeme}</>}
          </p>
        ) : null}
        {liste.isPending && <Yukleniyor />}
        {liste.data && liste.data.length === 0 && <p>Şu anda satışta paket yok.</p>}
        <div className="paketler">
          {liste.data?.map((p) => (
            <div key={p.id} className={`paket${secili?.id === p.id ? ' secili' : ''}`}>
              <h3>{p.ad}</h3>
              <p>{p.aciklama}</p>
              <p className="fiyat">{tl(p.fiyat)}</p>
              <p className="not">KDV dahil · {p.tur === 'abonelik' ? `${p.sure_gun} gün` : 'tek seferlik'}</p>
              <button
                type="button"
                className="birincil"
                onClick={() => setSecili(p)}
                aria-label={`${p.ad} satın al`}
              >
                Satın al
              </button>
            </div>
          ))}
        </div>
        <p className="not">Mobil uygulamada satın alma App Store / Google Play üzerinden yapılır.</p>
      </div>
      {secili && (
        <SatinAl
          key={secili.id}
          paket={secili}
          vazgec={() => setSecili(null)}
          bitti={async (m) => {
            setMesaj(m);
            await yenile();
          }}
        />
      )}
      <section className="kart" aria-labelledby="odemelerim-baslik">
        <h2 id="odemelerim-baslik">Ödemelerim</h2>
        {gecmis.isPending && <Yukleniyor />}
        {gecmis.data && gecmis.data.length === 0 && <p>Henüz ödeme yok.</p>}
        {gecmis.data && gecmis.data.length > 0 && (
          <div className="kaydir" tabIndex={0} role="region" aria-label="Ödemelerim">
            <table>
              <thead>
                <tr>
                  <th scope="col">Tarih</th>
                  <th scope="col">Paket</th>
                  <th scope="col" className="s">
                    Tutar
                  </th>
                  <th scope="col">Yöntem</th>
                  <th scope="col">Referans</th>
                  <th scope="col">Durum</th>
                  <th scope="col">
                    <span className="gizli">İşlem</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {gecmis.data.map((o) => {
                  const caymaOlur =
                    o.durum === 'onaylandi' &&
                    (o.yontem === 'kart' || o.yontem === 'havale') &&
                    o.karar_tarihi !== null &&
                    simdi - new Date(o.karar_tarihi).getTime() < 14 * GUN;
                  return (
                    <tr key={o.id}>
                      <td>{tarihGunSaat(o.olusturma)}</td>
                      <td>
                        {liste.data?.find((p) => p.id === o.paket_id)?.ad ?? o.paket_id}
                        {o.adet > 1 ? ` × ${o.adet}` : ''}
                      </td>
                      <td className="s">{tl(o.tutar)}</td>
                      <td>{YONTEM_ADI[o.yontem] ?? o.yontem}</td>
                      <td>{o.referans}</td>
                      <td>
                        {ODEME_DURUMU[o.durum]}
                        {o.red_nedeni && o.durum === 'reddedildi' ? ` (${o.red_nedeni})` : ''}
                      </td>
                      <td>
                        {o.durum === 'bekliyor' && o.yontem === 'havale' && (
                          <button type="button" className="kucuk" onClick={() => iptal.mutate(o.id)}>
                            İptal et
                          </button>
                        )}
                        {caymaOlur && (
                          <button type="button" className="kucuk" onClick={() => void caymaOnay(o)}>
                            Cayma talebi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="not">
          Hiç analiz yapılmamış paketler için ödemeden itibaren 14 gün içinde cayma talebi oluşturabilirsin.
          Analiz yapılmış paketlerde cayma hakkı yoktur (Mesafeli Satış Sözleşmesi).
        </p>
      </section>
    </section>
  );
}

function SatinAl({
  paket,
  vazgec,
  bitti,
}: {
  paket: Paket;
  vazgec: () => void;
  bitti: (m: string) => Promise<void>;
}) {
  const [yontem, setYontem] = useState<'kart' | 'havale'>('kart');
  const [adet, setAdet] = useState(1);
  const [f, setF] = useState<Fatura>(BOS_FATURA);
  const [onBilgi, setOnBilgi] = useState(false);
  const [mesafeli, setMesafeli] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [havale, setHavale] = useState<{ referans: string; tutar: number } | null>(null);

  const gonder = async () => {
    setHata(null);
    const fh = faturaHatasi(f);
    if (fh) return setHata(fh);
    if (!onBilgi || !mesafeli)
      return setHata('Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onaylanmalı.');
    setMesgul(true);
    try {
      await onayKaydet(['on_bilgilendirme', 'mesafeli_satis']);
      if (yontem === 'havale') {
        const r = await havaleBildir(paket.id, adet, f);
        setHavale({ referans: r.referans, tutar: Number(r.tutar) });
        await bitti('Havale/EFT bildirimin alındı. Ödemen onaylanınca hakların tanımlanacak.');
      } else {
        window.location.assign(await kartlaOde(paket.id, adet, f, window.location.origin + '/paketler'));
      }
    } catch (e) {
      setHata(turkceHata(e));
    } finally {
      setMesgul(false);
    }
  };

  if (havale) {
    return (
      <section className="kart" aria-labelledby="havale-baslik">
        <h2 id="havale-baslik">Havale / EFT bilgileri</h2>
        <p>
          Aşağıdaki hesaba <b>{tl(havale.tutar)}</b> gönder ve açıklamaya <b>referans kodunu</b> yaz. Ödeme
          yönetici tarafından kontrol edilince hakların tanımlanır.
        </p>
        <dl className="banka">
          <dt>Referans kodu</dt>
          <dd data-testid="havale-referans">{havale.referans}</dd>
          <dt>Alıcı</dt>
          <dd>{SIRKET.alici}</dd>
          <dt>Banka</dt>
          <dd>{SIRKET.banka}</dd>
          <dt>IBAN</dt>
          <dd>{SIRKET.iban}</dd>
          <dt>Tutar</dt>
          <dd>{tl(havale.tutar)}</dd>
        </dl>
        <div className="satir">
          <span />
          <button type="button" onClick={vazgec}>
            Tamam
          </button>
        </div>
      </section>
    );
  }

  const tutar = paket.fiyat * (paket.tur === 'ek_analiz' ? adet : 1);
  return (
    <section className="kart" aria-labelledby="satin-baslik">
      <h2 id="satin-baslik">{paket.ad} — satın al</h2>
      <HataKutusu mesaj={hata} />
      <fieldset className="radyo-grubu">
        <legend>Ödeme yöntemi</legend>
        <label>
          <input type="radio" name="yontem" checked={yontem === 'kart'} onChange={() => setYontem('kart')} />
          Kredi / banka kartı (iyzico)
        </label>
        <label>
          <input
            type="radio"
            name="yontem"
            checked={yontem === 'havale'}
            onChange={() => setYontem('havale')}
          />
          Havale / EFT
        </label>
      </fieldset>
      {paket.tur === 'ek_analiz' && (
        <div className="alan" style={{ maxWidth: 200 }}>
          <label htmlFor="adet">Adet</label>
          <input
            id="adet"
            type="number"
            min={1}
            max={100}
            value={adet}
            onChange={(e) => setAdet(Math.max(1, Math.min(100, Math.round(Number(e.target.value) || 1))))}
          />
        </div>
      )}
      <h3>Fatura bilgileri</h3>
      <div className="izgara">
        <MetinAlani etiket="Ad soyad / unvan" deger={f.ad} degistir={(ad) => setF({ ...f, ad })} />
        <MetinAlani
          etiket="TC kimlik no / vergi no"
          deger={f.no}
          enCok={11}
          degistir={(no) => setF({ ...f, no: no.replace(/\D/g, '') })}
        />
        <MetinAlani
          etiket="Vergi dairesi (vergi no ile)"
          deger={f.vergiDairesi}
          degistir={(vergiDairesi) => setF({ ...f, vergiDairesi })}
        />
        <SecimAlani
          etiket="İl"
          deger={f.il}
          secenekler={ILLER}
          bosSecenek={false}
          degistir={(il) => setF({ ...f, il })}
        />
      </div>
      <div className="alan">
        <label htmlFor="fatura-adres">Fatura adresi</label>
        <textarea
          id="fatura-adres"
          maxLength={500}
          value={f.adres}
          onChange={(e) => setF({ ...f, adres: e.target.value })}
        />
      </div>
      <fieldset className="onaylar-kutusu">
        <legend>Sözleşmeler</legend>
        <div className="onay-satiri">
          <input
            id="onbilgi"
            type="checkbox"
            checked={onBilgi}
            onChange={(e) => setOnBilgi(e.target.checked)}
          />
          <label htmlFor="onbilgi">
            <BelgeBaglantisi id="on_bilgilendirme" />
            'nu okudum. <span className="zorunlu">(zorunlu)</span>
          </label>
        </div>
        <div className="onay-satiri">
          <input
            id="mesafeli"
            type="checkbox"
            checked={mesafeli}
            onChange={(e) => setMesafeli(e.target.checked)}
          />
          <label htmlFor="mesafeli">
            <BelgeBaglantisi id="mesafeli_satis" />
            'ni kabul ediyorum; dijital hizmetin hemen ifasına başlanmasını onaylıyorum.{' '}
            <span className="zorunlu">(zorunlu)</span>
          </label>
        </div>
      </fieldset>
      <p>
        Ödenecek tutar: <b>{tl(tutar)}</b> (KDV dahil)
      </p>
      <div className="satir">
        <button type="button" onClick={vazgec}>
          Vazgeç
        </button>
        <button type="button" className="birincil" disabled={mesgul} onClick={() => void gonder()}>
          {mesgul ? 'İşleniyor…' : yontem === 'kart' ? 'Ödemeye geç' : 'Havale bildirimi oluştur'}
        </button>
      </div>
    </section>
  );
}
