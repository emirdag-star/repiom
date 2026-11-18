-- Fiyat listeleri: doğrulama, ekle-ve-yayınla, sürümler, değiştirilemezlik (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, aud, role, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'kullanici@ornek.test', now()),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'yonetici-fiyat@ornek.test', now());
insert into public.yonetici_epostalar (email) values ('yonetici-fiyat@ornek.test');

create function pg_temp.giris(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ---------- İçerik doğrulaması ----------
select ok(public.fiyat_listesi_gecerli('{"K001": 320, "K213": 0.5}'), 'Geçerli liste kabul edilir');
select ok(not public.fiyat_listesi_gecerli('{"X001": 320}'), 'Kod biçimi K + 3 rakam olmalı');
select ok(not public.fiyat_listesi_gecerli('{"K001": "320"}'), 'Fiyat metin olamaz');
select ok(not public.fiyat_listesi_gecerli('{"K001": -1}'), 'Negatif fiyat reddedilir');
select ok(not public.fiyat_listesi_gecerli('{"K001": 20000000000}'), '10 milyardan büyük fiyat reddedilir');
select ok(not public.fiyat_listesi_gecerli('[1,2]'), 'Liste nesne olmalı');

-- ---------- Normal kullanıcı ----------
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select throws_ok($$ select public.fiyat_listesi_ekle_yayinla('x', '{"K001": 1}') $$, '42501',
  'Bu işlem için yönetici yetkisi gerekir.', 'Normal kullanıcı liste yayınlayamaz');
select throws_ok($$ select * from public.fiyat_listesi_surumleri() $$, '42501',
  'Bu işlem için yönetici yetkisi gerekir.', 'Normal kullanıcı sürüm listesini göremez');
reset role;

-- ---------- Yönetici ----------
select pg_temp.giris('33333333-3333-3333-3333-333333333333');
select throws_ok($$ select public.fiyat_listesi_ekle_yayinla('x', '{"K001": -5}') $$, '22023', null,
  'Geçersiz içerik sunucuda reddedilir');
select throws_ok($$ select public.fiyat_listesi_ekle_yayinla('x', '{}') $$, '22023', 'Fiyat listesi boş.',
  'Boş liste yayınlanamaz');
select throws_ok($$ insert into public.fiyat_listeleri (aciklama, fiyatlar) values ('doğrudan', '{"K001": "a"}') $$,
  '23514', null, 'Doğrudan eklemede de içerik kısıtı geçerli');

create temp table ids (ad text, id bigint) on commit drop;
grant all on ids to authenticated;
insert into ids select 'ilk', public.fiyat_listesi_ekle_yayinla('Test 1', '{"K001": 100}');
insert into ids select 'ikinci', public.fiyat_listesi_ekle_yayinla('  ', '{"K001": 200, "K002": 5}');
select is((select aciklama from public.fiyat_listeleri where aktif), 'Fiyat güncellemesi',
  'Son eklenen yayında; boş açıklamaya varsayılan verilir');
select is((select count(*)::int from public.fiyat_listeleri where aktif), 1, 'Tek aktif liste');
select is((select kalem_sayisi from public.fiyat_listesi_surumleri() where id = (select id from ids where ad = 'ikinci')), 2,
  'Sürüm listesinde kalem sayısı');
select is((select olusturan_eposta from public.fiyat_listesi_surumleri() where id = (select id from ids where ad = 'ikinci')),
  'yonetici-fiyat@ornek.test', 'Sürümü kimin yayınladığı görünür');

-- Eski sürüme dönüş
select public.fiyat_listesi_yayinla((select id from ids where ad = 'ilk'));
select is((select aciklama from public.fiyat_listeleri where aktif), 'Test 1', 'Eski sürüm yeniden yayına alınabilir');

-- Listeler değiştirilemez ve silinemez (yönetici bile)
select throws_ok($$ update public.fiyat_listeleri set fiyatlar = '{"K001": 1}' $$, '42501', null,
  'Yayınlanmış liste değiştirilemez');
select throws_ok($$ delete from public.fiyat_listeleri $$, '42501', null, 'Liste silinemez');
reset role;

select * from finish();
rollback;
