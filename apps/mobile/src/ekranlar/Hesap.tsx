/** Hesap ayarları (KVKK): izin verme/geri alma, verilerimi indir (paylaş), hesap silme talebi, çıkış. */
import { BELGELER, type BelgeId } from '@repiom/core';
import {
  hesapKilitli,
  hesapSilmeIptal,
  hesapSilmeTalep,
  tarihGunSaat,
  verilerim,
} from '@repiom/istemci/abonelik';
import { turkceHata } from '@repiom/istemci/hatalar';
import { onayKaydet, sonOnaylar } from '@repiom/istemci/onaylar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { BelgeBaglantisi } from '../bilesenler/Belge';
import { Basari, Dugme, HataKutusu, Kart, onayIste, Uyari, Yukleniyor } from '../bilesenler/temel';
import { S } from '../bilesenler/tema';
import { useOturum } from '../lib/oturum';

const IZINLER: { id: BelgeId; aciklama: string }[] = [
  {
    id: 'acik_riza_yurtdisi',
    aciklama: 'Çizim analizinde plan görsellerinin yapay zekâ kontrolü için yurt dışına aktarılması',
  },
  { id: 'ticari_ileti', aciklama: 'Kampanya ve yenilikler hakkında ticari elektronik ileti' },
];

export function HesapEkrani() {
  const { oturum, cikisYap } = useOturum();
  const istemci = useQueryClient();
  const onaylar = useQuery({ queryKey: ['onaylar'], queryFn: sonOnaylar });
  const kilit = useQuery({ queryKey: ['hesap-kilitli'], queryFn: hesapKilitli });
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const izin = useMutation({
    mutationFn: ({ id, ver }: { id: BelgeId; ver: boolean }) => onayKaydet([id], ver),
    onSuccess: async (_, { id, ver }) => {
      setMesaj(`${BELGELER[id].ad}: ${ver ? 'izin verildi' : 'izin geri alındı'}.`);
      await istemci.invalidateQueries({ queryKey: ['onaylar'] });
    },
    onError: (e) => setHata(turkceHata(e)),
  });
  const indir = async () => {
    setHata(null);
    try {
      const metin = JSON.stringify(await verilerim(), null, 2);
      const ad = `REPIOM_verilerim_${new Date().toISOString().slice(0, 10)}.json`;
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([metin], { type: 'application/json' }));
        a.download = ad;
        a.click();
        return;
      }
      const f = new File(Paths.cache, ad);
      f.create({ overwrite: true });
      await f.write(metin);
      await Sharing.shareAsync(f.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: ad });
    } catch (e) {
      setHata(turkceHata(e));
    }
  };
  const silmeTalebi = async () => {
    if (
      !(await onayIste({
        baslik: 'Hesabın silinsin mi?',
        metin:
          'Talebin hemen kaydedilir ve hesabın kilitlenir (projelerini görebilir, indirebilirsin ama değiştiremezsin). Yönetici onaylayınca projelerin ve kişisel verilerin kalıcı olarak silinir; ödeme kayıtları kişisel bilgilerden arındırılarak yasal süre boyunca saklanır. Onaydan önce talebini geri alabilirsin.',
        evet: 'Silme talebi oluştur',
        tehlikeli: true,
      }))
    )
      return;
    try {
      await hesapSilmeTalep();
      setMesaj('Hesap silme talebin alındı. Hesabın kilitlendi.');
      await istemci.invalidateQueries({ queryKey: ['hesap-kilitli'] });
    } catch (e) {
      setHata(turkceHata(e));
    }
  };
  const silmeIptal = async () => {
    try {
      await hesapSilmeIptal();
      setMesaj('Silme talebin geri alındı; hesabın yeniden kullanılabilir.');
      await istemci.invalidateQueries({ queryKey: ['hesap-kilitli'] });
    } catch (e) {
      setHata(turkceHata(e));
    }
  };

  return (
    <ScrollView style={S.ekran} contentContainerStyle={S.icerik}>
      {mesaj ? <Basari>{mesaj}</Basari> : null}
      <HataKutusu mesaj={hata} />
      <Kart baslik="Hesap">
        <Text style={S.metin}>E-posta: {oturum?.user.email}</Text>
        <Dugme metin="Çıkış yap" bas={() => void cikisYap()} />
      </Kart>
      <Kart baslik="İzinler">
        {onaylar.isPending ? (
          <Yukleniyor />
        ) : (
          IZINLER.map(({ id, aciklama }) => {
            const son = onaylar.data?.[id];
            const verildi = Boolean(son?.onay && son.surum === BELGELER[id].surum);
            return (
              <View key={id} style={S.altkart}>
                <BelgeBaglantisi id={id} />
                <Text style={S.not}>{aciklama}</Text>
                <Text testID={`izin-${id}`} style={S.metin}>
                  Durum: {verildi ? 'İzin verildi' : 'İzin yok'}
                  {son ? ` · son değişiklik ${tarihGunSaat(son.tarih)}` : ''}
                </Text>
                <Dugme
                  kucuk
                  metin={verildi ? 'İzni geri al' : 'İzin ver'}
                  erisimEtiketi={`${verildi ? 'İzni geri al' : 'İzin ver'}: ${BELGELER[id].ad}`}
                  devreDisi={izin.isPending}
                  bas={() => izin.mutate({ id, ver: !verildi })}
                />
              </View>
            );
          })
        )}
        <Text style={S.not}>Zorunlu metinler:</Text>
        <BelgeBaglantisi id="kullanici_sozlesmesi" />
        <BelgeBaglantisi id="kvkk_aydinlatma" />
      </Kart>
      <Kart baslik="Verilerim">
        <Text style={S.metin}>
          Hesabın, projelerin, onayların, ödemelerin ve analiz kayıtların tek bir dosya (JSON) olarak
          paylaşılır.
        </Text>
        <Dugme metin="Verilerimi indir" bas={() => void indir()} />
      </Kart>
      <Kart baslik="Hesabı sil">
        {kilit.data ? (
          <>
            <Uyari>Hesap silme talebin yönetici onayı bekliyor. Hesabın bu süre içinde kilitli.</Uyari>
            <Dugme metin="Silme talebini geri al" bas={() => void silmeIptal()} />
          </>
        ) : (
          <>
            <Text style={S.metin}>
              Silme talebi oluşturunca hesabın hemen kilitlenir; yönetici onayıyla verilerin silinir.
            </Text>
            <Dugme tur="tehlikeli" metin="Hesabımı silmek istiyorum" bas={() => void silmeTalebi()} />
          </>
        )}
      </Kart>
    </ScrollView>
  );
}
