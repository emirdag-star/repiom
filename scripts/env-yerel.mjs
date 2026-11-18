// Yerel Supabase çalışırken web uygulamasının bağlantı ayarını (apps/web/.env.local) oluşturur.
// Kullanım: pnpm db:start && pnpm env:yerel
// Yalnız yerel geliştirme içindir; üretim anahtarları bu yolla yazılmaz.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
let cikti;
try {
  // Sabit komut: kullanıcı girdisi içermez.
  cikti = execSync('pnpm exec supabase status -o env', {
    cwd: kok,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch {
  console.error('Yerel Supabase çalışmıyor. Önce "pnpm db:start" komutunu çalıştır.');
  process.exit(1);
}

const degerler = Object.fromEntries(
  cikti
    .split(/\r?\n/)
    .map((s) => s.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const url = degerler.API_URL;
const anahtar = degerler.PUBLISHABLE_KEY || degerler.ANON_KEY;
if (!url || !anahtar) {
  console.error('Supabase durum bilgisinden adres ya da anahtar okunamadı.');
  process.exit(1);
}

const hedef = join(kok, 'apps', 'web', '.env.local');
writeFileSync(hedef, `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_PUBLISHABLE_KEY=${anahtar}\n`, 'utf8');
console.log(`Yazıldı: apps/web/.env.local (${url})`);

// Sunucu fonksiyonlarının yerel ayarı (sahte iyzico). Varsa dokunulmaz (gerçek sandbox anahtarları yazılmış olabilir).
const fonk = join(kok, 'supabase', 'functions', '.env');
if (!existsSync(fonk)) {
  copyFileSync(join(kok, 'supabase', 'functions', '.env.example'), fonk);
  console.log(
    'Yazıldı: supabase/functions/.env (sahte iyzico). Etkinleşmesi için: pnpm db:stop && pnpm db:start',
  );
}
