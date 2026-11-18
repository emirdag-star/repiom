import { calculate, emptyProject, type CalculationResult } from '@repiom/core';
import { expect, test } from '@playwright/test';
import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
import { kaydedildi, tlOku, yatayTasmaYok, yeniProjeyleBasla } from './yardimci';

test('yalnız toplam inşaat alanıyla hesap: 7 adım, sonuç motorla aynı, telefonda taşma yok', async ({
  page,
}) => {
  await yeniProjeyleBasla(page, 'alan');
  await page.getByLabel('Proje adı').fill('Deneme Konutları');
  await page.getByLabel('Toplam inşaat alanı (m²)').fill('6.000');
  await kaydedildi(page);
  await yatayTasmaYok(page, '(1. adım)');

  for (const [ad, baslik] of [
    ['Daire tipleri', 'Daire tipleri'],
    ['Katlar', 'Kat bilgileri'],
    ['Diğer bilgiler', 'Diğer bilgiler'],
    ['Proje geneli', 'Proje geneli'],
    ['Özet', 'Özet'],
  ] as const) {
    await page.getByRole('button', { name: `${ad} →` }).click();
    await expect(page.getByRole('heading', { name: baslik, exact: true })).toBeVisible();
    await yatayTasmaYok(page, `(${ad})`);
  }
  await page.getByRole('button', { name: 'Maliyet hesapla' }).click();

  const beklenen = calculate(
    Object.assign(emptyProject(), { ad: 'Deneme Konutları', toplamInsaatAlani: 6000 }),
  ) as CalculationResult;
  await expect(page.getByTestId('toplam-kdv-haric')).toHaveText(
    Math.round(beklenen.ozet.piyasa).toLocaleString('tr-TR') + ' TL',
  );
  await expect(page.getByTestId('toplam-kdv-dahil')).toHaveText(
    Math.round(beklenen.ozet.piyasaKdvDahil).toLocaleString('tr-TR') + ' TL',
  );
  await yatayTasmaYok(page, '(Sonuç)');
});

test('otomatik kayıt: değişiklik yeniden yüklemede korunur, sayfa kapanırken de kaydedilir', async ({
  page,
}) => {
  const adres = await yeniProjeyleBasla(page, 'kayit');
  await page.getByLabel('Proje adı').fill('Kalıcı Proje');
  await kaydedildi(page);
  await page.reload();
  await expect(page.getByLabel('Proje adı')).toHaveValue('Kalıcı Proje');

  // Kayıt beklenmeden sayfadan çıkılır: kapanırken gönderilen istek değişikliği kaydetmeli.
  await page.getByLabel('Toplam inşaat alanı (m²)').fill('4321');
  await page.goto('about:blank');
  // Kapanırken gönderilen istek arka planda tamamlanır; değer gelene kadar sayfa yeniden açılır.
  await expect
    .poll(
      async () => {
        await page.goto(adres);
        const alan = page.getByLabel('Toplam inşaat alanı (m²)');
        await alan.waitFor();
        return alan.inputValue();
      },
      { timeout: 10_000 },
    )
    .toBe('4321');
});

test('kat ve daire detayı girilince inşaat alanı yok sayılır ve kullanıcı uyarılır', async ({ page }) => {
  await yeniProjeyleBasla(page, 'detay');
  await page.getByLabel('Toplam inşaat alanı (m²)').fill('10000');
  await page.getByRole('button', { name: 'Daire tipleri →' }).click();
  await page.getByRole('button', { name: 'Daire tipi ekle' }).click();
  await page.getByLabel('Oda düzeni').selectOption('3+1');
  await page.getByLabel('Brüt alan (m²)').fill('120');
  await page.getByRole('button', { name: 'Katlar →' }).click();
  await page.getByRole('button', { name: '+ Normal kat' }).click();
  await page.getByLabel('Kaç kez tekrar ediyor').fill('5');
  await page.getByLabel('Daire tipi').selectOption({ index: 1 });
  await page.getByLabel('Adet').fill('4');
  await page.getByRole('link', { name: /Özet/ }).click();
  await expect(page.getByText(/yerine bu kullanıldı/)).toBeVisible();
  // 5 kat × 4 daire × 120 m² × 1,12 = 2.688 m²
  await expect(page.getByRole('row', { name: /Toplam/ })).toContainText('2.688');
  await expect(page.getByRole('row', { name: /Toplam/ })).toContainText('20');
});

test('KDV oranı 0–100 dışında kabul edilmez', async ({ page }) => {
  await yeniProjeyleBasla(page, 'kdv');
  await page.getByRole('link', { name: /Proje geneli/ }).click();
  await page.getByLabel('KDV oranı (%)').fill('150');
  await expect(page.getByText('En çok 100 olabilir.')).toBeVisible();
  await page.getByLabel('KDV oranı (%)').fill('abc');
  await expect(page.getByText(/Geçerli bir sayı yaz/)).toBeVisible();
  await page.getByLabel('KDV oranı (%)').fill('10');
  await expect(page.getByText(/Geçerli bir sayı yaz|En çok/)).toHaveCount(0);
});

test('sonuç tablosu düzenlenir, "Formüle dön" geri alır; Excel ve PDF iner', async ({ page }) => {
  await yeniProjeyleBasla(page, 'sonuc');
  await page.getByLabel('Proje adı').fill('Rapor Deneme');
  await page.getByLabel('Toplam inşaat alanı (m²)').fill('6000');
  await page.getByRole('link', { name: /Sonuç/ }).click();
  const ilk = tlOku((await page.getByTestId('toplam-kdv-haric').textContent())!);

  await page.getByRole('tab', { name: 'A BLOK' }).click();
  const hucre = page.getByLabel('Kazı, Yükleme ve Nakliye – metraj');
  await hucre.fill('1');
  await hucre.press('Enter');
  await expect(hucre).toHaveClass(/elle/);
  await expect(page.getByTestId('toplam-kdv-haric')).not.toHaveText(new RegExp(`^${ilk}`));
  const duzeltilmis = tlOku((await page.getByTestId('toplam-kdv-haric').textContent())!);
  expect(duzeltilmis).toBeLessThan(ilk);
  await expect(page.getByText('1 kalemde elle düzeltme var.')).toBeVisible();

  // Excel: indirilen dosyadaki toplam ekrandakiyle aynı.
  const [excel] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Excel indir' }).click(),
  ]);
  expect(excel.suggestedFilename()).toMatch(/^REPIOM_Rapor_Deneme_\d{8}\.xlsx$/);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(readFileSync((await excel.path())!) as unknown as ArrayBuffer);
  expect(wb.worksheets.map((w) => w.name)).toEqual([
    'Özet',
    'Tüm Proje',
    'A BLOK',
    'Proje Geneli',
    'Girdiler',
  ]);
  const b11 = wb.getWorksheet('Özet')!.getCell('B11').value as { result: number };
  expect(Math.round(b11.result)).toBe(duzeltilmis);

  // PDF
  const [pdf] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'PDF indir' }).click(),
  ]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  expect(
    readFileSync((await pdf.path())!)
      .subarray(0, 5)
      .toString(),
  ).toBe('%PDF-');

  await page.getByRole('button', { name: 'Kazı, Yükleme ve Nakliye: formüle dön' }).click();
  await expect(page.getByTestId('toplam-kdv-haric')).toHaveText(ilk.toLocaleString('tr-TR') + ' TL');
  await expect(page.getByText(/kalemde elle düzeltme var/)).toHaveCount(0);
  await yatayTasmaYok(page, '(Sonuç, blok sekmesi)');
});

test('Projelerim: örnek proje, kopyalama ve onaylı silme', async ({ page }) => {
  await yeniProjeyleBasla(page, 'liste');
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Projelerim' }).click();
  await page.getByRole('button', { name: 'Örnek projeyi aç' }).click();
  await expect(page.getByLabel('Proje adı')).toHaveValue('YENİKENT SİTESİ');
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Projelerim' }).click();

  await expect(page.getByRole('link', { name: 'YENİKENT SİTESİ', exact: true })).toBeVisible();
  // Liste özeti hesaplanmış toplamı gösterir.
  await expect(page.locator('.proje-karti', { hasText: 'YENİKENT SİTESİ' }).first()).toContainText('TL');
  await yatayTasmaYok(page, '(Projelerim)');

  await page.getByRole('button', { name: 'YENİKENT SİTESİ projesini kopyala' }).click();
  await expect(page.getByRole('link', { name: 'YENİKENT SİTESİ (kopya)', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'YENİKENT SİTESİ (kopya) projesini sil' }).click();
  const pencere = page.getByRole('dialog', { name: 'Proje silinsin mi?' });
  await expect(pencere).toBeVisible();
  await pencere.getByRole('button', { name: 'Vazgeç' }).click();
  await expect(page.getByRole('link', { name: 'YENİKENT SİTESİ (kopya)', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'YENİKENT SİTESİ (kopya) projesini sil' }).click();
  await pencere.getByRole('button', { name: 'Kalıcı olarak sil' }).click();
  await expect(page.getByText('Proje silindi.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'YENİKENT SİTESİ (kopya)', exact: true })).toHaveCount(0);
});

test('başkasının projesi açılamaz', async ({ page, browser }) => {
  const adres = await yeniProjeyleBasla(page, 'sahip');
  await page.getByLabel('Proje adı').fill('Gizli Proje');
  await kaydedildi(page);
  const baska = await browser.newPage();
  await yeniProjeyleBasla(baska, 'yabanci');
  await baska.goto(adres);
  await expect(baska.getByRole('alert')).toContainText('Proje bulunamadı');
  await baska.close();
});
