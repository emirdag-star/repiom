/** PDF raporu: belge tanımı içeriği ve Node'da gerçek PDF üretimi. */
import { calculate, exampleProject, type CalculationResult } from '@repiom/core';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPdfDefinition, REPORT_TITLE } from '../src';

const require = createRequire(import.meta.url);

const p = exampleProject();
const s = calculate(p) as CalculationResult;

describe('PDF raporu', () => {
  const def = buildPdfDefinition(s, p, { tarih: '01.01.2026' });
  const text = JSON.stringify(def.content);

  it('kapak, özet ve tablolar var', () => {
    expect(text).toContain(REPORT_TITLE);
    expect(text).toContain('YENİKENT SİTESİ');
    expect(text).toContain('Yaklaşık Maliyet Raporu');
    expect(text).toContain('"Özet"');
    expect(text).toContain('Tüm Proje Yaklaşık Maliyet Tablosu');
    for (const b of s.bloklar) expect(text).toContain(`${b.ad} Yaklaşık Maliyet Tablosu`);
    expect(text).toContain('Proje Geneli Giderler');
    // Toplam, Türkçe sayı biçimiyle.
    expect(text).toContain(Math.round(s.ozet.piyasa).toLocaleString('tr-TR') + ' TL');
  });

  it('Node ortamında geçerli bir PDF üretilir', async () => {
    // pdfmake'in sunucu tarafı: Roboto yazı tipi Türkçe karakterleri içerir.
    const pdfmake = require('pdfmake');
    const fonts = join(dirname(require.resolve('pdfmake/package.json')), 'build', 'fonts', 'Roboto');
    pdfmake.setFonts({
      Roboto: {
        normal: join(fonts, 'Roboto-Regular.ttf'),
        bold: join(fonts, 'Roboto-Medium.ttf'),
        italics: join(fonts, 'Roboto-Italic.ttf'),
        bolditalics: join(fonts, 'Roboto-MediumItalic.ttf'),
      },
    });
    pdfmake.setUrlAccessPolicy(() => false);
    const buffer: Buffer = await pdfmake.createPdf(def).getBuffer();
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(20_000);
  }, 60_000);
});
