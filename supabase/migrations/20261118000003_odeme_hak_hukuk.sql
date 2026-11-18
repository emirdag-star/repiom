-- Faz 6: paketler, ödemeler, analiz hakları (hak defteri), DXF analiz kayıtları, sözleşme sürümleri ve onaylar,
-- hesap silme talepleri. Ödeme, hak ve yönetici işlemleri yalnız security definer fonksiyonlarla yapılır.
--
-- Ürün kararları (ürün sahibi, 18.11.2026):
--  * Hak iadesi: (1) çizim okunduktan sonra hata yüzünden kontrol ekranı açılamazsa otomatik (1 saat içinde);
--    (2) hiç analiz yapılmamış pakette onaydan itibaren 14 gün içinde cayma — yönetici onayıyla;
--    (3) yönetici her zaman elle hak tanımlayabilir.
--  * Hesap silme: talep anında hesap kilitlenir; yönetici onaylayınca projeler ve kişisel veriler silinir,
--    ödeme kayıtları kişisel bilgilerden arındırılarak (anonim) tutulur.
--  * Abonelik yenilenirse yeni süre mevcut aboneliğin bitişinden başlar.

-- =====================================================================
-- Sözleşme / KVKK belge sürümleri ve onaylar
-- =====================================================================
create table public.belge_surumleri (
  belge text not null check (belge in ('kvkk_aydinlatma', 'acik_riza_yurtdisi', 'kullanici_sozlesmesi', 'mesafeli_satis', 'on_bilgilendirme', 'ticari_ileti')),
  surum text not null,
  yururluk timestamptz not null default now(),
  primary key (belge, surum)
);
alter table public.belge_surumleri enable row level security;
create policy belge_okur on public.belge_surumleri for select to anon, authenticated using (true);
grant select on public.belge_surumleri to anon, authenticated;

-- Uygulamadaki metinlerle aynı sürümler (packages/core/src/legal/belgeler.ts).
insert into public.belge_surumleri (belge, surum, yururluk) values
  ('kullanici_sozlesmesi', '2026-11-taslak-1', '2026-11-18'),
  ('kvkk_aydinlatma', '2026-11-taslak-1', '2026-11-18'),
  ('acik_riza_yurtdisi', '2026-11-taslak-1', '2026-11-18'),
  ('on_bilgilendirme', '2026-11-taslak-1', '2026-11-18'),
  ('mesafeli_satis', '2026-11-taslak-1', '2026-11-18'),
  ('ticari_ileti', '2026-11-taslak-1', '2026-11-18');

create function public.guncel_surum(p_belge text) returns text
language sql stable security definer set search_path = '' as $$
  select surum from public.belge_surumleri where belge = p_belge order by yururluk desc, surum desc limit 1;
$$;

-- Onay kaydı yalnız belgenin GÜNCEL sürümüyle eklenebilir (geçmiş tarihli/eskimiş sürüm onayı olmaz).
alter table public.onaylar add constraint onaylar_surum_fk foreign key (belge, surum) references public.belge_surumleri (belge, surum);
create function public.onay_guncel_surum() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.surum is distinct from public.guncel_surum(new.belge) then
    raise exception 'Belgenin güncel sürümü onaylanmalı.' using errcode = '22023';
  end if;
  new.tarih := now();
  return new;
end;
$$;
create trigger onaylar_guncel_surum before insert on public.onaylar for each row execute function public.onay_guncel_surum();

-- Kullanıcının belge için geçerli onayı var mı (son kaydı "onay" ve güncel sürüm).
create function public.onay_gecerli(p_kullanici uuid, p_belge text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select o.onay and o.surum = public.guncel_surum(p_belge)
    from public.onaylar o where o.kullanici = p_kullanici and o.belge = p_belge
    order by o.tarih desc, o.id desc limit 1), false);
$$;

-- Yeniden onay gerekenler: zorunlu belgelerden geçerli onayı olmayanlar ve eski sürümle verilmiş isteğe bağlı izinler.
create function public.eksik_onaylar() returns table (belge text, zorunlu boolean, surum text)
language sql stable security definer set search_path = '' as $$
  select b.belge, b.belge in ('kullanici_sozlesmesi', 'kvkk_aydinlatma'), public.guncel_surum(b.belge)
  from (values ('kullanici_sozlesmesi'), ('kvkk_aydinlatma'), ('acik_riza_yurtdisi'), ('ticari_ileti')) as b (belge)
  where auth.uid() is not null and (
    (b.belge in ('kullanici_sozlesmesi', 'kvkk_aydinlatma') and not public.onay_gecerli(auth.uid(), b.belge))
    or (b.belge in ('acik_riza_yurtdisi', 'ticari_ileti') and exists (
      select 1 from (select o.onay, o.surum from public.onaylar o
                     where o.kullanici = auth.uid() and o.belge = b.belge order by o.tarih desc, o.id desc limit 1) s
      where s.onay and s.surum <> public.guncel_surum(b.belge))));
$$;

-- Kayıt: e-posta ile kayıtta zorunlu onaylar sunucuda denetlenir ve kaydedilir (istemciye güvenilmez).
-- signUp(options.data = { onaylar: ['kullanici_sozlesmesi', 'kvkk_aydinlatma', …], tarayici: '…' })
create function public.kayit_onaylari() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_liste jsonb := coalesce(new.raw_user_meta_data -> 'onaylar', '[]'::jsonb); v_b text;
begin
  if coalesce(new.raw_app_meta_data ->> 'provider', '') <> 'email' then return new; end if;
  if jsonb_typeof(v_liste) <> 'array' or not (v_liste ? 'kullanici_sozlesmesi' and v_liste ? 'kvkk_aydinlatma') then
    raise exception 'Kayıt için Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni onayı gerekli.' using errcode = '22023';
  end if;
  for v_b in select jsonb_array_elements_text(v_liste) loop
    if v_b in ('kullanici_sozlesmesi', 'kvkk_aydinlatma', 'acik_riza_yurtdisi', 'ticari_ileti') then
      insert into public.onaylar (kullanici, belge, surum, onay, tarayici)
        values (new.id, v_b, public.guncel_surum(v_b), true, left(coalesce(new.raw_user_meta_data ->> 'tarayici', ''), 500));
    end if;
  end loop;
  return new;
end;
$$;
create trigger kayit_onaylari after insert on auth.users for each row execute function public.kayit_onaylari();

-- =====================================================================
-- Hesap silme talepleri (talep anında hesap kilitlenir)
-- =====================================================================
create table public.hesap_silme_talepleri (
  id bigint generated always as identity primary key,
  kullanici uuid references auth.users (id) on delete set null,
  eposta text,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'iptal', 'tamamlandi')),
  talep_tarihi timestamptz not null default now(),
  karar_veren uuid,
  karar_tarihi timestamptz
);
create unique index hesap_silme_tek_bekleyen on public.hesap_silme_talepleri (kullanici) where durum = 'bekliyor';
alter table public.hesap_silme_talepleri enable row level security;
create policy silme_okur on public.hesap_silme_talepleri for select to authenticated
  using (kullanici = (select auth.uid()) or (select public.yonetici_mi()));
grant select on public.hesap_silme_talepleri to authenticated;

create function public.hesap_kilitli(p_kullanici uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.hesap_silme_talepleri where kullanici = p_kullanici and durum = 'bekliyor');
$$;

create function public.hesap_silme_talep_et() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Oturum gerekli.' using errcode = '42501'; end if;
  if public.hesap_kilitli() then return; end if;
  insert into public.hesap_silme_talepleri (kullanici, eposta) select auth.uid(), email from auth.users where id = auth.uid();
end;
$$;

create function public.hesap_silme_iptal() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.hesap_silme_talepleri set durum = 'iptal', karar_tarihi = now()
    where kullanici = auth.uid() and durum = 'bekliyor';
end;
$$;

-- Kilitli hesapta projeler değiştirilemez (okunabilir ve indirilebilir).
drop policy proje_sahibi_ekler on public.projeler;
drop policy proje_sahibi_gunceller on public.projeler;
drop policy proje_sahibi_siler on public.projeler;
create policy proje_sahibi_ekler on public.projeler for insert to authenticated
  with check (sahip = (select auth.uid()) and not (select public.hesap_kilitli()));
create policy proje_sahibi_gunceller on public.projeler for update to authenticated
  using (sahip = (select auth.uid()) and not (select public.hesap_kilitli()))
  with check (sahip = (select auth.uid()));
create policy proje_sahibi_siler on public.projeler for delete to authenticated
  using (sahip = (select auth.uid()) and not (select public.hesap_kilitli()));

-- =====================================================================
-- Paketler
-- =====================================================================
create table public.paketler (
  id text primary key,
  ad text not null check (char_length(ad) between 1 and 80),
  aciklama text not null default '' check (char_length(aciklama) <= 300),
  sure_gun int not null default 30 check (sure_gun between 1 and 3660),
  analiz_hakki int not null default 0 check (analiz_hakki between 0 and 10000),
  fiyat numeric(12, 2) not null default 0 check (fiyat >= 0),
  tur text not null default 'abonelik' check (tur in ('abonelik', 'ek_analiz')),
  aktif boolean not null default true,
  sira int not null default 0
);
alter table public.paketler enable row level security;
-- Satışta: aktif ve fiyatı 0'dan büyük. Yönetici hepsini görür.
create policy paket_okur on public.paketler for select to authenticated
  using ((aktif and fiyat > 0) or (select public.yonetici_mi()));
grant select on public.paketler to authenticated;

-- Fiyatlar 0: yönetici girene kadar satışta görünmez.
insert into public.paketler (id, ad, aciklama, sure_gun, analiz_hakki, fiyat, tur, sira) values
  ('baslangic_ay', 'Başlangıç (aylık)', 'Ayda 2 proje analizi', 30, 2, 0, 'abonelik', 1),
  ('profesyonel_ay', 'Profesyonel (aylık)', 'Ayda 6 proje analizi', 30, 6, 0, 'abonelik', 2),
  ('ofis_yil', 'Ofis (yıllık)', 'Yılda 60 proje analizi', 365, 60, 0, 'abonelik', 3),
  ('ek_analiz', 'Ek analiz', 'Paket hakkı bittiğinde tek analiz', 365, 1, 0, 'ek_analiz', 9);

create function public.paket_guncelle(p_id text, p_fiyat numeric, p_aktif boolean, p_ad text default null, p_aciklama text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.yonetici_mi() then raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501'; end if;
  if p_fiyat is null or p_fiyat < 0 or p_fiyat > 10000000 then
    raise exception 'Fiyat 0 ile 10 milyon TL arasında olmalı.' using errcode = '22023';
  end if;
  update public.paketler set fiyat = round(p_fiyat, 2), aktif = coalesce(p_aktif, aktif),
    ad = coalesce(nullif(trim(p_ad), ''), ad), aciklama = coalesce(p_aciklama, aciklama) where id = p_id;
  if not found then raise exception 'Paket bulunamadı.' using errcode = 'P0002'; end if;
end;
$$;

-- =====================================================================
-- Ödemeler
-- =====================================================================
-- yontem: kart (iyzico) | havale (yönetici onayı) | iap (mağaza) | yonetici
-- durum: bekliyor → onaylandi | reddedildi | iptal; onaylandi → iade_bekliyor (cayma) → iade_edildi | onaylandi
create table public.odemeler (
  id bigint generated always as identity primary key,
  kullanici uuid default auth.uid() references auth.users (id) on delete set null,
  paket_id text not null references public.paketler (id),
  adet int not null default 1 check (adet between 1 and 100),
  tutar numeric(12, 2) not null check (tutar >= 0),
  yontem text not null check (yontem in ('kart', 'havale', 'iap', 'yonetici')),
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'onaylandi', 'reddedildi', 'iptal', 'iade_bekliyor', 'iade_edildi')),
  referans text not null unique default ('RP' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  fatura jsonb not null default '{}'::jsonb check (jsonb_typeof(fatura) = 'object' and pg_column_size(fatura) < 4000),
  saglayici_ref text,
  olusturma timestamptz not null default now(),
  karar_veren uuid,
  karar_tarihi timestamptz,
  red_nedeni text,
  iade_talep_tarihi timestamptz,
  anonim boolean not null default false
);
create index odemeler_kullanici on public.odemeler (kullanici, olusturma desc);
create index odemeler_bekleyen on public.odemeler (durum, olusturma) where durum in ('bekliyor', 'iade_bekliyor');
alter table public.odemeler enable row level security;
create policy odeme_okur on public.odemeler for select to authenticated
  using (kullanici = (select auth.uid()) or (select public.yonetici_mi()));
grant select on public.odemeler to authenticated;

-- =====================================================================
-- Hak defteri: her hak tanımı bir "parti"dir (miktar > 0, lot_id boş); düşüm ve iadeler partiye bağlıdır.
-- Partinin kalanı = miktar + bağlı hareketlerin toplamı. Kalan hak = süresi dolmamış partilerin kalanları.
-- =====================================================================
create table public.hak_hareketleri (
  id bigint generated always as identity primary key,
  kullanici uuid not null references auth.users (id) on delete cascade,
  miktar int not null check (miktar <> 0),
  gecerlilik timestamptz not null,
  kaynak text not null check (kaynak in ('odeme', 'yonetici', 'analiz', 'analiz_iade', 'cayma', 'cayma_ret')),
  lot_id bigint references public.hak_hareketleri (id),
  odeme_id bigint references public.odemeler (id),
  analiz_id bigint,
  aciklama text not null default '',
  tarih timestamptz not null default now(),
  check ((lot_id is null) = (kaynak in ('odeme', 'yonetici'))),
  check (lot_id is not null or miktar > 0)
);
create index hak_kullanici on public.hak_hareketleri (kullanici, gecerlilik);
create index hak_lot on public.hak_hareketleri (lot_id);
alter table public.hak_hareketleri enable row level security;
create policy hak_okur on public.hak_hareketleri for select to authenticated
  using (kullanici = (select auth.uid()) or (select public.yonetici_mi()));
grant select on public.hak_hareketleri to authenticated;

create function public.parti_kalan(p_lot bigint) returns int
language sql stable security definer set search_path = '' as $$
  select (select miktar from public.hak_hareketleri where id = p_lot)
       + coalesce((select sum(miktar)::int from public.hak_hareketleri where lot_id = p_lot), 0);
$$;

-- =====================================================================
-- DXF analiz kayıtları (çizimin kendisi saklanmaz) ve ücretsiz deneme çiziminin parmak izleri
-- =====================================================================
create table public.ornek_cizim_ozetleri (ozet text primary key check (ozet ~ '^[0-9a-f]{64}$'));
alter table public.ornek_cizim_ozetleri enable row level security;
-- packages/core/src/dxf/example.ts → exampleDrawings() (UTF-8, SHA-256). Test: supabase/tests ve core testi denetler.
insert into public.ornek_cizim_ozetleri (ozet) values
  ('77b7faecc41e49abaa8dc3ee7742a7fe9591b2a3a5a35c555ea2d199912c28cb'),
  ('5a18041f1abfc5156c4d193dc014c22c06e6ad5439c557e1c7b1c98f2e682d97');

create table public.dxf_analizleri (
  id bigint generated always as identity primary key,
  kullanici uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proje_id uuid references public.projeler (id) on delete set null,
  ad text not null default '' check (char_length(ad) <= 200),
  dosyalar jsonb not null default '[]'::jsonb check (jsonb_typeof(dosyalar) = 'array' and pg_column_size(dosyalar) < 4000),
  ozet jsonb check (ozet is null or pg_column_size(ozet) < 20000),
  deneme boolean not null default false,
  durum text not null default 'acik' check (durum in ('acik', 'iade')),
  yz_kullanildi boolean not null default false,
  yz_token jsonb,
  olusturma timestamptz not null default now()
);
create index analiz_kullanici on public.dxf_analizleri (kullanici, olusturma desc);
alter table public.dxf_analizleri enable row level security;
create policy analiz_okur on public.dxf_analizleri for select to authenticated
  using (kullanici = (select auth.uid()) or (select public.yonetici_mi()));
grant select on public.dxf_analizleri to authenticated;

-- Kalan hak ve abonelik bilgisi.
create function public.analiz_hakki() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'kalan', coalesce((select sum(greatest(public.parti_kalan(h.id), 0)) from public.hak_hareketleri h
                       where h.kullanici = auth.uid() and h.lot_id is null and h.gecerlilik > now()), 0),
    'abonelik', (select jsonb_build_object('paket', p.ad, 'bitis', h.gecerlilik)
                 from public.hak_hareketleri h join public.odemeler o on o.id = h.odeme_id join public.paketler p on p.id = o.paket_id
                 where h.kullanici = auth.uid() and h.lot_id is null and h.kaynak = 'odeme' and p.tur = 'abonelik' and h.gecerlilik > now()
                 order by h.gecerlilik desc limit 1),
    'bekleyen_odeme', (select count(*) from public.odemeler where kullanici = auth.uid() and durum = 'bekliyor'));
$$;

-- Analiz başlatır: çizim cihazda başarıyla okunduktan sonra, kontrol ekranı açılmadan hemen önce çağrılır.
-- Deneme (hazır örnek çizim) hak düşürmez; yalnız örnek çizimin parmak izleriyle kabul edilir.
-- Gerçek analiz, süresi en yakın bitecek partiden 1 hak düşer.
create function public.analiz_baslat(p_ad text, p_dosyalar jsonb, p_deneme boolean default false, p_ozetler text[] default '{}')
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v_lot record;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli.' using errcode = '42501'; end if;
  if public.hesap_kilitli() then raise exception 'Hesabın silme talebi nedeniyle kilitli.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('hak:' || auth.uid()::text));
  if p_deneme then
    if coalesce(array_length(p_ozetler, 1), 0) = 0
       or exists (select 1 from unnest(p_ozetler) z where z not in (select ozet from public.ornek_cizim_ozetleri)) then
      raise exception 'Ücretsiz deneme yalnız hazır örnek çizimle yapılabilir.' using errcode = '42501';
    end if;
  else
    select h.id, h.gecerlilik into v_lot from public.hak_hareketleri h
      where h.kullanici = auth.uid() and h.lot_id is null and h.gecerlilik > now() and public.parti_kalan(h.id) > 0
      order by h.gecerlilik, h.id limit 1;
    if not found then
      raise exception 'Analiz hakkın kalmadı. Paket ya da ek analiz satın alabilirsin.' using errcode = 'P0001';
    end if;
  end if;
  insert into public.dxf_analizleri (kullanici, ad, dosyalar, deneme)
    values (auth.uid(), left(coalesce(p_ad, ''), 200), coalesce(p_dosyalar, '[]'::jsonb), p_deneme) returning id into v_id;
  if not p_deneme then
    insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, lot_id, analiz_id)
      values (auth.uid(), -1, v_lot.gecerlilik, 'analiz', v_lot.id, v_id);
  end if;
  return v_id;
end;
$$;

-- Otomatik iade: hak düştükten sonra hata yüzünden kontrol ekranı açılamazsa (1 saat içinde, projeye aktarılmamışsa).
create function public.analiz_iade(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.dxf_analizleri; v_h public.hak_hareketleri;
begin
  select * into v from public.dxf_analizleri where id = p_id and kullanici = auth.uid() for update;
  if not found then raise exception 'Analiz bulunamadı.' using errcode = 'P0002'; end if;
  if v.durum <> 'acik' or v.proje_id is not null or v.olusturma < now() - interval '1 hour' then
    raise exception 'Bu analiz için iade yapılamaz.' using errcode = 'P0001';
  end if;
  update public.dxf_analizleri set durum = 'iade' where id = p_id;
  if v.deneme then return; end if;
  select * into v_h from public.hak_hareketleri where analiz_id = p_id and kaynak = 'analiz';
  insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, lot_id, analiz_id, aciklama)
    values (v.kullanici, 1, v_h.gecerlilik, 'analiz_iade', v_h.lot_id, p_id, 'Kontrol ekranı açılamadı');
end;
$$;

-- Analiz projeye aktarıldığında bağlantı ve özet.
create function public.analiz_projeye_bagla(p_id bigint, p_proje uuid, p_ozet jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.projeler where id = p_proje and sahip = auth.uid()) then
    raise exception 'Proje bulunamadı.' using errcode = 'P0002';
  end if;
  update public.dxf_analizleri set proje_id = p_proje, ozet = p_ozet
    where id = p_id and kullanici = auth.uid() and durum = 'acik';
  if not found then raise exception 'Analiz bulunamadı.' using errcode = 'P0002'; end if;
end;
$$;

-- =====================================================================
-- Ödeme oluşturma (havale ve kart için ortak). Fatura bilgisi ve ödeme belgeleri onayı sunucuda denetlenir.
-- =====================================================================
create function public.fatura_gecerli(f jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(f) = 'object'
    and char_length(trim(coalesce(f ->> 'ad', ''))) between 2 and 200
    and coalesce(f ->> 'no', '') ~ '^[0-9]{10,11}$'
    and (char_length(f ->> 'no') = 11 or char_length(trim(coalesce(f ->> 'vergiDairesi', ''))) >= 2)
    and char_length(trim(coalesce(f ->> 'adres', ''))) between 5 and 500;
$$;

create function public.odeme_olustur(p_paket text, p_adet int, p_fatura jsonb, p_yontem text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.odemeler; v_p public.paketler; v_adet int;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli.' using errcode = '42501'; end if;
  if public.hesap_kilitli() then raise exception 'Hesabın silme talebi nedeniyle kilitli.' using errcode = '42501'; end if;
  if p_yontem not in ('havale', 'kart') then raise exception 'Geçersiz ödeme yöntemi.' using errcode = '22023'; end if;
  select * into v_p from public.paketler where id = p_paket and aktif and fiyat > 0;
  if not found then raise exception 'Paket bulunamadı ya da satışta değil.' using errcode = 'P0002'; end if;
  if not public.fatura_gecerli(p_fatura) then
    raise exception 'Fatura bilgileri eksik ya da hatalı: ad/unvan, 11 haneli TCKN ya da 10 haneli VKN (vergi dairesiyle) ve adres gerekli.' using errcode = '22023';
  end if;
  if not (public.onay_gecerli(auth.uid(), 'on_bilgilendirme') and public.onay_gecerli(auth.uid(), 'mesafeli_satis'))
     or not exists (select 1 from public.onaylar where kullanici = auth.uid() and belge = 'mesafeli_satis' and onay and tarih > now() - interval '1 hour') then
    raise exception 'Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onaylanmalı.' using errcode = '22023';
  end if;
  if (select count(*) from public.odemeler where kullanici = auth.uid() and durum = 'bekliyor') >= 3 then
    raise exception 'Onay bekleyen 3 ödemen var; önce onlar sonuçlanmalı.' using errcode = 'P0001';
  end if;
  v_adet := case when v_p.tur = 'ek_analiz' then greatest(1, least(coalesce(p_adet, 1), 100)) else 1 end;
  insert into public.odemeler (kullanici, paket_id, adet, tutar, yontem, fatura)
    values (auth.uid(), v_p.id, v_adet, v_p.fiyat * v_adet, p_yontem,
            jsonb_build_object('ad', trim(p_fatura ->> 'ad'), 'no', p_fatura ->> 'no', 'vergiDairesi', trim(coalesce(p_fatura ->> 'vergiDairesi', '')),
                               'adres', trim(p_fatura ->> 'adres'), 'il', trim(coalesce(p_fatura ->> 'il', ''))))
    returning * into v;
  return jsonb_build_object('id', v.id, 'referans', v.referans, 'tutar', v.tutar);
end;
$$;

-- Kart ödemesi başlatılınca sağlayıcı belirteci (yalnız sunucu fonksiyonu, service_role).
create function public.odeme_saglayici_ref(p_id bigint, p_ref text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then raise exception 'Yetkisiz.' using errcode = '42501'; end if;
  update public.odemeler set saglayici_ref = p_ref where id = p_id and durum = 'bekliyor';
end;
$$;

-- Ödeme onayı: hak partisi ekler. Yönetici (havale) ya da sunucu fonksiyonu (kart, service_role) çağırır.
-- Abonelik yenilemesi: süresi dolmamış abonelik varsa yeni süre onun bitişinden başlar.
create function public.odeme_onayla(p_id bigint, p_saglayici_ref text default null) returns void
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
      where h.kullanici = v.kullanici and h.lot_id is null and h.kaynak = 'odeme' and p.tur = 'abonelik' and h.gecerlilik > now();
  end if;
  insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, odeme_id, aciklama)
    values (v.kullanici, v_p.analiz_hakki * v.adet,
            v_bas + make_interval(days => v_p.sure_gun * (case when v_p.tur = 'abonelik' then v.adet else 1 end)),
            'odeme', v.id, v_p.ad);
  update public.odemeler set durum = 'onaylandi', karar_veren = auth.uid(), karar_tarihi = now(),
    saglayici_ref = coalesce(p_saglayici_ref, saglayici_ref) where id = p_id;
end;
$$;

create function public.odeme_reddet(p_id bigint, p_neden text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.yonetici_mi() or coalesce(auth.jwt() ->> 'role', '') = 'service_role') then
    raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501';
  end if;
  update public.odemeler set durum = 'reddedildi', karar_veren = auth.uid(), karar_tarihi = now(),
    red_nedeni = left(coalesce(nullif(trim(p_neden), ''), 'Belirtilmedi'), 300) where id = p_id and durum = 'bekliyor';
  if not found then raise exception 'Bekleyen ödeme bulunamadı.' using errcode = 'P0002'; end if;
end;
$$;

-- Kullanıcı kendi bekleyen havale bildirimini iptal eder.
create function public.odeme_iptal(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.odemeler set durum = 'iptal', karar_tarihi = now()
    where id = p_id and kullanici = auth.uid() and durum = 'bekliyor' and yontem = 'havale';
  if not found then raise exception 'İptal edilebilecek ödeme bulunamadı.' using errcode = 'P0002'; end if;
end;
$$;

-- =====================================================================
-- Cayma (14 gün, hiç analiz yapılmamış paket) — talep kullanıcıdan, karar yöneticiden.
-- Talep anında paketin hakları kullanılamaz hale gelir; red halinde geri verilir.
-- =====================================================================
create function public.cayma_talebi(p_odeme bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.odemeler; v_lot public.hak_hareketleri;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('hak:' || auth.uid()::text));
  select * into v from public.odemeler where id = p_odeme and kullanici = auth.uid() for update;
  if not found then raise exception 'Ödeme bulunamadı.' using errcode = 'P0002'; end if;
  if v.durum <> 'onaylandi' or v.yontem not in ('kart', 'havale') then
    raise exception 'Bu ödeme için cayma talebi oluşturulamaz.' using errcode = 'P0001';
  end if;
  if v.karar_tarihi < now() - interval '14 days' then
    raise exception 'Cayma süresi (14 gün) dolmuş.' using errcode = 'P0001';
  end if;
  select * into v_lot from public.hak_hareketleri where odeme_id = v.id and lot_id is null;
  -- Kullanılmış = partiden net analiz düşümü var (iade edilen analiz kullanılmış sayılmaz).
  if coalesce((select sum(miktar) from public.hak_hareketleri
               where lot_id = v_lot.id and kaynak in ('analiz', 'analiz_iade')), 0) < 0 then
    raise exception 'Bu paketle analiz yapıldığı için cayma hakkı kullanılamaz.' using errcode = 'P0001';
  end if;
  insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, lot_id, odeme_id, aciklama)
    values (v.kullanici, -v_lot.miktar, v_lot.gecerlilik, 'cayma', v_lot.id, v.id, 'Cayma talebi');
  update public.odemeler set durum = 'iade_bekliyor', iade_talep_tarihi = now() where id = v.id;
end;
$$;

create function public.cayma_karar(p_odeme bigint, p_onay boolean, p_not text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare v public.odemeler; v_lot public.hak_hareketleri;
begin
  if not public.yonetici_mi() then raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501'; end if;
  select * into v from public.odemeler where id = p_odeme and durum = 'iade_bekliyor' for update;
  if not found then raise exception 'Bekleyen cayma talebi bulunamadı.' using errcode = 'P0002'; end if;
  if p_onay then
    update public.odemeler set durum = 'iade_edildi', karar_veren = auth.uid(), karar_tarihi = now(),
      red_nedeni = left(coalesce(p_not, ''), 300) where id = v.id;
  else
    select * into v_lot from public.hak_hareketleri where odeme_id = v.id and lot_id is null;
    insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, lot_id, odeme_id, aciklama)
      values (v.kullanici, v_lot.miktar, v_lot.gecerlilik, 'cayma_ret', v_lot.id, v.id, left(coalesce(p_not, 'Cayma talebi reddedildi'), 300));
    update public.odemeler set durum = 'onaylandi', red_nedeni = left(coalesce(p_not, ''), 300) where id = v.id;
  end if;
end;
$$;

-- Yönetici elle hak tanımlar (kampanya, iade, test).
create function public.hak_tanimla(p_email text, p_miktar int, p_gun int default 30, p_aciklama text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare v_k uuid;
begin
  if not public.yonetici_mi() then raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501'; end if;
  if p_miktar is null or p_miktar < 1 or p_miktar > 1000 then raise exception 'Hak adedi 1 ile 1000 arasında olmalı.' using errcode = '22023'; end if;
  select id into v_k from auth.users where lower(email) = lower(trim(p_email));
  if v_k is null then raise exception 'Bu e-postayla kayıtlı kullanıcı yok.' using errcode = 'P0002'; end if;
  insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, aciklama)
    values (v_k, p_miktar, now() + make_interval(days => greatest(1, least(coalesce(p_gun, 30), 3660))), 'yonetici',
            left(coalesce(nullif(trim(p_aciklama), ''), 'Yönetici tanımladı'), 300));
end;
$$;

-- Yönetici: ödemeler (kullanıcı e-postasıyla).
create function public.odeme_listesi(p_durum text default 'bekliyor')
returns table (id bigint, email text, paket text, adet int, tutar numeric, yontem text, durum text, referans text, fatura jsonb,
               olusturma timestamptz, karar_tarihi timestamptz, red_nedeni text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.yonetici_mi() then raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501'; end if;
  return query select o.id, u.email::text, p.ad, o.adet, o.tutar, o.yontem, o.durum, o.referans, o.fatura, o.olusturma, o.karar_tarihi, o.red_nedeni
    from public.odemeler o left join auth.users u on u.id = o.kullanici join public.paketler p on p.id = o.paket_id
    where p_durum is null or o.durum = p_durum order by o.olusturma desc limit 200;
end;
$$;

create function public.hesap_silme_listesi()
returns table (id bigint, kullanici uuid, eposta text, durum text, talep_tarihi timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.yonetici_mi() then raise exception 'Bu işlem için yönetici yetkisi gerekir.' using errcode = '42501'; end if;
  return query select t.id, t.kullanici, t.eposta, t.durum, t.talep_tarihi from public.hesap_silme_talepleri t
    where t.durum = 'bekliyor' order by t.talep_tarihi limit 200;
end;
$$;

-- Hesap silme onayı (yalnız sunucu fonksiyonu "hesap-sil", service_role): ödeme kayıtlarını kişisel bilgilerden arındırır,
-- talebi tamamlar. Kullanıcının kendisi (auth.users) ve ona bağlı projeler, onaylar, haklar, analizler ardından silinir.
create function public.hesap_anonimlestir(p_talep bigint, p_karar_veren uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.hesap_silme_talepleri;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then raise exception 'Yetkisiz.' using errcode = '42501'; end if;
  select * into v from public.hesap_silme_talepleri where id = p_talep and durum = 'bekliyor' for update;
  if not found or v.kullanici is null then raise exception 'Bekleyen silme talebi bulunamadı.' using errcode = 'P0002'; end if;
  update public.odemeler set fatura = jsonb_build_object('anonim', true), anonim = true where kullanici = v.kullanici;
  update public.hesap_silme_talepleri set durum = 'tamamlandi', eposta = null, karar_veren = p_karar_veren, karar_tarihi = now() where id = v.id;
  return v.kullanici;
end;
$$;

-- Kullanıcının verileri (KVKK: verilerini indirme).
create function public.verilerim() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'hesap', (select jsonb_build_object('eposta', email, 'kayit_tarihi', created_at, 'son_giris', last_sign_in_at) from auth.users where id = auth.uid()),
    'projeler', coalesce((select jsonb_agg(to_jsonb(p) - 'sahip' order by p.olusturma) from public.projeler p where p.sahip = auth.uid()), '[]'::jsonb),
    'onaylar', coalesce((select jsonb_agg(jsonb_build_object('belge', belge, 'surum', surum, 'onay', onay, 'tarih', tarih, 'tarayici', tarayici) order by tarih) from public.onaylar where kullanici = auth.uid()), '[]'::jsonb),
    'odemeler', coalesce((select jsonb_agg(to_jsonb(o) - 'kullanici' - 'karar_veren' order by o.olusturma) from public.odemeler o where o.kullanici = auth.uid()), '[]'::jsonb),
    'hak_hareketleri', coalesce((select jsonb_agg(jsonb_build_object('miktar', miktar, 'kaynak', kaynak, 'gecerlilik', gecerlilik, 'tarih', tarih, 'aciklama', aciklama) order by tarih) from public.hak_hareketleri where kullanici = auth.uid()), '[]'::jsonb),
    'cizim_analizleri', coalesce((select jsonb_agg(to_jsonb(a) - 'kullanici' order by a.olusturma) from public.dxf_analizleri a where a.kullanici = auth.uid()), '[]'::jsonb),
    'olusturma', now());
$$;

-- =====================================================================
-- Yetkiler
-- =====================================================================
revoke all on public.paketler, public.odemeler, public.hak_hareketleri, public.dxf_analizleri, public.ornek_cizim_ozetleri,
  public.hesap_silme_talepleri from anon;
grant all on public.paketler, public.odemeler, public.hak_hareketleri, public.dxf_analizleri, public.onaylar,
  public.hesap_silme_talepleri, public.ornek_cizim_ozetleri, public.belge_surumleri to service_role;

do $$
declare f text;
begin
  foreach f in array array[
    'guncel_surum(text)', 'onay_gecerli(uuid, text)', 'eksik_onaylar()', 'hesap_kilitli(uuid)', 'hesap_silme_talep_et()', 'hesap_silme_iptal()',
    'paket_guncelle(text, numeric, boolean, text, text)', 'parti_kalan(bigint)', 'analiz_hakki()', 'analiz_baslat(text, jsonb, boolean, text[])',
    'analiz_iade(bigint)', 'analiz_projeye_bagla(bigint, uuid, jsonb)', 'fatura_gecerli(jsonb)', 'odeme_olustur(text, int, jsonb, text)',
    'odeme_saglayici_ref(bigint, text)', 'odeme_onayla(bigint, text)', 'odeme_reddet(bigint, text)', 'odeme_iptal(bigint)',
    'cayma_talebi(bigint)', 'cayma_karar(bigint, boolean, text)', 'hak_tanimla(text, int, int, text)', 'odeme_listesi(text)',
    'hesap_silme_listesi()', 'hesap_anonimlestir(bigint, uuid)', 'verilerim()']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;
revoke execute on function public.kayit_onaylari(), public.onay_guncel_surum() from public, anon, authenticated;
