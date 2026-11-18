/** Kod ile veritabanı arasındaki tutarlılık: örnek çizim parmak izleri ve belge sürümleri. */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BELGELER, dxf } from '../src';

const migrations = readdirSync(join(__dirname, '..', '..', '..', 'supabase', 'migrations'))
  .map((f) => readFileSync(join(__dirname, '..', '..', '..', 'supabase', 'migrations', f), 'utf8'))
  .join('\n');

describe('kod ↔ veritabanı tutarlılığı', () => {
  it('ücretsiz deneme çiziminin parmak izleri veritabanında kayıtlı', () => {
    const o = dxf.exampleDrawings();
    for (const s of [o.mimari, o.statik])
      expect(migrations).toContain(createHash('sha256').update(s, 'utf8').digest('hex'));
  });
  it('her belgenin güncel sürümü belge_surumleri tablosunda', () => {
    for (const [id, b] of Object.entries(BELGELER)) expect(migrations).toContain(`('${id}', '${b.surum}'`);
  });
});
