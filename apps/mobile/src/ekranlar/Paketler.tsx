/**
 * Mobil paketler: kalan hak, satıştaki paketler (fiyatı 0 olan görünmez) ve uygulama içi satın alma.
 * Mağaza kuralları gereği mobilde kart/havale yoktur; ödeme ve iade App Store / Google Play üzerinden yürür.
 */
import {
  ODEME_DURUMU,
  odemelerim,
  paketler,
  tarihGunSaat,
  useHak,
  YONTEM_ADI,
} from '@repiom/istemci/abonelik';
import { tl } from '@repiom/istemci/bicim';
import { turkceHata } from '@repiom/istemci/hatalar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import { BelgeBaglantisi } from '../bilesenler/Belge';
import { Basari, Dugme, HataKutusu, Kart, Uyari, Yukleniyor } from '../bilesenler/temel';
import { R, S } from '../bilesenler/tema';
import { useMagaza } from '../magaza';

export function PaketlerEkrani() {
  const istemci = useQueryClient();
  const hak = useHak();
  const liste = useQuery({ queryKey: ['paketler'], queryFn: paketler });
  const gecmis = useQuery({ queryKey: ['odemelerim'], queryFn: odemelerim });
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState<string | null>(null);
  const urunler = useMemo(() => (liste.data ?? []).map((p) => p.id), [liste.data]);
  const webFiyatlari = useMemo(
    () => Object.fromEntries((liste.data ?? []).map((p) => [p.id, p.fiyat])),
    [liste.data],
  );
  const yenile = () =>
    Promise.all([
      istemci.invalidateQueries({ queryKey: ['hak'] }),
      istemci.invalidateQueries({ queryKey: ['odemelerim'] }),
    ]);
  const magaza = useMagaza(
    urunler,
    {
      tamam: (yeni) => {
        setMesgul(null);
        setMesaj(
          yeni
            ? 'Satın alma doğrulandı; analiz hakların tanımlandı.'
            : 'Bu satın alma daha önce işlenmişti; hakların yerinde.',
        );
        void yenile();
      },
      hata: (m) => {
        setMesgul(null);
        setHata(m);
      },
    },
    webFiyatlari,
  );
  const h = hak.data;
  const magazaAdi = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

  return (
    <ScrollView
      style={S.ekran}
      contentContainerStyle={S.icerik}
      refreshControl={<RefreshControl refreshing={hak.isRefetching} onRefresh={() => void yenile()} />}
    >
      {mesaj ? <Basari>{mesaj}</Basari> : null}
      <HataKutusu mesaj={hata} />
      <Kart>
        {hak.isPending ? (
          <Yukleniyor />
        ) : h ? (
          <Text style={S.metin}>
            Kalan analiz hakkın:{' '}
            <Text testID="kalan-hak" style={{ fontWeight: '800' }}>
              {h.kalan}
            </Text>
            {h.abonelik
              ? ` · ${h.abonelik.paket}, bitiş ${new Date(h.abonelik.bitis).toLocaleDateString('tr-TR')}`
              : ''}
          </Text>
        ) : null}
        {hak.isError && <HataKutusu mesaj={turkceHata(hak.error)} />}
      </Kart>
      {magaza.sahte && (
        <Uyari>Deneme kipi: satın almalar sahte mağazada yapılır, gerçek ücret alınmaz.</Uyari>
      )}
      {liste.isPending && <Yukleniyor />}
      {liste.data?.length === 0 && <Text style={S.metin}>Şu anda satışta paket yok.</Text>}
      {liste.data?.map((p) => {
        const fiyat = magaza.fiyatlar[p.id];
        return (
          <Kart key={p.id} baslik={p.ad}>
            <Text style={S.metin}>{p.aciklama}</Text>
            <Text style={S.not}>
              {p.analiz_hakki} analiz · {p.sure_gun} gün geçerli · tek seferlik satın alma (otomatik
              yenilenmez)
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: R.ana }}>
              {fiyat ?? (magaza.hazir ? 'Mağazada bulunamadı' : '…')}
            </Text>
            <Dugme
              tur="birincil"
              metin={mesgul === p.id ? 'İşleniyor…' : 'Satın al'}
              erisimEtiketi={`${p.ad} satın al`}
              devreDisi={!magaza.hazir || !fiyat || Boolean(mesgul)}
              bas={() => {
                setMesaj(null);
                setHata(null);
                setMesgul(p.id);
                void magaza.satinAl(p.id).finally(() => magaza.sahte || setMesgul(null));
              }}
            />
          </Kart>
        );
      })}
      <Kart>
        <Text style={S.not}>
          Ödeme {magazaAdi} hesabından alınır; iade talepleri {magazaAdi} üzerinden yapılır. İade onaylanırsa
          o satın almanın kullanılmamış analiz hakları geri alınır. Aktif bir paketin varken yeni paket
          alırsan yeni süre mevcut paketin bitişinden başlar.
        </Text>
        <BelgeBaglantisi id="kullanici_sozlesmesi" />
      </Kart>
      <Kart baslik="Ödemelerim">
        {gecmis.isPending && <Yukleniyor />}
        {gecmis.data?.length === 0 && <Text style={S.metin}>Henüz ödeme yok.</Text>}
        {gecmis.data?.map((o) => (
          <View key={o.id} style={{ borderBottomWidth: 1, borderBottomColor: R.cizgi, paddingVertical: 6 }}>
            <Text style={[S.metin, { fontWeight: '700' }]}>
              {liste.data?.find((p) => p.id === o.paket_id)?.ad ?? o.paket_id} · {tl(o.tutar)}
            </Text>
            <Text style={S.not}>
              {tarihGunSaat(o.olusturma)} · {YONTEM_ADI[o.yontem] ?? o.yontem} ·{' '}
              {ODEME_DURUMU[o.durum] ?? o.durum}
            </Text>
          </View>
        ))}
      </Kart>
    </ScrollView>
  );
}
