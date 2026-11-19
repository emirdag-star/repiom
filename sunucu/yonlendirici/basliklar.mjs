// apps/web/public/_headers (tek kaynak) → Caddy "header" yönergeleri. Docker derlemesinde çalışır.
// Kullanım: node basliklar.mjs <_headers yolu> > basliklar.caddy
import { readFileSync } from 'node:fs';

const bloklar = readFileSync(process.argv[2], 'utf8').split(/\r?\n(?=\/)/);
const yerel = process.argv.includes('--yerel');
let cikti = '# Otomatik üretildi (apps/web/public/_headers). Elle değiştirme.\n';
for (const blok of bloklar) {
  const [yol, ...satirlar] = blok.split(/\r?\n/).filter((s) => s.trim() && !s.trim().startsWith('#'));
  if (!yol?.startsWith('/')) continue;
  const b = satirlar
    .map((s) => /^\s+([\w-]+):\s*(.+)$/.exec(s))
    .filter((m) => m && !(yerel && m[1] === 'Strict-Transport-Security'))
    .map((m) => (yerel ? [m[0], m[1], m[2].replace('; upgrade-insecure-requests', '')] : m));
  cikti += `header ${yol.trim()} {\n${b.map((m) => `\t${m[1]} ${JSON.stringify(m[2])}`).join('\n')}\n}\n`;
}
process.stdout.write(cikti);
