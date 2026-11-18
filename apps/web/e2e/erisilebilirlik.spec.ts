import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { yeniProjeyleBasla } from './yardimci';

/** WCAG 2.1 A/AA kurallarıyla otomatik tarama (axe-core). */
async function tara(page: Page, yer: string) {
  const sonuc = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const ihlaller = sonuc.violations.map(
    (v) =>
      `${yer}: ${v.id} (${v.impact}) – ${v.help} → ${v.nodes
        .map((n) => n.target.join(' '))
        .slice(0, 3)
        .join(', ')}`,
  );
  expect(ihlaller).toEqual([]);
}

test('giriş ve kayıt ekranları', async ({ page }) => {
  await page.goto('/giris');
  await tara(page, 'Giriş');
  await page.goto('/kayit');
  await page.getByRole('button', { name: 'Kayıt ol' }).click(); // hata mesajları görünürken
  await tara(page, 'Kayıt (hatalı)');
});

test('Projelerim ve 7 adım', async ({ page }) => {
  await yeniProjeyleBasla(page, 'axe');
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Projelerim' }).click();
  await page.getByRole('button', { name: 'Örnek projeyi aç' }).click();
  await expect(page.getByLabel('Proje adı')).toHaveValue('YENİKENT SİTESİ');
  for (const adim of [
    'proje',
    'daire-tipleri',
    'katlar',
    'diger-bilgiler',
    'proje-geneli',
    'ozet',
    'sonuc',
  ]) {
    await page.goto(page.url().replace(/\/proje\/([^/]+)\/[^/?]+/, `/proje/$1/${adim}`));
    await expect(page.getByRole('navigation', { name: 'Hesap adımları' })).toBeVisible();
    await tara(page, adim);
  }
  await page.getByRole('tab', { name: 'A BLOK' }).click();
  await tara(page, 'sonuç / blok sekmesi');
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Projelerim' }).click();
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await tara(page, 'Projelerim');
});
