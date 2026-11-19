/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

/**
 * Önizleme (uçtan uca testler) üretimle AYNI güvenlik başlıklarıyla çalışır (public/_headers). Yalnız yerel farklar:
 * yerel Supabase adresine izin, HTTPS'e zorlama ve HSTS yok.
 */
function onizlemeBasliklari(): Record<string, string> {
  const metin = readFileSync(new URL('./public/_headers', import.meta.url), 'utf8');
  const blok = metin.split(/\r?\n(?=\/)/).find((b) => b.startsWith('/*'))!;
  const b: Record<string, string> = {};
  for (const satir of blok.split(/\r?\n/).slice(1)) {
    const m = /^\s+([\w-]+):\s*(.+)$/.exec(satir);
    if (m) b[m[1]!] = m[2]!;
  }
  delete b['Strict-Transport-Security'];
  b['Content-Security-Policy'] = b['Content-Security-Policy']!.replace(
    '; upgrade-insecure-requests',
    '',
  ).replace("connect-src 'self'", "connect-src 'self' http://127.0.0.1:55321 ws://127.0.0.1:55321");
  return b;
}

export default defineConfig({
  plugins: [react()],
  // Ortak paket (packages/istemci) React ve sorgu önbelleğini uygulamanın kopyasından kullanmalı.
  resolve: { dedupe: ['react', 'react-dom', '@tanstack/react-query', '@supabase/supabase-js'] },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true, headers: onizlemeBasliklari() },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    // Ortak mantığın testleri packages/istemci'de; web'e özgü birim testi eklendiğinde burada çalışır.
    passWithNoTests: true,
  },
});
