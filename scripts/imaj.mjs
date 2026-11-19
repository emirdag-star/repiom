// Sunucu imajlarını derler ve (istenirse) registry.sargin.me'ye gönderir.
//   node scripts/imaj.mjs              → derle: registry.sargin.me/repiom/{db,fonksiyonlar,yonlendirici}:<SURUM> ve :latest
//   node scripts/imaj.mjs --gonder     → derle + gönder (önce bir kez: docker login registry.sargin.me)
//   --surum <etiket>                   → etiket (varsayılan: git kısa özeti; çalışma alanı kirliyse "-kirli" eki)
// İmajlar ortamdan bağımsızdır: adres ve anahtarlar sunucudaki .env'den çalışma anında gelir; imajda gizli değer yok.
import { execFileSync, execSync } from 'node:child_process';
import { resolve } from 'node:path';

const kok = resolve(import.meta.dirname, '..');
const arg = (ad) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const git = (...a) => execFileSync('git', a, { cwd: kok, encoding: 'utf8' }).trim();
const kirli = git('status', '--porcelain') !== '';
const surum = arg('--surum') ?? `${git('rev-parse', '--short=10', 'HEAD')}${kirli ? '-kirli' : ''}`;
if (!/^[\w.-]{1,64}$/.test(surum)) {
  console.error('Geçersiz sürüm etiketi.');
  process.exit(1);
}
const gonder = process.argv.includes('--gonder');
if (gonder && kirli) {
  console.error(
    "Kaydedilmemiş değişiklik var: gönderilecek imaj bir commit'e karşılık gelmeli. Önce commit et.",
  );
  process.exit(1);
}

const KAYIT = 'registry.sargin.me/repiom';
const IMAJLAR = ['db', 'fonksiyonlar', 'yonlendirici'];
const calistir = (komut, ortam = {}) => {
  console.log(`▶ ${komut}`);
  execSync(komut, { cwd: resolve(kok, 'sunucu'), stdio: 'inherit', env: { ...process.env, ...ortam } });
};

// Derleme yalnız compose'daki build tanımlarını kullanır; .env gerekmez (gerekli değişkenler boş geçilir).
const sahte = {
  SURUM: surum,
  POSTGRES_PASSWORD: 'x',
  JWT_SECRET: 'x',
  ANON_KEY: 'x',
  SERVICE_ROLE_KEY: 'x',
  SITE_URL: 'x',
};
calistir('docker compose build db functions yonlendirici', sahte);
for (const i of IMAJLAR) calistir(`docker tag ${KAYIT}/${i}:${surum} ${KAYIT}/${i}:latest`);

if (gonder) {
  for (const i of IMAJLAR) {
    calistir(`docker push ${KAYIT}/${i}:${surum}`);
    calistir(`docker push ${KAYIT}/${i}:latest`);
  }
  console.log(
    `\nGönderildi. Sunucuda .env → SURUM=${surum}, sonra: docker compose pull && docker compose up -d`,
  );
} else {
  console.log(
    `\nDerlendi: ${IMAJLAR.map((i) => `${KAYIT}/${i}:${surum}`).join(', ')}\nGöndermek için: --gonder`,
  );
}
