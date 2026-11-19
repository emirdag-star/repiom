// Üretime yayın (Supabase Frankfurt + Cloudflare Pages). VARSAYILAN: kuru çalıştırma — yalnız adımları yazdırır.
// Gerçekten uygulamak için: node scripts/yayinla.mjs --ortam <üretim ortam dosyası> --uygula
// Önkoşullar (docs/yayin.md): `supabase login` + `supabase link --project-ref <ref>`, `npx wrangler login`,
// yayın denetimi engelsiz, çalışma alanı temiz ve main dalında.
// Test fonksiyonları (test-*) ASLA yayınlanmaz; üretim ortam dosyası depoya girmez.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const kok = resolve(import.meta.dirname, '..');
const uygula = process.argv.includes('--uygula');
const i = process.argv.indexOf('--ortam');
const ortamDosyasi = i > 0 ? resolve(process.argv[i + 1]) : null;
if (!ortamDosyasi) {
  console.error('Kullanım: node scripts/yayinla.mjs --ortam <üretim ortam dosyası> [--uygula]');
  process.exit(1);
}
const ortam = Object.fromEntries(
  readFileSync(ortamDosyasi, 'utf8')
    .split(/\r?\n/)
    .map((s) => /^([A-Z0-9_]+)=(.*)$/.exec(s.trim()))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

const calistir = (ad, komut, ek = {}) => {
  console.log(`\n▶ ${ad}\n  ${komut.replace(/(KEY|SECRET|DSN|ANAHTAR|PRIVATE)[^ ]*=\S+/g, '$1=***')}`);
  if (uygula) execSync(komut, { cwd: kok, stdio: 'inherit', env: { ...process.env, ...ek } });
};

// 0. Denetimler
calistir('Yayın denetimi', `node scripts/yayin-denetimi.mjs --ortam ${JSON.stringify(ortamDosyasi)}`);
if (uygula) {
  const dal = execSync('git branch --show-current', { cwd: kok, encoding: 'utf8' }).trim();
  const kirli = execSync('git status --porcelain', { cwd: kok, encoding: 'utf8' }).trim();
  if (dal !== 'main' || kirli) {
    console.error('Yayın yalnız temiz main dalından yapılır.');
    process.exit(1);
  }
}
calistir('Testler', 'pnpm lint && pnpm typecheck && pnpm test');

// 1. Veritabanı: migration'lar (tohum veri üretime YÜKLENMEZ)
calistir('Veritabanı migration', 'pnpm exec supabase db push --linked');

// 2. Sunucu fonksiyonu gizli değerleri (yalnız fonksiyonların okuduğu adlar)
const FONK = [
  'IYZICO_URL',
  'IYZICO_API_KEY',
  'IYZICO_SECRET_KEY',
  'ODEME_DONUS_URL',
  'IZINLI_KAYNAKLAR',
  'ANTHROPIC_API_KEY',
  'YZ_MODEL',
  'APPLE_ISSUER_ID',
  'APPLE_KEY_ID',
  'APPLE_PRIVATE_KEY',
  'APPLE_BUNDLE_ID',
  'GOOGLE_PACKAGE_NAME',
  'GOOGLE_SERVICE_ACCOUNT',
  'MAGAZA_BILDIRIM_ANAHTARI',
  'SENTRY_DSN',
  'ORTAM',
];
const gizliDosya = join(kok, 'supabase', '.temp', 'yayin-gizli.env');
if (uygula) {
  const { mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  mkdirSync(join(kok, 'supabase', '.temp'), { recursive: true });
  writeFileSync(
    gizliDosya,
    FONK.filter((a) => ortam[a])
      .map((a) => `${a}=${ortam[a]}`)
      .join('\n'),
  );
  try {
    calistir(
      'Fonksiyon gizli değerleri',
      `pnpm exec supabase secrets set --env-file ${JSON.stringify(gizliDosya)}`,
    );
  } finally {
    rmSync(gizliDosya, { force: true });
  }
} else
  console.log(
    `\n▶ Fonksiyon gizli değerleri\n  supabase secrets set (${FONK.filter((a) => ortam[a]).length} değer)`,
  );

// 3. Sunucu fonksiyonları (test-* hariç)
for (const f of readdirSync(join(kok, 'supabase/functions'), { withFileTypes: true })) {
  if (!f.isDirectory() || f.name.startsWith('_') || f.name.startsWith('test-')) continue;
  calistir(`Fonksiyon: ${f.name}`, `pnpm exec supabase functions deploy ${f.name}`);
}

// 4. Web: üretim ayarlarıyla derle ve Cloudflare Pages'e yükle
const web = Object.fromEntries(
  ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SENTRY_DSN'].map((a) => [a, ortam[a] ?? '']),
);
calistir('Web derleme', 'pnpm --filter @repiom/web build', { ...web, VITE_ORTAM: 'uretim' });
calistir(
  'Web yayın (Cloudflare Pages)',
  'npx wrangler pages deploy apps/web/dist --project-name repiom --branch main',
);

console.log(
  uygula
    ? '\nYayın tamamlandı. docs/yayin.md → "Yayın sonrası kontrol" adımlarını uygula.'
    : '\nKuru çalıştırma: hiçbir şey değiştirilmedi. Uygulamak için --uygula ekle.',
);
