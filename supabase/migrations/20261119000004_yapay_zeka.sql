-- Faz 7: çizim analizinin yapay zekâ adımı. Analiz başına TEK çağrı; açık rıza sunucuda denetlenir; token kaydı.
-- Çağrı hakkı, Claude API'ye gidilmeden ÖNCE atomik olarak alınır: aynı analiz için ikinci istek reddedilir
-- (çağrı başarısız olsa bile — maliyet denetimi).

alter table public.dxf_analizleri add column yz_tarih timestamptz;

-- Kullanıcı (kendi oturumuyla, sunucu fonksiyonu üzerinden) çağrı hakkını alır.
-- Koşullar: kendi analizi, açık, ücretsiz deneme değil, son 1 saatte başlatılmış, daha önce kullanılmamış,
-- yurt dışına aktarım için geçerli açık rıza var.
create function public.yz_hakki_al(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.dxf_analizleri;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli.' using errcode = '42501'; end if;
  select * into v from public.dxf_analizleri where id = p_id and kullanici = auth.uid() for update;
  if not found then raise exception 'Analiz bulunamadı.' using errcode = 'P0002'; end if;
  if not public.onay_gecerli(auth.uid(), 'acik_riza_yurtdisi') then
    raise exception 'Yapay zekâ kontrolü için yurt dışına aktarım açık rızası gerekli.' using errcode = '42501';
  end if;
  if v.deneme then raise exception 'Örnek çizimle denemede yapay zekâ kontrolü yapılmaz.' using errcode = 'P0001'; end if;
  if v.durum <> 'acik' then raise exception 'Bu analiz için yapay zekâ kontrolü yapılamaz.' using errcode = 'P0001'; end if;
  if v.yz_kullanildi then raise exception 'Bu analiz için yapay zekâ kontrolü zaten yapıldı.' using errcode = 'P0001'; end if;
  if v.olusturma < now() - interval '1 hour' then raise exception 'Analizin süresi doldu; yeniden başlat.' using errcode = 'P0001'; end if;
  update public.dxf_analizleri set yz_kullanildi = true, yz_tarih = now() where id = p_id;
end;
$$;

-- Çağrı sonucu ve token kullanımı (yalnız sunucu fonksiyonu, service_role).
create function public.yz_kaydet(p_id bigint, p_token jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then raise exception 'Yetkisiz.' using errcode = '42501'; end if;
  update public.dxf_analizleri set yz_token = p_token where id = p_id and yz_kullanildi;
  if not found then raise exception 'Analiz bulunamadı.' using errcode = 'P0002'; end if;
end;
$$;

-- Yönetici: yapay zekâ kullanım özeti (token toplamları).
create function public.yz_kullanim_ozeti(p_gun int default 30)
returns table (cagri bigint, basarisiz bigint, girdi_token bigint, cikti_token bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.yonetici_mi() then raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501'; end if;
  return query select count(*), count(*) filter (where yz_token ? 'hata'),
    coalesce(sum((yz_token ->> 'input_tokens')::bigint), 0), coalesce(sum((yz_token ->> 'output_tokens')::bigint), 0)
    from public.dxf_analizleri where yz_kullanildi and yz_tarih > now() - make_interval(days => greatest(1, p_gun));
end;
$$;

revoke execute on function public.yz_hakki_al(bigint), public.yz_kaydet(bigint, jsonb), public.yz_kullanim_ozeti(int) from public, anon;
grant execute on function public.yz_hakki_al(bigint), public.yz_kullanim_ozeti(int) to authenticated;
grant execute on function public.yz_kaydet(bigint, jsonb) to service_role;

-- Savunma katmanı: Supabase'in varsayılan yetkileri yeni tablolarda "authenticated" rolüne yazma izni verir.
-- Bu tablolara yazma yalnız security definer fonksiyonlarla yapılır (RLS zaten engelliyordu); izinleri açıkça kaldır.
revoke insert, update, delete, truncate, references, trigger on
  public.paketler, public.odemeler, public.hak_hareketleri, public.dxf_analizleri, public.ornek_cizim_ozetleri,
  public.hesap_silme_talepleri, public.belge_surumleri
from authenticated, anon;
revoke all on public.ornek_cizim_ozetleri from authenticated;
