/**
 * Excel ve PDF raporları cihazda üretilir (web ile aynı packages/report), önbellek klasörüne yazılır ve paylaşım
 * penceresiyle açılır (Dosyalar'a kaydet, e-posta, WhatsApp…). Web önizlemesinde dosya indirilir.
 */
import type { CalculationResult, ProjectInput } from '@repiom/core';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function base64(bayt: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bayt.length; i += 0x8000) s += String.fromCharCode(...bayt.subarray(i, i + 0x8000));
  return btoa(s);
}

async function paylas(bayt: Uint8Array, ad: string, tur: string, uti: string) {
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bayt as BlobPart], { type: tur }));
    a.download = ad;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return;
  }
  const f = new File(Paths.cache, ad);
  f.create({ overwrite: true });
  await f.write(base64(bayt), { encoding: 'base64' });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Bu cihazda dosya paylaşımı kullanılamıyor.');
  await Sharing.shareAsync(f.uri, { mimeType: tur, UTI: uti, dialogTitle: ad });
}

export async function excelPaylas(s: CalculationResult, p: ProjectInput) {
  const { buildExcel, reportFileName } = await import('@repiom/report');
  const b = await buildExcel(s, p);
  await paylas(
    new Uint8Array(b as unknown as ArrayBuffer),
    reportFileName(p, 'xlsx'),
    EXCEL,
    'org.openxmlformats.spreadsheetml.sheet',
  );
}

export async function pdfPaylas(s: CalculationResult, p: ProjectInput) {
  const [{ buildPdfDefinition, reportFileName }, pdfMakeMod, vfsMod] = await Promise.all([
    import('@repiom/report'),
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  const pm = ((pdfMakeMod as { default?: unknown }).default ?? pdfMakeMod) as {
    addVirtualFileSystem: (v: unknown) => void;
    createPdf: (d: unknown) => { getBuffer: () => Promise<Uint8Array> };
  };
  pm.addVirtualFileSystem((vfsMod as { default?: unknown }).default ?? vfsMod);
  const b = await pm.createPdf(buildPdfDefinition(s, p)).getBuffer();
  await paylas(new Uint8Array(b), reportFileName(p, 'pdf'), 'application/pdf', 'com.adobe.pdf');
}
