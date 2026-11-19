// Sunucu için rastgele gizli değerler ve Supabase anahtarları (anon / service_role JWT) üretir.
// Kullanım (sunucuda, sunucu/ klasöründe): node anahtar-uret.mjs > .env   → sonra boş kalan alanları doldur.
// Çıktı ekrana/dosyaya yazılır; hiçbir yere gönderilmez. Var olan .env'in üzerine YAZMA (anahtarlar değişirse
// oturumlar ve mobil uygulamadaki anahtar geçersiz olur).
import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

const rastgele = (n) => randomBytes(n).toString('base64url');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (rol, gizli) => {
  const simdi = Math.floor(Date.now() / 1000);
  const govde = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ role: rol, iss: 'supabase', iat: simdi, exp: simdi + 10 * 365 * 86400 })}`;
  return `${govde}.${createHmac('sha256', gizli).update(govde).digest('base64url')}`;
};

const JWT_SECRET = rastgele(48);
const uretilen = {
  POSTGRES_PASSWORD: rastgele(32),
  JWT_SECRET,
  ANON_KEY: jwt('anon', JWT_SECRET),
  SERVICE_ROLE_KEY: jwt('service_role', JWT_SECRET),
  PG_META_CRYPTO_KEY: rastgele(32),
  MAGAZA_BILDIRIM_ANAHTARI: rastgele(32),
  YEDEK_SIFRESI: rastgele(32),
};
const sablon = readFileSync(new URL('./.env.example', import.meta.url), 'utf8');
process.stdout.write(
  sablon.replace(/^([A-Z0-9_]+)=(.*)$/gm, (s, ad) => (ad in uretilen ? `${ad}=${uretilen[ad]}` : s)),
);
