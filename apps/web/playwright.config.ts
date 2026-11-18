import { defineConfig, devices } from '@playwright/test';

/**
 * Uçtan uca testler. Yerel Supabase çalışıyor olmalı (pnpm db:start && pnpm env:yerel).
 * Masaüstü ve telefon görünümü ayrı projeler olarak çalışır.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'tr-TR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'masaustu', testIgnore: /yonetici[\\/]/, use: { ...devices['Desktop Chrome'] } },
    { name: 'telefon', testIgnore: /yonetici[\\/]/, use: { ...devices['Pixel 7'] } },
    // Yayındaki fiyat listesini değiştiren testler: diğerleri bittikten sonra, tek başına.
    {
      name: 'yonetici',
      testMatch: /yonetici[\\/].*\.spec\.ts/,
      dependencies: ['masaustu', 'telefon'],
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
