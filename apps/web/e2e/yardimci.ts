import { expect, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

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

/** Yerel Supabase anahtarları (yalnız test; `supabase status`). */
function yerelAnahtarlar(): { url: string; servis: string } {
  // Playwright apps/web klasöründe çalışır; Supabase yapılandırması deponun kökünde.
  const cikti = execSync('pnpm exec supabase status -o env', {
    cwd: resolve(process.cwd(), '..', '..'),
    encoding: 'utf8',
  });
  const al = (k: string) => (new RegExp(`^${k}="?([^"\n]*)"?`, 'm').exec(cikti) ?? [])[1] ?? '';
  return { url: al('API_URL'), servis: al('SERVICE_ROLE_KEY') };
}
let anahtarlar: { url: string; servis: string } | null = null;

/** Testteki oturum açık kullanıcıya analiz hakkı tanımlar (hizmet rolüyle, doğrudan hak defterine). */
export async function hakVer(page: Page, miktar = 5) {
  anahtarlar ??= yerelAnahtarlar();
  const id = await page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.endsWith('-auth-token'))!;
    return (JSON.parse(localStorage.getItem(k)!) as { user: { id: string } }).user.id;
  });
  const r = await fetch(`${anahtarlar.url}/rest/v1/hak_hareketleri`, {
    method: 'POST',
    headers: {
      apikey: anahtarlar.servis,
      Authorization: `Bearer ${anahtarlar.servis}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      kullanici: id,
      miktar,
      gecerlilik: new Date(Date.now() + 30 * 864e5).toISOString(),
      kaynak: 'yonetici',
      aciklama: 'Test',
    }),
  });
  expect(r.ok, await r.text()).toBe(true);
}
