/**
 * LibreOffice ile Excel dosyasını yeniden hesaplatır.
 * Önce PATH'teki `soffice` denenir (CI'da apt ile kurulur), yoksa `repiom-libreoffice` Docker imajı.
 * Dosya önbellek değeri olmadan (yalnız formül) yazıldığı için tüm değerleri LibreOffice kendisi hesaplar.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type Runner = { kind: 'local' } | { kind: 'docker' } | null;

function detect(): Runner {
  try {
    execFileSync('soffice', ['--version'], { stdio: 'ignore' });
    return { kind: 'local' };
  } catch {
    /* yok */
  }
  try {
    execFileSync('docker', ['image', 'inspect', 'repiom-libreoffice'], { stdio: 'ignore' });
    return { kind: 'docker' };
  } catch {
    return null;
  }
}

export const runner = detect();

/** xlsx baytlarını LibreOffice'te açıp yeniden kaydeder; yeniden hesaplanmış dosyanın baytlarını döner. */
export function recalculate(files: Record<string, Uint8Array>): Record<string, Uint8Array> {
  if (!runner) throw new Error('LibreOffice bulunamadı.');
  const dir = mkdtempSync(join(tmpdir(), 'repiom-lo-'));
  const out = join(dir, 'out');
  mkdirSync(out);
  const names = Object.keys(files);
  names.forEach((n) => writeFileSync(join(dir, n), files[n]!));
  const args = ['--headless', '--norestore', '--convert-to', 'xlsx', '--outdir'];
  if (runner.kind === 'local') {
    execFileSync('soffice', [...args, out, ...names.map((n) => join(dir, n))], {
      stdio: 'ignore',
      timeout: 180_000,
    });
  } else {
    execFileSync(
      'docker',
      [
        'run',
        '--rm',
        '-v',
        `${dir}:/w`,
        'repiom-libreoffice',
        '--convert-to',
        'xlsx',
        '--outdir',
        '/w/out',
        ...names.map((n) => '/w/' + n),
      ],
      { stdio: 'ignore', timeout: 180_000 },
    );
  }
  return Object.fromEntries(names.map((n) => [n, new Uint8Array(readFileSync(join(out, n)))]));
}
