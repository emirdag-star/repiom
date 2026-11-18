/** Çizimden maliyet (DXF): örnek çizim, dosya yükleme, kontrol ekranı, projeye aktarma. */
import AxeBuilder from '@axe-core/playwright';
import { dxf } from '@repiom/core';
import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { hakVer, kayitOl, yatayTasmaYok, yeniEposta } from './yardimci';

async function giris(page: Page) {
  await kayitOl(page, yeniEposta('cizim'));
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await hakVer(page);
}

async function tara(page: Page, yer: string) {
  const s = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(s.violations.map((v) => `${yer}: ${v.id} – ${v.help}`)).toEqual([]);
}

test('örnek çizim: kontrol ekranı, önizleme, düzeltme ve projeye aktarma', async ({ page }) => {
  await giris(page);
  await page.getByRole('link', { name: 'Örnek çizimle dene' }).click();
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByRole('heading', { name: /kontrol$/ })).toBeVisible();
  await expect(page.getByText('3 plan · 5 kat')).toBeVisible();
  await yatayTasmaYok(page, '(kontrol ekranı)');
  await tara(page, 'Katlar');

  // Plan önizlemesi worker'da çizilir.
  await page.getByRole('button', { name: 'Planı gör: ZEMİN KAT PLANI Ö:1/50' }).click();
  const resim = page.getByRole('img', { name: 'ZEMİN KAT PLANI Ö:1/50 önizlemesi' });
  await expect(resim).toBeVisible();
  expect(await resim.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(1100);

  // Mahaller: kat filtresi ve tür değişikliği
  await page.getByRole('tab', { name: 'Mahaller' }).click();
  await page.getByLabel('Kat planı').selectOption({ label: 'ZEMİN KAT PLANI Ö:1/50' });
  await expect(page.getByRole('row')).toHaveCount(20); // başlık + 19 mahal
  await expect(page.getByLabel('BANYO – duvar').first()).toHaveValue('Seramik');
  await page.getByLabel('SALON – zemin').first().selectOption('Mermer');
  await tara(page, 'Mahaller');

  await page.getByRole('tab', { name: 'Statik' }).click();
  await expect(page.getByText('48 × 10 m jet grout')).toBeVisible();

  await page.getByRole('tab', { name: /Yeni kalemler/ }).click();
  await expect(page.getByRole('cell', { name: /^Jet Grout Zemin İyileştirme/ }).first()).toBeVisible();
  await page.getByLabel(/Jet Grout .* birim fiyatı/).fill('2500');

  await page.getByRole('button', { name: 'Projeye aktar ve maliyeti hesapla' }).click();
  await expect(page).toHaveURL(/\/proje\/.+\/sonuc$/);
  await expect(page.getByTestId('toplam-kdv-haric')).toContainText('TL');
  await page.getByRole('tab', { name: 'A BLOK' }).click();
  await expect(page.getByText(/Jet Grout Zemin İyileştirme Kolonu .* \(tahmini fiyat\)/)).toBeVisible();
  await expect(page.getByLabel(/Jet Grout .* – birim fiyat/)).toHaveValue('2500');
  // Çizimden ölçülen beton elle düzeltme olarak gelir.
  await expect(page.getByLabel(/Hazır Beton.* – metraj/).first()).toHaveClass(/elle/);
});

test('dosya yükleme: başlıkta yanlış birim ve statik dosyası olmadan', async ({ page }, info) => {
  await giris(page);
  const yol = info.outputPath('mimari.dxf');
  writeFileSync(yol, dxf.exampleArchitectureDxf({ insunits: 4 }));
  await page.getByRole('link', { name: 'Çizim yükle' }).click();
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByRole('alert')).toHaveText('Mimari DXF dosyasını seç.');

  await page.getByLabel('Proje adı').fill('Yüklenen Çizim');
  await page.getByLabel('Mimari DXF (zorunlu)').setInputFiles(yol);
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(
    page.getByText(/başlığında birim "mm" yazıyor; çizim ölçülerine göre birim santimetre/),
  ).toBeVisible();
  await expect(
    page.getByText('Statik DXF yüklenmedi: beton, kalıp ve temel formülle tahmin edilir.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Projeye aktar ve maliyeti hesapla' }).click();
  await expect(page.getByRole('heading', { name: 'Yüklenen Çizim' })).toBeVisible();
});

test('mimaride aynı kat iki kez: uyarı ve hariç bırakma', async ({ page }, info) => {
  await giris(page);
  const yol = info.outputPath('iki-kez.dxf');
  writeFileSync(
    yol,
    dxf.exampleArchitectureDxf({
      katlar: [
        { baslik: '1. BODRUM KAT PLANI', plan: 'bodrum' },
        { baslik: 'ZEMİN KAT PLANI', plan: 'konut' },
        { baslik: '1-2-3. KAT PLANI', plan: 'konut' },
        { baslik: '1-2-3. KAT PLANI', plan: 'konut' },
      ],
    }),
  );
  await page.getByRole('link', { name: 'Çizim yükle' }).click();
  await page.getByLabel('Mimari DXF (zorunlu)').setInputFiles(yol);
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByText(/aynı kat iki kez çizilmiş olabilir/)).toBeVisible();
  await expect(page.getByText('4 plan · 8 kat')).toBeVisible();
  await page.getByLabel('1-2-3. KAT PLANI hesaba dahil').nth(1).uncheck();
  await expect(page.getByText(/aynı kat iki kez/)).toHaveCount(0);
  await expect(page.getByText('3 plan · 5 kat')).toBeVisible();
});

test('DXF olmayan dosyada Türkçe hata', async ({ page }, info) => {
  await giris(page);
  const yol = info.outputPath('bos.dxf');
  writeFileSync(yol, 'bu bir çizim değil\n');
  await page.getByRole('link', { name: 'Çizim yükle' }).click();
  await page.getByLabel('Mimari DXF (zorunlu)').setInputFiles(yol);
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByRole('alert')).toHaveText('Mimari dosyada kat planı başlığı bulunamadı.');
});
