// Şifreli yedeği açar ve bir veritabanına geri yükler (aylık geri yükleme denemesi ya da felaket kurtarma).
// Varsayılan hedef YEREL veritabanıdır: önce sıfırlanır (migration'lar uygulanır), sonra veri yüklenir ve kayıt
// sayıları yazdırılır. Üretime geri yükleme bilerek desteklenmez: belgedeki adımlar elle, iki kişiyle yapılır.
//
// Kullanım: YEDEK_SIFRESI=… node scripts/yedek-geri-yukle.mjs <dosya.rpyd> [--yalniz-ac <klasör>]
import { execFileSync, execSync } from 'node:child_process';
import { createDecipheriv, scryptSync } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const dosya = process.argv[2];
const sifre = process.env.YEDEK_SIFRESI ?? '';
if (!dosya || !sifre) {
  console.error(
    'Kullanım: YEDEK_SIFRESI=… node scripts/yedek-geri-yukle.mjs <dosya.rpyd> [--yalniz-ac <klasör>]',
  );
  process.exit(1);
}
const b = readFileSync(dosya);
if (b.subarray(0, 5).toString() !== 'RPYD1') {
  console.error('Bu bir REPİO(M) yedek dosyası değil.');
  process.exit(1);
}
const tuz = b.subarray(5, 21);
const iv = b.subarray(21, 33);
const etiket = b.subarray(b.length - 16);
const anahtar = scryptSync(sifre, tuz, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const d = createDecipheriv('aes-256-gcm', anahtar, iv);
d.setAuthTag(etiket);
let yedek;
try {
  yedek = JSON.parse(
    gunzipSync(Buffer.concat([d.update(b.subarray(33, b.length - 16)), d.final()])).toString(),
  );
} catch {
  console.error('Yedek açılamadı: şifre yanlış ya da dosya bozuk.');
  process.exit(1);
}
console.log(`Yedek tarihi: ${yedek.tarih}`);

const ac = process.argv.indexOf('--yalniz-ac');
if (ac > 0) {
  const k = resolve(process.argv[ac + 1] ?? 'yedek-acik');
  mkdirSync(k, { recursive: true });
  for (const p of ['roller', 'sema', 'veri']) writeFileSync(join(k, `${p}.sql`), yedek[p]);
  console.log(`Açıldı: ${k} (roller.sql, sema.sql, veri.sql)`);
  process.exit(0);
}

// Yerel deneme: veritabanı sıfırlanır (şema migration'lardan gelir), tohum veri silinir, yedeğin verisi yüklenir.
const kok = resolve(import.meta.dirname, '..');
const psql = (sql) =>
  execFileSync(
    'docker',
    ['exec', '-i', 'supabase_db_repiom', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'],
    {
      input: sql,
      encoding: 'utf8',
      maxBuffer: 1 << 30,
    },
  );
execSync('pnpm exec supabase db reset', { cwd: kok, stdio: 'ignore' });
psql(`set session_replication_role = replica;
do $$ declare t text; begin
  for t in select format('%I.%I', schemaname, tablename) from pg_tables
           where schemaname = 'public' or (schemaname = 'auth' and tablename <> 'schema_migrations') loop
    execute 'truncate ' || t || ' cascade';
  end loop; end $$;`);
psql(`set session_replication_role = replica;\n${yedek.veri}`);
const sayilar = execFileSync(
  'docker',
  [
    'exec',
    'supabase_db_repiom',
    'psql',
    '-U',
    'postgres',
    '-At',
    '-c',
    `select 'kullanici=' || (select count(*) from auth.users) || ' proje=' || (select count(*) from public.projeler) ||
       ' odeme=' || (select count(*) from public.odemeler) || ' hak_hareketi=' || (select count(*) from public.hak_hareketleri) ||
       ' onay=' || (select count(*) from public.onaylar) || ' fiyat_listesi=' || (select count(*) from public.fiyat_listeleri)`,
  ],
  { encoding: 'utf8' },
);
console.log(`Yerel veritabanına geri yüklendi: ${sayilar.trim()}`);
