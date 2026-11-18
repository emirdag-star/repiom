/**
 * DXF kontrol ekranı: sonuç projeye aktarılmadan önce kullanıcı burada okunanları görür ve düzeltir.
 * Sekmeler: Katlar (önizlemeli), Mahaller (tür ve kaplama), Statik, Yeni kalemler, Varsayımlar.
 */
import { dxf } from '@repiom/core';
import { useEffect, useId, useState, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router';
import { SayiAlani } from '../components/form';
import { sayi } from '../lib/bicim';
import type { Varsayimlar } from '../pages/CizimSayfasi';
import type { AnalizSonucu } from './mesajlar';
import type { YzDurumu } from './yapayZeka';

export interface EkKalem {
  bk: string;
  blok: string;
  grup: number;
  ad: string;
  birim?: string;
  metraj: number;
  fiyat: number;
  kaynak?: string;
  aciklama?: string;
  dahil: boolean;
}

type Sekme = 'katlar' | 'mahaller' | 'statik' | 'yeni' | 'ayar';

interface Ozellikler {
  analiz: AnalizSonucu;
  setAnaliz: Dispatch<SetStateAction<AnalizSonucu | null>>;
  ornek: boolean;
  v: Varsayimlar;
  setV: Dispatch<SetStateAction<Varsayimlar>>;
  ekler: EkKalem[];
  setEkler: Dispatch<SetStateAction<EkKalem[]>>;
  onizle: (
    bolge: [number, number, number, number],
    isaret: { x: number; y: number }[],
  ) => Promise<Blob | null>;
  /** Yapay zekâ kontrolü (istenmediyse null). */
  yz?: YzDurumu | null;
  aktar: () => void;
  aktariliyor: boolean;
}

const BIRIM_AD: Record<string, string> = { cm: 'santimetre', mm: 'milimetre', m: 'metre' };
const katAdi = (k: dxf.ArchFloor) =>
  (k.blok ? `${k.blok} · ` : '') + k.baslik.replace(/\s*(PLANI|PLAN).*$/i, '');

export function KontrolEkrani(o: Ozellikler) {
  const [sekme, setSekme] = useState<Sekme>('katlar');
  const { analiz } = o;
  const M = analiz.mimari;
  const S = analiz.statik;
  const uyarilar = dxf.analysisWarnings({
    ...analiz,
    veri: { mimari: { T: [], I: [], L: [], P: [], header: {} }, statik: null },
  });
  const dahilKatlar = M.katlar.filter((k) => !k.haric);
  const asil = S.planlar.filter((p) => !p.kopya);
  const ozet: [string, string][] = [
    ['Kat planı', `${dahilKatlar.length} plan · ${dahilKatlar.reduce((s, k) => s + k.tekrar, 0)} kat`],
    ['Mahal', String(dahilKatlar.reduce((s, k) => s + k.mahaller.length, 0))],
    [
      'Kalıp planı',
      analiz.statikVar
        ? `${asil.length}${S.planlar.length > asil.length ? ` (+${S.planlar.length - asil.length} kopya ayıklandı)` : ''}`
        : '—',
    ],
    ['Birim', BIRIM_AD[analiz.birim.mimari] ?? analiz.birim.mimari],
    [
      'Temel',
      Object.keys(S.temel)
        .map(
          (b) => `${b}: ${S.temel[b]!.kalinlik_cm ? S.temel[b]!.kalinlik_cm + ' cm ' : ''}${S.temel[b]!.tip}`,
        )
        .join(' · ') || '—',
    ],
    ['Beton sınıfı', S.beton_sinifi ?? '—'],
  ];
  const sekmeler: [Sekme, string][] = [
    ['katlar', 'Katlar'],
    ['mahaller', 'Mahaller'],
    ['statik', 'Statik'],
    ['yeni', `Yeni kalemler (${o.ekler.length})`],
    ['ayar', 'Varsayımlar'],
  ];

  return (
    <>
      <section className="kart" aria-labelledby="kontrol-baslik">
        <div className="altbaslik">
          <h1 id="kontrol-baslik">{o.v.ad || 'Çizim analizi'} — kontrol</h1>
          {o.ornek && <span className="etiket">örnek çizim</span>}
        </div>
        <dl className="kartlar kucuk-kartlar">
          {ozet.map(([e, d]) => (
            <div className="olcu" key={e}>
              <dt className="e">{e}</dt>
              <dd className="d kucuk-d">{d}</dd>
            </div>
          ))}
        </dl>
        <div role="status">
          {uyarilar.map((u, i) => (
            <div className="uyari" key={i}>
              {u}
            </div>
          ))}
        </div>
        {o.yz && <YapayZekaNotlari yz={o.yz} />}
      </section>
      <section className="kart" aria-label="Okunan bilgiler">
        <div className="sekmeler" role="tablist" aria-label="Kontrol sekmeleri">
          {sekmeler.map(([k, ad]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === sekme}
              className={k === sekme ? 'aktif' : ''}
              onClick={() => setSekme(k)}
            >
              {ad}
            </button>
          ))}
        </div>
        {sekme === 'katlar' && <Katlar {...o} />}
        {sekme === 'mahaller' && <Mahaller {...o} />}
        {sekme === 'statik' && <Statik analiz={analiz} />}
        {sekme === 'yeni' && <YeniKalemler {...o} />}
        {sekme === 'ayar' && <Ayarlar {...o} />}
      </section>
      <div className="satir">
        <Link className="dugme" to="/">
          Vazgeç
        </Link>
        <button
          type="button"
          className="birincil buyuk"
          disabled={o.aktariliyor || !dahilKatlar.length}
          onClick={o.aktar}
        >
          {o.aktariliyor ? 'Aktarılıyor…' : 'Projeye aktar ve maliyeti hesapla'}
        </button>
      </div>
    </>
  );
}

function Katlar({ analiz, setAnaliz, onizle }: Ozellikler) {
  const [secili, setSecili] = useState<number | null>(null);
  const [resim, setResim] = useState<string | null>(null);
  const M = analiz.mimari;
  const toplam = (o: Record<string, number>) => Object.values(o).reduce((s, x) => s + x, 0);

  useEffect(() => {
    if (secili === null) return;
    let iptal = false;
    let url: string | null = null;
    const k = M.katlar[secili]!;
    void onizle(
      k.bolge,
      k.mahaller.map((m) => ({ x: m.x, y: m.y })),
    ).then((b) => {
      if (iptal || !b) return;
      url = URL.createObjectURL(b);
      setResim(url);
    });
    return () => {
      iptal = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [secili, M.katlar, onizle]);

  const haricYap = (i: number, haric: boolean) =>
    setAnaliz((a) => {
      if (!a) return a;
      const katlar = a.mimari.katlar.map((k, j) => (j === i ? { ...k, haric } : k));
      return { ...a, mimari: { ...a.mimari, katlar } };
    });

  return (
    <>
      <div className="kaydir" tabIndex={0} role="region" aria-label="Kat planları">
        <table className="sikisik">
          <thead>
            <tr>
              <th scope="col">Hesaba dahil</th>
              <th scope="col">Blok</th>
              <th scope="col">Kat planı</th>
              <th scope="col" className="s">
                Tekrar
              </th>
              <th scope="col" className="s">
                Mahal
              </th>
              <th scope="col" className="s">
                Net alan m²
              </th>
              <th scope="col" className="s">
                Kapı
              </th>
              <th scope="col" className="s">
                Pencere
              </th>
              <th scope="col">
                <span className="gizli">Önizleme</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {M.katlar.map((k, i) => (
              <tr key={i} className={k.haric ? 'soluk' : secili === i ? 'secili' : undefined}>
                <td>
                  <input
                    type="checkbox"
                    checked={!k.haric}
                    onChange={(e) => haricYap(i, !e.target.checked)}
                    aria-label={`${k.baslik} hesaba dahil`}
                  />
                </td>
                <td>{k.blok || 'A'}</td>
                <td>{k.baslik}</td>
                <td className="s">{k.tekrar}</td>
                <td className="s">{k.mahaller.length}</td>
                <td className="s">
                  {sayi(
                    k.mahaller.reduce((s, m) => s + m.alan, 0),
                    1,
                  )}
                </td>
                <td className="s">{toplam(k.kapilar)}</td>
                <td className="s" title={k.pencere_yontemi}>
                  {toplam(k.pencereler)}
                </td>
                <td>
                  <button
                    type="button"
                    className="kucuk"
                    onClick={() => setSecili(i)}
                    aria-label={`Planı gör: ${k.baslik}`}
                  >
                    Planı gör
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="not">Aynı kat iki kez çizilmişse fazlasının işaretini kaldır; hesaba girmez.</p>
      {secili !== null && (
        <figure className="onizleme">
          {resim ? (
            <img src={resim} alt={`${M.katlar[secili]!.baslik} önizlemesi`} />
          ) : (
            <p role="status">Önizleme hazırlanıyor…</p>
          )}
          <figcaption>{M.katlar[secili]!.baslik} — turuncu noktalar okunan mahaller</figcaption>
        </figure>
      )}
    </>
  );
}

function Mahaller({ analiz, setAnaliz }: Ozellikler) {
  const [filtre, setFiltre] = useState('');
  const filtreId = useId();
  const M = analiz.mimari;
  const degistir = (ki: number, mi: number, fn: (m: dxf.Room) => dxf.Room) =>
    setAnaliz((a) => {
      if (!a) return a;
      const katlar = a.mimari.katlar.map((k, i) =>
        i !== ki ? k : { ...k, mahaller: k.mahaller.map((m, j) => (j === mi ? fn(m) : m)) },
      );
      return { ...a, mimari: { ...a.mimari, katlar } };
    });
  const kaplama = (m: dxf.Room, ki: number, mi: number, y: 'zemin' | 'duvar' | 'tavan') => {
    const s = dxf.chosenFinish(m, y);
    const sec = dxf.FINISH_OPTIONS[y].includes(s) ? dxf.FINISH_OPTIONS[y] : [...dxf.FINISH_OPTIONS[y], s];
    return (
      <select
        value={s}
        aria-label={`${m.ad} – ${y}`}
        title={m[y] ? `Çizimde: ${m[y]}` : 'Kural tablosundan'}
        onChange={(e) => degistir(ki, mi, (x) => ({ ...x, secim: { ...x.secim, [y]: e.target.value } }))}
      >
        {sec.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    );
  };
  return (
    <>
      <div className="izgara">
        <div className="alan">
          <label htmlFor={filtreId}>Kat planı</label>
          <select id={filtreId} value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">Tümü</option>
            {M.katlar.map((k, i) => (
              <option key={i} value={String(i)}>
                {(k.blok ? k.blok + ' · ' : '') + k.baslik}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="not">
        Kaplama çizimde yazıyorsa o, yazmıyorsa onaylı kural tablosu seçilir. Islak hacimde çizimde "boya"
        yazıyorsa seramik alınır. Seçilen kaplamanın alt katmanları (şap, yapıştırıcı, su yalıtımı, sıva/alçı)
        otomatik eklenir.
      </p>
      <div className="kaydir" tabIndex={0} role="region" aria-label="Mahaller">
        <table className="sikisik mahal-tablosu">
          <thead>
            <tr>
              <th scope="col">Kat</th>
              <th scope="col">Mahal</th>
              <th scope="col">Tür</th>
              <th scope="col" className="s">
                Alan m²
              </th>
              <th scope="col" className="s">
                Çevre m
              </th>
              <th scope="col">Zemin</th>
              <th scope="col">Duvar</th>
              <th scope="col">Tavan</th>
            </tr>
          </thead>
          <tbody>
            {M.katlar.flatMap((k, ki) =>
              filtre !== '' && +filtre !== ki
                ? []
                : k.mahaller.map((m, mi) => (
                    <tr key={`${ki}-${mi}`} className={k.haric ? 'soluk' : undefined}>
                      <td>{katAdi(k)}</td>
                      <td>
                        {m.ad}
                        {!m.std && <span className="etiket">tanınmadı</span>}
                      </td>
                      <td>
                        <select
                          value={m.tur ?? 'kuru'}
                          aria-label={`${m.ad} – tür`}
                          onChange={(e) =>
                            degistir(ki, mi, (x) => ({
                              ...x,
                              tur: e.target.value as dxf.RoomKind,
                              secim: {},
                            }))
                          }
                        >
                          {dxf.ROOM_KINDS.map((t) => (
                            <option key={t} value={t}>
                              {dxf.ROOM_KIND_NAMES[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="s">{sayi(m.alan, 2)}</td>
                      <td className="s">
                        {m.cevre ? (
                          sayi(m.cevre, 2)
                        ) : m.alan ? (
                          <span title="Kapalı sınır bulunamadı; alandan tahmin edildi">
                            ~{sayi(4.4 * Math.sqrt(m.alan), 2)} (tahmini)
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{kaplama(m, ki, mi, 'zemin')}</td>
                      <td>{kaplama(m, ki, mi, 'duvar')}</td>
                      <td>{kaplama(m, ki, mi, 'tavan')}</td>
                    </tr>
                  )),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Statik({ analiz }: { analiz: AnalizSonucu }) {
  const S = analiz.statik;
  if (!S.planlar.length) return <p>Statik çizim yok ya da kalıp planı bulunamadı.</p>;
  return (
    <>
      <div className="kaydir" tabIndex={0} role="region" aria-label="Kalıp planları">
        <table className="sikisik">
          <thead>
            <tr>
              <th scope="col">Blok</th>
              <th scope="col">Kat</th>
              <th scope="col">Başlık</th>
              <th scope="col" className="s">
                Tekrar
              </th>
              <th scope="col" className="s">
                Döşeme m²
              </th>
              <th scope="col" className="s">
                Kiriş m
              </th>
              <th scope="col">Kiriş kesiti</th>
              <th scope="col" className="s">
                Döşeme d
              </th>
              <th scope="col" className="s">
                Kolon+perde m²
              </th>
              <th scope="col">Durum</th>
            </tr>
          </thead>
          <tbody>
            {S.planlar.map((p, i) => (
              <tr key={i} className={p.kopya ? 'soluk' : undefined}>
                <td>{p.blok || 'A'}</td>
                <td>{p.kat ?? '?'}</td>
                <td>{p.baslik || '—'}</td>
                <td className="s">{p.tekrar}</td>
                <td className="s" title={p.alan_yontemi}>
                  {sayi(p.doseme_alan_m2, 1)}
                </td>
                <td className="s">{sayi(p.kiris_cizgi_m / 2)}</td>
                <td>
                  {p.kiris_kesit
                    .slice(0, 2)
                    .map((k) => k[0])
                    .join(', ') || '—'}
                </td>
                <td className="s">
                  {p.doseme_kalinlik.length ? `${p.doseme_kalinlik[0]![0]} cm` : '15 cm*'}
                </td>
                <td className="s">{sayi(p.kolon_alan_m2, 2)}</td>
                <td>{p.kopya || 'hesaba girer'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="not">
        * Kalınlık çizimde yoksa 15 cm varsayılır. Kopya ve donatı planı eşleri hesaba girmez. Beton = döşeme
        + kiriş + kolon/perde + radye; donatı = beton × donatı oranı.
      </p>
      {Object.keys(S.jet_grout).length > 0 && (
        <p>
          Zemin iyileştirme:{' '}
          {Object.entries(S.jet_grout)
            .map(([b, j]) => `${b} blok ${j.adet} × ${j.boy_m ?? '?'} m jet grout (Ø${j.cap_cm ?? '?'} cm)`)
            .join(' · ')}
        </p>
      )}
    </>
  );
}

function YeniKalemler({ ekler, setEkler }: Ozellikler) {
  if (!ekler.length) return <p>Fiyat listesinde olmayan yeni kalem bulunmadı.</p>;
  const set = (i: number, fn: (e: EkKalem) => EkKalem) =>
    setEkler((l) => l.map((e, j) => (j === i ? fn(e) : e)));
  return (
    <>
      <p className="not">
        Çizimde bulunup fiyat listesinde olmayan kalemler. Fiyatlar tahminidir (varsayılan); kontrol edip
        düzeltebilirsin. Raporda "(tahmini fiyat)" etiketiyle görünür.
      </p>
      <div className="kaydir" tabIndex={0} role="region" aria-label="Yeni kalemler">
        <table>
          <thead>
            <tr>
              <th scope="col">Dahil</th>
              <th scope="col">Blok</th>
              <th scope="col">Kalem</th>
              <th scope="col">Birim</th>
              <th scope="col" className="s">
                Metraj
              </th>
              <th scope="col" className="s">
                Birim fiyat (TL)
              </th>
              <th scope="col">Dayanak</th>
            </tr>
          </thead>
          <tbody>
            {ekler.map((e, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="checkbox"
                    checked={e.dahil}
                    aria-label={`${e.ad} dahil`}
                    onChange={(x) => set(i, (y) => ({ ...y, dahil: x.target.checked }))}
                  />
                </td>
                <td>{e.blok}</td>
                <td>{e.ad}</td>
                <td>{e.birim}</td>
                <td className="s">{sayi(e.metraj, 1)}</td>
                <td className="s">
                  <input
                    className="hucre"
                    type="number"
                    min={0}
                    step={1}
                    value={e.fiyat}
                    aria-label={`${e.ad} birim fiyatı`}
                    onChange={(x) =>
                      set(i, (y) => ({ ...y, fiyat: Math.max(0, Number(x.target.value) || 0) }))
                    }
                  />
                </td>
                <td>{e.aciklama}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Ayarlar({ v, setV }: Ozellikler) {
  return (
    <>
      <div className="izgara">
        <SayiAlani
          etiket="Kat yüksekliği (m)"
          deger={v.H}
          min={2.4}
          max={6}
          degistir={(H) => H !== '' && setV((x) => ({ ...x, H }))}
        />
        <SayiAlani
          etiket="Donatı oranı (kg / m³ beton)"
          deger={v.donati}
          min={60}
          max={200}
          degistir={(donati) => donati !== '' && setV((x) => ({ ...x, donati }))}
        />
      </div>
      <p className="not">
        Betonarme: kalıp planlarından döşeme + kiriş + kolon/perde betonu ve radye; donatı betonla orantılı.
        Mahal çevresi kapalı sınırdan ölçülür, bulunamazsa alandan tahmin edilir. Bu değerler hesapta formülün
        yerine geçer; çizimden çıkmayan kalemler (mekanik, elektrik, genel giderler) formülle hesaplanır.
      </p>
    </>
  );
}

function YapayZekaNotlari({ yz }: { yz: YzDurumu }) {
  return (
    <section className="yz-kutu" aria-labelledby="yz-baslik" aria-busy={yz.durum === 'bekliyor'}>
      <h2 id="yz-baslik">Yapay zekâ kontrolü</h2>
      <div role="status" aria-live="polite">
        {yz.durum === 'bekliyor' && (
          <p>Yapay zekâ kontrolü yapılıyor… Bu sırada okunanları inceleyebilirsin.</p>
        )}
        {yz.durum === 'hata' && (
          <p className="uyari">
            {yz.mesaj ?? 'Yapay zekâ kontrolü yapılamadı.'} Analiz etkilenmez; yeni kalemlerde varsayılan
            tahmini fiyatlar kullanılır.
          </p>
        )}
        {yz.durum === 'tamam' &&
          (yz.notlar.length ? (
            <ul>
              {yz.notlar.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : (
            <p>Yapay zekâ bir tutarsızlık bulmadı.</p>
          ))}
        {yz.durum === 'tamam' && (
          <p className="not">
            Notlar ve fiyat tahminleri yapay zekâ önerisidir; kontrol edip karar vermek sana aittir.
          </p>
        )}
      </div>
    </section>
  );
}
