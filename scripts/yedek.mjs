// Haftalık şifreli tam yedek (Supabase'in kendi günlük yedeğine EK, ayrı bir yerde saklanır).
// İçerik: roller, şema (public) ve veri (public + auth: kullanıcılar, onaylar, projeler, ödemeler, hak defteri).
// Şifreleme: gzip + AES-256-GCM, anahtar YEDEK_SIFRESI'nden scrypt ile türetilir. Şifre olmadan yedek okunamaz;
// şifre ayrı bir yerde (parola yöneticisi) saklanmalı — kaybolursa yedek açılamaz.
//
// Kullanım:
//   node scripts/yedek.mjs                       → yerel veritabanı, ./yedekler klasörüne (deneme)
//   node scripts/yedek.mjs --db "<bağlantı>"     → üretim veritabanı (Supabase panelindeki "Session pooler" adresi)
//   hedef: YEDEK_R2_HESAP, YEDEK_R2_ANAHTAR, YEDEK_R2_GIZLI, YEDEK_R2_KOVA tanımlıysa Cloudflare R2'ye (AB) yüklenir;
//   yoksa --klasor <yol> (varsayılan ./yedekler). 12 haftadan eski yedekleri R2'nin yaşam döngüsü kuralı siler.
// Gizli değerler yalnız ortam değişkeninden okunur; komut satırına ve depoya yazılmaz.
import { execSync } from 'node:child_process';
import { createCipheriv, createHash, createHmac, randomBytes, scryptSync } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const arg = (ad) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const sifre = process.env.YEDEK_SIFRESI ?? '';
if (sifre.length < 16) {
  console.error('YEDEK_SIFRESI ortam değişkeni en az 16 karakter olmalı.');
  process.exit(1);
}
const db = arg('--db');
const kok = resolve(import.meta.dirname, '..');
const gecici = mkdtempSync(join(tmpdir(), 'repiom-yedek-'));

function dok(ek, dosya) {
  const hedef = join(gecici, dosya);
  // Windows'ta pnpm bir .cmd dosyasıdır ve kabuk gerektirir; her bağımsız değişken tırnaklanır.
  const ar = ['exec', 'supabase', 'db', 'dump', ...(db ? [`--remote=${db}`] : []), ...ek, '-f', hedef];
  execSync(['pnpm', ...ar.map((a) => JSON.stringify(a))].join(' '), {
    cwd: kok,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  return readFileSync(hedef, 'utf8');
}

try {
  const parcalar = {
    roller: dok(['--role-only'], 'roller.sql'),
    sema: dok([], 'sema.sql'),
    veri: dok(['--data-only', '--use-copy', '--schema', 'public,auth'], 'veri.sql'),
  };
  const tarih = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const icerik = gzipSync(Buffer.from(JSON.stringify({ surum: 1, tarih, ...parcalar })));

  // Biçim: "RPYD1" | tuz(16) | iv(12) | şifreli | etiket(16)
  const tuz = randomBytes(16);
  const iv = randomBytes(12);
  const anahtar = scryptSync(sifre, tuz, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const c = createCipheriv('aes-256-gcm', anahtar, iv);
  const sifreli = Buffer.concat([Buffer.from('RPYD1'), tuz, iv, c.update(icerik), c.final(), c.getAuthTag()]);
  const ad = `repiom-${tarih}.rpyd`;

  if (process.env.YEDEK_R2_KOVA) {
    await r2Yukle(ad, sifreli);
    console.log(
      `Yedek R2'ye yüklendi: ${process.env.YEDEK_R2_KOVA}/${ad} (${(sifreli.length / 1048576).toFixed(1)} MB)`,
    );
  } else {
    const klasor = resolve(arg('--klasor') ?? join(kok, 'yedekler'));
    mkdirSync(klasor, { recursive: true });
    writeFileSync(join(klasor, ad), sifreli);
    console.log(`Yedek yazıldı: ${join(klasor, ad)} (${(sifreli.length / 1048576).toFixed(1)} MB)`);
  }
} finally {
  rmSync(gecici, { recursive: true, force: true });
}

/** Cloudflare R2 (S3 uyumlu) — AWS İmza Sürüm 4 ile tek PUT. */
async function r2Yukle(ad, govde) {
  const hesap = process.env.YEDEK_R2_HESAP;
  const anahtar = process.env.YEDEK_R2_ANAHTAR;
  const gizli = process.env.YEDEK_R2_GIZLI;
  const kova = process.env.YEDEK_R2_KOVA;
  if (!hesap || !anahtar || !gizli)
    throw new Error('YEDEK_R2_HESAP, YEDEK_R2_ANAHTAR ve YEDEK_R2_GIZLI gerekli.');
  const host = `${hesap}.eu.r2.cloudflarestorage.com`;
  const yol = `/${kova}/${encodeURIComponent(ad)}`;
  const simdi = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const gun = simdi.slice(0, 8);
  const ozet = createHash('sha256').update(govde).digest('hex');
  const basliklar = `host:${host}\nx-amz-content-sha256:${ozet}\nx-amz-date:${simdi}\n`;
  const imzali = 'host;x-amz-content-sha256;x-amz-date';
  const istek = ['PUT', yol, '', basliklar, imzali, ozet].join('\n');
  const kapsam = `${gun}/auto/s3/aws4_request`;
  const metin = ['AWS4-HMAC-SHA256', simdi, kapsam, createHash('sha256').update(istek).digest('hex')].join(
    '\n',
  );
  const h = (k, v) => createHmac('sha256', k).update(v).digest();
  const imza = createHmac('sha256', h(h(h(h(`AWS4${gizli}`, gun), 'auto'), 's3'), 'aws4_request'))
    .update(metin)
    .digest('hex');
  const r = await fetch(`https://${host}${yol}`, {
    method: 'PUT',
    headers: {
      'x-amz-content-sha256': ozet,
      'x-amz-date': simdi,
      Authorization: `AWS4-HMAC-SHA256 Credential=${anahtar}/${kapsam}, SignedHeaders=${imzali}, Signature=${imza}`,
    },
    body: govde,
  });
  if (!r.ok) throw new Error(`R2 yüklemesi başarısız: ${r.status} ${await r.text()}`);
}
