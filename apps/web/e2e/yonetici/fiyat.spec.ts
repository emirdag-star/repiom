/**
 * Yönetici fiyat listesi akışı. Yayındaki listeyi değiştirdiği için diğer testlerden SONRA, tek başına çalışır
 * (playwright.config.ts → "yonetici" projesi) ve sonunda eski sürümü geri yayına alır.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import { readFileSync, writeFileSync } from 'node:fs';
import { girisYap, kaydedildi, kayitOl, tlOku } from '../yardimci';

const YONETICI = 'yonetici@repiom.test'; // supabase/seed.sql

async function yoneticiOl(page: Page) {
  await girisYap(page, YONETICI);
  const projelerim = page.getByRole('heading', { name: 'Projelerim' });
  await expect(projelerim.or(page.getByRole('alert'))).toBeVisible();
  if (!(await projelerim.isVisible())) await kayitOl(page, YONETICI);
  await expect(projelerim).toBeVisible();
}

test('fiyat tablosu indir → doldur → yükle → farkları gör → yayınla → eski sürüme dön', async ({
  page,
}, info) => {
  await yoneticiOl(page);

  // Mevcut listeyle hesaplanan bir proje.
  await page.getByRole('button', { name: 'Yeni proje' }).click();
  await page.getByLabel('Proje adı').fill('Fiyat Deneme');
  await page.getByLabel('Toplam inşaat alanı (m²)').fill('6000');
  await kaydedildi(page);
  const projeAdresi = page.url();
  await page.getByRole('link', { name: /Sonuç/ }).click();
  const ilkToplam = tlOku((await page.getByTestId('toplam-kdv-haric').textContent())!);

  // Yönetici: yayındaki sürüm
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Yönetici' }).click();
  await expect(page.getByRole('heading', { name: 'Yayındaki fiyat listesi' })).toBeVisible();
  const eskiSurum = await page
    .getByRole('row')
    .filter({ hasText: 'Yayında' })
    .getByRole('cell')
    .first()
    .textContent();

  // Excel olmayan dosya
  const bozuk = info.outputPath('bozuk.xlsx');
  writeFileSync(bozuk, 'excel değil');
  await page.getByLabel('Doldurulmuş güncelleme tablosu (.xlsx)').setInputFiles(bozuk);
  await expect(page.getByRole('alert')).toContainText('Dosya okunamadı');

  // Tabloyu indir ve doldur: K001 iki katına, bilinmeyen bir kod ve hatalı değer.
  const [indirme] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Güncelleme tablosunu indir (Excel)' }).click(),
  ]);
  expect(indirme.suggestedFilename()).toMatch(/^REPIOM_Fiyat_Guncelleme_\d{4}-\d{2}-\d{2}\.xlsx$/);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(readFileSync((await indirme.path())!) as unknown as ArrayBuffer);
  const ws = wb.getWorksheet('Birim Fiyatlar')!;
  let eskiFiyat = 0;
  ws.eachRow((row) => {
    if (row.getCell(1).value === 'K001') {
      eskiFiyat = row.getCell(6).value as number;
      row.getCell(8).value = eskiFiyat * 2;
    }
    if (row.getCell(1).value === 'K002') row.getCell(8).value = 'çok';
  });
  expect(eskiFiyat).toBeGreaterThan(0);
  const dolu = info.outputPath('dolu.xlsx');
  writeFileSync(dolu, new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer));
  await page.getByLabel('Doldurulmuş güncelleme tablosu (.xlsx)').setInputFiles(dolu);

  await expect(page.getByText('1 kalemde fiyat değişiyor')).toBeVisible();
  await expect(page.getByText(/K002: "çok" geçerli bir fiyat değil/)).toBeVisible();
  const fark = page.getByRole('row').filter({ hasText: 'K001' });
  await expect(fark).toContainText('+100,0%');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  await page.getByLabel('Sürüm açıklaması').fill('E2E iki kat kazı');
  await page.getByRole('button', { name: 'Yeni sürüm olarak kaydet ve yayınla' }).click();
  await expect(page.getByText(/Sürüm \d+ yayında\. Yeni projeler/)).toBeVisible();
  await expect(page.getByText('E2E iki kat kazı').first()).toBeVisible();

  // Proje eski listeyle kalır; kullanıcı onaylarsa güncel fiyatlara geçer.
  await page.goto(projeAdresi.replace(/\/proje$/, '/sonuc'));
  await expect(page.getByText(/Daha yeni bir liste yayında/)).toBeVisible();
  await expect(page.getByTestId('toplam-kdv-haric')).toHaveText(ilkToplam.toLocaleString('tr-TR') + ' TL');
  await page.getByRole('button', { name: 'Güncel fiyatlarla yeniden hesapla' }).click();
  await expect(page.getByText(/Daha yeni bir liste yayında/)).toHaveCount(0);
  await expect(page.getByTestId('toplam-kdv-haric')).not.toHaveText(
    ilkToplam.toLocaleString('tr-TR') + ' TL',
  );
  expect(tlOku((await page.getByTestId('toplam-kdv-haric').textContent())!)).toBeGreaterThan(ilkToplam);
  await kaydedildi(page);

  // Eski sürüme dön.
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Yönetici' }).click();
  await page.getByRole('button', { name: `Sürüm ${eskiSurum!.trim()}'i yayına al` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yayına al' }).click();
  await expect(page.getByText(`Sürüm ${eskiSurum!.trim()} yayında.`)).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Yayında' }).getByRole('cell').first()).toHaveText(
    eskiSurum!.trim(),
  );
});

test('yönetici olmayan kullanıcı fiyat listesi yayınlayamaz (sunucu reddeder)', async ({ page }) => {
  await kayitOl(page, `e2e-fiyat-${Date.now()}@ornek.test`);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  const sonuc = await page.evaluate(async () => {
    const anahtar = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'))!;
    const oturum = JSON.parse(localStorage.getItem(anahtar)!) as { access_token: string };
    const url =
      (window as unknown as { __SUPABASE_URL__?: string }).__SUPABASE_URL__ ?? 'http://127.0.0.1:55321';
    const r = await fetch(`${url}/rest/v1/rpc/fiyat_listesi_ekle_yayinla`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: oturum.access_token,
        Authorization: `Bearer ${oturum.access_token}`,
      },
      body: JSON.stringify({ p_aciklama: 'saldırı', p_fiyatlar: { K001: 1 } }),
    });
    return { durum: r.status, govde: await r.text() };
  });
  expect(sonuc.durum).toBe(403);
  expect(sonuc.govde).toContain('yönetici yetkisi');
});
