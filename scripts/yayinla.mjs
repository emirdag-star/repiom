// Kendi sunucumuza yayın: imajlar registry.sargin.me'de; sunucuda yalnız compose.yaml, geri-yukle.sh ve .env.
// VARSAYILAN: kuru çalıştırma — yalnız adımları yazar. Uygulamak için:
//   node scripts/yayinla.mjs --ssh <kullanici@sunucu> [--dizin /opt/repiom] --uygula
// Önkoşullar (docs/yayin.md): bu bilgisayarda `docker login registry.sargin.me`; sunucuda Docker,
// `docker login registry.sargin.me` (yalnız okuma yetkili hesap) ve <dizin>/.env (anahtar-uret.mjs ile).
// Gizli değerler yalnız sunucudaki .env'de durur; imajlarda gizli değer yoktur.
import { execFileSync, execSync } from 'node:child_process';
import { resolve } from 'node:path';

const kok = resolve(import.meta.dirname, '..');
const arg = (ad, varsayilan) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : varsayilan;
};
const uygula = process.argv.includes('--uygula');
const ssh = arg('--ssh');
const dizin = arg('--dizin', '/opt/repiom');
if (!ssh || !/^[\w.-]+@[\w.-]+$/.test(ssh) || !/^\/[\w./-]+$/.test(dizin)) {
  console.error(
    'Kullanım: node scripts/yayinla.mjs --ssh <kullanici@sunucu> [--dizin /opt/repiom] [--uygula]',
  );
  process.exit(1);
}
const git = (...a) => execFileSync('git', a, { cwd: kok, encoding: 'utf8' }).trim();
const surum = git('rev-parse', '--short=10', 'HEAD');
const uzak = (komut) => `ssh ${ssh} ${JSON.stringify(`cd ${dizin} && ${komut}`)}`;
const calistir = (ad, komut) => {
  console.log(`\n▶ ${ad}\n  ${komut}`);
  if (uygula) execSync(komut, { cwd: kok, stdio: 'inherit' });
};

if (uygula && (git('branch', '--show-current') !== 'main' || git('status', '--porcelain'))) {
  console.error('Yayın yalnız temiz main dalından yapılır.');
  process.exit(1);
}

calistir(
  'Testler ve depo denetimi (bu bilgisayarda)',
  'pnpm lint && pnpm typecheck && pnpm test && node scripts/yayin-denetimi.mjs --yalniz-kod',
);
calistir(`İmajları derle ve gönder (sürüm ${surum})`, 'node scripts/imaj.mjs --gonder');
calistir(
  'Sunucu dosyalarını gönder',
  `scp sunucu/compose.yaml sunucu/geri-yukle.sh sunucu/.env.example scripts/yayin-denetimi.mjs ${ssh}:${dizin}/`,
);
calistir(
  'Sunucu ayarlarını denetle (.env; değerler yazdırılmaz)',
  uzak(
    `docker run --rm -v ${dizin}:/d:ro -w /d node:24-alpine node yayin-denetimi.mjs --yalniz-ortam --ortam .env`,
  ),
);
calistir(
  'Önce anlık yedek (sürekli yedeğe ek)',
  uzak('docker compose exec -T yedekci yedek --type=incr backup || true'),
);
calistir(
  'Sürümü ayarla, imajları çek, başlat (migration otomatik)',
  uzak(
    `(grep -q '^SURUM=' .env && sed -i 's/^SURUM=.*/SURUM=${surum}/' .env || echo 'SURUM=${surum}' >> .env) && chmod +x geri-yukle.sh && docker compose pull && docker compose up -d --no-build`,
  ),
);
calistir('Durum', uzak('docker compose ps'));

console.log(
  uygula
    ? `\nYayın tamamlandı (sürüm ${surum}). docs/yayin.md → "Yayın sonrası kontrol" adımlarını uygula.`
    : '\nKuru çalıştırma: hiçbir şey değiştirilmedi. Uygulamak için --uygula ekle.',
);
