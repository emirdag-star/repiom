-- Faz 8: mobilde uygulama içi satın alma (App Store / Google Play). Ürün kararı (ürün sahibi, 19.11.2026): tüm paketler
-- mağazada TEK SEFERLİK (tüketilebilir) ürün; mağaza iadesinde o satın almanın KULLANILMAMIŞ hakkı geri alınır.
-- Mağaza ürün kimliği = paket kimliği (ör. "baslangic_ay"). Satın alma yalnız sunucu fonksiyonu mağazadan doğruladıktan
-- sonra (service_role) kaydedilir; hak, web ödemesiyle aynı kuralla (odeme_onayla) tanımlanır.

alter table public.odemeler add column magaza jsonb
  check (magaza is null or (jsonb_typeof(magaza) = 'object' and pg_column_size(magaza) < 4000));
-- Aynı mağaza işlemi iki kez hak vermez (iOS: transactionId, Android: purchaseToken).
create unique index odemeler_magaza_islem on public.odemeler ((magaza ->> 'platform'), saglayici_ref) where yontem = 'iap';

create function public.magaza_satin_alma(p_kullanici uuid, p_platform text, p_islem text, p_urun text, p_ortam text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.odemeler; v_p public.paketler; v_id bigint;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then raise exception 'Yetkisiz.' using errcode = '42501'; end if;
  if p_platform not in ('ios', 'android') or coalesce(p_islem, '') = '' or char_length(p_islem) > 500 then
    raise exception 'Geçersiz mağaza işlemi.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('magaza:' || p_platform || ':' || p_islem));
  select * into v from public.odemeler where yontem = 'iap' and magaza ->> 'platform' = p_platform and saglayici_ref = p_islem;
  if found then
    if v.kullanici is distinct from p_kullanici then
      raise exception 'Bu satın alma başka bir hesaba ait.' using errcode = '42501';
    end if;
    return jsonb_build_object('odeme_id', v.id, 'yeni', false);
  end if;
  if exists (select 1 from public.hesap_silme_talepleri where kullanici = p_kullanici and durum = 'bekliyor') then
    raise exception 'Hesabın silme talebi nedeniyle kilitli.' using errcode = '42501';
  end if;
  select * into v_p from public.paketler where id = p_urun and aktif;
  if not found then raise exception 'Mağaza ürünü tanınmadı.' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(hashtext('hak:' || p_kullanici::text));
  -- tutar: paketin web fiyatı (başvuru değeri); mağazanın tahsil ettiği tutar mağaza raporlarındadır.
  insert into public.odemeler (kullanici, paket_id, adet, tutar, yontem, saglayici_ref, magaza)
    values (p_kullanici, v_p.id, 1, v_p.fiyat, 'iap', p_islem,
            jsonb_build_object('platform', p_platform, 'urun', p_urun, 'ortam', left(coalesce(p_ortam, ''), 20)))
    returning id into v_id;
  perform public.odeme_onayla(v_id, p_islem);
  return jsonb_build_object('odeme_id', v_id, 'yeni', true);
end;
$$;

-- Mağaza iadesi (sunucu fonksiyonu mağazadan doğruladıktan sonra): kullanılmamış hak geri alınır, ödeme "iade edildi".
create function public.magaza_iade(p_platform text, p_islem text, p_neden text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.odemeler; v_lot public.hak_hareketleri; v_kalan int;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then raise exception 'Yetkisiz.' using errcode = '42501'; end if;
  select * into v from public.odemeler where yontem = 'iap' and magaza ->> 'platform' = p_platform and saglayici_ref = p_islem for update;
  if not found then return jsonb_build_object('bulundu', false); end if;
  if v.durum = 'iade_edildi' then return jsonb_build_object('bulundu', true, 'geri_alinan', 0, 'zaten', true); end if;
  if v.kullanici is not null then perform pg_advisory_xact_lock(hashtext('hak:' || v.kullanici::text)); end if;
  select * into v_lot from public.hak_hareketleri where odeme_id = v.id and lot_id is null;
  v_kalan := greatest(coalesce(public.parti_kalan(v_lot.id), 0), 0);
  if v_kalan > 0 then
    insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, lot_id, odeme_id, aciklama)
      values (v.kullanici, -v_kalan, v_lot.gecerlilik, 'cayma', v_lot.id, v.id, 'Mağaza iadesi');
  end if;
  update public.odemeler set durum = 'iade_edildi', karar_tarihi = now(),
    red_nedeni = left('Mağaza iadesi' || case when coalesce(p_neden, '') <> '' then ': ' || p_neden else '' end, 300)
    where id = v.id;
  return jsonb_build_object('bulundu', true, 'geri_alinan', v_kalan, 'zaten', false);
end;
$$;

revoke execute on function public.magaza_satin_alma(uuid, text, text, text, text), public.magaza_iade(text, text, text)
  from public, anon, authenticated;
grant execute on function public.magaza_satin_alma(uuid, text, text, text, text), public.magaza_iade(text, text, text)
  to service_role;

-- Düzeltme: iade edilmiş / cayma incelemesindeki paket "abonelik" sayılmaz ve yenilemenin başlangıcını uzatmaz.
create or replace function public.analiz_hakki() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'kalan', coalesce((select sum(greatest(public.parti_kalan(h.id), 0)) from public.hak_hareketleri h
                       where h.kullanici = auth.uid() and h.lot_id is null and h.gecerlilik > now()), 0),
    'abonelik', (select jsonb_build_object('paket', p.ad, 'bitis', h.gecerlilik)
                 from public.hak_hareketleri h join public.odemeler o on o.id = h.odeme_id join public.paketler p on p.id = o.paket_id
                 where h.kullanici = auth.uid() and h.lot_id is null and h.kaynak = 'odeme' and p.tur = 'abonelik' and h.gecerlilik > now()
                   and o.durum = 'onaylandi'
                 order by h.gecerlilik desc limit 1),
    'bekleyen_odeme', (select count(*) from public.odemeler where kullanici = auth.uid() and durum = 'bekliyor'));
$$;

create or replace function public.odeme_onayla(p_id bigint, p_saglayici_ref text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.odemeler; v_p public.paketler; v_bas timestamptz;
begin
  if not (public.yonetici_mi() or coalesce(auth.jwt() ->> 'role', '') = 'service_role') then
    raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501';
  end if;
  select * into v from public.odemeler where id = p_id for update;
  if not found then raise exception 'Ödeme bulunamadı.' using errcode = 'P0002'; end if;
  if v.durum <> 'bekliyor' then raise exception 'Bu ödeme zaten sonuçlanmış (%).', v.durum using errcode = 'P0001'; end if;
  if v.kullanici is null then raise exception 'Ödemenin kullanıcısı yok.' using errcode = 'P0001'; end if;
  select * into v_p from public.paketler where id = v.paket_id;
  v_bas := now();
  if v_p.tur = 'abonelik' then
    select greatest(now(), coalesce(max(h.gecerlilik), now())) into v_bas
      from public.hak_hareketleri h join public.odemeler o on o.id = h.odeme_id join public.paketler p on p.id = o.paket_id
      where h.kullanici = v.kullanici and h.lot_id is null and h.kaynak = 'odeme' and p.tur = 'abonelik' and h.gecerlilik > now()
        and o.durum = 'onaylandi';
  end if;
  insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, odeme_id, aciklama)
    values (v.kullanici, v_p.analiz_hakki * v.adet,
            v_bas + make_interval(days => v_p.sure_gun * (case when v_p.tur = 'abonelik' then v.adet else 1 end)),
            'odeme', v.id, v_p.ad);
  update public.odemeler set durum = 'onaylandi', karar_veren = auth.uid(), karar_tarihi = now(),
    saglayici_ref = coalesce(p_saglayici_ref, saglayici_ref) where id = p_id;
end;
$$;
