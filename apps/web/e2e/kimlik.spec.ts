import { expect, test, type Page } from '@playwright/test';

const SIFRE = 'DenemeSifre123';

/** Her test kendi kurgusal hesabını açar; testler birbirini etkilemez. */
function yeniEposta(etiket: string): string {
  return `e2e-${etiket}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@ornek.test`;
}

async function kayitOl(page: Page, eposta: string, sifre = SIFRE) {
  await page.goto('/kayit');
  await page.getByLabel('E-posta').fill(eposta);
  await page.getByLabel('Şifre', { exact: true }).fill(sifre);
  await page.getByLabel('Şifre (tekrar)').fill(sifre);
  await page.getByRole('button', { name: 'Kayıt ol' }).click();
}

async function girisYap(page: Page, eposta: string, sifre = SIFRE) {
  await page.goto('/giris');
  await page.getByLabel('E-posta').fill(eposta);
  await page.getByLabel('Şifre').fill(sifre);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
}

async function cikisYap(page: Page) {
  await page.getByRole('button', { name: 'Çıkış yap' }).click();
  await expect(page.getByRole('heading', { name: 'Giriş yap' })).toBeVisible();
}

async function yatayTasmaYok(page: Page) {
  const tasma = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(tasma, 'sayfa yatayda taşmamalı').toBeLessThanOrEqual(0);
}

test('oturum yokken korunan sayfa giriş ekranına yönlendirir', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/giris$/);
  await expect(page.getByRole('heading', { name: 'Giriş yap' })).toBeVisible();
  await yatayTasmaYok(page);
});

test('boş formda Türkçe doğrulama mesajları görünür', async ({ page }) => {
  await page.goto('/kayit');
  await page.getByRole('button', { name: 'Kayıt ol' }).click();
  await expect(page.getByText('E-posta adresini yaz.')).toBeVisible();
  await expect(page.getByText('Şifre en az 8 karakter olmalı.')).toBeVisible();
  await yatayTasmaYok(page);
});

test('kayıt, çıkış ve yeniden giriş çalışır', async ({ page }) => {
  const eposta = yeniEposta('kayit');
  await kayitOl(page, eposta);

  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await expect(page.getByText('Henüz projen yok')).toBeVisible();
  await yatayTasmaYok(page);

  await cikisYap(page);

  await girisYap(page, eposta);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();

  // Sayfa yenilenince oturum korunur.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
});

test('hatalı şifrede Türkçe hata mesajı görünür', async ({ page }) => {
  const eposta = yeniEposta('hatali');
  await kayitOl(page, eposta);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await cikisYap(page);

  await girisYap(page, eposta, 'YanlisSifre999');
  await expect(page.getByRole('alert')).toHaveText('E-posta ya da şifre hatalı.');
});

test('aynı e-postayla ikinci kayıt engellenir', async ({ page }) => {
  const eposta = yeniEposta('cift');
  await kayitOl(page, eposta);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await cikisYap(page);

  await kayitOl(page, eposta);
  await expect(page.getByRole('alert')).toContainText('zaten var');
});

test('yönetici olmayan kullanıcı yönetici ekranını göremez', async ({ page }) => {
  await kayitOl(page, yeniEposta('normal'));
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Yönetici' })).toHaveCount(0);
  await page.goto('/yonetici');
  await expect(page.getByText('Bu sayfayı görmek için yönetici yetkisi gerekir.')).toBeVisible();
});

test('yönetici listesindeki e-posta yönetici ekranını görür', async ({ page }) => {
  // supabase/seed.sql içindeki yer tutucu yönetici. Hesap yoksa açılır, varsa giriş yapılır.
  const eposta = 'yonetici@repiom.test';
  const projelerim = page.getByRole('heading', { name: 'Projelerim' });
  // Masaüstü ve telefon testleri aynı anda çalışabilir: hesap yoksa açılır, yarışta biri kaybederse giriş yapılır.
  for (let deneme = 0; deneme < 3 && !(await projelerim.isVisible()); deneme++) {
    await (deneme % 2 === 0 ? girisYap(page, eposta) : kayitOl(page, eposta));
    await expect(projelerim.or(page.getByRole('alert'))).toBeVisible();
  }
  await expect(projelerim).toBeVisible();
  await page.getByRole('link', { name: 'Yönetici' }).click();
  await expect(page.getByRole('heading', { name: 'Fiyat listeleri' })).toBeVisible();
});
