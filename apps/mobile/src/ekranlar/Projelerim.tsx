/** Projelerim: liste, yeni / örnek proje, kopyala, sil (web ile aynı çağrılar). */
import { calculate, emptyProject, exampleProject, type ProjectInput } from '@repiom/core';
import { sayi, tl } from '@repiom/istemci/bicim';
import { aktifFiyatListesi } from '@repiom/istemci/fiyat';
import { turkceHata } from '@repiom/istemci/hatalar';
import {
  ozetCikar,
  projeKopyala,
  projeleriListele,
  projeOlustur,
  projeSil,
  type ProjeSatiri,
} from '@repiom/istemci/projeler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Basari, Dugme, HataKutusu, Kart, onayIste, Yukleniyor } from '../bilesenler/temel';
import { S } from '../bilesenler/tema';

const tarih = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

export function ProjelerimEkrani() {
  const router = useRouter();
  const istemci = useQueryClient();
  const [mesaj, setMesaj] = useState<string | null>(null);
  const projeler = useQuery({ queryKey: ['projeler'], queryFn: projeleriListele });
  const olustur = useMutation({
    mutationFn: async (girdi: ProjectInput) => {
      const liste = await aktifFiyatListesi().catch(() => null);
      return projeOlustur(
        girdi,
        liste?.id ?? null,
        ozetCikar(calculate(girdi, { fiyatlar: liste?.fiyatlar ?? null })),
      );
    },
    onSuccess: (id) => router.push({ pathname: '/proje/[id]', params: { id } }),
  });
  const kopyala = useMutation({
    mutationFn: projeKopyala,
    onSuccess: async () => {
      setMesaj('Projenin kopyası oluşturuldu.');
      await istemci.invalidateQueries({ queryKey: ['projeler'] });
    },
  });
  const sil = useMutation({
    mutationFn: projeSil,
    onSuccess: async () => {
      setMesaj('Proje silindi.');
      await istemci.invalidateQueries({ queryKey: ['projeler'] });
    },
  });
  const silOnay = async (p: ProjeSatiri) => {
    if (
      await onayIste({
        baslik: 'Proje silinsin mi?',
        metin: `"${p.ad || 'Adsız proje'}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
        evet: 'Kalıcı olarak sil',
        tehlikeli: true,
      })
    ) {
      setMesaj(null);
      sil.mutate(p.id);
    }
  };
  const hata = olustur.error ?? kopyala.error ?? sil.error;
  const mesgul = olustur.isPending || kopyala.isPending || sil.isPending;

  return (
    <ScrollView
      style={S.ekran}
      contentContainerStyle={S.icerik}
      refreshControl={
        <RefreshControl refreshing={projeler.isRefetching} onRefresh={() => void projeler.refetch()} />
      }
    >
      <View style={S.satir}>
        <Dugme metin="Örnek projeyi aç" devreDisi={mesgul} bas={() => olustur.mutate(exampleProject())} />
        <Dugme
          tur="birincil"
          metin="Yeni proje"
          devreDisi={mesgul}
          bas={() => olustur.mutate(emptyProject())}
        />
      </View>
      <Kart baslik="Çizimden maliyet (ücretli modül)">
        <Text style={S.not}>
          Mimari ve statik DXF'ini yükle: katlar, mahaller, kaplamalar, beton-kalıp-donatı ve kapı-pencere
          çizimden çıkarılır. Çizim bu cihazda okunur.
        </Text>
        <View style={S.satir}>
          <Dugme
            metin="Örnek çizimle dene"
            bas={() => router.push({ pathname: '/cizim', params: { ornek: '1' } })}
          />
          <Dugme tur="birincil" metin="Çizim yükle" bas={() => router.push('/cizim')} />
        </View>
      </Kart>
      {mesaj ? <Basari>{mesaj}</Basari> : null}
      {hata ? <HataKutusu mesaj={turkceHata(hata)} /> : null}
      {projeler.isPending && <Yukleniyor metin="Projeler yükleniyor…" />}
      {projeler.isError && <HataKutusu mesaj={turkceHata(projeler.error)} />}
      {projeler.data?.length === 0 && (
        <Kart baslik="Henüz projen yok">
          <Text style={S.metin}>
            "Yeni proje" ile ilk projeni oluştur ya da örnek projeyi aç. Hesap için toplam inşaat alanını
            girmen yeterli.
          </Text>
        </Kart>
      )}
      {projeler.data?.map((p) => {
        const o = p.ozet;
        const ad = p.ad || 'Adsız proje';
        return (
          <Kart key={p.id} baslik={ad}>
            <Text style={S.not}>Son değişiklik: {tarih.format(new Date(p.guncelleme))}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {(
                [
                  ['Toplam (KDV hariç)', o?.toplam ? tl(o.toplam) : '—'],
                  ['m² maliyeti', o?.m2 ? `${sayi(o.m2)} TL` : '—'],
                  ['İnşaat alanı', o?.alan ? `${sayi(o.alan)} m²` : '—'],
                  ['Daire', o?.daire ? sayi(o.daire) : '—'],
                ] as const
              ).map(([e, d]) => (
                <View key={e} style={{ minWidth: '45%' }}>
                  <Text style={S.not}>{e}</Text>
                  <Text style={[S.metin, { fontWeight: '700' }]}>{d}</Text>
                </View>
              ))}
            </View>
            <View style={S.satir}>
              <Dugme
                kucuk
                tur="birincil"
                metin="Aç"
                erisimEtiketi={`${ad} projesini aç`}
                bas={() => router.push({ pathname: '/proje/[id]', params: { id: p.id } })}
              />
              <Dugme
                kucuk
                metin="Kopyala"
                devreDisi={mesgul}
                erisimEtiketi={`${ad} projesini kopyala`}
                bas={() => {
                  setMesaj(null);
                  kopyala.mutate(p.id);
                }}
              />
              <Dugme
                kucuk
                metin="Sil"
                devreDisi={mesgul}
                erisimEtiketi={`${ad} projesini sil`}
                bas={() => void silOnay(p)}
              />
            </View>
          </Kart>
        );
      })}
    </ScrollView>
  );
}
