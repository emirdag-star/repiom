-- Faz 7: yapay zekâ çağrı hakkı (rıza, tek çağrı, deneme, süre) ve token kaydı (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

create function pg_temp.giris(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;
insert into auth.users (id, aud, role, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'yz@ornek.test', now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'baska@ornek.test', now());
insert into public.hak_hareketleri (kullanici, miktar, gecerlilik, kaynak) values
  ('11111111-1111-1111-1111-111111111111', 5, now() + interval '30 days', 'yonetici');
create temp table x (ad text primary key, id bigint) on commit drop;
grant all on x to authenticated, service_role;

select pg_temp.giris('11111111-1111-1111-1111-111111111111');
insert into x select 'a', public.analiz_baslat('A', '[]', false);
insert into x select 'd', public.analiz_baslat('D', '[]', true,
  array['77b7faecc41e49abaa8dc3ee7742a7fe9591b2a3a5a35c555ea2d199912c28cb']);
select throws_ok($$ select public.yz_hakki_al((select id from x where ad = 'a')) $$, '42501',
  'Yapay zekâ kontrolü için yurt dışına aktarım açık rızası gerekli.', 'Açık rıza olmadan yapay zekâ çağrılamaz');
insert into public.onaylar (belge, surum) values ('acik_riza_yurtdisi', '2026-11-taslak-1');
select throws_ok($$ select public.yz_hakki_al((select id from x where ad = 'd')) $$, 'P0001', null, 'Denemede yapay zekâ yok');
select lives_ok($$ select public.yz_hakki_al((select id from x where ad = 'a')) $$, 'Rızayla çağrı hakkı alınır');
select throws_ok($$ select public.yz_hakki_al((select id from x where ad = 'a')) $$, 'P0001',
  'Bu analiz için yapay zekâ kontrolü zaten yapıldı.', 'Analiz başına tek çağrı');
select throws_ok($$ update public.dxf_analizleri set yz_kullanildi = false $$, '42501', null, 'Kullanıcı çağrı kaydını değiştiremez');
select throws_ok($$ select public.yz_kaydet((select id from x where ad = 'a'), '{"input_tokens":1}') $$, '42501', null,
  'Token kaydı yalnız sunucu fonksiyonuyla');
-- Rıza geri alınınca yeni çağrı yapılamaz
insert into x select 'b', public.analiz_baslat('B', '[]', false);
insert into public.onaylar (belge, surum, onay) values ('acik_riza_yurtdisi', '2026-11-taslak-1', false);
select throws_ok($$ select public.yz_hakki_al((select id from x where ad = 'b')) $$, '42501', null, 'Rıza geri alınınca çağrı yapılamaz');
reset role;

-- Başkasının analizi
select pg_temp.giris('22222222-2222-2222-2222-222222222222');
select throws_ok($$ select public.yz_hakki_al((select id from x where ad = 'b')) $$, 'P0002', null, 'Başkasının analizi için çağrı yok');
reset role;

-- Süre (1 saat)
update public.dxf_analizleri set olusturma = now() - interval '2 hours' where id = (select id from x where ad = 'b');
select pg_temp.giris('11111111-1111-1111-1111-111111111111');
insert into public.onaylar (belge, surum) values ('acik_riza_yurtdisi', '2026-11-taslak-1');
select throws_ok($$ select public.yz_hakki_al((select id from x where ad = 'b')) $$, 'P0001', 'Analizin süresi doldu; yeniden başlat.',
  'Eski analiz için çağrı yok');
reset role;

-- Token kaydı (service_role)
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select public.yz_kaydet((select id from x where ad = 'a'), '{"model":"claude-sonnet-5-5","input_tokens":1200,"output_tokens":300}');
reset role;
select is((select (yz_token ->> 'input_tokens')::int from public.dxf_analizleri where id = (select id from x where ad = 'a')), 1200,
  'Token kullanımı kaydedilir');
select ok((select yz_tarih is not null from public.dxf_analizleri where id = (select id from x where ad = 'a')), 'Çağrı zamanı kaydedilir');

select is((select count(*)::int from information_schema.role_table_grants
           where grantee in ('authenticated', 'anon') and table_schema = 'public'
             and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') and table_name <> 'projeler'), 0,
  'Kullanıcı rolünün (projeler dışında) tablo düzeyinde yazma yetkisi yok');

select * from finish();
rollback;
