/**
 * Çizimden maliyet (mobil): DXF seç → cihazda oku → hak sunucuda düşer → kontrol ekranı → projeye aktar.
 * İsteğe bağlı yapay zekâ kontrolü: açık rıza + yazısız plan görselleri (en çok 6) + gizlilik özeti.
 */
import { dxf, PROVINCES } from '@repiom/core';
import { analizBaslat, analizIade, sha256, useHak } from '@repiom/istemci/abonelik';
import {
  ekListesi,
  fiyatlariUygula,
  projeyeAktar,
  yzIste,
  type AnalizSonucu,
  type EkKalem,
  type Varsayimlar,
} from '@repiom/istemci/cizim';
import { turkceHata } from '@repiom/istemci/hatalar';
import { onayKaydet } from '@repiom/istemci/onaylar';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View, type ScrollViewInstance } from 'react-native';
import { BelgeBaglantisi } from '../bilesenler/Belge';
import { MetinAlani, OnayKutusu, SayiAlani, SecimAlani } from '../bilesenler/form';
import { Basari, Dugme, HataKutusu, Kart } from '../bilesenler/temel';
import { S } from '../bilesenler/tema';
import { EkranHatasi } from '../cizim/EkranHatasi';
import { KontrolEkrani, type YzDurumu } from '../cizim/Kontrol';
import { cizimiOku, MOBIL_EN_COK, type Ilerleme, type SecilenDosya } from '../cizim/okuma';
import { PlanOnizleme, type OnizlemeRef } from '../cizim/Onizleme';

const ILLER = PROVINCES.map((p) => p.ad);
const MB = (n: number) => `${(n / 1048576).toFixed(1).replace('.', ',')} MB`;

async function dosyaSec(): Promise<SecilenDosya | null> {
  const r = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  if (!/\.dxf$/i.test(a.name)) throw new Error('DXF uzantılı bir dosya seç.');
  return { uri: a.uri, ad: a.name, boyut: a.size ?? 0, webDosyasi: a.file };
}

/** Yazısız plan görsellerini ekran dışında çizip PNG'ye çevirir (yalnız iOS/Android; web önizlemesinde görsel yok). */
function GorselUretici({
  veri,
  a,
  bitti,
}: {
  veri: dxf.DxfData;
  a: AnalizSonucu;
  bitti: (g: string[]) => void;
}) {
  const katlar = a.mimari.katlar.filter((k) => !k.haric).slice(0, dxf.AI_MAX_IMAGES);
  const refler = useRef<(OnizlemeRef | null)[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      void Promise.all(refler.current.map((r) => r?.png() ?? Promise.resolve(null))).then((l) =>
        bitti(l.filter((x): x is string => Boolean(x))),
      );
    }, 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View
      style={{ position: 'absolute', left: -10000, top: 0 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {katlar.map((k, i) => (
        <PlanOnizleme
          key={i}
          ref={(r) => {
            refler.current[i] = r;
          }}
          veri={veri}
          bolge={k.bolge}
          yazi={false}
          genislik={1100}
          etiket=""
        />
      ))}
    </View>
  );
}

export function CizimEkrani() {
  const { ornek: o } = useLocalSearchParams<{ ornek?: string }>();
  const ornek = o === '1';
  const router = useRouter();
  const istemci = useQueryClient();
  const hak = useHak(!ornek);
  const [v, setV] = useState<Varsayimlar>({
    ad: ornek ? 'Örnek çizim analizi' : '',
    il: 'İstanbul',
    H: 3,
    donati: 110,
  });
  const [mimari, setMimari] = useState<SecilenDosya | null>(null);
  const [statik, setStatik] = useState<SecilenDosya | null>(null);
  const [ilerleme, setIlerleme] = useState<Ilerleme | null>(null);
  const [analiz, setAnaliz] = useState<AnalizSonucu | null>(null);
  const [veri, setVeri] = useState<dxf.DxfData | null>(null);
  const [ekler, setEkler] = useState<EkKalem[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [analizId, setAnalizId] = useState<number | null>(null);
  const [aktariliyor, setAktariliyor] = useState(false);
  const [yzIzin, setYzIzin] = useState(false);
  const [yz, setYz] = useState<YzDurumu | null>(null);
  const [gorselIste, setGorselIste] = useState<((g: string[]) => void) | null>(null);
  const kaydirma = useRef<ScrollViewInstance>(null);

  const sec = async (tur: 'mimari' | 'statik') => {
    setHata(null);
    try {
      const d = await dosyaSec();
      if (d) (tur === 'mimari' ? setMimari : setStatik)(d);
    } catch (e) {
      setHata(turkceHata(e));
    }
  };

  const yzCalistir = async (id: number, a: AnalizSonucu, varsayilan: EkKalem[]) => {
    setYz({ durum: 'bekliyor', notlar: [] });
    try {
      await onayKaydet(['acik_riza_yurtdisi']);
      const gorseller =
        Platform.OS === 'web' ? [] : await new Promise<string[]>((coz) => setGorselIste(() => coz));
      setGorselIste(null);
      const r = await yzIste(id, a, v.il, varsayilan, gorseller);
      setEkler((l) => fiyatlariUygula(l, varsayilan, r.fiyatlar));
      setYz({ durum: 'tamam', notlar: r.notlar });
    } catch (e) {
      setGorselIste(null);
      setYz({ durum: 'hata', notlar: [], mesaj: turkceHata(e) });
    }
  };

  const baslat = async () => {
    setHata(null);
    if (!ornek && !mimari) return setHata('Mimari DXF dosyasını seç.');
    try {
      const okunan = await cizimiOku(mimari, statik, ornek, setIlerleme);
      // Çizim başarıyla okundu: kontrol ekranı açılmadan hemen önce hak sunucuda düşer.
      const e = dxf.exampleDrawings();
      const ozetler = ornek ? await Promise.all([sha256(e.mimari), sha256(e.statik)]) : [];
      const dosyalar = [mimari, statik]
        .filter((f): f is SecilenDosya => Boolean(f))
        .map((f) => ({ ad: f.ad, boyut: f.boyut }));
      const id = await analizBaslat(v.ad.trim() || 'Çizim analizi', ornek ? [] : dosyalar, ornek, ozetler);
      setAnalizId(id);
      void istemci.invalidateQueries({ queryKey: ['hak'] });
      const varsayilan = ekListesi(okunan.analiz, v);
      setAnaliz(okunan.analiz);
      setVeri(okunan.veri);
      setEkler(varsayilan);
      setYz(null);
      if (!ornek && yzIzin) void yzCalistir(id, okunan.analiz, varsayilan);
      kaydirma.current?.scrollTo({ y: 0, animated: false });
    } catch (x) {
      setHata(turkceHata(x));
    } finally {
      setIlerleme(null);
    }
  };

  const aktar = async () => {
    if (!analiz) return;
    setHata(null);
    setAktariliyor(true);
    try {
      const id = await projeyeAktar(analiz, v, ekler, analizId);
      await istemci.invalidateQueries({ queryKey: ['projeler'] });
      router.replace({ pathname: '/proje/[id]', params: { id } });
    } catch (e) {
      setHata(turkceHata(e));
      setAktariliyor(false);
    }
  };

  return (
    <ScrollView
      ref={kaydirma}
      style={S.ekran}
      contentContainerStyle={S.icerik}
      keyboardShouldPersistTaps="handled"
    >
      <HataKutusu mesaj={hata} />
      {analiz ? (
        <>
          <EkranHatasi
            hataOlunca={() => {
              if (analizId)
                void analizIade(analizId).then(() => istemci.invalidateQueries({ queryKey: ['hak'] }));
            }}
          >
            <KontrolEkrani
              analiz={analiz}
              setAnaliz={setAnaliz}
              veri={veri}
              ornek={ornek}
              v={v}
              setV={setV}
              ekler={ekler}
              setEkler={setEkler}
              yz={yz}
              aktar={() => void aktar()}
              aktariliyor={aktariliyor}
              vazgec={() => router.back()}
            />
          </EkranHatasi>
          {gorselIste && veri && <GorselUretici veri={veri} a={analiz} bitti={gorselIste} />}
        </>
      ) : (
        <Kart baslik={ornek ? 'Örnek çizimle dene' : 'Çizimden maliyet analizi'}>
          {hata?.startsWith('Analiz hakkın kalmadı') && (
            <Dugme tur="baglanti" metin="Paketlere git" bas={() => router.push('/paketler')} />
          )}
          {!ornek && hak.data && (
            <Text style={S.metin}>
              Kalan analiz hakkın: <Text style={{ fontWeight: '800' }}>{hak.data.kalan}</Text>. Hak, çizim
              başarıyla okunup kontrol ekranı açılınca düşer; çizim okunamazsa düşmez.
            </Text>
          )}
          {ornek && <Text style={S.not}>Örnek çizimle deneme ücretsizdir; analiz hakkından düşmez.</Text>}
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
            degistir={(d) => d !== '' && setV({ ...v, donati: d })}
          />
          {ornek ? (
            <Text style={S.metin}>
              Hazır kurgusal çizim kullanılır: 1 blok, 1 bodrum + zemin + 3 normal kat, mimari ve statik.
              Gerçek bir projeye ait değildir.
            </Text>
          ) : (
            <>
              <Dugme
                metin={mimari ? `Mimari: ${mimari.ad} (${MB(mimari.boyut)})` : 'Mimari DXF seç (zorunlu)'}
                bas={() => void sec('mimari')}
              />
              <Dugme
                metin={statik ? `Statik: ${statik.ad} (${MB(statik.boyut)})` : 'Statik DXF seç (önerilir)'}
                bas={() => void sec('statik')}
              />
              <Text style={S.not}>
                AutoCAD'den DXF olarak kaydet. Telefonda en çok {MB(MOBIL_EN_COK)}; daha büyük çizimleri web
                uygulamasında analiz et. Çizim bu cihazda okunur; sunucuya gönderilmez.
              </Text>
              <OnayKutusu
                etiket="Yapay zekâ kontrolü de yapılsın (isteğe bağlı)"
                deger={yzIzin}
                degistir={setYzIzin}
              />
              <Text style={S.not}>
                İşaretlersen kat planlarının yazısız görüntüleri (en çok 6) ile mahal ve alan özeti, kontrol
                notları ve yeni kalem fiyat tahmini için yurt dışındaki yapay zekâ servisine (Anthropic, ABD)
                gönderilir. Proje adı, antet, isimler ve ada-parsel gönderilmez. Kutuyu işaretlemek açık rıza
                metni onayı anlamına gelir; Hesap ekranından geri alabilirsin. İşaretlemezsen analiz yine
                yapılır; yeni kalemlere varsayılan tahmini fiyatlar konur.
              </Text>
              <BelgeBaglantisi id="acik_riza_yurtdisi" />
            </>
          )}
          {ilerleme && (
            <Basari>
              {ilerleme.asama === 'cozumleme'
                ? 'Planlar çözümleniyor…'
                : `${ilerleme.asama === 'mimari' ? 'Mimari' : 'Statik'} okunuyor: ${MB(ilerleme.okunan)} / ${MB(ilerleme.toplam)}`}
            </Basari>
          )}
          <View style={S.arasi}>
            <Dugme metin="Vazgeç" bas={() => router.back()} />
            <Dugme
              tur="birincil"
              metin={ilerleme ? 'Okunuyor…' : 'Analizi başlat'}
              devreDisi={Boolean(ilerleme)}
              bas={() => void baslat()}
            />
          </View>
        </Kart>
      )}
    </ScrollView>
  );
}
