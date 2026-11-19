/** Mobil uygulama (telefon görünümü): kayıt, proje akışı, çizim analizi, sahte mağazadan satın alma, hesap. */
import { expect, test } from '@playwright/test';
import { kayitOl, sql, tara, yatayTasmaYok } from './yardimci';

test('kayıt → örnek proje → düzenleme → sonuç', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Giriş yap' })).toBeVisible();
  await tara(page, 'giriş');
  await kayitOl(page);
  await tara(page, 'Projelerim');
  await page.getByRole('button', { name: 'Örnek projeyi aç' }).click();
  const alan = page.getByRole('textbox', { name: 'Toplam inşaat alanı (m²)' });
  await expect(alan).toBeVisible();
  await alan.fill('5.000');
  await expect(page.getByText('Kaydedildi')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('tab', { name: '7. Sonuç' }).click();
  await expect(page.getByTestId('toplam-kdv-haric')).toContainText('TL');
  await expect(page.getByText('5.000 m² · 24 daire')).toBeVisible();
  await yatayTasmaYok(page, 'sonuç');
  await tara(page, 'sonuç');
  // Blok sekmesinde elle düzeltme ve "Formüle dön"
  await page.getByRole('tab', { name: 'A BLOK' }).click();
  await page.getByRole('button', { name: /^▸ 1\./ }).click();
  const hucre = page.getByRole('textbox', { name: /– metraj$/ }).first();
  await hucre.fill('123');
  await hucre.blur();
  await expect(page.getByRole('button', { name: /formüle dön/ }).first()).toBeVisible();
});

test('örnek çizim: kontrol ekranı, önizleme ve projeye aktarma (hak düşmez)', async ({ page }) => {
  await kayitOl(page);
  await page.getByRole('button', { name: 'Örnek çizimle dene' }).click();
  await expect(page.getByText('Örnek çizimle deneme ücretsizdir; analiz hakkından düşmez.')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Yapay zekâ kontrolü/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByText('3 plan · 5 kat')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Planı gör: ZEMİN KAT PLANI Ö:1/50' }).click();
  await expect(page.getByRole('img', { name: 'ZEMİN KAT PLANI Ö:1/50 önizlemesi' })).toBeVisible();
  await yatayTasmaYok(page, 'kontrol');
  await tara(page, 'kontrol');
  await page.getByRole('tab', { name: /Yeni kalemler/ }).click();
  await page
    .getByRole('textbox', { name: /Jet Grout .* birim fiyatı/ })
    .first()
    .fill('2500');
  await page.getByRole('button', { name: 'Projeye aktar ve maliyeti hesapla' }).click();
  await expect(page.getByRole('tab', { name: '1. Proje' })).toBeVisible();
  await page.getByRole('tab', { name: '7. Sonuç' }).click();
  await expect(page.getByTestId('toplam-kdv-haric')).toContainText('TL');
});

test('paketler: sahte mağazadan satın alma hak verir; hesap izinleri', async ({ page }) => {
  sql("update public.paketler set fiyat = 450, aktif = true where id = 'ek_analiz'");
  await kayitOl(page);
  await page.getByRole('tab', { name: 'Paketler' }).click();
  await expect(page.getByTestId('kalan-hak')).toHaveText('0');
  await expect(
    page.getByText('Deneme kipi: satın almalar sahte mağazada yapılır, gerçek ücret alınmaz.'),
  ).toBeVisible();
  await tara(page, 'paketler');
  await page.getByRole('button', { name: 'Ek analiz satın al' }).click();
  await expect(page.getByText('Satın alma doğrulandı; analiz hakların tanımlandı.')).toBeVisible();
  await expect(page.getByTestId('kalan-hak')).toHaveText('1');
  await expect(page.getByText(/Mağaza \(App Store \/ Google Play\) · Onaylandı/)).toBeVisible();

  await page.getByRole('tab', { name: 'Hesap' }).click();
  await expect(page.getByTestId('izin-acik_riza_yurtdisi')).toContainText('İzin yok');
  await page.getByRole('button', { name: /^İzin ver: Açık Rıza Metni/ }).click();
  await expect(page.getByTestId('izin-acik_riza_yurtdisi')).toContainText('İzin verildi');
  await tara(page, 'hesap');
});
