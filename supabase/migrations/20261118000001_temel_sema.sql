-- REPİO(M) temel şema: yöneticiler, fiyat listeleri, projeler, sözleşme/KVKK onayları.
-- Kaynak: prototip supabase/sema.sql (ilk bölüm). Ödeme, hak ve DXF analizi tabloları Faz 6'da eklenecek.
-- Kural: tüm tablolarda RLS açık; yönetici işlemleri yalnız security definer fonksiyonlarla.

create extension if not exists pgcrypto with schema extensions;

-- ---------- Yöneticiler ----------
-- Yönetici yetkisi bu listedeki e-postalara verilir. Liste yalnız veritabanından (service_role) düzenlenir.
create table public.yonetici_epostalar (
  email text primary key check (email = lower(email) and position('@' in email) > 1),
  eklenme timestamptz not null default now()
);
alter table public.yonetici_epostalar enable row level security;

-- E-posta doğrulanmış olmalı: doğrulanmamış bir hesap yönetici e-postasıyla kaydolarak yetki alamaz.
create function public.yonetici_mi() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.yonetici_epostalar y
    join auth.users u on lower(u.email) = y.email
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

create policy yonetici_okur on public.yonetici_epostalar
  for select to authenticated using ((select public.yonetici_mi()));

-- ---------- Fiyat listeleri ----------
-- fiyatlar: {"K001": 320, ...}. Kod = iş kalemi kodu (K + 3 haneli sıra). Listede olmayan kalem formül fiyatıyla hesaplanır.
create table public.fiyat_listeleri (
  id bigint generated always as identity primary key,
  aciklama text not null default '' check (char_length(aciklama) <= 500),
  fiyatlar jsonb not null check (jsonb_typeof(fiyatlar) = 'object'),
  aktif boolean not null default false,
  olusturan uuid default auth.uid() references auth.users (id) on delete set null,
  olusturma timestamptz not null default now(),
  yayin_tarihi timestamptz
);
-- Aynı anda yalnız bir liste aktif olabilir.
create unique index fiyat_listeleri_tek_aktif on public.fiyat_listeleri (aktif) where aktif;
alter table public.fiyat_listeleri enable row level security;

create policy fiyat_okur on public.fiyat_listeleri
  for select to authenticated using (true);
create policy fiyat_yonetici_ekler on public.fiyat_listeleri
  for insert to authenticated with check ((select public.yonetici_mi()) and not aktif);

-- Yayına alma yalnız bu fonksiyonla yapılır.
create function public.fiyat_listesi_yayinla(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.yonetici_mi() then
    raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.fiyat_listeleri where id = p_id) then
    raise exception 'Fiyat listesi bulunamadı.' using errcode = 'P0002';
  end if;
  update public.fiyat_listeleri set aktif = false where aktif and id <> p_id;
  update public.fiyat_listeleri set aktif = true, yayin_tarihi = now() where id = p_id;
end;
$$;

-- ---------- Projeler ----------
create table public.projeler (
  id uuid primary key default gen_random_uuid(),
  sahip uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ad text not null default '' check (char_length(ad) <= 200),
  girdi jsonb not null default '{}'::jsonb check (jsonb_typeof(girdi) = 'object' and pg_column_size(girdi) < 2000000),
  ozet jsonb,
  fiyat_listesi_id bigint references public.fiyat_listeleri (id) on delete set null,
  olusturma timestamptz not null default now(),
  guncelleme timestamptz not null default now()
);
create index projeler_sahip_guncelleme on public.projeler (sahip, guncelleme desc);
alter table public.projeler enable row level security;

create policy proje_sahibi_okur on public.projeler
  for select to authenticated using (sahip = (select auth.uid()));
create policy proje_sahibi_ekler on public.projeler
  for insert to authenticated with check (sahip = (select auth.uid()));
create policy proje_sahibi_gunceller on public.projeler
  for update to authenticated using (sahip = (select auth.uid())) with check (sahip = (select auth.uid()));
create policy proje_sahibi_siler on public.projeler
  for delete to authenticated using (sahip = (select auth.uid()));

create function public.guncelleme_zamani() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.guncelleme := now();
  return new;
end;
$$;
create trigger projeler_guncelleme before update on public.projeler
  for each row execute function public.guncelleme_zamani();

-- ---------- Sözleşme / KVKK onayları (ispat için saklanır, değiştirilemez) ----------
create table public.onaylar (
  id bigint generated always as identity primary key,
  kullanici uuid not null default auth.uid() references auth.users (id) on delete cascade,
  belge text not null check (belge in ('kvkk_aydinlatma', 'acik_riza_yurtdisi', 'kullanici_sozlesmesi', 'mesafeli_satis', 'on_bilgilendirme', 'ticari_ileti')),
  surum text not null check (char_length(surum) between 1 and 40),
  onay boolean not null default true,
  tarih timestamptz not null default now(),
  tarayici text check (char_length(tarayici) <= 500)
);
create index onaylar_kullanici on public.onaylar (kullanici, belge, tarih desc);
alter table public.onaylar enable row level security;

create policy onay_sahibi_okur on public.onaylar
  for select to authenticated using (kullanici = (select auth.uid()) or (select public.yonetici_mi()));
create policy onay_sahibi_ekler on public.onaylar
  for insert to authenticated with check (kullanici = (select auth.uid()));

-- ---------- Yetkiler ----------
revoke all on public.yonetici_epostalar, public.fiyat_listeleri, public.projeler, public.onaylar from anon, authenticated;
grant select on public.yonetici_epostalar to authenticated;
grant select on public.fiyat_listeleri to authenticated;
grant insert (aciklama, fiyatlar) on public.fiyat_listeleri to authenticated;
grant select, insert, delete on public.projeler to authenticated;
grant update (ad, girdi, ozet, fiyat_listesi_id) on public.projeler to authenticated;
grant select on public.onaylar to authenticated;
grant insert (belge, surum, onay, tarayici) on public.onaylar to authenticated;

revoke execute on function public.yonetici_mi(), public.fiyat_listesi_yayinla(bigint), public.guncelleme_zamani() from public, anon;
grant execute on function public.yonetici_mi(), public.fiyat_listesi_yayinla(bigint) to authenticated;
