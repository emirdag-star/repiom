/** Yönetici kullanım panosu: çerezsiz sayaçlar ve türetilen sayılar görünür; erişilebilir. */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { girisYap, kayitOl } from '../yardimci';

const YONETICI = 'yonetici@repiom.test';

test('kullanım panosu: adım hunisi ve toplamlar', async ({ page }) => {
  await girisYap(page, YONETICI);
  const projelerim = page.getByRole('heading', { name: 'Projelerim' });
  await expect(projelerim.or(page.getByRole('alert'))).toBeVisible();
  if (!(await projelerim.isVisible())) await kayitOl(page, YONETICI);
  // Bir adım ziyareti sayaca eklenir.
  await page.getByRole('button', { name: 'Yeni proje' }).click();
  await expect(page.getByRole('heading', { name: 'Proje bilgileri' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Yönetici' }).click();
  await expect(page.getByRole('heading', { name: 'Kullanım', exact: true })).toBeVisible();
  await expect(page.getByTestId('kullanim-proje')).not.toHaveText('0');
  await expect(
    page.getByRole('list', { name: 'Adımlara ulaşma sayıları' }).getByRole('listitem').first(),
  ).not.toContainText(/\s0$/);
  const s = await new AxeBuilder({ page })
    .include('section[aria-labelledby="kullanim-baslik"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(s.violations.map((v) => `${v.id} – ${v.help}`)).toEqual([]);
});
