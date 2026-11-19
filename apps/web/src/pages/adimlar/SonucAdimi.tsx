import type { CalculationResult, ItemRow, ProjectInput, ResultRow } from '@repiom/core';
import { olaySay } from '@repiom/istemci/olcum';
import { useState } from 'react';
import { HataKutusu } from '../../components/HataKutusu';
import { useOnay } from '../../components/OnayPenceresi';
import { sayiOku } from '../../lib/sayi';
import { turkceHata } from '../../lib/hatalar';
import { excelIndir, pdfIndir } from '../../lib/raporIndir';
import { Uyarilar } from './OzetAdimi';
import { sayi, tl } from '../../lib/bicim';
import { type AdimOzellikleri } from './ortak';

type Alan = 'metraj' | 'piyasa';

/** Düzenlenebilir sayı hücresi: odaktan çıkınca ya da Enter'a basınca kaydeder. */
function Hucre({
  deger,
  elle,
  etiket,
  kaydet,
}: {
  deger: number;
  elle: boolean;
  etiket: string;
  kaydet: (x: number | null) => void;
}) {
  const goster = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');
  const [metin, setMetin] = useState(goster(deger));
  const [hata, setHata] = useState(false);
  // Hesap sonucu değişince (ör. "Formüle dön") hücre güncellenir — render sırasında eşitleme.
  const [oncekiDeger, setOncekiDeger] = useState(deger);
  if (!Object.is(oncekiDeger, deger)) {
    setOncekiDeger(deger);
    setMetin(goster(deger));
  }
  const bitir = () => {
    const x = sayiOku(metin);
    if (x === null) return kaydet(null);
    if (Number.isNaN(x) || x < 0) {
      setHata(true);
      return;
    }
    setHata(false);
    // Değer değişmediyse (yalnız odaklanıp çıkıldıysa) düzeltme kaydedilmez.
    if (Math.round(x * 100) !== Math.round(deger * 100)) kaydet(x);
  };
  return (
    <input
      className={`hucre${elle ? ' elle' : ''}`}
      type="text"
      inputMode="decimal"
      aria-label={etiket}
      aria-invalid={hata || undefined}
      value={metin}
      onChange={(e) => setMetin(e.target.value)}
      onBlur={bitir}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

type Sekme = 'tum' | 'pg' | `b${number}`;

function tablo(s: CalculationResult, sekme: Sekme) {
  if (sekme === 'tum') return s.tumProje;
  if (sekme === 'pg') return s.projeGeneli;
  return s.bloklar[+sekme.slice(1)] ?? s.tumProje;
}

export function SonucAdimi({ editor, girdi, degistir, adimaGit }: AdimOzellikleri) {
  const onayla = useOnay();
  const [sekme, setSekme] = useState<Sekme>('tum');
  const [sifirGizle, setSifirGizle] = useState(true);
  const [kapali, setKapali] = useState<Record<string, boolean>>({});
  const [mesgul, setMesgul] = useState<'' | 'excel' | 'pdf'>('');
  const [indirmeHatasi, setIndirmeHatasi] = useState<string | null>(null);
  const s = editor.sonuc!;

  if (s.hata !== undefined) {
    return (
      <section className="kart">
        <div className="uyari" role="alert">
          {s.hata}
        </div>
        <button type="button" onClick={() => adimaGit('proje')}>
          Proje bilgilerine dön
        </button>
      </section>
    );
  }

  const o = s.ozet;
  const sekmeler: [Sekme, string][] = [
    ['tum', 'Tüm Proje'],
    ...s.bloklar.map((b, n) => [`b${n}` as Sekme, b.ad] as [Sekme, string]),
    ['pg', 'Proje Geneli'],
  ];
  const veri = tablo(s, sekme);
  const duzenlenebilir = sekme !== 'tum';
  const duzAnahtar = sekme === 'pg' ? 'proje' : `blok${sekme.slice(1)}`;
  const duzeltmeSayisi = Object.values(girdi.duzeltmeler ?? {}).reduce(
    (a, d) => a + Object.keys(d).length,
    0,
  );

  const duzelt = (r: ItemRow, alan: Alan, x: number | null) =>
    degistir((p: ProjectInput) => {
      const tum = (p.duzeltmeler ??= {});
      const dk = (tum[duzAnahtar] ??= {});
      const d = (dk[r.anahtar] ??= {});
      if (x === null) delete d[alan];
      else d[alan] = x;
      if (!Object.keys(d).length) delete dk[r.anahtar];
    });
  const formuleDon = (r: ItemRow) =>
    degistir((p) => {
      delete p.duzeltmeler?.[duzAnahtar]?.[r.anahtar];
    });
  const hepsiniKaldir = async () => {
    if (
      await onayla({
        baslik: 'Elle düzeltmeler kaldırılsın mı?',
        metin: 'Tüm elle düzeltmeler kaldırılıp formül değerlerine dönülecek.',
        evet: 'Hepsini kaldır',
        tehlikeli: true,
      })
    )
      degistir((p) => void (p.duzeltmeler = {}));
  };
  const indir = async (tur: 'excel' | 'pdf') => {
    setMesgul(tur);
    olaySay(tur === 'excel' ? 'rapor:excel' : 'rapor:pdf');
    setIndirmeHatasi(null);
    try {
      await (tur === 'excel' ? excelIndir(s, girdi) : pdfIndir(s, girdi));
    } catch (e) {
      setIndirmeHatasi(`Rapor hazırlanamadı. ${turkceHata(e)}`);
    } finally {
      setMesgul('');
    }
  };

  // Her satırın bağlı olduğu ana başlığın açık olup olmadığı (başlık satırından sonraki kalemler ona aittir).
  const grupAcik: boolean[] = [];
  for (const r of veri.satirlar) {
    const onceki = grupAcik.length ? grupAcik[grupAcik.length - 1]! : true;
    grupAcik.push(r.baslik ? !kapali[sekme + r.grup] : onceki);
  }
  const satirlar = veri.satirlar.map((r: ResultRow, i) => {
    const acik = grupAcik[i]!;
    if (r.baslik) {
      const anahtar = sekme + r.grup;
      return (
        <tr className="grup" key={`g${r.grup}-${i}`}>
          <td colSpan={5}>
            <button
              type="button"
              className="grup-dugme"
              aria-expanded={acik}
              onClick={() => setKapali((k) => ({ ...k, [anahtar]: !k[anahtar] }))}
            >
              {r.no}. {r.ad}
            </button>
          </td>
          <td className="s">{sayi(r.piyasaTutar ?? 0)}</td>
          {duzenlenebilir && <td />}
        </tr>
      );
    }
    if (!acik || (sifirGizle && !r.metraj)) return null;
    const elle = Boolean(r.metrajElle || r.piyasaElle);
    return (
      <tr key={r.anahtar} className={r.opsiyonel ? 'ops' : undefined}>
        <td>{r.no}</td>
        <td>{r.ad}</td>
        <td>{r.birim}</td>
        <td className="s">
          {duzenlenebilir ? (
            <Hucre
              deger={r.metraj}
              elle={Boolean(r.metrajElle)}
              etiket={`${r.ad} – metraj`}
              kaydet={(x) => duzelt(r, 'metraj', x)}
            />
          ) : (
            sayi(r.metraj, 2)
          )}
        </td>
        <td className="s">
          {duzenlenebilir ? (
            <Hucre
              deger={r.piyasaFiyat}
              elle={Boolean(r.piyasaElle)}
              etiket={`${r.ad} – birim fiyat`}
              kaydet={(x) => duzelt(r, 'piyasa', x)}
            />
          ) : (
            sayi(r.piyasaFiyat, 2)
          )}
        </td>
        <td className="s">{sayi(r.piyasaTutar)}</td>
        {duzenlenebilir && (
          <td>
            {elle && (
              <button
                type="button"
                className="kucuk"
                onClick={() => formuleDon(r)}
                aria-label={`${r.ad}: formüle dön`}
              >
                Formüle dön
              </button>
            )}
          </td>
        )}
      </tr>
    );
  });

  return (
    <>
      <Uyarilar uyarilar={s.uyarilar} />
      <div className="kartlar">
        <div className="olcu">
          <div className="e">Toplam maliyet (KDV hariç)</div>
          <div className="d" data-testid="toplam-kdv-haric">
            {tl(o.piyasa)}
          </div>
          <div className="a">
            {sayi(o.toplamInsaatAlani)} m² · {sayi(o.toplamDaire)} daire
          </div>
        </div>
        <div className="olcu">
          <div className="e">m² maliyeti (KDV hariç)</div>
          <div className="d">{sayi(o.m2Piyasa)} TL/m²</div>
          <div className="a">KDV dahil: {sayi(o.m2KdvDahil)} TL/m²</div>
        </div>
        <div className="olcu">
          <div className="e">KDV (%{sayi(o.kdvOrani * 100)})</div>
          <div className="d">{tl(o.piyasaKdv)}</div>
        </div>
        <div className="olcu">
          <div className="e">Toplam maliyet (KDV dahil)</div>
          <div className="d" data-testid="toplam-kdv-dahil">
            {tl(o.piyasaKdvDahil)}
          </div>
        </div>
      </div>
      <div className="indir">
        <button
          type="button"
          className="birincil"
          disabled={Boolean(mesgul)}
          onClick={() => void indir('excel')}
        >
          {mesgul === 'excel' ? 'Excel hazırlanıyor…' : 'Excel indir'}
        </button>
        <button
          type="button"
          className="birincil"
          disabled={Boolean(mesgul)}
          onClick={() => void indir('pdf')}
        >
          {mesgul === 'pdf' ? 'PDF hazırlanıyor…' : 'PDF indir'}
        </button>
      </div>
      <HataKutusu mesaj={indirmeHatasi} />
      <section className="kart" aria-labelledby="sonuc-baslik">
        <h2 id="sonuc-baslik">{String(girdi.ad || 'Proje')} – Yaklaşık Maliyet Tablosu</h2>
        <div className="sekmeler" role="tablist" aria-label="Tablolar">
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
        <p className="not">
          {duzenlenebilir
            ? 'Metraj ve birim fiyat hücrelerini değiştirebilirsin; değişen hücre sarı görünür ve girdileri değiştirsen de korunur. Metrajı 0 olan kalemlere metraj girmek için aşağıdaki gizleme işaretini kaldır.'
            : 'Bu sekme blokların ve proje genelinin toplamıdır; birim fiyatlar ağırlıklı ortalamadır. Düzeltme yapmak için bir blok ya da Proje Geneli sekmesine geç.'}
        </p>
        <div className="satir ust-bosluksuz">
          <label className="onay">
            <input type="checkbox" checked={sifirGizle} onChange={(e) => setSifirGizle(e.target.checked)} />
            Metrajı 0 olan kalemleri gizle
          </label>
          <span className="not">Sekme toplamı: {tl(veri.toplam.piyasa)}</span>
        </div>
        <div className="kaydir" tabIndex={0} role="region" aria-label="Maliyet tablosu">
          <table className="kalem-tablosu">
            <thead>
              <tr>
                <th scope="col">Sıra</th>
                <th scope="col">İş kalemi</th>
                <th scope="col">Birim</th>
                <th scope="col" className="s">
                  Yaklaşık metraj
                </th>
                <th scope="col" className="s">
                  Birim fiyat (TL)
                </th>
                <th scope="col" className="s">
                  Tutar (TL)
                </th>
                {duzenlenebilir && (
                  <th scope="col">
                    <span className="gizli">İşlem</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>{satirlar}</tbody>
          </table>
        </div>
        <div className="satir">
          <span className="not">
            {duzeltmeSayisi > 0 && (
              <>
                {duzeltmeSayisi} kalemde elle düzeltme var.{' '}
                <button type="button" className="baglanti" onClick={() => void hepsiniKaldir()}>
                  Hepsini kaldır
                </button>
              </>
            )}
          </span>
          <button type="button" onClick={() => adimaGit('ozet')}>
            Girdilere dön
          </button>
        </div>
      </section>
    </>
  );
}
