/**
 * Açık projenin düzenleme durumu: girdi, hesap sonucu ve otomatik kayıt.
 * Her değişiklikten 0,8 sn sonra sunucuya yazılır; sayfa gizlenirken/kapanırken bekleyen değişiklik hemen gönderilir.
 */
import { calculate, type ProjectInput } from '@repiom/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useAktifFiyatListesi, useFiyatListesi } from './fiyat';
import { turkceHata } from './hatalar';
import {
  ozetCikar,
  projeGetir,
  projeGuncelle,
  projeyiKapanirkenKaydet,
  type ProjeGuncellemesi,
} from './projeler';

export type KayitDurumu = { tur: 'kaydedildi' } | { tur: 'kaydediliyor' } | { tur: 'hata'; mesaj: string };

const GECIKME_MS = 800;

export function useProjeEditoru(id: string) {
  const { oturum } = useAuth();
  const sorguIstemcisi = useQueryClient();
  const kayit = useQuery({
    queryKey: ['proje', id],
    queryFn: () => projeGetir(id),
    staleTime: Infinity,
    gcTime: 0,
  });
  const aktif = useAktifFiyatListesi();

  const [girdi, setGirdi] = useState<ProjectInput | null>(null);
  const [fiyatListesiId, setFiyatListesiId] = useState<number | null>(null);
  const [durum, setDurum] = useState<KayitDurumu>({ tur: 'kaydedildi' });

  // Sunucudan gelen kayıt ilk kez geldiğinde yerel duruma alınır (sonraki yeniden yüklemeler yerel düzenlemeyi ezmez).
  const yuklendi = useRef(false);
  useEffect(() => {
    if (kayit.data && !yuklendi.current) {
      yuklendi.current = true;
      setGirdi(kayit.data.girdi);
      setFiyatListesiId(kayit.data.fiyat_listesi_id ?? aktif.data?.id ?? null);
    }
  }, [kayit.data, aktif.data]);

  const projeListesi = useFiyatListesi(fiyatListesiId);
  const fiyatListesi = fiyatListesiId != null ? (projeListesi.data ?? null) : null;

  const sonuc = useMemo(
    () => (girdi ? calculate(girdi, { fiyatlar: fiyatListesi?.fiyatlar ?? null }) : null),
    [girdi, fiyatListesi],
  );

  /* ---------- Otomatik kayıt ---------- */
  const bekleyen = useRef<ProjeGuncellemesi | null>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suruyor = useRef<Promise<void> | null>(null);

  const gonder = useCallback(async () => {
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = null;
    const veri = bekleyen.current;
    if (!veri) return suruyor.current ?? undefined;
    bekleyen.current = null;
    const is = (async () => {
      try {
        await projeGuncelle(id, veri);
        if (!bekleyen.current) setDurum({ tur: 'kaydedildi' });
        void sorguIstemcisi.invalidateQueries({ queryKey: ['projeler'] });
      } catch (e) {
        bekleyen.current = bekleyen.current ?? veri; // sonra yeniden denenir
        setDurum({ tur: 'hata', mesaj: turkceHata(e) });
      }
    })();
    suruyor.current = is;
    return is;
  }, [id, sorguIstemcisi]);

  // Girdi ya da fiyat listesi değişince kayıt planlanır (ilk yükleme hariç).
  const ilkDeger = useRef(true);
  useEffect(() => {
    if (!girdi || !sonuc) return;
    if (ilkDeger.current) {
      ilkDeger.current = false;
      return;
    }
    bekleyen.current = {
      ad: String(girdi.ad || ''),
      girdi,
      ozet: ozetCikar(sonuc),
      fiyat_listesi_id: fiyatListesiId,
    };
    setDurum({ tur: 'kaydediliyor' });
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => void gonder(), GECIKME_MS);
  }, [girdi, sonuc, fiyatListesiId, gonder]);

  // Sayfa gizlenir ya da kapanırken bekleyen kayıt hemen gönderilir.
  const anahtar = oturum?.access_token;
  useEffect(() => {
    const kapanis = () => {
      const veri = bekleyen.current;
      if (!veri || !anahtar) return;
      bekleyen.current = null;
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      projeyiKapanirkenKaydet(id, veri, anahtar);
    };
    const gorunurluk = () => {
      if (document.visibilityState === 'hidden') kapanis();
    };
    window.addEventListener('pagehide', kapanis);
    document.addEventListener('visibilitychange', gorunurluk);
    return () => {
      window.removeEventListener('pagehide', kapanis);
      document.removeEventListener('visibilitychange', gorunurluk);
    };
  }, [id, anahtar]);

  // Projeden çıkarken (başka sayfaya geçiş) bekleyen kayıt gönderilir.
  useEffect(() => () => void gonder(), [gonder]);

  const degistir = useCallback((fn: (taslak: ProjectInput) => void) => {
    setGirdi((onceki) => {
      if (!onceki) return onceki;
      const taslak = structuredClone(onceki);
      fn(taslak);
      return taslak;
    });
  }, []);

  return {
    yukleniyor: kayit.isPending || (kayit.isSuccess && !girdi),
    hata: kayit.error ? turkceHata(kayit.error) : null,
    girdi,
    degistir,
    sonuc,
    durum,
    kaydet: gonder,
    fiyatListesi,
    aktifFiyatListesi: aktif.data ?? null,
    guncelFiyataGec: () => setFiyatListesiId(aktif.data?.id ?? null),
  };
}

export type ProjeEditoru = ReturnType<typeof useProjeEditoru>;
