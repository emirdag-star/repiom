import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

export const SIFRE = 'DenemeSifre123';
export const yeniEposta = (e: string) =>
  `e2e-mobil-${e}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@ornek.test`;

/** Uygulama tek sayfa: derin bağlantı yerine kökten açılıp içeride gezinilir. */
export async function kayitOl(page: Page, eposta = yeniEposta('kayit')) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Kayıt ol' }).click();
  await page.getByRole('textbox', { name: 'E-posta' }).fill(eposta);
  await page.getByRole('textbox', { name: 'Şifre', exact: true }).fill(SIFRE);
  await page.getByRole('textbox', { name: 'Şifre (tekrar)' }).fill(SIFRE);
  await page.getByRole('checkbox', { name: /Kullanıcı Sözleşmesi/ }).click();
  await page.getByRole('checkbox', { name: /KVKK/ }).click();
  await page.getByRole('button', { name: 'Kayıt ol' }).click();
  await expect(page.getByRole('button', { name: 'Yeni proje' })).toBeVisible();
  return eposta;
}

export async function tara(page: Page, yer: string) {
  const s = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(
    s.violations.map(
      (v) => `${yer}: ${v.id} – ${v.help} · ${v.nodes.map((n) => n.html.slice(0, 140)).join(' | ')}`,
    ),
  ).toEqual([]);
}

export async function yatayTasmaYok(page: Page, yer: string) {
  const t = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(t, `yatay taşma ${yer}`).toBeLessThanOrEqual(0);
}

/** Yerel veritabanında (yalnız test) SQL çalıştırır. */
export function sql(komut: string) {
  execFileSync(
    'docker',
    ['exec', 'supabase_db_repiom', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', komut],
    {
      stdio: 'pipe',
    },
  );
}
