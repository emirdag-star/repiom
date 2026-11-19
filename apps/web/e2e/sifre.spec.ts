/** Şifremi unuttum: Türkçe sıfırlama e-postası (yerel posta yakalayıcı), yeni şifre, yeni şifreyle giriş. */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { cikisYap, girisYap, kayitOl, yeniEposta } from './yardimci';

const POSTA = 'http://127.0.0.1:55324/api/v1';

async function sonBaglanti(eposta: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const l = (await (
      await fetch(`${POSTA}/search?query=${encodeURIComponent(`to:"${eposta}"`)}`)
    ).json()) as {
      messages: { ID: string; Subject: string }[];
    };
    const m = l.messages.find((x) => /şifre sıfırlama/.test(x.Subject));
    if (m) {
      const html = ((await (await fetch(`${POSTA}/message/${m.ID}`)).json()) as { HTML: string }).HTML;
      return /href="([^"]+)"/.exec(html)![1]!.replace(/&amp;/g, '&');
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Sıfırlama e-postası gelmedi.');
}

test('şifremi unuttum → e-posta → yeni şifre → yeni şifreyle giriş', async ({ page }) => {
  const eposta = yeniEposta('sifre');
  await kayitOl(page, eposta);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await cikisYap(page);

  await page.getByRole('link', { name: 'Şifremi unuttum' }).click();
  await expect(page.getByRole('heading', { name: 'Şifremi unuttum' })).toBeVisible();
  const s = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(s.violations.map((v) => v.id)).toEqual([]);
  await page.getByLabel('E-posta').fill(eposta);
  await page.getByRole('button', { name: 'Sıfırlama bağlantısı gönder' }).click();
  await expect(page.getByRole('status')).toContainText('şifre sıfırlama bağlantısı gönderdik');

  await page.goto(await sonBaglanti(eposta));
  await expect(page.getByRole('heading', { name: 'Yeni şifre' })).toBeVisible();
  await page
    .locator('input')
    .and(page.getByLabel('Yeni şifre', { exact: true }))
    .fill('YeniSifre456');
  await page.getByLabel('Yeni şifre (tekrar)').fill('YeniSifre999');
  await page.getByRole('button', { name: 'Şifreyi değiştir' }).click();
  await expect(page.getByText('Şifreler aynı değil.')).toBeVisible();
  await page.getByLabel('Yeni şifre (tekrar)').fill('YeniSifre456');
  await page.getByRole('button', { name: 'Şifreyi değiştir' }).click();
  await expect(page.getByText('Şifren değiştirildi.')).toBeVisible();
  await cikisYap(page);

  await girisYap(page, eposta, 'YeniSifre456');
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
});

test('bilinmeyen e-postada da aynı yanıt (hesap varlığı sızdırılmaz); geçersiz bağlantı', async ({
  page,
}) => {
  await page.goto('/sifremi-unuttum');
  await page.getByLabel('E-posta').fill(yeniEposta('yok'));
  await page.getByRole('button', { name: 'Sıfırlama bağlantısı gönder' }).click();
  await expect(page.getByRole('status')).toContainText('Bu adresle kayıtlı bir hesap varsa');
  await page.goto('/sifre-yenile');
  await expect(page.getByRole('alert')).toContainText('Sıfırlama bağlantısı geçersiz ya da süresi dolmuş');
});
