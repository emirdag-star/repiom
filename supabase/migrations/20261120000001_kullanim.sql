-- Faz 9: çerezsiz kullanım ölçümü (ürün kararı, 19.11.2026). İki kaynak:
-- 1) Mevcut tablolardan TÜRETİLEN günlük sayılar (kayıt, proje, analiz, ödeme) — yeni kişisel veri toplanmaz.
-- 2) Kişiye bağlanmayan olay sayaçları (adım görüntüleme, rapor, uygulama açılışı): yalnız gün + olay + platform + sayı.
--    Kullanıcı kimliği, IP, cihaz kimliği SAKLANMAZ; bu yüzden çerez/izin penceresi gerekmez.

create table public.kullanim_sayaclari (
  gun date not null default (now() at time zone 'Europe/Istanbul')::date,
  olay text not null,
  platform text not null check (platform in ('web', 'ios', 'android')),
  sayi int not null default 0 check (sayi >= 0),
  primary key (gun, olay, platform)
);
alter table public.kullanim_sayaclari enable row level security;
create policy kullanim_yonetici_okur on public.kullanim_sayaclari for select to authenticated
  using ((select public.yonetici_mi()));
grant select on public.kullanim_sayaclari to authenticated;

-- İzinli olaylar (serbest metin kabul edilmez).
create function public.olay_say(p_olay text, p_platform text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_olay not in ('uygulama_acilis', 'adim:proje', 'adim:daire-tipleri', 'adim:katlar', 'adim:diger-bilgiler',
                    'adim:proje-geneli', 'adim:ozet', 'adim:sonuc', 'rapor:excel', 'rapor:pdf', 'paketler_goruntuleme')
     or p_platform not in ('web', 'ios', 'android') then
    return; -- bilinmeyen olay sessizce yok sayılır
  end if;
  insert into public.kullanim_sayaclari as k (olay, platform, sayi) values (p_olay, p_platform, 1)
    on conflict (gun, olay, platform) do update set sayi = k.sayi + 1;
end;
$$;
revoke execute on function public.olay_say(text, text) from public;
grant execute on function public.olay_say(text, text) to anon, authenticated;

-- Yönetici: son N gün, günlük özet. Kişisel bilgi döndürmez (yalnız sayılar).
create function public.kullanim_ozeti(p_gun int default 30)
returns table (gun date, kayit bigint, proje bigint, analiz bigint, deneme bigint, odeme bigint, magaza bigint, olaylar jsonb)
language plpgsql stable security definer set search_path = '' as $$
declare v_bas date := (now() at time zone 'Europe/Istanbul')::date - greatest(1, least(p_gun, 366)) + 1;
begin
  if not public.yonetici_mi() then raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501'; end if;
  return query
  with g as (select generate_series(v_bas, (now() at time zone 'Europe/Istanbul')::date, interval '1 day')::date as gun)
  select g.gun,
    (select count(*) from auth.users u where (u.created_at at time zone 'Europe/Istanbul')::date = g.gun),
    (select count(*) from public.projeler p where (p.olusturma at time zone 'Europe/Istanbul')::date = g.gun),
    (select count(*) from public.dxf_analizleri a where not a.deneme and (a.olusturma at time zone 'Europe/Istanbul')::date = g.gun),
    (select count(*) from public.dxf_analizleri a where a.deneme and (a.olusturma at time zone 'Europe/Istanbul')::date = g.gun),
    (select count(*) from public.odemeler o where o.durum = 'onaylandi' and o.yontem in ('kart', 'havale')
       and (coalesce(o.karar_tarihi, o.olusturma) at time zone 'Europe/Istanbul')::date = g.gun),
    (select count(*) from public.odemeler o where o.durum = 'onaylandi' and o.yontem = 'iap'
       and (coalesce(o.karar_tarihi, o.olusturma) at time zone 'Europe/Istanbul')::date = g.gun),
    coalesce((select jsonb_object_agg(k.olay, k.toplam) from
               (select s.olay, sum(s.sayi) as toplam from public.kullanim_sayaclari s where s.gun = g.gun group by s.olay) k),
             '{}'::jsonb)
  from g order by g.gun;
end;
$$;
revoke execute on function public.kullanim_ozeti(int) from public, anon;
grant execute on function public.kullanim_ozeti(int) to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.kullanim_sayaclari from authenticated, anon;
