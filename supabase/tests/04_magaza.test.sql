-- Faz 8: uygulama içi satın alma kaydı ve mağaza iadesi (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

create function pg_temp.servis() returns void language sql as $$
  select set_config('request.jwt.claims', '{"role":"service_role"}', true);
  set local role service_role;
$$;
create function pg_temp.giris(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;
insert into auth.users (id, aud, role, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'mobil@ornek.test', now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'baska@ornek.test', now());
update public.paketler set fiyat = 500, aktif = true;

-- Kullanıcı kendisi kayıt oluşturamaz
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select throws_ok($$ select public.magaza_satin_alma('11111111-1111-1111-1111-111111111111', 'ios', 'T1', 'profesyonel_ay') $$,
  '42501', null, 'Satın alma kaydı yalnız sunucu fonksiyonuyla');
reset role;

select pg_temp.servis();
select is((public.magaza_satin_alma('11111111-1111-1111-1111-111111111111', 'ios', 'T1', 'profesyonel_ay', 'Sandbox') ->> 'yeni')::boolean,
  true, 'Doğrulanan satın alma kaydedilir');
select is((public.magaza_satin_alma('11111111-1111-1111-1111-111111111111', 'ios', 'T1', 'profesyonel_ay') ->> 'yeni')::boolean,
  false, 'Aynı işlem ikinci kez hak vermez');
select throws_ok($$ select public.magaza_satin_alma('22222222-2222-2222-2222-222222222222', 'ios', 'T1', 'profesyonel_ay') $$,
  '42501', 'Bu satın alma başka bir hesaba ait.', 'Başkasının makbuzu kullanılamaz');
select throws_ok($$ select public.magaza_satin_alma('11111111-1111-1111-1111-111111111111', 'android', 'J1', 'yok_boyle') $$,
  'P0002', null, 'Tanınmayan ürün reddedilir');
-- Yenileme: ikinci aylık paket, ilkinin bitişinden başlar (tek seferlik ürün de abonelik kuralını izler)
select public.magaza_satin_alma('11111111-1111-1111-1111-111111111111', 'android', 'J2', 'profesyonel_ay');
reset role;

select is((select count(*)::int from public.odemeler where yontem = 'iap' and durum = 'onaylandi'), 2, 'İki onaylı mağaza ödemesi');
select ok((select max(gecerlilik) - min(gecerlilik) between interval '29 days' and interval '31 days'
           from public.hak_hareketleri where kaynak = 'odeme' and kullanici = '11111111-1111-1111-1111-111111111111'),
  'Yeni süre önceki paketin bitişinden başlar');

select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select is((public.analiz_hakki() ->> 'kalan')::int, 12, 'Hak tanımlandı (2 × 6)');
-- Bir analiz yapılır (en yakın biten partiden: T1)
select public.analiz_baslat('A', '[]', false);
reset role;

-- İade: T1'in kullanılmamış 5 hakkı geri alınır
select pg_temp.servis();
select is((public.magaza_iade('ios', 'T1', 'REFUND') ->> 'geri_alinan')::int, 5, 'İadede yalnız kullanılmamış hak geri alınır');
select is((public.magaza_iade('ios', 'T1') ->> 'zaten')::boolean, true, 'İade iki kez işlenmez');
select is((public.magaza_iade('ios', 'BILINMEYEN') ->> 'bulundu')::boolean, false, 'Bilinmeyen işlem sessizce geçilir');
reset role;
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select is((public.analiz_hakki() ->> 'kalan')::int, 6, 'İade sonrası kalan hak');
select is((public.analiz_hakki() -> 'abonelik' ->> 'bitis')::timestamptz,
  (select gecerlilik from public.hak_hareketleri h join public.odemeler o on o.id = h.odeme_id
    where o.saglayici_ref = 'J2' and h.lot_id is null), 'Abonelik bitişi iade edilmeyen pakete göre');
reset role;
select pg_temp.servis();
select public.magaza_iade('android', 'J2');
reset role;
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select ok(public.analiz_hakki() -> 'abonelik' = 'null'::jsonb, 'İade edilen paket abonelik sayılmaz');
select throws_ok($$ select public.cayma_talebi((select id from public.odemeler where saglayici_ref = 'J2')) $$, 'P0001', null,
  'Mağaza ödemesinde cayma mağaza üzerinden yapılır');
reset role;

select * from finish();
rollback;
