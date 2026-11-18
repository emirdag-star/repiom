/**
 * Çizim analizinin yapay zekâ adımı — SAHTE Claude servisiyle (supabase/functions/test-claude).
 * Rıza, gizlilik (proje adı ve pafta başlıkları gönderilmez), en çok 8 not, fiyat tahmini ve rızasız akış.
 */
import AxeBuilder from '@axe-core/playwright';
import { dxf } from '@repiom/core';
import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { hakVer, kayitOl, yatayTasmaYok, yeniEposta } from './yardimci';

const GIZLI_AD = 'GİZLİ PROJE ADI 4711';

async function yukle(page: Page, dizin: (ad: string) => string, yz: boolean) {
  await kayitOl(page, yeniEposta('yz'));
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await hakVer(page);
  const c = dxf.exampleDrawings();
  writeFileSync(dizin('mimari.dxf'), c.mimari);
  writeFileSync(dizin('statik.dxf'), c.statik);
  await page.getByRole('link', { name: 'Çizim yükle' }).click();
  await page.getByLabel('Proje adı').fill(GIZLI_AD);
  await page.getByLabel('Mimari DXF (zorunlu)').setInputFiles(dizin('mimari.dxf'));
  await page.getByLabel(/^Statik DXF/).setInputFiles(dizin('statik.dxf'));
  const kutu = page.getByRole('checkbox', { name: 'Yapay zekâ kontrolü de yapılsın (isteğe bağlı)' });
  await expect(kutu).not.toBeChecked(); // varsayılan kapalı
  if (yz) await kutu.check();
}

test('rızayla: yazısız görseller ve özet gider, notlar ve fiyat tahmini gelir', async ({ page }, info) => {
  await yukle(page, (a) => info.outputPath(a), true);
  const istek = page.waitForRequest((r) => r.url().endsWith('/functions/v1/dxf-yz'));
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByRole('heading', { name: /kontrol$/ })).toBeVisible();

  // İstemcinin gönderdiği: yalnız yazısız PNG'ler + izinli özet; proje adı ve pafta başlıkları yok.
  const govde = (await istek).postDataJSON() as { gorseller: string[]; ozet: unknown; il: string };
  expect(govde.gorseller).toHaveLength(3);
  govde.gorseller.forEach((g) => expect(g.startsWith('iVBORw0KGgo')).toBe(true));
  const metin = JSON.stringify(govde.ozet);
  expect(metin).not.toContain('GİZLİ');
  expect(metin).not.toMatch(/PLAN|Ö:1\/50|KALIP/);

  const yz = page.getByRole('region', { name: 'Yapay zekâ kontrolü' });
  await expect(yz.getByRole('listitem')).toHaveCount(8); // sahte servis 10 not döner, sunucu 8'e indirir
  await expect(yz).toContainText('3 plan görseli incelendi');
  await yatayTasmaYok(page, '(yapay zekâ notları)');
  const s = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(s.violations.map((v) => `${v.id} – ${v.help}`)).toEqual([]);

  // Sunucunun ilettiği sorgu da gizli: sahte servisin gördüğü son istek.
  const son = (await (await fetch('http://127.0.0.1:55321/functions/v1/test-claude/son-istek')).json()) as {
    model: string;
    metin: string;
  };
  expect(son.model).toBe('claude-sonnet-5-5');
  expect(son.metin).not.toContain('GİZLİ');
  expect(son.metin).not.toMatch(/KAT PLANI|KALIP PLANI/);

  // Fiyat tahmini yeni kaleme uygulanır.
  await page.getByRole('tab', { name: /Yeni kalemler/ }).click();
  await expect(page.getByLabel(/Jet Grout .* birim fiyatı/).first()).toHaveValue('2345');
  await expect(page.getByText(/Yapay zekâ tahmini: Sahte tahmin\./).first()).toBeVisible();

  // Rıza kaydedildi: Hesabım'da görünür.
  await page.getByRole('button', { name: 'Projeye aktar ve maliyeti hesapla' }).click();
  await expect(page).toHaveURL(/\/proje\/.+\/sonuc$/);
  await page.goto('/hesap');
  await expect(page.getByTestId('izin-acik_riza_yurtdisi')).toContainText('İzin verildi');
});

test('rızasız: yapay zekâ çağrılmaz, varsayılan tahmini fiyat kalır', async ({ page }, info) => {
  await yukle(page, (a) => info.outputPath(a), false);
  let cagrildi = false;
  page.on('request', (r) => {
    if (r.url().includes('/functions/v1/dxf-yz')) cagrildi = true;
  });
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByRole('heading', { name: /kontrol$/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Yapay zekâ kontrolü' })).toHaveCount(0);
  await page.getByRole('tab', { name: /Yeni kalemler/ }).click();
  await expect(page.getByLabel(/Jet Grout .* birim fiyatı/).first()).toHaveValue(
    String(dxf.ESTIMATES.jetGrout),
  );
  expect(cagrildi).toBe(false);
});

test('örnek çizimle denemede yapay zekâ seçeneği yok', async ({ page }) => {
  await kayitOl(page, yeniEposta('yz-ornek'));
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await page.getByRole('link', { name: 'Örnek çizimle dene' }).click();
  await expect(page.getByRole('button', { name: 'Analizi başlat' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Yapay zekâ kontrolü/ })).toHaveCount(0);
});
