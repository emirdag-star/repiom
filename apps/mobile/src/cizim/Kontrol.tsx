/** Mobil kontrol ekranı: okunanlar projeye aktarılmadan önce görülür ve düzeltilir (web ile aynı sekmeler). */
import { dxf } from '@repiom/core';
import { sayi } from '@repiom/istemci/bicim';
import type { AnalizSonucu, EkKalem, Varsayimlar } from '@repiom/istemci/cizim';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Text, TextInput, useWindowDimensions, View } from 'react-native';
import { OnayKutusu, SayiAlani, SecimAlani } from '../bilesenler/form';
import { Dugme, Kart, Sekmeler, Uyari } from '../bilesenler/temel';
import { R, S } from '../bilesenler/tema';
import { PlanOnizleme } from './Onizleme';

export interface YzDurumu {
  durum: 'bekliyor' | 'tamam' | 'hata';
  notlar: string[];
  mesaj?: string;
}

interface Ozellikler {
  analiz: AnalizSonucu;
  setAnaliz: Dispatch<SetStateAction<AnalizSonucu | null>>;
  veri: dxf.DxfData | null;
  ornek: boolean;
  v: Varsayimlar;
  setV: Dispatch<SetStateAction<Varsayimlar>>;
  ekler: EkKalem[];
  setEkler: Dispatch<SetStateAction<EkKalem[]>>;
  yz: YzDurumu | null;
  aktar: () => void;
  aktariliyor: boolean;
  vazgec: () => void;
}

type Sekme = 'katlar' | 'mahaller' | 'statik' | 'yeni' | 'ayar';
const BIRIM_AD: Record<string, string> = { cm: 'santimetre', mm: 'milimetre', m: 'metre' };
const katAdi = (k: dxf.ArchFloor) =>
  (k.blok ? `${k.blok} · ` : '') + k.baslik.replace(/\s*(PLANI|PLAN).*$/i, '');
const toplam = (o: Record<string, number>) => Object.values(o).reduce((s, x) => s + x, 0);

export function KontrolEkrani(o: Ozellikler) {
  const [sekme, setSekme] = useState<Sekme>('katlar');
  const { analiz } = o;
  const M = analiz.mimari;
  const St = analiz.statik;
  const uyarilar = dxf.analysisWarnings({
    ...analiz,
    veri: { mimari: { T: [], I: [], L: [], P: [], header: {} }, statik: null },
  });
  const dahil = M.katlar.filter((k) => !k.haric);
  const asil = St.planlar.filter((p) => !p.kopya);
  const ozet: [string, string][] = [
    ['Kat planı', `${dahil.length} plan · ${dahil.reduce((s, k) => s + k.tekrar, 0)} kat`],
    ['Mahal', String(dahil.reduce((s, k) => s + k.mahaller.length, 0))],
    [
      'Kalıp planı',
      analiz.statikVar
        ? `${asil.length}${St.planlar.length > asil.length ? ` (+${St.planlar.length - asil.length} kopya ayıklandı)` : ''}`
        : '—',
    ],
    ['Birim', BIRIM_AD[analiz.birim.mimari] ?? analiz.birim.mimari],
    ['Beton sınıfı', St.beton_sinifi ?? '—'],
  ];
  return (
    <>
      <Kart baslik={`${o.v.ad || 'Çizim analizi'} — kontrol${o.ornek ? ' (örnek çizim)' : ''}`}>
        {ozet.map(([e, d]) => (
          <View key={e} style={S.arasi}>
            <Text style={S.not}>{e}</Text>
            <Text style={[S.metin, { fontWeight: '700' }]}>{d}</Text>
          </View>
        ))}
        {uyarilar.map((u, i) => (
          <Uyari key={i}>{u}</Uyari>
        ))}
        {o.yz && <YapayZeka yz={o.yz} />}
      </Kart>
      <Sekmeler
        etiket="Kontrol sekmeleri"
        secenekler={[
          ['katlar', 'Katlar'],
          ['mahaller', 'Mahaller'],
          ['statik', 'Statik'],
          ['yeni', `Yeni kalemler (${o.ekler.length})`],
          ['ayar', 'Varsayımlar'],
        ]}
        secili={sekme}
        sec={setSekme}
      />
      {sekme === 'katlar' && <Katlar {...o} />}
      {sekme === 'mahaller' && <Mahaller {...o} />}
      {sekme === 'statik' && <Statik analiz={analiz} />}
      {sekme === 'yeni' && <YeniKalemler {...o} />}
      {sekme === 'ayar' && <Ayarlar {...o} />}
      <View style={S.arasi}>
        <Dugme metin="Vazgeç" bas={o.vazgec} />
        <Dugme
          tur="birincil"
          metin={o.aktariliyor ? 'Aktarılıyor…' : 'Projeye aktar ve maliyeti hesapla'}
          devreDisi={o.aktariliyor || !dahil.length}
          bas={o.aktar}
        />
      </View>
    </>
  );
}

function YapayZeka({ yz }: { yz: YzDurumu }) {
  return (
    <View
      style={{ borderLeftWidth: 4, borderLeftColor: R.ana, paddingLeft: 10, gap: 4 }}
      accessibilityLiveRegion="polite"
    >
      <Text accessibilityRole="header" style={S.baslik3}>
        Yapay zekâ kontrolü
      </Text>
      {yz.durum === 'bekliyor' && (
        <Text style={S.metin}>Yapay zekâ kontrolü yapılıyor… Bu sırada okunanları inceleyebilirsin.</Text>
      )}
      {yz.durum === 'hata' && (
        <Uyari>
          {yz.mesaj ?? 'Yapay zekâ kontrolü yapılamadı.'} Analiz etkilenmez; yeni kalemlerde varsayılan
          tahmini fiyatlar kullanılır.
        </Uyari>
      )}
      {yz.durum === 'tamam' &&
        (yz.notlar.length ? (
          yz.notlar.map((n, i) => (
            <Text key={i} style={S.metin}>
              • {n}
            </Text>
          ))
        ) : (
          <Text style={S.metin}>Yapay zekâ bir tutarsızlık bulmadı.</Text>
        ))}
      {yz.durum === 'tamam' && (
        <Text style={S.not}>
          Notlar ve fiyat tahminleri yapay zekâ önerisidir; kontrol edip karar vermek sana aittir.
        </Text>
      )}
    </View>
  );
}

function Katlar({ analiz, setAnaliz, veri }: Ozellikler) {
  const [secili, setSecili] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const M = analiz.mimari;
  const haricYap = (i: number, haric: boolean) =>
    setAnaliz((a) =>
      a
        ? {
            ...a,
            mimari: { ...a.mimari, katlar: a.mimari.katlar.map((k, j) => (j === i ? { ...k, haric } : k)) },
          }
        : a,
    );
  const k = secili === null ? null : M.katlar[secili];
  return (
    <Kart>
      <Text style={S.not}>Aynı kat iki kez çizilmişse fazlasının işaretini kaldır; hesaba girmez.</Text>
      {M.katlar.map((x, i) => (
        <View key={i} style={[S.altkart, x.haric ? { opacity: 0.6 } : null]}>
          <OnayKutusu etiket={`${x.baslik} hesaba dahil`} deger={!x.haric} degistir={(d) => haricYap(i, !d)}>
            <Text style={[S.metin, { fontWeight: '700' }]}>
              {x.blok || 'A'} · {x.baslik}
            </Text>
          </OnayKutusu>
          <Text style={S.not}>
            Tekrar {x.tekrar} · {x.mahaller.length} mahal ·{' '}
            {sayi(
              x.mahaller.reduce((s, m) => s + m.alan, 0),
              1,
            )}{' '}
            m² · kapı {toplam(x.kapilar)} · pencere {toplam(x.pencereler)}
          </Text>
          <Dugme kucuk metin="Planı gör" erisimEtiketi={`Planı gör: ${x.baslik}`} bas={() => setSecili(i)} />
        </View>
      ))}
      {k && veri && (
        <View style={{ gap: 4 }}>
          <PlanOnizleme
            veri={veri}
            bolge={k.bolge}
            isaret={k.mahaller.map((m) => ({ x: m.x, y: m.y }))}
            genislik={Math.min(width - 60, 900)}
            etiket={`${k.baslik} önizlemesi`}
          />
          <Text style={S.not}>{k.baslik} — turuncu noktalar okunan mahaller</Text>
        </View>
      )}
    </Kart>
  );
}

function Mahaller({ analiz, setAnaliz }: Ozellikler) {
  const [filtre, setFiltre] = useState('0');
  const M = analiz.mimari;
  const degistir = (ki: number, mi: number, fn: (m: dxf.Room) => dxf.Room) =>
    setAnaliz((a) =>
      a
        ? {
            ...a,
            mimari: {
              ...a.mimari,
              katlar: a.mimari.katlar.map((k, i) =>
                i !== ki ? k : { ...k, mahaller: k.mahaller.map((m, j) => (j === mi ? fn(m) : m)) },
              ),
            },
          }
        : a,
    );
  const kaplama = (m: dxf.Room, ki: number, mi: number, y: 'zemin' | 'duvar' | 'tavan', ad: string) => {
    const s = dxf.chosenFinish(m, y);
    const sec = dxf.FINISH_OPTIONS[y].includes(s) ? dxf.FINISH_OPTIONS[y] : [...dxf.FINISH_OPTIONS[y], s];
    return (
      <SecimAlani
        etiket={`${m.ad} – ${y}`}
        aciklama={undefined}
        deger={s}
        secenekler={sec}
        bosSecenek={false}
        degistir={(x) => degistir(ki, mi, (r) => ({ ...r, secim: { ...r.secim, [y]: x } }))}
        key={ad}
      />
    );
  };
  const ki = Number(filtre);
  const k = M.katlar[ki];
  return (
    <Kart>
      <SecimAlani
        etiket="Kat planı"
        deger={filtre}
        bosSecenek={false}
        secenekler={M.katlar.map((x, i) => [String(i), (x.blok ? x.blok + ' · ' : '') + x.baslik] as const)}
        degistir={setFiltre}
      />
      <Text style={S.not}>
        Kaplama çizimde yazıyorsa o, yazmıyorsa onaylı kural tablosu seçilir. Islak hacimde çizimde "boya"
        yazıyorsa seramik alınır. Alt katmanlar (şap, yapıştırıcı, su yalıtımı, sıva/alçı) otomatik eklenir.
      </Text>
      {k?.mahaller.map((m, mi) => (
        <View key={mi} style={S.altkart}>
          <Text style={[S.metin, { fontWeight: '700' }]}>
            {katAdi(k)} · {m.ad}
            {!m.std ? ' (tanınmadı)' : ''}
          </Text>
          <Text style={S.not}>
            {sayi(m.alan, 2)} m² · çevre{' '}
            {m.cevre
              ? `${sayi(m.cevre, 2)} m`
              : m.alan
                ? `~${sayi(4.4 * Math.sqrt(m.alan), 2)} m (tahmini)`
                : '—'}
          </Text>
          <SecimAlani
            etiket={`${m.ad} – tür`}
            deger={m.tur ?? 'kuru'}
            bosSecenek={false}
            secenekler={dxf.ROOM_KINDS.map((t) => [t, dxf.ROOM_KIND_NAMES[t]] as const)}
            degistir={(x) => degistir(ki, mi, (r) => ({ ...r, tur: x as dxf.RoomKind, secim: {} }))}
          />
          {kaplama(m, ki, mi, 'zemin', 'z')}
          {kaplama(m, ki, mi, 'duvar', 'd')}
          {kaplama(m, ki, mi, 'tavan', 't')}
        </View>
      ))}
    </Kart>
  );
}

function Statik({ analiz }: { analiz: AnalizSonucu }) {
  const St = analiz.statik;
  if (!St.planlar.length)
    return (
      <Kart>
        <Text style={S.metin}>Statik çizim yok ya da kalıp planı bulunamadı.</Text>
      </Kart>
    );
  return (
    <Kart>
      {St.planlar.map((p, i) => (
        <View key={i} style={[S.altkart, p.kopya ? { opacity: 0.6 } : null]}>
          <Text style={[S.metin, { fontWeight: '700' }]}>
            {p.blok || 'A'} · {p.kat ?? '?'} · {p.baslik || '—'}
          </Text>
          <Text style={S.not}>
            Tekrar {p.tekrar} · döşeme {sayi(p.doseme_alan_m2, 1)} m² · kiriş {sayi(p.kiris_cizgi_m / 2)} m (
            {p.kiris_kesit
              .slice(0, 2)
              .map((x) => x[0])
              .join(', ') || '—'}
            ) · d={p.doseme_kalinlik.length ? `${p.doseme_kalinlik[0]![0]} cm` : '15 cm*'} · kolon+perde{' '}
            {sayi(p.kolon_alan_m2, 2)} m²
          </Text>
          <Text style={S.not}>{p.kopya || 'hesaba girer'}</Text>
        </View>
      ))}
      <Text style={S.not}>
        * Kalınlık çizimde yoksa 15 cm varsayılır. Kopya ve donatı planı eşleri hesaba girmez.
      </Text>
      {Object.keys(St.jet_grout).length > 0 && (
        <Text style={S.metin}>
          Zemin iyileştirme:{' '}
          {Object.entries(St.jet_grout)
            .map(([b, j]) => `${b} blok ${j.adet} × ${j.boy_m ?? '?'} m jet grout (Ø${j.cap_cm ?? '?'} cm)`)
            .join(' · ')}
        </Text>
      )}
    </Kart>
  );
}

function YeniKalemler({ ekler, setEkler }: Ozellikler) {
  if (!ekler.length)
    return (
      <Kart>
        <Text style={S.metin}>Fiyat listesinde olmayan yeni kalem bulunmadı.</Text>
      </Kart>
    );
  const set = (i: number, fn: (e: EkKalem) => EkKalem) =>
    setEkler((l) => l.map((e, j) => (j === i ? fn(e) : e)));
  return (
    <Kart>
      <Text style={S.not}>
        Çizimde bulunup fiyat listesinde olmayan kalemler. Fiyatlar tahminidir; kontrol edip düzeltebilirsin.
        Raporda "(tahmini fiyat)" etiketiyle görünür.
      </Text>
      {ekler.map((e, i) => (
        <View key={i} style={S.altkart}>
          <OnayKutusu
            etiket={`${e.ad} dahil`}
            deger={e.dahil}
            degistir={(x) => set(i, (y) => ({ ...y, dahil: x }))}
          >
            <Text style={[S.metin, { fontWeight: '700' }]}>
              {e.blok} · {e.ad}
            </Text>
          </OnayKutusu>
          <Text style={S.not}>
            {sayi(e.metraj, 1)} {e.birim}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: R.ana }}>Birim fiyat (TL)</Text>
          <TextInput
            accessibilityLabel={`${e.ad} birim fiyatı`}
            keyboardType="number-pad"
            value={String(e.fiyat)}
            onChangeText={(x) =>
              set(i, (y) => ({ ...y, fiyat: Math.max(0, Number(x.replace(/\D/g, '')) || 0) }))
            }
            style={{
              borderWidth: 1,
              borderColor: R.cizgi,
              borderRadius: 8,
              padding: 10,
              minHeight: 44,
              color: R.ana,
            }}
          />
          {e.aciklama ? <Text style={S.not}>{e.aciklama}</Text> : null}
        </View>
      ))}
    </Kart>
  );
}

function Ayarlar({ v, setV }: Ozellikler) {
  return (
    <Kart>
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
        degistir={(d) => d !== '' && setV((x) => ({ ...x, donati: d }))}
      />
      <Text style={S.not}>
        Betonarme: kalıp planlarından döşeme + kiriş + kolon/perde betonu ve radye; donatı betonla orantılı.
        Çizimden çıkmayan kalemler (mekanik, elektrik, genel giderler) formülle hesaplanır.
      </Text>
    </Kart>
  );
}
