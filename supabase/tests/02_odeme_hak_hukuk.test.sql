-- Faz 6: onaylar, paketler, ödemeler, hak düşme / iade / cayma / yenileme, hesap silme (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;
select plan(59);

-- ---------- Yardımcılar ----------
create function pg_temp.giris(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;
create function pg_temp.servis() returns void language sql as $$
  select set_config('request.jwt.claims', '{"role":"service_role"}', true);
  set local role service_role;
$$;
create function pg_temp.kalan() returns int language sql as $$ select (public.analiz_hakki() ->> 'kalan')::int $$;
create function pg_temp.odeme_onaylari() returns void language sql as $$
  insert into public.onaylar (belge, surum) values ('on_bilgilendirme', '2026-11-taslak-1'), ('mesafeli_satis', '2026-11-taslak-1');
$$;
grant execute on function pg_temp.kalan(), pg_temp.odeme_onaylari() to authenticated;

insert into auth.users (id, aud, role, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'ayse@ornek.test', now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'mehmet@ornek.test', now()),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'yonetici-odeme@ornek.test', now());
insert into public.yonetici_epostalar (email) values ('yonetici-odeme@ornek.test');
-- Önceki çalıştırmalardan kalan paket fiyatlarından bağımsız başla.
update public.paketler set fiyat = 0, aktif = true;
create temp table x (ad text primary key, id bigint) on commit drop;
grant all on x to authenticated, service_role;

-- ================= 1. Kayıt onayları (sunucuda) =================
select throws_ok($$ insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
  values ('44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'onaysiz@ornek.test',
          '{"provider":"email"}', '{"onaylar":["kullanici_sozlesmesi"]}') $$,
  '22023', 'Kayıt için Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni onayı gerekli.', 'Zorunlu onaylar olmadan kayıt olunamaz');
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values ('55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'onayli@ornek.test', now(),
          '{"provider":"email"}', '{"onaylar":["kullanici_sozlesmesi","kvkk_aydinlatma","acik_riza_yurtdisi","sahte_belge"],"tarayici":"Test/1.0"}');
select is((select count(*)::int from public.onaylar where kullanici = '55555555-5555-5555-5555-555555555555'), 3,
  'Kayıtta verilen onaylar (bilinmeyen belge hariç) kaydedilir');
select is((select string_agg(distinct surum, ',') from public.onaylar where kullanici = '55555555-5555-5555-5555-555555555555'),
  '2026-11-taslak-1', 'Onaylar güncel sürümle kaydedilir');
select is((select tarayici from public.onaylar where kullanici = '55555555-5555-5555-5555-555555555555' limit 1), 'Test/1.0',
  'Tarayıcı bilgisi saklanır');

select pg_temp.giris('55555555-5555-5555-5555-555555555555');
select is((select count(*)::int from public.eksik_onaylar()), 0, 'Onaylı kullanıcıdan yeniden onay istenmez');
select throws_ok($$ insert into public.onaylar (belge, surum) values ('kvkk_aydinlatma', 'eski') $$, null, null,
  'Güncel olmayan sürüm onaylanamaz');
reset role;
-- Metin sürümü değişince yeniden onay
insert into public.belge_surumleri (belge, surum, yururluk) values ('kullanici_sozlesmesi', '2027-01', now()), ('acik_riza_yurtdisi', '2027-01', now());
select pg_temp.giris('55555555-5555-5555-5555-555555555555');
select results_eq($$ select belge, zorunlu from public.eksik_onaylar() order by belge $$,
  $$ values ('acik_riza_yurtdisi', false), ('kullanici_sozlesmesi', true) $$,
  'Sürüm değişince zorunlu belge ve eski sürümle verilmiş isteğe bağlı izin yeniden sorulur');
insert into public.onaylar (belge, surum, tarayici) values ('kullanici_sozlesmesi', '2027-01', 't'), ('acik_riza_yurtdisi', '2027-01', 't');
select is((select count(*)::int from public.eksik_onaylar()), 0, 'Yeni sürüm onaylanınca istek kalkar');
-- Rıza geri alma
insert into public.onaylar (belge, surum, onay) values ('acik_riza_yurtdisi', '2027-01', false);
select is(public.onay_gecerli(auth.uid(), 'acik_riza_yurtdisi'), false, 'Rıza geri alınabilir');
reset role;
delete from public.onaylar where surum = '2027-01';
delete from public.belge_surumleri where surum = '2027-01';

select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select results_eq($$ select belge from public.eksik_onaylar() order by belge $$,
  $$ values ('kullanici_sozlesmesi'), ('kvkk_aydinlatma') $$, 'Onayı olmayan kullanıcıdan zorunlu belgeler istenir');

-- ================= 2. Paketler =================
select is((select count(*)::int from public.paketler), 0, 'Fiyatı 0 olan paketler satışta görünmez');
select throws_ok($$ select public.paket_guncelle('baslangic_ay', 500, true) $$, '42501', null, 'Normal kullanıcı paket fiyatı giremez');
reset role;
select pg_temp.giris('33333333-3333-3333-3333-333333333333');
select public.paket_guncelle('baslangic_ay', 500, true);
select public.paket_guncelle('ek_analiz', 150, true);
select throws_ok($$ select public.paket_guncelle('ek_analiz', -1, true) $$, '22023', null, 'Negatif fiyat girilemez');
reset role;
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select results_eq($$ select id from public.paketler order by sira $$, $$ values ('baslangic_ay'), ('ek_analiz') $$,
  'Fiyat girilen paketler satışta');

-- ================= 3. Ödeme oluşturma =================
select throws_ok($$ select public.odeme_olustur('baslangic_ay', 1, '{"ad":"Ayşe Yılmaz","no":"12345678901","adres":"Bir sokak 1"}', 'havale') $$,
  '22023', 'Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onaylanmalı.', 'Ödeme belgeleri onaylanmadan ödeme olmaz');
select pg_temp.odeme_onaylari();
select throws_ok($$ select public.odeme_olustur('baslangic_ay', 1, '{"ad":"Ayşe","no":"123","adres":"Bir sokak 1"}', 'havale') $$,
  '22023', null, 'Hatalı TCKN/VKN reddedilir');
select throws_ok($$ select public.odeme_olustur('baslangic_ay', 1, '{"ad":"Ayşe A.Ş.","no":"1234567890","adres":"Bir sokak 1"}', 'havale') $$,
  '22023', null, 'VKN ile vergi dairesi zorunlu');
select throws_ok($$ select public.odeme_olustur('profesyonel_ay', 1, '{"ad":"Ayşe Yılmaz","no":"12345678901","adres":"Bir sokak 1"}', 'havale') $$,
  'P0002', null, 'Satışta olmayan paket alınamaz');
insert into x select 'h1', (public.odeme_olustur('baslangic_ay', 1, '{"ad":"Ayşe Yılmaz","no":"12345678901","adres":"Bir sokak 1","fazla":"x"}', 'havale') ->> 'id')::bigint;
select is((select durum from public.odemeler where id = (select id from x where ad = 'h1')), 'bekliyor', 'Havale bildirimi onay bekler');
select ok((select referans ~ '^RP[0-9A-F]{8}$' from public.odemeler where id = (select id from x where ad = 'h1')), 'Referans kodu üretilir');
select is((select tutar from public.odemeler where id = (select id from x where ad = 'h1')), 500.00::numeric, 'Tutar paket fiyatı');
select ok(not ((select fatura from public.odemeler where id = (select id from x where ad = 'h1')) ? 'fazla'), 'Fatura yalnız tanımlı alanları saklar');
select throws_ok($$ select public.odeme_onayla((select id from x where ad = 'h1')) $$, '42501', null, 'Kullanıcı kendi ödemesini onaylayamaz');
select is(pg_temp.kalan(), 0, 'Onay öncesi hak yok');
select throws_ok($$ select public.analiz_baslat('Proje', '[]', false) $$, 'P0001',
  'Analiz hakkın kalmadı. Paket ya da ek analiz satın alabilirsin.', 'Hak yokken analiz başlamaz');
reset role;

-- Mehmet Ayşe'nin ödemesini göremez
select pg_temp.giris('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.odemeler), 0, 'Başkasının ödemesi görünmez');
reset role;

-- ================= 4. Yönetici onayı ve hak düşme =================
select pg_temp.giris('33333333-3333-3333-3333-333333333333');
select public.odeme_onayla((select id from x where ad = 'h1'));
select throws_ok($$ select public.odeme_onayla((select id from x where ad = 'h1')) $$, 'P0001', null, 'Ödeme iki kez onaylanamaz');
reset role;
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select is(pg_temp.kalan(), 2, 'Onaylanan Başlangıç paketi 2 hak verir');
select is((public.analiz_hakki() -> 'abonelik' ->> 'paket'), 'Başlangıç (aylık)', 'Abonelik bilgisi görünür');
-- Deneme: yalnız örnek çizimin parmak iziyle, hak düşmez
select throws_ok($$ select public.analiz_baslat('Deneme', '[]', true, array['00']) $$, '42501', null, 'Sahte deneme reddedilir');
select throws_ok($$ select public.analiz_baslat('Deneme', '[]', true) $$, '42501', null, 'Parmak izi olmadan deneme olmaz');
select lives_ok($$ select public.analiz_baslat('Deneme', '[]', true,
  array['77b7faecc41e49abaa8dc3ee7742a7fe9591b2a3a5a35c555ea2d199912c28cb', '5a18041f1abfc5156c4d193dc014c22c06e6ad5439c557e1c7b1c98f2e682d97']) $$,
  'Örnek çizimle deneme başlar');
select is(pg_temp.kalan(), 2, 'Deneme hak düşürmez');
insert into x select 'a1', public.analiz_baslat('Proje 1', '[{"ad":"m.dxf","boyut":1}]', false);
select is(pg_temp.kalan(), 1, 'Gerçek analiz 1 hak düşer');
-- Otomatik iade (kontrol ekranı açılamadı)
select public.analiz_iade((select id from x where ad = 'a1'));
select is(pg_temp.kalan(), 2, 'Kontrol ekranı açılamazsa hak geri verilir');
select throws_ok($$ select public.analiz_iade((select id from x where ad = 'a1')) $$, 'P0001', null, 'Aynı analiz iki kez iade edilemez');
insert into x select 'a2', public.analiz_baslat('Proje 2', '[]', false);
insert into public.projeler (id, ad) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'DXF projesi');
select public.analiz_projeye_bagla((select id from x where ad = 'a2'), 'aaaaaaaa-0000-0000-0000-00000000000a', '{"kat":3}');
select throws_ok($$ select public.analiz_iade((select id from x where ad = 'a2')) $$, 'P0001', null, 'Projeye aktarılmış analiz iade edilemez');
select is(pg_temp.kalan(), 1, 'Aktarılan analizin hakkı düşmüş kalır');
reset role;
-- İadede 1 saat sınırı
update public.dxf_analizleri set olusturma = now() - interval '2 hours' where id = (select id from x where ad = 'a1');
update public.dxf_analizleri set durum = 'acik' where id = (select id from x where ad = 'a1');
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select throws_ok($$ select public.analiz_iade((select id from x where ad = 'a1')) $$, 'P0001', null, '1 saatten eski analiz iade edilemez');
reset role;
update public.dxf_analizleri set durum = 'iade' where id = (select id from x where ad = 'a1');

-- ================= 5. Partiler: süresi en yakın biten önce, süresi dolan sayılmaz =================
insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak, aciklama) values
  ('11111111-1111-1111-1111-111111111111', 1, now() + interval '5 days', 'yonetici', 'kısa'),
  ('11111111-1111-1111-1111-111111111111', 5, now() - interval '1 day', 'yonetici', 'süresi dolmuş');
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select is(pg_temp.kalan(), 2, 'Süresi dolmuş hak sayılmaz');
insert into x select 'a3', public.analiz_baslat('Proje 3', '[]', false);
reset role;
select is((select l.aciklama from public.hak_hareketleri d join public.hak_hareketleri l on l.id = d.lot_id
           where d.analiz_id = (select id from x where ad = 'a3')), 'kısa', 'Süresi en yakın biten partiden düşülür');

-- ================= 6. Abonelik yenileme: yeni süre mevcut bitişten başlar =================
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select pg_temp.odeme_onaylari();
insert into x select 'h2', (public.odeme_olustur('baslangic_ay', 1, '{"ad":"Ayşe Yılmaz","no":"12345678901","adres":"Bir sokak 1"}', 'havale') ->> 'id')::bigint;
reset role;
select pg_temp.giris('33333333-3333-3333-3333-333333333333');
select public.odeme_onayla((select id from x where ad = 'h2'));
reset role;
select is((select gecerlilik from public.hak_hareketleri where odeme_id = (select id from x where ad = 'h2') and lot_id is null),
          (select gecerlilik from public.hak_hareketleri where odeme_id = (select id from x where ad = 'h1') and lot_id is null) + interval '30 days',
          'Yenilenen aboneliğin süresi mevcut bitişten başlar');

-- ================= 7. Cayma (14 gün, kullanılmamış paket) =================
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select throws_ok($$ select public.cayma_talebi((select id from x where ad = 'h1')) $$, 'P0001',
  'Bu paketle analiz yapıldığı için cayma hakkı kullanılamaz.', 'Kullanılmış pakette cayma olmaz');
select is(pg_temp.kalan(), 3, 'Cayma öncesi kalan');
select public.cayma_talebi((select id from x where ad = 'h2'));
select is(pg_temp.kalan(), 1, 'Cayma talebiyle paketin hakları kullanılamaz');
select is((select durum from public.odemeler where id = (select id from x where ad = 'h2')), 'iade_bekliyor', 'Talep yönetici onayı bekler');
reset role;
select pg_temp.giris('33333333-3333-3333-3333-333333333333');
select public.cayma_karar((select id from x where ad = 'h2'), false, 'Belge eksik');
reset role;
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select is(pg_temp.kalan(), 3, 'Reddedilen caymada haklar geri gelir');
select public.cayma_talebi((select id from x where ad = 'h2'));
reset role;
select pg_temp.giris('33333333-3333-3333-3333-333333333333');
select public.cayma_karar((select id from x where ad = 'h2'), true, 'İade yapıldı');
reset role;
select is((select durum from public.odemeler where id = (select id from x where ad = 'h2')), 'iade_edildi', 'Onaylanan cayma iade edildi');
update public.odemeler set durum = 'onaylandi', karar_tarihi = now() - interval '15 days' where id = (select id from x where ad = 'h1');
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select throws_ok($$ select public.cayma_talebi((select id from x where ad = 'h1')) $$, 'P0001', 'Cayma süresi (14 gün) dolmuş.', '14 gün sonra cayma olmaz');

-- ================= 8. Elle hak tanımlama =================
select throws_ok($$ select public.hak_tanimla('ayse@ornek.test', 5) $$, '42501', null, 'Kullanıcı kendine hak tanımlayamaz');
reset role;
select pg_temp.giris('33333333-3333-3333-3333-333333333333');
select public.hak_tanimla('AYSE@ornek.test', 4, 30, 'Kampanya');
reset role;
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select is(pg_temp.kalan(), 5, 'Yönetici hak tanımlayabilir');
reset role;

-- ================= 9. Hesap silme =================
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
select public.hesap_silme_talep_et();
select ok(public.hesap_kilitli(), 'Silme talebiyle hesap kilitlenir');
select throws_ok($$ insert into public.projeler (ad) values ('yeni') $$, '42501', null, 'Kilitli hesapta proje eklenemez');
select throws_ok($$ select public.analiz_baslat('x', '[]', false) $$, '42501', null, 'Kilitli hesapta analiz yapılamaz');
select ok((public.verilerim() -> 'projeler') @> '[{"ad":"DXF projesi"}]' and public.verilerim() ? 'odemeler', 'Kullanıcı verilerini indirebilir');
select public.hesap_silme_iptal();
select ok(not public.hesap_kilitli(), 'Talep geri alınınca kilit kalkar');
select public.hesap_silme_talep_et();
select throws_ok($$ select public.hesap_anonimlestir((select id from public.hesap_silme_talepleri where durum = 'bekliyor' limit 1), auth.uid()) $$,
  '42501', null, 'Anonimleştirme yalnız sunucu fonksiyonuyla');
reset role;
select pg_temp.servis();
select public.hesap_anonimlestir((select id from public.hesap_silme_talepleri where kullanici = '11111111-1111-1111-1111-111111111111' and durum = 'bekliyor'),
                                 '33333333-3333-3333-3333-333333333333');
reset role;
select is((select count(*)::int from public.odemeler where kullanici = '11111111-1111-1111-1111-111111111111' and fatura <> '{"anonim": true}'), 0,
  'Silmede ödeme kayıtlarındaki kişisel bilgiler kaldırılır');
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select is((select count(*)::int from public.odemeler where id in (select id from x where ad in ('h1', 'h2')) and kullanici is null and anonim), 2,
  'Kullanıcı silinince ödeme kayıtları anonim olarak kalır');

select * from finish();
rollback;
