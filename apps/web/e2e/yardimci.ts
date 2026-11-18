import { expect, type Page } from '@playwright/test';

export const SIFRE = 'DenemeSifre123';

export function yeniEposta(etiket: string): string {
  return `e2e-${etiket}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@ornek.test`;
}

export async function kayitOl(page: Page, eposta: string, sifre = SIFRE) {
  await page.goto('/kayit');
  await page.getByLabel('E-posta', { exact: true }).fill(eposta);
  await page.getByLabel('Şifre', { exact: true }).fill(sifre);
  await page.getByLabel('Şifre (tekrar)').fill(sifre);
  await page.getByRole('checkbox', { name: /Kullanıcı Sözleşmesi/ }).check();
  await page.getByRole('checkbox', { name: /KVKK Aydınlatma Metni/ }).check();
  await page.getByRole('button', { name: 'Kayıt ol' }).click();
}

export async function girisYap(page: Page, eposta: string, sifre = SIFRE) {
  await page.goto('/giris');
  await page.getByLabel('E-posta', { exact: true }).fill(eposta);
  await page.getByLabel('Şifre').fill(sifre);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
}

export async function cikisYap(page: Page) {
  await page.getByRole('button', { name: 'Çıkış yap' }).click();
  await expect(page.getByRole('heading', { name: 'Giriş yap' })).toBeVisible();
}

export async function yatayTasmaYok(page: Page, yer = '') {
  const tasma = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(tasma, `sayfa yatayda taşmamalı ${yer}`).toBeLessThanOrEqual(0);
}

/** Yeni hesap açar ve Projelerim'de boş bir proje oluşturur; proje adresini döner. */
export async function yeniProjeyleBasla(page: Page, etiket: string): Promise<string> {
  await kayitOl(page, yeniEposta(etiket));
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await page.getByRole('button', { name: 'Yeni proje' }).click();
  await expect(page.getByRole('heading', { name: 'Proje bilgileri' })).toBeVisible();
  return page.url();
}

export async function kaydedildi(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: /^Kaydedildi$/ })).toBeVisible({ timeout: 10_000 });
}

/** "1.234.567 TL" → 1234567 */
export const tlOku = (s: string) => Number(s.replace(/[^\d,]/g, '').replace(',', '.'));
