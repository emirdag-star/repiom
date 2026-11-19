// Kendi sunucumuza yayın (Türkiye'deki sunucu, Docker Compose). VARSAYILAN: kuru çalıştırma — yalnız adımları yazar.
// Gerçekten uygulamak için: node scripts/yayinla.mjs --ssh <kullanici@sunucu> [--dizin /opt/repiom] --uygula
// Önkoşullar (docs/yayin.md → "Sunucunun ilk kurulumu"): sunucuda Docker, /opt/repiom.git çıplak depo ve
// /opt/repiom çalışma kopyası, sunucu/.env (anahtar-uret.mjs ile); bu bilgisayarda `git remote add sunucu ...`.
// Kod GitHub'a gitmez: doğrudan SSH ile sunucudaki depoya gönderilir. Gizli değerler yalnız sunucudaki .env'de durur.
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const kok = resolve(import.meta.dirname, '..');
const arg = (ad, varsayilan) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : varsayilan;
};
const uygula = process.argv.includes('--uygula');
const ssh = arg('--ssh');
const dizin = arg('--dizin', '/opt/repiom');
if (!ssh || !/^[\w.-]+@[\w.-]+$/.test(ssh)) {
  console.error(
    'Kullanım: node scripts/yayinla.mjs --ssh <kullanici@sunucu> [--dizin /opt/repiom] [--uygula]',
  );
  process.exit(1);
}
const uzak = (komut) => `ssh ${ssh} ${JSON.stringify(`cd ${dizin} && ${komut}`)}`;
const calistir = (ad, komut) => {
  console.log(`\n▶ ${ad}\n  ${komut}`);
  if (uygula) execSync(komut, { cwd: kok, stdio: 'inherit' });
};

if (uygula) {
  const dal = execSync('git branch --show-current', { cwd: kok, encoding: 'utf8' }).trim();
  const kirli = execSync('git status --porcelain', { cwd: kok, encoding: 'utf8' }).trim();
  if (dal !== 'main' || kirli) {
    console.error('Yayın yalnız temiz main dalından yapılır.');
    process.exit(1);
  }
}

calistir('Testler (bu bilgisayarda)', 'pnpm lint && pnpm typecheck && pnpm test');
calistir('Kodu sunucuya gönder (SSH)', 'git push sunucu main');
calistir('Sunucuda kodu güncelle', uzak('git pull --ff-only'));
// Denetim sunucudaki .env ile, sunucuda (Node kurulu olmasa da) Docker içinde çalışır; değerler yazdırılmaz.
calistir(
  'Yayın denetimi (sunucuda)',
  uzak(
    `docker run --rm -v ${dizin}:/d:ro -w /d node:24-alpine node scripts/yayin-denetimi.mjs --ortam sunucu/.env`,
  ),
);
calistir(
  'Önce anlık yedek (sürekli yedeğe ek)',
  uzak('cd sunucu && docker compose exec -T yedekci yedek --type=incr backup'),
);
calistir('Derle ve başlat (migration otomatik)', uzak('cd sunucu && docker compose up -d --build'));
calistir('Durum', uzak('cd sunucu && docker compose ps'));

console.log(
  uygula
    ? '\nYayın tamamlandı. docs/yayin.md → "Yayın sonrası kontrol" adımlarını uygula.'
    : '\nKuru çalıştırma: hiçbir şey değiştirilmedi. Uygulamak için --uygula ekle.',
);
