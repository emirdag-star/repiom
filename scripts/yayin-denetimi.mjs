// Yayın öncesi denetim: üretime çıkmadan önce kapatılması gereken eksikleri listeler. Hiçbir yere bağlanmaz.
// Kullanım: node scripts/yayin-denetimi.mjs [--ortam <üretim ortam dosyası>]
//   --ortam: üretim değişkenlerinin bulunduğu dosya (depoda DEĞİL; ör. C:\gizli\repiom.uretim.env). Değerler yazdırılmaz.
// Çıkış kodu: engelleyici eksik varsa 1.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const kok = resolve(import.meta.dirname, '..');
const sonuc = [];
const kontrol = (tamam, baslik, aciklama, engelleyici = true) =>
  sonuc.push({ tamam, baslik, aciklama, engelleyici });
const oku = (y) => readFileSync(join(kok, y), 'utf8');

/* 1. Depoda gizli bilgi yok */
const izlenen = execFileSync('git', ['ls-files'], { cwd: kok, encoding: 'utf8' }).split('\n').filter(Boolean);
const yasakDosya = izlenen.filter((f) =>
  /(^|\/)\.env(\.|$)(?!example)|anahtarlar\.json$|kurulum\.ps1$|\.dxf$|\.pkl$|\.rpyd$/i.test(f),
);
kontrol(!yasakDosya.length, 'Depoda gizli dosya / çizim yok', yasakDosya.join(', ') || 'temiz');
const desen =
  /sk-ant-[a-z0-9-]{20,}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|"private_key":\s*"-----|AKIA[0-9A-Z]{16}|sbp_[a-f0-9]{30,}/i;
const sizinti = izlenen.filter(
  (f) =>
    !/\.(png|jpg|ico|ttf|woff2?|xlsx|pdf)$|pnpm-lock\.yaml$/.test(f) &&
    existsSync(join(kok, f)) &&
    desen.test(readFileSync(join(kok, f), 'utf8')),
);
kontrol(!sizinti.length, 'Kodda anahtar / özel anahtar kalıbı yok', sizinti.join(', ') || 'temiz');

/* 2. Hukuki metinler ve şirket bilgileri */
const belgeler = oku('packages/core/src/legal/belgeler.ts');
const yerTutucu = (belgeler.match(/'\[[^\]]+\][^']*'|TR\[00/g) ?? []).length;
kontrol(
  yerTutucu === 0,
  'Şirket bilgileri girildi (unvan, MERSİS, adres, KEP, IBAN…)',
  `${yerTutucu} yer tutucu var: packages/core/src/legal/belgeler.ts → SIRKET`,
);
const avukat = (belgeler.match(/\[AVUKAT/g) ?? []).length + (belgeler.match(/taslak/gi) ?? []).length;
kontrol(
  avukat === 0,
  'Hukuki metinler avukat onaylı (TASLAK / [AVUKAT] notu yok)',
  `${avukat} taslak işareti var`,
);

/* 3. Sunucu fonksiyonları: test fonksiyonları yayınlanmaz */
const fonksiyonlar = readdirSync(join(kok, 'supabase/functions'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
  .map((d) => d.name);
const testler = fonksiyonlar.filter((f) => f.startsWith('test-'));
kontrol(
  true,
  'Yayınlanacak fonksiyonlar',
  fonksiyonlar.filter((f) => !f.startsWith('test-')).join(', ') + ` (yayınlanmayacak: ${testler.join(', ')})`,
  false,
);

/* 4. Üretim ortam değişkenleri */
const i = process.argv.indexOf('--ortam');
const ZORUNLU = {
  web: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SENTRY_DSN'],
  mobil: [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'EXPO_PUBLIC_SENTRY_DSN',
    'EXPO_PUBLIC_WEB_URL',
  ],
  fonksiyon: [
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
  ],
};
if (i > 0) {
  const metin = readFileSync(process.argv[i + 1], 'utf8');
  const d = Object.fromEntries(
    metin
      .split(/\r?\n/)
      .map((s) => /^([A-Z0-9_]+)=(.*)$/.exec(s.trim()))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
  for (const [grup, adlar] of Object.entries(ZORUNLU)) {
    const eksik = adlar.filter((a) => !d[a]);
    kontrol(
      !eksik.length,
      `Üretim değişkenleri (${grup})`,
      eksik.length ? `eksik: ${eksik.join(', ')}` : 'tamam',
    );
  }
  const sahte = Object.keys(d).filter(
    (a) => /^SAHTE_|SAHTE_MAGAZA|_BASE_URL$/.test(a) || /test-(iyzico|claude|magaza)|sahte/i.test(d[a]),
  );
  kontrol(!sahte.length, 'Üretimde sahte servis ayarı yok', sahte.join(', ') || 'temiz');
  kontrol(
    !/localhost|127\.0\.0\.1/.test(metin),
    'Üretim adreslerinde localhost yok',
    /localhost|127\.0\.0\.1/.test(metin) ? 'localhost geçiyor' : 'temiz',
  );
  kontrol(
    (d.MAGAZA_BILDIRIM_ANAHTARI ?? '').length >= 32,
    'Mağaza bildirim anahtarı en az 32 karakter',
    'rastgele üret',
  );
  kontrol(
    d.YZ_MODEL === 'claude-sonnet-5-5',
    'Yapay zekâ modeli claude-sonnet-5-5',
    d.YZ_MODEL ?? 'tanımsız',
  );
} else {
  kontrol(false, 'Üretim ortam dosyası denetlenmedi', '--ortam <dosya> ile çalıştır (dosya depoda tutulmaz)');
}

/* 5. Mobil yapılandırma */
const app = JSON.parse(oku('apps/mobile/app.json')).expo;
kontrol(
  app.ios?.bundleIdentifier === app.android?.package,
  'Mobil paket kimliği iOS ve Android’de aynı',
  `${app.ios?.bundleIdentifier}`,
  false,
);
kontrol(existsSync(join(kok, 'apps/mobile/eas.json')), 'EAS derleme profilleri var', 'apps/mobile/eas.json');

/* Rapor */
let engel = 0;
for (const s of sonuc) {
  if (!s.tamam && s.engelleyici) engel++;
  console.log(
    `${s.tamam ? '✔' : s.engelleyici ? '✖' : '•'} ${s.baslik}${s.aciklama ? ` — ${s.aciklama}` : ''}`,
  );
}
console.log(engel ? `\n${engel} engelleyici eksik var; yayına çıkılmamalı.` : '\nEngelleyici eksik yok.');
process.exit(engel ? 1 : 0);
