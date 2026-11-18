# REPİO(M)

Konut inşaatı için yaklaşık maliyet hesaplayan ve raporlayan uygulama. Önce web, sonra Android ve iOS.

## Gerekenler

- Node.js 24 ve pnpm (`npm i -g pnpm`)
- Docker Desktop (çalışır durumda)

## İlk kurulum ve çalıştırma

```powershell
pnpm install
pnpm db:start
pnpm env:yerel
pnpm dev
```

Uygulama: http://localhost:5173 · Veritabanı yönetim paneli (Supabase Studio): http://127.0.0.1:55323

Yerelde e-posta doğrulaması kapalıdır; kayıt olunca doğrudan giriş yapılır. `yonetici@repiom.test` adresiyle kaydolan hesap yönetici olur (yalnız yerel, yer tutucu).

## Testler

| Komut            | Ne yapar                                                 |
| ---------------- | -------------------------------------------------------- |
| `pnpm lint`      | Kod denetimi                                             |
| `pnpm typecheck` | Tip kontrolü                                             |
| `pnpm test`      | Birim testleri (Vitest)                                  |
| `pnpm db:test`   | Veritabanı ve RLS testleri (pgTAP); Supabase açık olmalı |
| `pnpm e2e`       | Uçtan uca testler, masaüstü ve telefon (Playwright)      |
| `pnpm gen:check` | Formül dosyası `veri.js` ile güncel mi                   |
| `pnpm build`     | Üretim derlemesi                                         |

Excel raporunun LibreOffice ile yeniden hesap testi için bir kez `docker build -t repiom-libreoffice tools/libreoffice` çalıştır (ya da LibreOffice'i kur); imaj yoksa bu test yerelde atlanır, CI'da her zaman çalışır.

`pnpm db:reset` veritabanını sıfırlar ve `supabase/seed.sql` verisini yeniden yükler.

## Klasörler

- `packages/core` — hesap motoru, veri modeli, DXF analizi (saf TypeScript). `reference/` prototipten alınmış doğruluk referansıdır.
- `packages/report` — Excel ve PDF raporları.
- `apps/web` — React + Vite web uygulaması.
- `supabase/` — migration'lar, seed verisi, pgTAP testleri.
- `docs/kararlar.md` — teknik kararlar ve gerekçeleri.

## Güvenlik

Gizli anahtarlar yalnız ortam değişkenlerinde tutulur ve depoya girmez. Gerçek proje çizimleri (`*.dxf`) üçüncü kişilere aittir; depoya eklenmez.
