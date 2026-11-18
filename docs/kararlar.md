# Teknik kararlar

Her satır: karar — gerekçe. Ürün kararları burada değil; onlar ürün sahibiyle konuşulur.

## Faz 1

- Yeni kod `REPİO(M)/repiom/` altında ayrı git deposu; prototip klasörü değiştirilmedi — referans bozulmasın, gizli dosyalar ve gerçek DXF'ler depoya giremesin.
- Prototipten `veri.js`, `hesap.js`, `beklenen_v4.json` `packages/core/reference/` altına kopyalandı — CI'da da doğruluk referansı olarak kullanılabilsin (gizli bilgi içermiyorlar).
- pnpm workspaces (pnpm 12, Node 24) — paylaşılan `core` paketi web, mobil ve sunucuda tek kaynak.
- TypeScript 6.0 (7.0 değil) — typescript-eslint henüz 7.0'ı desteklemiyor.
- ESLint (flat config) + Prettier; ESLint yol desenleri `**/` ile başlıyor — klasör adındaki "İ" göreli desenlerin eşleşmesini bozuyor.
- Vitest birim testleri; web için jsdom ortamı.
- React 19 + Vite 8 + React Router 8 + TanStack Query — sunucu verisi önbelleklenir, otomatik kayıt (Faz 3) kolaylaşır.
- React Hook Form + Zod — doğrulama mesajları Türkçe ve tek yerde; eksik girdi uygulamayı çökertmez.
- Supabase hata kodları `apps/web/src/lib/hatalar.ts` ile Türkçeye çevriliyor; bilinmeyen hatada teknik ayrıntı gösterilmiyor.
- Stil: CSS değişkenleriyle tek global stil dosyası (CSS Modules yerine) — prototip de böyle; ekran sayısı arttıkça bileşen bazlı modüllere geçilebilir.
- Yazı tipleri `@fontsource` ile uygulamayla birlikte sunuluyor, Google Fonts'tan çekilmiyor — KVKK: kullanıcının IP adresi üçüncü tarafa gitmez.
- Düğme zemini `#C2410C` (koyu turuncu), logo turuncusu `#F0692B` yalnız süs — beyaz yazıyla WCAG AA kontrastı (5,2:1) için.
- Yerel Supabase portları 55321–55329 — bu bilgisayarda başka bir Supabase projesi varsayılan 543xx portlarını kullanıyor.
- Yerelde kullanılmayan Supabase servisleri (realtime, storage, analytics) kapalı — daha hızlı açılış; gerektiğinde açılır.
- Şifre kuralı: en az 8 karakter, harf ve rakam (sunucuda `config.toml`, istemcide Zod) — Supabase önerisi.
- `yonetici_mi()` e-postanın listede olmasının yanında doğrulanmış olmasını da istiyor — doğrulanmamış bir hesap yönetici e-postasıyla kaydolup yetki alamasın.
- `projeler` tablosunda sütun bazlı güncelleme yetkisi (`sahip` değiştirilemez), `girdi` boyutu 2 MB ile sınırlı — RLS'e ek savunma.
- `onaylar` kayıtları yalnız eklenebilir; güncellenemez, silinemez — ispat değeri korunur.
- İlk fiyat listesi ve yer tutucu yönetici e-postası `supabase/seed.sql` içinde (yalnız yerel) — üretimdeki fiyat listesi akışı Faz 4'te.
- Uçtan uca testler Playwright ile, derlenmiş uygulamaya (`vite preview`) karşı; masaüstü Chrome ve Pixel 7 görünümü — telefon görünümünde yatay taşma da kontrol ediliyor.
- CI: GitHub Actions'ta iki iş — (1) format, lint, tip, birim test, build; (2) Supabase'i Docker'da başlatıp pgTAP ve Playwright.

## Faz 2

- Formüller `packages/core/scripts/gen-formulas.ts` ile `veri.js`'ten otomatik üretiliyor (`pnpm gen:formulas`); CI `pnpm gen:check` ile dosyanın güncel olduğunu denetliyor — formüller elle kopyalanmaz.
- Üretici TypeScript sözdizimi ağacını kullanıyor ve yalnız bilinen yapıları kabul ediyor — beklenmeyen bir formül sessizce yanlış çevrilmez, üretim durur.
- Karşılaştırma sonuçları `B(...)` ile açıkça 1/0'a çevriliyor; `==` yalnız aynı tipteki değerler arasında, `===` olarak üretiliyor — JavaScript'teki örtük çevrimle aynı sonuç, tip kontrolüyle.
- Metinle karşılaştırılan değişkenler (`CEPHE_TIP`, `ISITMA` …) üretilen `FormulaVars` arayüzünde `string`, diğerleri `number` — metin bir değişkenin aritmetikte kullanılması derleme hatası olur.
- Hesap motoru (`packages/core/src/engine`) prototipin işlem sırasını koruyor — kayan nokta sonuçları bit düzeyinde aynı.
- Girdi (`ProjectInput`) ve sonuç alan adları prototiple aynı (Türkçe) — prototipte kaydedilmiş projeler ve rapor/arayüz kodu değişmeden uyumlu kalsın; fonksiyon adları İngilizce.
- Üç katmanlı doğrulama: (1) her formül 300 rastgele girdide prototiple aynı, (2) v4'ün 588 değeri, (3) 7 sabit + 300 rastgele projede tüm sonuç nesnesi prototip motoruyla aynı.
- `core/src` için ESLint, Node/tarayıcı/React/Supabase bağımlılığını yasaklıyor — paket web, mobil ve sunucuda aynen çalışsın.
