import { defineConfig, devices } from '@playwright/test';

/**
 * Mobil uygulamanın uçtan uca testleri: uygulama react-native-web ile tarayıcıda (telefon görünümü) çalışır.
 * Yerel Supabase çalışıyor olmalı (pnpm db:start && pnpm env:yerel). Mağaza: sahte (EXPO_PUBLIC_SAHTE_MAGAZA=1).
 * Not: gerçek cihaz davranışı (dosya paylaşımı, mağaza penceresi) burada değil, cihazda elle denenir.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:8081', locale: 'tr-TR', trace: 'retain-on-failure' },
  projects: [{ name: 'mobil', use: { ...devices['Pixel 7'] } }],
  webServer: {
    // Testte sunucu adresi bu bilgisayar (127.0.0.1); telefondaki yerel ağ adresi değil.
    command: 'node e2e/derle.mjs && pnpm exec expo serve --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
