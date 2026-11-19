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

## Faz 3

- Excel için ExcelJS, PDF için pdfmake (`packages/report`) — Excel'de canlı formül, stil, gizli satır; PDF'i tarayıcıda yazdırma penceresi olmadan doğrudan dosya olarak üretmek için. İkisi de web'de yalnız indirme düğmesine basınca yükleniyor.
- Excel düzeni prototipteki gibi: metraj ve birim fiyat değer, tutar = metraj × fiyat formül, ara toplamlar SUM, KDV oranı Özet!B16'dan (değiştirilebilir). Özet'teki inşaat alanı yuvarlanmadan yazılıyor — m² maliyeti motorla kuruşu kuruşuna aynı çıksın.
- LibreOffice testi: rapor yalnız formüllerle (önbellek değeri olmadan) yazılıp LibreOffice'te yeniden hesaplatılıyor; tüm sayfalarda hata hücresi aranıyor ve toplamlar motorla kuruş düzeyinde karşılaştırılıyor. Yerelde `tools/libreoffice` Docker imajı, CI'da apt paketi kullanılıyor (`REQUIRE_LIBREOFFICE=1` ile CI'da atlanamaz).
- ExcelJS, dosyada `<v>0</v>` olan formül sonucunu okurken düşürüyor; bu yüzden hata/sonuç denetimi doğrudan XML üzerinden yapılıyor.
- PDF yazı tipi Roboto (pdfmake ile gelen; Türkçe karakterleri içeriyor).
- Sayı alanları `type="text" inputMode="decimal"`: Türkçe yazım esas — virgül ondalık, nokta binlik ("6.000" = 6000). Tarayıcıların sayı alanı davranışı dile göre değiştiği için kendi ayrıştırıcımız (`sayiOku`).
- Geçersiz sayı (ör. KDV "abc" ya da 150) forma kaydedilmiyor, alanın altında Türkçe hata gösteriliyor — motorun NaN üretmesi arayüzde engellendi; motor prototiple aynı kaldı.
- Otomatik kayıt: değişiklikten 0,8 sn sonra; sayfa gizlenir/kapanırken bekleyen değişiklik `fetch(keepalive)` ile PostgREST'e gönderiliyor (64 KB altı). Proje oluşturulurken özet de hesaplanıp kaydediliyor (Projelerim listesi hemen dolu görünsün).
- Projenin girdisi `projeler.girdi` alanında prototiple aynı JSON biçiminde; eski/eksik kayıtlar açılırken tamamlanıyor (`girdiyiTamamla`).
- Onay soruları `<dialog>` ile (tarayıcının confirm penceresi yerine) — erişilebilir ve uygulamanın görünümüyle uyumlu.
- Erişilebilirlik: Playwright + axe-core ile WCAG 2.1 A/AA taraması (giriş, kayıt, Projelerim, 7 adım).

## Faz 4

- Fiyat listesi mantığı (`packages/core/src/prices.ts`) prototipteki `fiyat.js` ile aynı kurallar; kalem listesi, sayı okuma, fiyat ayıklama ve farklar prototiple karşılaştırmalı testli. Excel okuma/yazma `packages/report/src/priceTable.ts` (ExcelJS).
- Yayınlanan liste = yayındaki liste + yüklenen yeni fiyatlar (prototipteki gibi); boş bırakılan hücre fiyatı değiştirmez. Hatalı satırlar listelenir ve yayına alınmaz.
- Ekleme ve yayınlama tek sunucu fonksiyonunda (`fiyat_listesi_ekle_yayinla`), tek işlemde — yarım kalmış (eklenmiş ama yayınlanmamış) liste oluşmaz.
- Fiyat listesi içeriği veritabanında da doğrulanıyor (`fiyat_listesi_gecerli`: kod K + 3 rakam, fiyat 0–10 milyar sayı, en çok 1000 kalem) — istemciye güvenilmez.
- Fiyat listeleri değiştirilemez ve silinemez; geri dönüş eski sürümü yeniden yayına almakla. Projeler hesaplandıkları listeyi tuttuğu için geçmiş sonuçlar bozulmaz.
- Sürüm listesi yönetici fonksiyonuyla (`fiyat_listesi_surumleri`), fiyat içeriği olmadan ve yayınlayanın e-postasıyla.
- Yayındaki listeyi değiştiren uçtan uca testler ayrı bir Playwright projesinde (`yonetici`), diğer testler bittikten sonra tek başına çalışıyor ve sonunda eski sürümü geri yayına alıyor.
- İndirme bağlantısı sayfaya eklenmeden tıklanıyor — erişilebilirlik taraması sayfada kalan metinsiz bağlantıyı yakalamıştı.

## Faz 5

- DXF kuralları `packages/core/src/dxf` altında, prototip `dxf.js` ile aynı (iki gerçek çizimle doğrulanmış kurallar korunsun); okuma, mimari, statik ve proje girdisi prototiple birebir karşılaştırmalı testli. `pnpm dxf:karsilastir <mimari.dxf> [statik.dxf]` gerçek çizimde aynı karşılaştırmayı yerelde yapar (çizim bilgisayardan çıkmaz).
- Okuma ve analiz tarayıcıda bir Web Worker'da; dosya `File.stream()` ile parça parça okunur, ilerleme gösterilir. Çizim verisi worker'da kalır; plan önizlemesi orada OffscreenCanvas ile çizilip PNG olarak gelir (ana sayfa milyonlarca çizgiyi taşımaz).
- 100 MB'lık kurgusal çizim (1,1 milyon çizgi, 100 bin yazı) Node'da ~7 sn'de okunup analiz ediliyor (sınır 60 sn); test her çalıştırmada ölçüyor.
- PROTOTİPTEN FARK 1 — birim: prototip birimi ölçülerden tespit edip yalnız raporluyordu. Yeni kod tespit edilen birime göre (mm/m) koordinatları cm'ye çeviriyor; statik dosyanın birimi kolon kesitlerinden ayrıca tespit ediliyor. cm çizimlerde sonuç değişmez. (Ürün sahibi onayladı, 18.11.2026.)
- PROTOTİPTEN FARK 2 — mimaride aynı kat iki kez çizilmişse uyarı veriliyor ve kontrol ekranında kat "hesaba dahil" işaretiyle dışarıda bırakılabiliyor. Kullanıcı bir şey yapmazsa sonuç prototiple aynı. (Ürün sahibi onayladı, 18.11.2026.)
- Kurgusal örnek çizim üreticisi TypeScript'te (`example.ts`); varsayılan çıktı prototipin Python üreticisiyle bayt bayt aynı. Ücretsiz deneme bu çizimi kullanıyor; testler için birim, yazım biçimi, kopya kat, çok blok çeşitlemeleri var. Gerçek DXF'ler depoya girmez (`.gitignore`: `*.dxf`).
- Analiz hakkı (sunucuda düşme) ve yapay zekâ adımı bu fazda yok: Faz 6 ve 7'de eklenecek; şimdilik modül oturum açmış herkese açık.

## Faz 6

- Ürün kararları (ürün sahibi, 18.11.2026): hak iadesi = teknik hatada otomatik + 14 gün içinde kullanılmamış pakette cayma (yönetici onayı) + yönetici elle; hesap silme = talep → kilit → yönetici onayı → silme, ödeme kayıtları anonim; e-fatura/e-arşiv sonraya; yönetici e-postası şimdilik yer tutucu.
- Hak defteri "parti" mantığıyla (`hak_hareketleri`): her satın alma/elle tanım bir parti; analiz süresi en yakın biten partiden düşer; iade ve cayma aynı partiye yazılır. Böylece "hiç analiz yapılmamış paket" kesin denetlenir; defter yalnız eklenir (silinmez).
- Hak, çizim cihazda başarıyla okunduktan sonra ve kontrol ekranı açılmadan hemen önce sunucuda düşer (`analiz_baslat`). Kontrol ekranı bir hata yüzünden çizilemezse 1 saat içinde otomatik iade (`analiz_iade`); projeye aktarılmış analiz iade edilmez.
- Ücretsiz deneme, istemcinin "deneme" demesine güvenmez: sunucu yalnız hazır örnek çizimin SHA-256 parmak izleriyle kabul eder (`ornek_cizim_ozetleri`; core testi kodla tutarlılığını denetler). Not: çizim analizi tasarım gereği tarayıcıda yapıldığından, kodu değiştiren bir kullanıcı analizi yerelde çalıştırabilir; sunucu denetimi olağan yolun kötüye kullanımını engeller.
- Kayıt onayları sunucuda: `signUp` ile gelen onay listesi `auth.users` tetikleyicisinde denetlenir; zorunlular yoksa kayıt reddedilir; onaylar belgelerin güncel sürümüyle ve tarayıcı bilgisiyle saklanır. Onay yalnız güncel sürümle eklenebilir; sürüm değişince `eksik_onaylar` yeniden onay ister (eski sürümle verilmiş isteğe bağlı izinler de geçersiz sayılır).
- Ödeme kaydı tek veritabanı fonksiyonunda (`odeme_olustur`): paket satışta mı, fatura (TCKN 11 / VKN 10 + vergi dairesi, adres), son 1 saatte Ön Bilgilendirme ve Mesafeli Satış onayı, bekleyen ödeme sınırı. Kart ödemesi de aynı fonksiyonu kullanıcının oturumuyla çağırır.
- Kart: iyzico Checkout Form; onay yalnız `odeme-sonuc` fonksiyonunun iyzico'dan SUNUCUDA sorguladığı sonuçla (durum, tutar, conversationId). Dönüş adresi izinli kaynak listesiyle sınırlı.
- Testler için `test-iyzico` sahte servisi (SAHTE_IYZICO=1 değilse kapalı; üretime yayınlanmaz). Gerçek sandbox anahtarlarıyla deneme ürün sahibiyle yapılacak.
- Hesap silme: talep anında RLS ile proje yazımı ve yeni analiz/ödeme kapanır; yönetici onayı `hesap-sil` fonksiyonuyla (ödeme kayıtlarındaki fatura bilgisi silinir, kullanıcı ve bağlı veriler silinir). Not: fatura kayıtlarının yasal saklama yükümlülüğü (VUK) mali müşavir/avukatla netleştirilmeli.
- Hukuki metinler `packages/core/src/legal/belgeler.ts` (prototipten aynen; TASLAK, şirket bilgileri yer tutucu). Sözleşme pencereleri `<dialog>` ile.
- Fonksiyonların yerel ayarı `supabase/functions/.env` (örnek: `.env.example`, gerçek anahtar içermez); CI aynı dosyayı kopyalar ve Edge Runtime'ı başlatır.

## Faz 7

- Yapay zekâ adımı isteğe bağlı ve varsayılan kapalı: çizim yükleme ekranındaki kutu işaretlenince açık rıza (yurt dışına aktarım) güncel sürümle kaydedilir; rıza sunucuda (`yz_hakki_al`) yeniden denetlenir. Rıza yoksa analiz yine yapılır, yeni kalemler varsayılan tahmini fiyatla gelir.
- Analiz başına tek çağrı: hak, Claude'a gidilmeden önce veritabanında atomik alınır; çağrı başarısız olsa da ikinci deneme yok (maliyet denetimi). Örnek çizimle denemede ve 1 saatten eski analizde yapay zekâ yok.
- Gizlilik iki katmanlı: istemci yalnız yazısız plan görselleri (en çok 6, hesaba dahil katlar) ve `aiSummary` özetini gönderir; sunucu fonksiyonu özeti izin listesiyle yeniden süzer (mahal/kaplama/kat türü sözlükte yoksa "Tanınmayan mahal"/"Diğer", yeni kalem adları kalıpla). Proje adı, pafta başlıkları, antet, isim, ada-parsel gitmez. Sınır: çizimde yazı "patlatılıp" çizgiye çevrilmişse görselde şekil olarak kalabilir.
- Claude çağrısı resmi SDK ile (`npm:@anthropic-ai/sdk@1.10.0`), model `claude-sonnet-5-5` (`YZ_MODEL`), yapılandırılmış JSON çıktı (şema), effort orta; sunucu tarafı yedek model (server-side fallback) açık: güvenlik sınıflandırıcısı reddederse istek sunucuda uygun modelle yeniden denenir. Yanıt sunucuda süzülür: en çok 8 not, fiyat yalnız istenen kalemler için ve pozitif.
- Token kullanımı (girdi/çıktı, model, görsel sayısı, hata) `dxf_analizleri.yz_token`'a yazılır; yönetici sayfasında son 30 gün özeti.
- Yapay zekâ fiyatı, kullanıcının elle değiştirmediği kalemlere uygulanır ve açıklamaya gerekçesiyle yazılır; raporda "(tahmini fiyat)" etiketi sürer.
- Testler `test-claude` sahte servisiyle (SAHTE_CLAUDE=1 değilse kapalı; üretime yayınlanmaz). Gerçek anahtarla bir deneme ürün sahibiyle yapılacak.
- Savunma katmanı: Supabase'in varsayılan yetkileriyle `authenticated` rolüne verilen tablo yazma izinleri Faz 6 tablolarında açıkça kaldırıldı (RLS zaten engelliyordu); SQL testi bunu denetler.

## Faz 8

- Ürün kararları (ürün sahibi, 19.11.2026): mobil = web ile aynı özellikler, yönetici ekranları yalnız web'de; mağazada tüm paketler TEK SEFERLİK (tüketilebilir) ürün, otomatik yenileme yok; mağaza iadesinde o satın almanın kullanılmamış hakkı geri alınır; mağaza hesapları henüz yok → sahte mağaza ile geliştirme.
- Ortak istemci paketi `packages/istemci`: sunucu çağrıları, biçimleme, form doğrulama, proje düzenleyici (otomatik kayıt) ve çizim analizinin ortak mantığı web ile mobilde aynı kod. Platform farkları (cihaz bilgisi, SHA-256, uygulama kapanışı) açılışta `baglan` ile verilir. React ve sorgu önbelleğinin tek kopyası için Vite `dedupe`, Metro `resolveRequest` kullanılır.
- Mobil: Expo SDK 58 + Expo Router, react-native-svg (logo, plan önizlemesi), expo-file-system/document-picker/sharing, expo-sqlite tabanlı oturum saklama, expo-iap. Ekranlar Expo Router ile alt sekmeler (Projelerim, Paketler, Hesap) + proje ve çizim ekranları.
- Mobilde DXF en çok 30 MB (telefon belleği); dosya parça parça okunur, analiz core'daki aynı kurallarla yapılır; plan önizlemesi core'un `renderPlan` çizimini SVG yollarına çeviren bir uyarlayıcıyla gösterilir. Yapay zekâ görselleri aynı SVG'den PNG'ye çevrilir (yalnız iOS/Android; web önizlemesinde görsel gönderilmez).
- Raporlar cihazda üretilir (aynı `packages/report`) ve paylaşım penceresiyle açılır. Sonuç tablosunda mobilde gruplar başlangıçta kapalı (telefon ekranı için); hesap ve düzeltme kuralları web ile aynı.
- Mağaza ürün kimliği = paket kimliği (ör. `baslangic_ay`). Satın alma → `magaza-dogrula` sunucu fonksiyonu işlemi App Store Server API / Google Play Developer API'den kendi kimlik bilgimizle okur → `magaza_satin_alma` (yalnız service_role) ödeme kaydı + hak (web ödemesiyle aynı `odeme_onayla` kuralı; yenileme bitişten başlar). Aynı işlem iki kez hak vermez, başka hesaba aktarılamaz. İşlem, sunucu onayından SONRA mağazada bitirilir (tüketilir).
- İade: `magaza-bildirim` (Apple Server Notifications V2 / Google RTDN) bildirimin içeriğine güvenmez; işlem kimliğini alıp iade durumunu mağaza API'sinden yeniden sorgular, sonra `magaza_iade` kullanılmamış hakkı geri alır. Ek katman: bildirim adresinde gizli anahtar. Mağaza ödemelerinde web'deki cayma talebi yok (iade mağaza üzerinden).
- Mobilde kart/havale yok (mağaza kuralları). Mağaza satışında fatura bilgisi istenmez (satıcı Apple/Google). [Avukata sorulacak: mağaza satışında Ön Bilgilendirme / Mesafeli Satış metinlerinin gerekip gerekmediği.]
- Düzeltme: iade edilmiş/cayma incelemesindeki paket "abonelik" sayılmıyor ve yenileme başlangıcını uzatmıyor (`analiz_hakki`, `odeme_onayla`).
- Testler: `test-magaza` sahte App Store/Google Play servisi (SAHTE_MAGAZA=1 değilse kapalı); pgTAP (`04_magaza`), Jest bileşen testleri, Playwright ile mobil uygulamanın web derlemesi (telefon görünümü, axe). Gerçek cihaz davranışı (mağaza penceresi, paylaşım, Hermes'te Excel/PDF üretimi) otomatik testte yok; cihazda elle denenecek.

## Faz 9

- Ürün kararları (ürün sahibi, 20.11.2026): Supabase Cloud Frankfurt; Cloudflare Pages; Sentry (AB); çerezsiz kendi kullanım ölçümümüz; yedek = Supabase günlük + haftalık şifreli kopya (Cloudflare R2, AB, 12 hafta); GitHub şimdilik yok; alan adı ve e-posta servisi yer tutucu; mağaza listeleri taslak.
- Kullanım ölçümü iki kaynaklı: kayıt/proje/analiz/ödeme sayıları mevcut tablolardan türetilir (yeni veri toplanmaz); adım, rapor ve açılış olayları kişiye bağlanmayan günlük sayaçlardır (gün + olay + platform + sayı; kullanıcı kimliği, IP, cihaz kimliği yok) → çerez/izin penceresi gerekmez. Olay adları sunucuda izin listesiyle sınırlı.
- Hata kaydı: Sentry yalnız adres (DSN) verilirse açılır. Kişisel veri iki katmanda engellenir: SDK'nın veri toplama ayarları (kullanıcı, çerez, başlık, gövde, sorgu dizgisi kapalı; oturum kaydı ve performans izleme yok) + ortak süzgeç (`packages/istemci/hataKaydi`: e-posta, UUID, belirteç, 10+ haneli sayı maskelenir; ek veri ve özel bağlam silinir). Sunucu fonksiyonları yalnız beklenmeyen (5xx) hataları bildirir.
- Yedek: `supabase db dump` (roller, şema, public+auth verisi) → gzip → AES-256-GCM (scrypt ile şifreden anahtar) → R2 (AWS İmza 4, ek paket yok). Geri yükleme yerel veritabanına yapılır ve kayıt sayılarını yazar; üretime geri yükleme bilerek elle. Yerel deneme: kayıt sayıları birebir aynı, yanlış şifre reddedildi.
- Web güvenlik başlıkları `apps/web/public/_headers` (CSP: yalnız kendi betikleri; bağlantı yalnız Supabase ve Sentry AB; çerçeveye alınamaz; HSTS). Uçtan uca testler `vite preview` ile AYNI başlıklarla çalışır (yalnız yerel Supabase adresi eklenir).
- Yayın öncesi zorunlu bulunan eksik: "Şifremi unuttum" akışı yoktu. Eklendi (web: istek ve yeni şifre sayfaları; mobil: istek, yeni şifre web sayfasında). Hesap varlığı sızdırılmaz (her e-postaya aynı yanıt). Türkçe e-posta şablonları (doğrulama, sıfırlama, e-posta değişikliği).
- Yayın betiği varsayılan kuru çalışır, `--uygula` ile uygular; yalnız temiz main dalından, denetim ve testler geçtikten sonra; test-* fonksiyonları yayınlanmaz; gizli değerler geçici dosyayla yüklenip hemen silinir.
- Yayın denetimi engelleyicileri: depoda gizli dosya/anahtar kalıbı, şirket bilgisi yer tutucuları, taslak hukuki metin, eksik üretim değişkeni, üretimde sahte servis ayarı, localhost adresi, kısa bildirim anahtarı.
