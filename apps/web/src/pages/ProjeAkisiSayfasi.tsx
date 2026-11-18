import type { ReactNode } from 'react';
import { Link, Navigate, NavLink, useNavigate, useParams, useSearchParams } from 'react-router';
import { HataKutusu } from '../components/HataKutusu';
import { Yukleniyor } from '../components/Yukleniyor';
import { ADIMLAR } from '../lib/adimlar';
import { tarihGun } from '../lib/fiyat';
import { useProjeEditoru, type ProjeEditoru } from '../lib/useProjeEditoru';
import { DaireTipleriAdimi } from './adimlar/DaireTipleriAdimi';
import { DigerBilgilerAdimi } from './adimlar/DigerBilgilerAdimi';
import { KatlarAdimi } from './adimlar/KatlarAdimi';
import type { AdimOzellikleri } from './adimlar/ortak';
import { OzetAdimi } from './adimlar/OzetAdimi';
import { ProjeAdimi } from './adimlar/ProjeAdimi';
import { ProjeGeneliAdimi } from './adimlar/ProjeGeneliAdimi';
import { SonucAdimi } from './adimlar/SonucAdimi';

const EKRANLAR: Record<string, (p: AdimOzellikleri) => ReactNode> = {
  proje: ProjeAdimi,
  'daire-tipleri': DaireTipleriAdimi,
  katlar: KatlarAdimi,
  'diger-bilgiler': DigerBilgilerAdimi,
  'proje-geneli': ProjeGeneliAdimi,
  ozet: OzetAdimi,
  sonuc: SonucAdimi,
};

function KayitGostergesi({ editor }: { editor: ProjeEditoru }) {
  const d = editor.durum;
  return (
    <span className={`kayit-durum${d.tur === 'hata' ? ' hata' : ''}`} role="status" aria-live="polite">
      {d.tur === 'kaydedildi'
        ? 'Kaydedildi'
        : d.tur === 'kaydediliyor'
          ? 'Kaydediliyor…'
          : `Kaydedilemedi: ${d.mesaj}`}
      {d.tur === 'hata' && (
        <button type="button" className="baglanti" onClick={() => void editor.kaydet()}>
          Tekrar dene
        </button>
      )}
    </span>
  );
}

export function ProjeAkisiSayfasi() {
  const { projeId = '', adim = 'proje' } = useParams();
  const [arama, setArama] = useSearchParams();
  const navigate = useNavigate();
  const editor = useProjeEditoru(projeId);
  const sira = ADIMLAR.findIndex((a) => a.yol === adim);

  if (sira < 0) return <Navigate to={`/proje/${projeId}/proje`} replace />;
  if (editor.hata) {
    return (
      <section className="kart">
        <HataKutusu mesaj={editor.hata} />
        <Link className="dugme" to="/">
          ← Projelerim
        </Link>
      </section>
    );
  }
  if (editor.yukleniyor || !editor.girdi) return <Yukleniyor metin="Proje açılıyor…" />;

  const girdi = editor.girdi;
  const blokSayisi = (girdi.bloklar ?? []).length || 1;
  const blok = Math.min(Math.max(0, Number(arama.get('blok')) || 0), blokSayisi - 1);
  const ek = blok ? `?blok=${blok}` : '';
  const adimaGit = (yol: string) => {
    navigate(`/proje/${projeId}/${yol}${ek}`);
    window.scrollTo(0, 0);
  };
  const props: AdimOzellikleri = {
    editor,
    girdi,
    degistir: editor.degistir,
    blok,
    blokSec: (n) => setArama(n ? { blok: String(n) } : {}, { replace: true }),
    adimaGit,
  };
  const Ekran = EKRANLAR[adim]!;
  const aktif = ADIMLAR[sira]!;
  const onceki = ADIMLAR[sira - 1];
  const sonraki = ADIMLAR[sira + 1];
  const f = editor.fiyatListesi;
  const a = editor.aktifFiyatListesi;

  return (
    <section aria-labelledby="proje-adi">
      <div className="proje-ust">
        <div>
          <h1 id="proje-adi" className="proje-adi">
            {String(girdi.ad || 'Adsız proje')}
          </h1>
          <KayitGostergesi editor={editor} />
        </div>
        {f && (
          <div className="not">
            Fiyat listesi: {f.aciklama || `Sürüm ${f.id}`} ({tarihGun(f.yayin_tarihi ?? f.olusturma)})
          </div>
        )}
      </div>
      {f && a && f.id !== a.id && (
        <div className="uyari" role="status">
          Bu proje {tarihGun(f.yayin_tarihi ?? f.olusturma)} tarihli fiyat listesiyle hesaplanıyor. Daha yeni
          bir liste yayında ({a.aciklama || `Sürüm ${a.id}`}).{' '}
          <button type="button" className="baglanti" onClick={editor.guncelFiyataGec}>
            Güncel fiyatlarla yeniden hesapla
          </button>
        </div>
      )}
      <nav className="adimlar" aria-label="Hesap adımları">
        <ol>
          {ADIMLAR.map((x, i) => (
            <li key={x.yol}>
              <NavLink to={`/proje/${projeId}/${x.yol}${ek}`} aria-current={i === sira ? 'step' : undefined}>
                <span className="adim-no" aria-hidden="true">
                  {i + 1}
                </span>
                {x.ad}
              </NavLink>
            </li>
          ))}
        </ol>
      </nav>
      <h2 className="gizli">
        {sira + 1}. adım: {aktif.ad}
      </h2>
      <Ekran {...props} />
      {sira < 5 && (
        <div className="satir">
          {onceki ? (
            <button type="button" onClick={() => adimaGit(onceki.yol)}>
              ← {onceki.ad}
            </button>
          ) : (
            <Link className="dugme" to="/">
              ← Projelerim
            </Link>
          )}
          {sonraki && (
            <button type="button" className="birincil" onClick={() => adimaGit(sonraki.yol)}>
              {sonraki.ad} →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
