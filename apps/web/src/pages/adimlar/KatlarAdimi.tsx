import { emptyFloor, FLOOR_KINDS, type BlockInput, type FloorKind } from '@repiom/core';
import { SayiAlani, SecimAlani } from '../../components/form';
import { KAT_ADI, tipEtiketi } from '../../lib/bicim';
import { BlokSekmeleri, type AdimOzellikleri } from './ortak';

/** Yeni kat, türlerin sırasına göre (bodrum → dubleks) doğru yere eklenir. */
function katEkle(b: BlockInput, tur: FloorKind) {
  const katlar = b.katlar ?? (b.katlar = []);
  const sira = FLOOR_KINDS.indexOf(tur);
  let yer = katlar.length;
  for (let i = katlar.length - 1; i >= 0; i--) {
    if (FLOOR_KINDS.indexOf(katlar[i]!.tur as FloorKind) <= sira) {
      yer = i + 1;
      break;
    }
    if (i === 0) yer = 0;
  }
  katlar.splice(yer, 0, emptyFloor(tur));
}

export function KatlarAdimi({ girdi, degistir, blok, blokSec, adimaGit }: AdimOzellikleri) {
  const b = girdi.bloklar![blok]!;
  const katlar = b.katlar ?? [];
  const tipler = girdi.tipler ?? [];
  const tipSecenek = tipler.map((t) => [t.id, tipEtiketi(t)] as const);
  const blokDegistir = (fn: (x: BlockInput) => void) => degistir((p) => fn(p.bloklar![blok]!));

  const sayac: Record<string, number> = {};
  katlar.forEach((k) => {
    sayac[k.tur] = (sayac[k.tur] ?? 0) + (Number(k.tekrar) || (k.tekrar === '' ? 1 : 0));
  });
  const ozet = FLOOR_KINDS.filter((t) => sayac[t])
    .map((t) => `${sayac[t]} ${KAT_ADI[t]!.toLocaleLowerCase('tr')}`)
    .join(', ');

  return (
    <section className="kart" aria-labelledby="katlar-baslik">
      <h2 id="katlar-baslik">Kat bilgileri</h2>
      <BlokSekmeleri
        girdi={girdi}
        blok={blok}
        blokSec={blokSec}
        kopyaMetni="katlarını"
        kopyala={() =>
          degistir(
            (p) => void (p.bloklar![blok]!.katlar = structuredClone(p.bloklar![blok - 1]!.katlar ?? [])),
          )
        }
      />
      <p className="not">
        Aynı düzendeki katları tek satırda gir ve "kaç kez tekrar ediyor" alanına adedini yaz. Normal ve
        dubleks katlarda kat alanı, dairelerin brüt alanına %12 ortak alan eklenerek hesaplanır.
      </p>
      {!katlar.length && (
        <p>Bu blok için kat girilmedi. Boş bırakırsan blok, toplam inşaat alanından hesaplanır.</p>
      )}
      {katlar.map((k, n) => {
        const konut = k.tur === 'normal' || k.tur === 'dubleks';
        const sira = katlar.slice(0, n + 1).filter((x) => x.tur === k.tur).length;
        const baslik = `${KAT_ADI[k.tur] ?? k.tur} ${sira}`;
        const kat = (fn: (x: (typeof katlar)[number]) => void) => blokDegistir((x) => fn(x.katlar![n]!));
        return (
          <div className="altkart" key={n}>
            <div className="altbaslik">
              <h3>{baslik}</h3>
              <button
                type="button"
                className="kucuk"
                aria-label={`${baslik} satırını sil`}
                onClick={() => blokDegistir((x) => void x.katlar!.splice(n, 1))}
              >
                Sil
              </button>
            </div>
            <div className="izgara">
              <SayiAlani
                etiket="Kaç kez tekrar ediyor"
                deger={k.tekrar}
                tamSayi
                min={1}
                max={200}
                degistir={(x) => kat((y) => void (y.tekrar = x))}
              />
              <SayiAlani
                etiket="Kat yüksekliği (m)"
                deger={k.yukseklik}
                max={20}
                degistir={(x) => kat((y) => void (y.yukseklik = x))}
              />
              <SecimAlani
                etiket="Gömülü mü"
                deger={k.gomulu}
                secenekler={[
                  ['EVET', 'Evet'],
                  ['YARI', 'Yarı gömülü'],
                  ['HAYIR', 'Hayır'],
                ]}
                degistir={(x) => kat((y) => void (y.gomulu = x))}
              />
              {!konut && (
                <SayiAlani
                  etiket="Kat alanı (m²)"
                  deger={k.m2}
                  degistir={(x) => kat((y) => void (y.m2 = x))}
                />
              )}
            </div>
            {konut && (
              <>
                <h4>
                  {k.tur === 'dubleks'
                    ? 'Bu kattaki dubleks daireler (m² iki seviyenin toplamı)'
                    : 'Bu kattaki daireler'}
                </h4>
                {tipSecenek.length ? (
                  <>
                    {(k.daireler ?? []).map((d, i) => (
                      <div className="daire-satir" key={i}>
                        <SecimAlani
                          etiket="Daire tipi"
                          deger={d.tip}
                          secenekler={tipSecenek}
                          degistir={(x) => kat((y) => void (y.daireler![i]!.tip = x))}
                        />
                        <SayiAlani
                          etiket="Adet"
                          deger={d.adet}
                          tamSayi
                          max={100}
                          degistir={(x) => kat((y) => void (y.daireler![i]!.adet = x))}
                        />
                        <button
                          type="button"
                          className="kucuk"
                          aria-label={`${baslik}: ${i + 1}. daire satırını sil`}
                          onClick={() => kat((y) => void y.daireler!.splice(i, 1))}
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="kucuk"
                      onClick={() => kat((y) => void (y.daireler ??= []).push({ tip: '', adet: '' }))}
                    >
                      Daire ekle
                    </button>
                  </>
                ) : (
                  <p className="not">
                    Daire yerleştirmek için önce{' '}
                    <button type="button" className="baglanti" onClick={() => adimaGit('daire-tipleri')}>
                      Daire tipleri
                    </button>{' '}
                    adımında tip tanımla. Boş bırakırsan daireler kat alanından tahmin edilir.
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
      <div className="ekle" role="group" aria-label="Kat ekle">
        {FLOOR_KINDS.map((t) => (
          <button key={t} type="button" onClick={() => blokDegistir((x) => katEkle(x, t))}>
            + {KAT_ADI[t]}
          </button>
        ))}
      </div>
      {ozet && (
        <div className="bilgi">
          <span>
            {String(b.ad || `Blok ${blok + 1}`)}: <b>{ozet}</b>
          </span>
        </div>
      )}
    </section>
  );
}
