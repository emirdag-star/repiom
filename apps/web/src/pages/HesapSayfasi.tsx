/**
 * Hesap ayarları (KVKK): açık rıza ve ticari ileti izni verme/geri alma, verilerini indirme, hesap silme talebi.
 */
import { BELGELER, type BelgeId } from '@repiom/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { BelgeBaglantisi } from '../components/Belge';
import { HataKutusu } from '../components/HataKutusu';
import { useOnay } from '../components/OnayPenceresi';
import { Yukleniyor } from '../components/Yukleniyor';
import { hesapKilitli, hesapSilmeIptal, hesapSilmeTalep, tarihGunSaat, verilerim } from '../lib/abonelik';
import { turkceHata } from '../lib/hatalar';
import { onayKaydet, sonOnaylar } from '../lib/onaylar';

const IZINLER: { id: BelgeId; aciklama: string }[] = [
  {
    id: 'acik_riza_yurtdisi',
    aciklama: 'Çizim analizinde plan görsellerinin yapay zekâ kontrolü için yurt dışına aktarılması',
  },
  { id: 'ticari_ileti', aciklama: 'Kampanya ve yenilikler hakkında ticari elektronik ileti' },
];

export function HesapSayfasi() {
  const { oturum } = useAuth();
  const istemci = useQueryClient();
  const onayla = useOnay();
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
      const veri = await verilerim();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(veri, null, 2)], { type: 'application/json' }));
      a.download = `REPIOM_verilerim_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      setHata(turkceHata(e));
    }
  };

  const silmeTalebi = async () => {
    if (
      !(await onayla({
        baslik: 'Hesabın silinsin mi?',
        metin:
          'Talebin hemen kaydedilir ve hesabın kilitlenir (projelerini görebilir, indirebilirsin ama değiştiremezsin). ' +
          'Yönetici onaylayınca projelerin ve kişisel verilerin kalıcı olarak silinir; ödeme kayıtları kişisel bilgilerden ' +
          'arındırılarak yasal süre boyunca saklanır. Onaydan önce talebini geri alabilirsin.',
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
    <section aria-labelledby="hesap-baslik">
      <h1 id="hesap-baslik">Hesap ayarları</h1>
      {mesaj && (
        <div className="basari" role="status">
          {mesaj}
        </div>
      )}
      <HataKutusu mesaj={hata} />
      <section className="kart" aria-labelledby="hesap-bilgi">
        <h2 id="hesap-bilgi">Hesap</h2>
        <p>E-posta: {oturum?.user.email}</p>
      </section>

      <section className="kart" aria-labelledby="izin-baslik">
        <h2 id="izin-baslik">İzinler</h2>
        {onaylar.isPending ? (
          <Yukleniyor />
        ) : (
          <ul className="izin-listesi">
            {IZINLER.map(({ id, aciklama }) => {
              const son = onaylar.data?.[id];
              const verildi = Boolean(son?.onay && son.surum === BELGELER[id].surum);
              return (
                <li key={id}>
                  <div>
                    <b>
                      <BelgeBaglantisi id={id} />
                    </b>
                    <p className="not">{aciklama}</p>
                    <p data-testid={`izin-${id}`}>
                      Durum: {verildi ? 'İzin verildi' : 'İzin yok'}
                      {son && <span className="not"> · son değişiklik {tarihGunSaat(son.tarih)}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={izin.isPending}
                    onClick={() => izin.mutate({ id, ver: !verildi })}
                  >
                    {verildi ? 'İzni geri al' : 'İzin ver'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="not">
          Zorunlu metinler: <BelgeBaglantisi id="kullanici_sozlesmesi" /> ·{' '}
          <BelgeBaglantisi id="kvkk_aydinlatma" />
        </p>
      </section>

      <section className="kart" aria-labelledby="veri-baslik">
        <h2 id="veri-baslik">Verilerim</h2>
        <p>
          Hesabın, projelerin, onayların, ödemelerin ve analiz kayıtların tek bir dosya (JSON) olarak iner.
        </p>
        <button type="button" onClick={() => void indir()}>
          Verilerimi indir
        </button>
      </section>

      <section className="kart" aria-labelledby="sil-baslik">
        <h2 id="sil-baslik">Hesabı sil</h2>
        {kilit.data ? (
          <>
            <div className="uyari" role="status">
              Hesap silme talebin yönetici onayı bekliyor. Hesabın bu süre içinde kilitli.
            </div>
            <button type="button" onClick={() => void silmeIptal()}>
              Silme talebini geri al
            </button>
          </>
        ) : (
          <>
            <p>Silme talebi oluşturunca hesabın hemen kilitlenir; yönetici onayıyla verilerin silinir.</p>
            <button type="button" className="tehlikeli" onClick={() => void silmeTalebi()}>
              Hesabımı silmek istiyorum
            </button>
          </>
        )}
      </section>
    </section>
  );
}
