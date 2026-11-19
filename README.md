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

`pnpm env:yerel` ayrıca sunucu fonksiyonlarının yerel ayarını (`supabase/functions/.env`, sahte iyzico) oluşturur; ilk seferde ardından `pnpm db:stop` ve `pnpm db:start` çalıştır.

Yerelde e-posta doğrulaması kapalıdır; kayıt olunca doğrudan giriş yapılır. `yonetici@repiom.test` adresiyle kaydolan hesap yönetici olur (yalnız yerel, yer tutucu).

## Testler

| Komut                                            | Ne yapar                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `pnpm lint`                                      | Kod denetimi                                                                   |
| `pnpm typecheck`                                 | Tip kontrolü                                                                   |
| `pnpm test`                                      | Birim testleri (Vitest)                                                        |
| `pnpm db:test`                                   | Veritabanı ve RLS testleri (pgTAP); Supabase açık olmalı                       |
| `pnpm e2e`                                       | Uçtan uca testler, masaüstü ve telefon (Playwright)                            |
| `pnpm dxf:karsilastir <mimari.dxf> [statik.dxf]` | Gerçek çizimi prototip ve yeni kodla analiz edip farkları yazar (yalnız yerel) |
| `pnpm e2e:mobil`                                 | Mobil uygulamanın uçtan uca testleri (web derlemesinde, telefon görünümü)      |
| `pnpm gen:check`                                 | Formül dosyası `veri.js` ile güncel mi                                         |
| `pnpm build`                                     | Üretim derlemesi                                                               |

Excel raporunun LibreOffice ile yeniden hesap testi için bir kez `docker build -t repiom-libreoffice tools/libreoffice` çalıştır (ya da LibreOffice'i kur); imaj yoksa bu test yerelde atlanır, CI'da her zaman çalışır.

`pnpm db:reset` veritabanını sıfırlar ve `supabase/seed.sql` verisini yeniden yükler.

## Klasörler

- `packages/core` — hesap motoru, veri modeli, DXF analizi (saf TypeScript). `reference/` prototipten alınmış doğruluk referansıdır.
- `packages/report` — Excel ve PDF raporları.
- `packages/istemci` — web ve mobilin ortak sunucu çağrıları ve iş mantığı.
- `apps/web` — React + Vite web uygulaması.
- `apps/mobile` — Expo (React Native) mobil uygulama.
- `supabase/` — migration'lar, seed verisi, pgTAP testleri.
- `docs/kararlar.md` — teknik kararlar ve gerekçeleri.

## Güvenlik

Gizli anahtarlar yalnız ortam değişkenlerinde tutulur ve depoya girmez. Sunucu fonksiyonlarının yerel ayarı `supabase/functions/.env` dosyasındadır (`.env.example`'dan kopyalanır, depoya girmez); yerelde ödeme ve yapay zekâ sahte servislerle çalışır.

### Yapay zekâ adımını gerçek anahtarla denemek (bir kez, yerelde)

1. `supabase/functions/.env` içinde `ANTHROPIC_API_KEY=` satırına gerçek anahtarı yaz; `ANTHROPIC_BASE_URL` ve `SAHTE_CLAUDE` satırlarını sil.
2. `docker restart supabase_edge_runtime_repiom` ile fonksiyonları yeniden başlat.
3. Kendi çiziminle "Çizim yükle" → "Yapay zekâ kontrolü de yapılsın" kutusunu işaretle → analizi başlat. Kullanım Yönetici sayfasında görünür.
4. Bitince dosyayı `.env.example`'daki sahte değerlere geri döndür. Gerçek proje çizimleri (`*.dxf`) üçüncü kişilere aittir; depoya eklenmez.

## Mobil uygulamayı telefonda denemek

1. Telefon ve bilgisayar aynı Wi-Fi ağında olsun. Telefona **Expo Go** uygulamasını kur (App Store / Google Play).
2. `pnpm db:start` ve `pnpm env:yerel` (mobil ayarı bilgisayarın yerel ağ adresiyle yazılır).
3. `pnpm mobil` → ekrandaki QR kodu telefonla okut.
4. Expo Go'da satın almalar **sahte mağazada** yapılır (gerçek ücret alınmaz). Gerçek App Store / Google Play satın alması için geliştirme derlemesi (EAS) ve mağaza hesapları gerekir.
5. Windows güvenlik duvarı sorarsa yerel ağ erişimine izin ver (55321 ve 8081 bağlantı noktaları).
