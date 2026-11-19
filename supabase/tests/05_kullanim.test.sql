-- Faz 9: çerezsiz kullanım ölçümü (pgTAP).
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

create function pg_temp.giris(p_uid uuid, p_email text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'email', p_email)::text, true);
  set local role authenticated;
$$;
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'kul@ornek.test', now(), now());

set local role anon;
select lives_ok($$ select public.olay_say('uygulama_acilis', 'web') $$, 'Oturumsuz da sayılır (giriş ekranı)');
reset role;
select pg_temp.giris('11111111-1111-1111-1111-111111111111', 'kul@ornek.test');
select public.olay_say('adim:sonuc', 'ios');
select public.olay_say('adim:sonuc', 'ios');
select public.olay_say('serbest metin <script>', 'web');
select public.olay_say('adim:sonuc', 'masaustu');
select is((select count(*)::int from public.kullanim_sayaclari), 0, 'Yönetici olmayan sayaçları göremez');
select throws_ok($$ select * from public.kullanim_ozeti(7) $$, '42501', null, 'Özet yalnız yöneticiye');
select throws_ok($$ insert into public.kullanim_sayaclari (olay, platform, sayi) values ('x', 'web', 999) $$, '42501', null,
  'Sayaçlara doğrudan yazılamaz');
reset role;

select is((select sayi from public.kullanim_sayaclari where olay = 'adim:sonuc' and platform = 'ios'), 2, 'Olay günlük toplanır');
select is((select count(*)::int from public.kullanim_sayaclari), 2, 'Bilinmeyen olay ve platform yok sayılır');
select is((select count(*)::int from information_schema.columns where table_name = 'kullanim_sayaclari'
           and column_name in ('kullanici', 'ip', 'cihaz')), 0, 'Sayaçta kişiyi tanıtan sütun yok');

-- Yönetici özeti (yönetici e-postası listede)
insert into public.yonetici_epostalar (email) values ('yon@ornek.test') on conflict do nothing;
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at) values
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'yon@ornek.test', now(), now());
select pg_temp.giris('22222222-2222-2222-2222-222222222222', 'yon@ornek.test');
select ok((select (olaylar ->> 'adim:sonuc')::int = 2 and kayit >= 1 from public.kullanim_ozeti(1) order by gun desc limit 1),
  'Özet: türetilen sayılar ve olaylar');
reset role;

select * from finish();
rollback;
