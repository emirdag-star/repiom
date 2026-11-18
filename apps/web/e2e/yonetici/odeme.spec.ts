/**
 * Ödeme, haklar ve hukuk: paket fiyatı, havale + yönetici onayı, kartla ödeme (sahte iyzico), hak düşme,
 * cayma, izinler, verilerimi indir, hesap silme. Paket fiyatlarını değiştirdiği için "yonetici" projesinde çalışır.
 */
import { dxf } from '@repiom/core';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { cikisYap, girisYap, kayitOl, yeniEposta } from '../yardimci';

const YONETICI = 'yonetici@repiom.test';
test.describe.configure({ mode: 'serial' });

async function yoneticiSayfasi(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await girisYap(page, YONETICI);
  const projelerim = page.getByRole('heading', { name: 'Projelerim' });
  await expect(projelerim.or(page.getByRole('alert'))).toBeVisible();
  if (!(await projelerim.isVisible())) await kayitOl(page, YONETICI);
  await expect(projelerim).toBeVisible();
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Yönetici' }).click();
  await expect(page.getByRole('heading', { name: 'Bekleyen ödemeler' })).toBeVisible();
  return page;
}

/** Kalan hak: sayfa yeniden yüklenir (sunucudaki güncel değer okunur). */
const kalan = async (page: Page) => {
  await page.goto('/paketler');
  await expect(page.getByTestId('kalan-hak')).toBeVisible();
  return Number(await page.getByTestId('kalan-hak').textContent());
};

async function faturaVeSozlesme(page: Page) {
  await page.getByLabel('Ad soyad / unvan').fill('Deneme Kullanıcı');
  await page.getByLabel('TC kimlik no / vergi no').fill('12345678901');
  await page.getByLabel('Fatura adresi').fill('Örnek Mahallesi 1. Sokak No: 1');
  await page.getByRole('checkbox', { name: /Ön Bilgilendirme Formu/ }).check();
  await page.getByRole('checkbox', { name: /Mesafeli Satış Sözleşmesi/ }).check();
}

let kullanici = '';

test('yönetici paket fiyatlarını girer; fiyatlanan paketler satışa çıkar', async ({ browser }) => {
  const y = await yoneticiSayfasi(browser);
  await y.getByLabel('Başlangıç (aylık) fiyatı (TL)').fill('500');
  await y.getByRole('button', { name: 'Başlangıç (aylık) paketini kaydet' }).click();
  await expect(y.getByText('Başlangıç (aylık) güncellendi.')).toBeVisible();
  await y.getByLabel('Ek analiz fiyatı (TL)').fill('150');
  await y.getByRole('button', { name: 'Ek analiz paketini kaydet' }).click();
  await expect(y.getByText('Ek analiz güncellendi.')).toBeVisible();
  await y.close();
});

test('havale: bildirim → hak yokken analiz yapılamaz → yönetici onayı → analiz hak düşürür', async ({
  page,
  browser,
}, info) => {
  kullanici = yeniEposta('odeme');
  await kayitOl(page, kullanici);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  expect(await kalan(page)).toBe(0);
  await expect(page.getByRole('heading', { name: 'Profesyonel (aylık)' })).toHaveCount(0); // fiyatı 0

  // Hak yokken gerçek çizim analizi: çizim okunur ama kontrol ekranı açılmaz.
  const yol = info.outputPath('m.dxf');
  writeFileSync(yol, dxf.exampleArchitectureDxf());
  await page.goto('/cizim');
  await page.getByLabel('Mimari DXF (zorunlu)').setInputFiles(yol);
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByRole('alert')).toContainText('Analiz hakkın kalmadı');
  await expect(page.getByRole('link', { name: 'Paketlere git' })).toBeVisible();

  // Örnek çizimle deneme yine ücretsiz.
  await page.goto('/cizim?ornek=1');
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByRole('heading', { name: /kontrol$/ })).toBeVisible();

  // Havale bildirimi
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Paketler' }).click();
  await page.getByRole('button', { name: 'Başlangıç (aylık) satın al' }).click();
  await page.getByLabel('Havale / EFT').check();
  await page.getByRole('button', { name: 'Havale bildirimi oluştur' }).click();
  await expect(page.getByRole('alert')).toContainText('ad soyad ya da unvan');
  await faturaVeSozlesme(page);
  await page.getByRole('button', { name: 'Havale bildirimi oluştur' }).click();
  const referans = (await page.getByTestId('havale-referans').textContent())!;
  expect(referans).toMatch(/^RP[0-9A-F]{8}$/);
  await expect(page.getByText(/TR\[00/)).toBeVisible(); // IBAN (yer tutucu)
  await page.getByRole('button', { name: 'Tamam' }).click();
  await expect(page.getByRole('row', { name: new RegExp(referans) })).toContainText('Onay bekliyor');

  // Yönetici onaylar
  const y = await yoneticiSayfasi(browser);
  await y.getByRole('button', { name: `${referans}: Onayla` }).click();
  await y.getByRole('dialog').getByRole('button', { name: 'Onayla ve hak tanımla' }).click();
  await expect(y.getByText(`${referans} onaylandı; hak tanımlandı.`)).toBeVisible();
  await y.close();

  expect(await kalan(page)).toBe(2);
  await expect(page.getByRole('row', { name: new RegExp(referans) })).toContainText('Onaylandı');

  // Gerçek analiz 1 hak düşer
  await page.goto('/cizim');
  await page.getByLabel('Mimari DXF (zorunlu)').setInputFiles(yol);
  await page.getByRole('button', { name: 'Analizi başlat' }).click();
  await expect(page.getByRole('heading', { name: /kontrol$/ })).toBeVisible();
  expect(await kalan(page)).toBe(1);
});

test('kartla ödeme (sahte iyzico): başarılı ödeme hak verir, reddedilen vermez; cayma talebi ve yönetici kararı', async ({
  page,
  browser,
}) => {
  await girisYap(page, kullanici);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  const once = await kalan(page);

  // Reddedilen kart
  await page.getByRole('button', { name: 'Ek analiz satın al' }).click();
  await faturaVeSozlesme(page);
  await page.getByRole('button', { name: 'Ödemeye geç' }).click();
  await expect(page.getByRole('heading', { name: 'Sahte iyzico ödeme sayfası' })).toBeVisible();
  await page.getByRole('button', { name: 'Kart reddedildi' }).click();
  await expect(page).toHaveURL(/\/paketler\?odeme=hata/);
  await expect(page.getByRole('alert')).toContainText('Ödeme tamamlanamadı');
  expect(Number(await page.getByTestId('kalan-hak').textContent())).toBe(once);

  // Başarılı kart, 2 adet
  await page.getByRole('button', { name: 'Ek analiz satın al' }).click();
  await page.getByLabel('Adet').fill('2');
  await faturaVeSozlesme(page);
  await expect(page.getByText('Ödenecek tutar: 300 TL')).toBeVisible();
  await page.getByRole('button', { name: 'Ödemeye geç' }).click();
  await expect(page.getByText('Tutar: 300.00 TL')).toBeVisible();
  await page.getByRole('button', { name: 'Ödemeyi tamamla' }).click();
  await expect(page).toHaveURL(/\/paketler\?odeme=tamam/);
  await expect(page.getByText('Ödemen alındı; analiz hakların tanımlandı.')).toBeVisible();
  await expect(page.getByTestId('kalan-hak')).toHaveText(String(once + 2));

  // Cayma: kullanılmamış paket, 14 gün içinde
  const satir = page.getByRole('row').filter({ hasText: 'Kart' }).filter({ hasText: 'Onaylandı' }).first();
  const referans = (await satir.getByRole('cell').nth(4).textContent())!;
  await satir.getByRole('button', { name: 'Cayma talebi' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cayma talebi oluştur' }).click();
  await expect(page.getByText(/Cayma talebin alındı/)).toBeVisible();
  await expect(page.getByTestId('kalan-hak')).toHaveText(String(once));
  await expect(page.getByRole('row', { name: new RegExp(referans) })).toContainText(
    'Cayma talebi inceleniyor',
  );

  const y = await yoneticiSayfasi(browser);
  await y.getByRole('button', { name: `${referans}: İade edildi` }).click();
  await y.getByRole('dialog').getByRole('button', { name: 'İade edildi olarak işaretle' }).click();
  await expect(y.getByText(`${referans} iade edildi olarak işaretlendi.`)).toBeVisible();
  await y.close();
  await page.reload();
  await expect(page.getByRole('row', { name: new RegExp(referans) })).toContainText('İade edildi');
});

test('hesap ayarları: izinler, verilerimi indir, silme talebi → kilit → yönetici onayıyla silinir', async ({
  page,
  browser,
}) => {
  await girisYap(page, kullanici);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Hesap' }).click();
  // Kayıtta isteğe bağlı izinler işaretlenmedi.
  await expect(page.getByTestId('izin-acik_riza_yurtdisi')).toContainText('İzin yok');
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Açık Rıza' })
    .getByRole('button', { name: 'İzin ver' })
    .click();
  await expect(page.getByTestId('izin-acik_riza_yurtdisi')).toContainText('İzin verildi');
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Açık Rıza' })
    .getByRole('button', { name: 'İzni geri al' })
    .click();
  await expect(page.getByTestId('izin-acik_riza_yurtdisi')).toContainText('İzin yok');

  const [indirme] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Verilerimi indir' }).click(),
  ]);
  const veri = JSON.parse(readFileSync((await indirme.path())!, 'utf8'));
  expect(veri.hesap.eposta).toBe(kullanici);
  expect(veri.onaylar.map((o: { belge: string }) => o.belge)).toEqual(
    expect.arrayContaining(['kullanici_sozlesmesi', 'kvkk_aydinlatma', 'on_bilgilendirme', 'mesafeli_satis']),
  );
  expect(veri.odemeler.length).toBeGreaterThanOrEqual(3);

  await page.getByRole('button', { name: 'Hesabımı silmek istiyorum' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Silme talebi oluştur' }).click();
  await expect(
    page.getByText('Hesap silme talebin yönetici onayı bekliyor. Hesabın bu süre içinde kilitli.'),
  ).toBeVisible();
  // Kilitliyken yeni proje açılamaz.
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Projelerim' }).click();
  await page.getByRole('button', { name: 'Yeni proje' }).click();
  await expect(page.getByRole('alert')).toContainText('yetkin yok');

  const y = await yoneticiSayfasi(browser);
  await y.getByRole('button', { name: `${kullanici} hesabını sil` }).click();
  await y.getByRole('dialog').getByRole('button', { name: 'Kalıcı olarak sil' }).click();
  await expect(y.getByText(`${kullanici} hesabı silindi.`)).toBeVisible();
  await y.close();

  await cikisYap(page);
  await girisYap(page, kullanici);
  await expect(page.getByRole('alert')).toHaveText('E-posta ya da şifre hatalı.');
});

test('yönetici elle hak tanımlar', async ({ page, browser }) => {
  const e = yeniEposta('hak');
  await kayitOl(page, e);
  await expect(page.getByRole('heading', { name: 'Projelerim' })).toBeVisible();
  const y = await yoneticiSayfasi(browser);
  await y.getByLabel('Kullanıcı e-postası').fill(e);
  await y.getByLabel('Hak adedi').fill('3');
  await y.getByRole('button', { name: 'Hak tanımla' }).click();
  await expect(y.getByText(`${e} hesabına 3 hak tanımlandı.`)).toBeVisible();
  await y.close();
  expect(await kalan(page)).toBe(3);
});
