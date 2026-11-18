/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Ortak paket (packages/istemci) React ve sorgu önbelleğini uygulamanın kopyasından kullanmalı.
  resolve: { dedupe: ['react', 'react-dom', '@tanstack/react-query', '@supabase/supabase-js'] },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    // Ortak mantığın testleri packages/istemci'de; web'e özgü birim testi eklendiğinde burada çalışır.
    passWithNoTests: true,
  },
});
