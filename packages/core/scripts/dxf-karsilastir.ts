/**
 * Gerçek çizimle elle doğrulama: aynı DXF'i prototip (reference/dxf.js) ve yeni kodla analiz edip farkları yazar.
 * Çizim yalnız bu bilgisayarda okunur; hiçbir yere gönderilmez ve depoya eklenmez.
 *
 *   pnpm dxf:karsilastir <mimari.dxf> [statik.dxf]
 */
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { calculate, dxf, type CalculationResult, type ProjectInput } from '../src';

const [mimariYol, statikYol] = process.argv.slice(2);
if (!mimariYol || !existsSync(mimariYol) || (statikYol && !existsSync(statikYol))) {
  console.error('Kullanım: pnpm dxf:karsilastir <mimari.dxf> [statik.dxf]  (dosya bulunamadı)');
  process.exit(1);
}
const SEC = { katYuksekligi: 3, donatiKgM3: 110, il: 'İstanbul' };
const ctx: Record<string, unknown> = { TextDecoder };
runInNewContext(readFileSync(join(import.meta.dirname, '..', 'reference', 'dxf.js'), 'utf8'), ctx);
type Legacy = {
  oku: (it: AsyncIterable<Uint8Array>) => Promise<unknown>;
  analiz: (
    a: string,
    m: unknown,
    s: unknown,
    o: unknown,
  ) => { hata?: string; mimari: unknown; statik: unknown; proje: ProjectInput };
};
const L = ctx.REPIOM_DXF as Legacy;
const akis = (yol: string) => createReadStream(yol) as unknown as AsyncIterable<Uint8Array>;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const tl = (x: number) => Math.round(x).toLocaleString('tr-TR') + ' TL';

function farklar(a: unknown, b: unknown, yol: string, out: string[]) {
  if (out.length >= 25) return;
  if (typeof a === 'number' && typeof b === 'number') {
    if (Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a))) out.push(`${yol}: prototip ${a} / yeni ${b}`);
    return;
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    if (a !== b) out.push(`${yol}: prototip ${JSON.stringify(a)} / yeni ${JSON.stringify(b)}`);
    return;
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
    farklar((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${yol}.${k}`, out);
}

const t0 = performance.now();
const dm = await dxf.readDxf(akis(mimariYol));
const ds = statikYol ? await dxf.readDxf(akis(statikYol)) : null;
const t1 = performance.now();
const yeni = dxf.analyzeDrawings(dm, ds);
const eski = L.analiz(
  'Karşılaştırma',
  await L.oku(akis(mimariYol)),
  statikYol ? await L.oku(akis(statikYol)) : null,
  SEC,
);
if (yeni.hata !== undefined || eski.hata) {
  console.log('Prototip:', eski.hata ?? 'tamam', '| Yeni:', yeni.hata ?? 'tamam');
  process.exit(eski.hata === yeni.hata ? 0 : 1);
}
const pYeni = dxf.projectFromAnalysis(yeni, 'Karşılaştırma', SEC);
const sYeni = calculate(pYeni) as CalculationResult;
const sEski = calculate(eski.proje) as CalculationResult;
console.log(
  `Okuma: ${((t1 - t0) / 1000).toFixed(1)} sn · ${dm.L.length + (ds?.L.length ?? 0)} çizgi, ${dm.T.length + (ds?.T.length ?? 0)} yazı`,
);
console.log(
  `Birim: ölçülerden ${yeni.birim.mimari}${yeni.birim.statik ? ' / statik ' + yeni.birim.statik : ''}, dosya başlığında ${yeni.birim.baslik}`,
);
console.log(
  `Kat planı: ${yeni.mimari.katlar.length} · mahal: ${yeni.mimari.katlar.reduce((s, k) => s + k.mahaller.length, 0)} · kalıp planı: ${yeni.statik.planlar.filter((p) => !p.kopya).length}`,
);
console.log(`Toplam maliyet (KDV hariç): prototip ${tl(sEski.ozet.piyasa)} · yeni ${tl(sYeni.ozet.piyasa)}`);
for (const u of dxf.analysisWarnings(yeni)) console.log('Uyarı:', u);
const out: string[] = [];
farklar(plain(eski.mimari), plain(yeni.mimari), 'mimari', out);
farklar(plain(eski.statik), plain(yeni.statik), 'statik', out);
farklar(plain(eski.proje), plain(pYeni), 'proje', out);
if (!out.length) console.log('SONUÇ: prototiple birebir aynı.');
else {
  console.log(
    `SONUÇ: ${out.length >= 25 ? '25+' : out.length} fark bulundu${yeni.birim.mimari !== 'cm' ? " (çizim cm değil; yeni kod ölçüleri cm'ye çevirir, prototip çevirmez)" : ''}:`,
  );
  out.forEach((f) => console.log('  ' + f));
  process.exit(1);
}
