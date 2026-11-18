-- Faz 4: fiyat listeleri — içerik doğrulaması, ekle-ve-yayınla, yönetici için sürüm listesi.
-- Fiyat listeleri silinmez ve değiştirilmez (projeler hangi listeyle hesaplandığını tutar); geri dönüş, eski sürümü
-- yeniden yayına almakla yapılır.

-- İçerik: {"K001": 320, …} — anahtar K + 3 rakam, değer 0 ile 1e10 arası sayı; en çok 1000 kalem.
create function public.fiyat_listesi_gecerli(p jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(p) = 'object'
    and (select count(*) from jsonb_object_keys(p)) <= 1000
    and not exists (
      select 1 from jsonb_each(p) e
      where e.key !~ '^K[0-9]{3}$'
         or jsonb_typeof(e.value) <> 'number'
         or (e.value)::numeric < 0
         or (e.value)::numeric > 10000000000
    );
$$;

alter table public.fiyat_listeleri
  add constraint fiyat_listeleri_icerik_gecerli check (public.fiyat_listesi_gecerli(fiyatlar));

-- Yeni liste ekler ve aynı işlemde yayınlar. Yalnız yönetici.
create function public.fiyat_listesi_ekle_yayinla(p_aciklama text, p_fiyatlar jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  if not public.yonetici_mi() then
    raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501';
  end if;
  if p_fiyatlar is null or not public.fiyat_listesi_gecerli(p_fiyatlar) then
    raise exception 'Fiyat listesi geçersiz: kodlar K001 biçiminde, fiyatlar 0 ile 10 milyar arasında olmalı.' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_object_keys(p_fiyatlar)) = 0 then
    raise exception 'Fiyat listesi boş.' using errcode = '22023';
  end if;
  insert into public.fiyat_listeleri (aciklama, fiyatlar, aktif, olusturan)
    values (left(coalesce(nullif(trim(p_aciklama), ''), 'Fiyat güncellemesi'), 500), p_fiyatlar, false, auth.uid())
    returning id into v_id;
  perform public.fiyat_listesi_yayinla(v_id);
  return v_id;
end;
$$;

-- Yönetici ekranı için sürümler (fiyat içeriği olmadan, kalem sayısıyla) ve yayınlayan kişinin e-postası.
create function public.fiyat_listesi_surumleri()
returns table (id bigint, aciklama text, aktif boolean, olusturma timestamptz, yayin_tarihi timestamptz, kalem_sayisi int, olusturan_eposta text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.yonetici_mi() then
    raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501';
  end if;
  return query
    select f.id, f.aciklama, f.aktif, f.olusturma, f.yayin_tarihi,
           (select count(*)::int from jsonb_object_keys(f.fiyatlar)), u.email::text
    from public.fiyat_listeleri f left join auth.users u on u.id = f.olusturan
    order by f.id desc
    limit 200;
end;
$$;

revoke execute on function public.fiyat_listesi_gecerli(jsonb), public.fiyat_listesi_ekle_yayinla(text, jsonb),
  public.fiyat_listesi_surumleri() from public, anon;
grant execute on function public.fiyat_listesi_ekle_yayinla(text, jsonb), public.fiyat_listesi_surumleri() to authenticated;
grant execute on function public.fiyat_listesi_gecerli(jsonb) to authenticated;
