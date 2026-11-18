-- Temel şema RLS ve yetki testleri (pgTAP). Çalıştırma: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- ---------- Kurgusal kullanıcılar ----------
insert into auth.users (id, aud, role, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'ayse@ornek.test', now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'mehmet@ornek.test', now()),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'yonetici-test@ornek.test', now()),
  ('44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'dogrulanmamis@ornek.test', null);
insert into public.yonetici_epostalar (email) values ('yonetici-test@ornek.test'), ('dogrulanmamis@ornek.test');

create function pg_temp.giris(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ---------- 1. Tüm public tablolarda RLS açık ----------
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity), 0,
  'public şemasındaki her tabloda RLS açık');

-- ---------- 2. Projeler: yalnız sahibi görür ve değiştirir ----------
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
insert into public.projeler (id, ad) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ayşe projesi');
select is((select count(*)::int from public.projeler), 1, 'Ayşe kendi projesini görür');
select throws_ok(
  $$ insert into public.projeler (ad, sahip) values ('sahte', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null, 'Başkası adına proje eklenemez');
select throws_ok(
  $$ update public.projeler set sahip = '22222222-2222-2222-2222-222222222222' $$,
  '42501', null, 'Projenin sahibi değiştirilemez');
reset role;

select pg_temp.giris('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.projeler), 0, 'Mehmet, Ayşe''nin projesini göremez');
update public.projeler set ad = 'ele geçirildi' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
delete from public.projeler where id = 'aaaaaaaa-0000-0000-0000-000000000001';
reset role;
select is((select ad from public.projeler where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Ayşe projesi',
  'Mehmet, Ayşe''nin projesini değiştiremez ve silemez');

select pg_temp.giris('11111111-1111-1111-1111-111111111111');
update public.projeler set ad = 'Yeni ad' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is((select ad from public.projeler where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Yeni ad', 'Ayşe kendi projesini günceller');
select ok((select guncelleme >= olusturma from public.projeler where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Güncelleme zamanı tutulur');
reset role;

-- ---------- 3. Oturumsuz (anon) erişim yok ----------
set local role anon;
select throws_ok($$ select * from public.projeler $$, '42501', null, 'Oturumsuz kullanıcı projeleri okuyamaz');
select throws_ok($$ select * from public.fiyat_listeleri $$, '42501', null, 'Oturumsuz kullanıcı fiyat listelerini okuyamaz');
select throws_ok($$ select public.yonetici_mi() $$, '42501', null, 'Oturumsuz kullanıcı yönetici kontrolünü çağıramaz');
reset role;

-- ---------- 4. Yönetici yetkisi ----------
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select is(public.yonetici_mi(), false, 'Normal kullanıcı yönetici değil');
select is((select count(*)::int from public.yonetici_epostalar), 0, 'Normal kullanıcı yönetici listesini göremez');
select throws_ok($$ insert into public.fiyat_listeleri (fiyatlar) values ('{}') $$, '42501', null,
  'Normal kullanıcı fiyat listesi ekleyemez');
select throws_ok($$ select public.fiyat_listesi_yayinla(1) $$, '42501', 'Bu işlem için yönetici yetkisi gerekir.',
  'Normal kullanıcı fiyat listesi yayınlayamaz');
reset role;

select pg_temp.giris('44444444-4444-4444-4444-444444444444');
select is(public.yonetici_mi(), false, 'E-postası doğrulanmamış hesap yönetici listesinde olsa da yönetici değil');
reset role;

select pg_temp.giris('33333333-3333-3333-3333-333333333333');
select is(public.yonetici_mi(), true, 'Listedeki doğrulanmış e-posta yönetici');
select throws_ok($$ insert into public.fiyat_listeleri (fiyatlar, aktif) values ('{}', true) $$, '42501', null,
  'Yönetici bile listeyi doğrudan aktif ekleyemez');
insert into public.fiyat_listeleri (aciklama, fiyatlar) values ('Test listesi 1', '{"K001": 100}');
insert into public.fiyat_listeleri (aciklama, fiyatlar) values ('Test listesi 2', '{"K001": 200}');
select public.fiyat_listesi_yayinla((select id from public.fiyat_listeleri where aciklama = 'Test listesi 1'));
select public.fiyat_listesi_yayinla((select id from public.fiyat_listeleri where aciklama = 'Test listesi 2'));
select is((select count(*)::int from public.fiyat_listeleri where aktif), 1, 'Aynı anda yalnız bir liste aktif');
select is((select aciklama from public.fiyat_listeleri where aktif), 'Test listesi 2', 'Son yayınlanan liste aktif');
select throws_ok($$ select public.fiyat_listesi_yayinla(-1) $$, 'P0002', 'Fiyat listesi bulunamadı.',
  'Olmayan liste yayınlanamaz');
reset role;

-- ---------- 5. Onaylar: kişi yalnız kendi adına ekler, kayıt değiştirilemez ----------
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
insert into public.onaylar (belge, surum, tarayici) values ('kvkk_aydinlatma', '2026-11-taslak-1', 'test');
select throws_ok(
  $$ insert into public.onaylar (kullanici, belge, surum) values ('22222222-2222-2222-2222-222222222222', 'kvkk_aydinlatma', '2026-11-taslak-1') $$,
  '42501', null, 'Başkası adına onay eklenemez');
select throws_ok($$ update public.onaylar set onay = false $$, '42501', null, 'Onay kaydı değiştirilemez');
reset role;

select pg_temp.giris('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.onaylar), 0, 'Başkasının onay kayıtları görünmez');
reset role;

select * from finish();
rollback;
