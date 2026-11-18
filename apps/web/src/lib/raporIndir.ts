/**
 * Excel ve PDF raporlarını tarayıcıda üretip indirir. Rapor kütüphaneleri büyük olduğu için
 * yalnız düğmeye basılınca yüklenir.
 */
import type { CalculationResult, ProjectInput } from '@repiom/core';

function indir(veri: BlobPart, ad: string, tur: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([veri], { type: tur }));
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

export async function excelIndir(s: CalculationResult, p: ProjectInput) {
  const { buildExcel, reportFileName } = await import('@repiom/report');
  const bytes = await buildExcel(s, p);
  indir(
    bytes as BlobPart,
    reportFileName(p, 'xlsx'),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}

export async function pdfIndir(s: CalculationResult, p: ProjectInput) {
  const [{ buildPdfDefinition, reportFileName }, pdfMakeMod, vfsMod] = await Promise.all([
    import('@repiom/report'),
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  const pdfMake = (pdfMakeMod as { default?: unknown }).default ?? pdfMakeMod;
  const vfs = (vfsMod as { default?: unknown }).default ?? vfsMod;
  const pm = pdfMake as {
    addVirtualFileSystem: (v: unknown) => void;
    createPdf: (d: unknown) => { getBuffer: () => Promise<Uint8Array> };
  };
  pm.addVirtualFileSystem(vfs);
  const buffer = await pm.createPdf(buildPdfDefinition(s, p)).getBuffer();
  indir(buffer as BlobPart, reportFileName(p, 'pdf'), 'application/pdf');
}
