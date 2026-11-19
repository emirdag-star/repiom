/** Proje: 7 adımlı akış, otomatik kayıt göstergesi ve fiyat listesi uyarısı (ortak useProjeEditoru). */
import { ADIMLAR } from '@repiom/istemci/adimlar';
import { tarihGun } from '@repiom/istemci/fiyat';
import { useProjeEditoru } from '@repiom/istemci/useProjeEditoru';
import { Stack, useRouter } from 'expo-router';
import { olaySay, type Olay } from '@repiom/istemci/olcum';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, Text, View, type ScrollViewInstance } from 'react-native';
import { Dugme, HataKutusu, Sekmeler, Uyari, Yukleniyor } from '../bilesenler/temel';
import { R, S } from '../bilesenler/tema';
import { useOturum } from '../lib/oturum';
import {
  DaireTipleriAdimi,
  DigerBilgilerAdimi,
  KatlarAdimi,
  ProjeAdimi,
  ProjeGeneliAdimi,
  type AdimOzellikleri,
} from './adimlar';
import { OzetAdimi, SonucAdimi } from './sonuc';

type Yol = (typeof ADIMLAR)[number]['yol'];
const EKRANLAR: Record<Yol, (p: AdimOzellikleri) => ReactNode> = {
  proje: ProjeAdimi,
  'daire-tipleri': DaireTipleriAdimi,
  katlar: KatlarAdimi,
  'diger-bilgiler': DigerBilgilerAdimi,
  'proje-geneli': ProjeGeneliAdimi,
  ozet: OzetAdimi,
  sonuc: SonucAdimi,
};

export function ProjeAkisiEkrani({ id }: { id: string }) {
  const { oturum } = useOturum();
  const router = useRouter();
  const editor = useProjeEditoru(id, oturum?.access_token);
  const [adim, setAdim] = useState<Yol>('proje');
  const [blokSecili, setBlok] = useState(0);
  const kaydirma = useRef<ScrollViewInstance>(null);
  useEffect(() => olaySay(`adim:${adim}` as Olay), [adim]);

  if (editor.hata)
    return (
      <View style={[S.ekran, S.icerik]}>
        <HataKutusu mesaj={editor.hata} />
        <Dugme metin="← Projelerim" bas={() => router.back()} />
      </View>
    );
  if (editor.yukleniyor || !editor.girdi) return <Yukleniyor metin="Proje açılıyor…" />;

  const girdi = editor.girdi;
  const blok = Math.min(blokSecili, Math.max(1, (girdi.bloklar ?? []).length) - 1);
  const sira = ADIMLAR.findIndex((a) => a.yol === adim);
  const adimaGit = (y: string) => {
    setAdim(y as Yol);
    kaydirma.current?.scrollTo({ y: 0, animated: false });
  };
  const Ekran = EKRANLAR[adim];
  const onceki = ADIMLAR[sira - 1];
  const sonraki = ADIMLAR[sira + 1];
  const d = editor.durum;
  const f = editor.fiyatListesi;
  const a = editor.aktifFiyatListesi;

  return (
    <>
      <Stack.Screen options={{ title: String(girdi.ad || 'Adsız proje') }} />
      <ScrollView
        ref={kaydirma}
        style={S.ekran}
        contentContainerStyle={S.icerik}
        keyboardShouldPersistTaps="handled"
      >
        <View style={S.arasi}>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: d.tur === 'hata' ? R.hata : R.soluk, fontSize: 13, flex: 1 }}
          >
            {d.tur === 'kaydedildi'
              ? 'Kaydedildi'
              : d.tur === 'kaydediliyor'
                ? 'Kaydediliyor…'
                : `Kaydedilemedi: ${d.mesaj}`}
          </Text>
          {d.tur === 'hata' && <Dugme kucuk metin="Tekrar dene" bas={() => void editor.kaydet()} />}
        </View>
        {f && (
          <Text style={S.not}>
            Fiyat listesi: {f.aciklama || `Sürüm ${f.id}`} ({tarihGun(f.yayin_tarihi ?? f.olusturma)})
          </Text>
        )}
        {f && a && f.id !== a.id && (
          <View style={{ gap: 6 }}>
            <Uyari>
              Bu proje {tarihGun(f.yayin_tarihi ?? f.olusturma)} tarihli fiyat listesiyle hesaplanıyor. Daha
              yeni bir liste yayında ({a.aciklama || `Sürüm ${a.id}`}).
            </Uyari>
            <Dugme kucuk metin="Güncel fiyatlarla yeniden hesapla" bas={editor.guncelFiyataGec} />
          </View>
        )}
        <Sekmeler
          etiket="Hesap adımları"
          secenekler={ADIMLAR.map((x, i) => [x.yol, `${i + 1}. ${x.ad}`] as const)}
          secili={adim}
          sec={adimaGit}
        />
        <Ekran
          editor={editor}
          girdi={girdi}
          degistir={editor.degistir}
          blok={blok}
          blokSec={setBlok}
          adimaGit={adimaGit}
        />
        {sira < 5 && (
          <View style={S.arasi}>
            {onceki ? (
              <Dugme metin={`← ${onceki.ad}`} bas={() => adimaGit(onceki.yol)} />
            ) : (
              <Dugme metin="← Projelerim" bas={() => router.back()} />
            )}
            {sonraki && <Dugme tur="birincil" metin={`${sonraki.ad} →`} bas={() => adimaGit(sonraki.yol)} />}
          </View>
        )}
      </ScrollView>
    </>
  );
}
