# Mağaza listeleri — TASLAK

> Bu metinler taslaktır. Mağazaya gönderim yapılmadı. Şirket bilgileri, destek adresi ve gizlilik politikası adresi
> yer tutucudur. Gizlilik formu cevapları, uygulamanın bugünkü veri işleyişine göre doldurulmuştur; avukat onayından
> ve yayın öncesi son kontrolden geçmeli.

## Ortak bilgiler

| Alan                                         | Değer                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Uygulama adı                                 | REPİO(M)                                                                             |
| Alt başlık (iOS, en çok 30)                  | İnşaat maliyeti ve metraj                                                            |
| Kısa açıklama (Android, en çok 80)           | Konut projelerinde yaklaşık maliyet, metraj ve çizimden (DXF) hesap.                 |
| Kategori                                     | iOS: İş (Business), ikincil: Verimlilik · Android: İş                                |
| Paket kimliği                                | `com.repiom.uygulama` (iOS ve Android)                                               |
| Yaş sınırı                                   | 4+ / Herkes (şiddet, kumar, kullanıcılar arası iletişim yok)                         |
| Destek adresi                                | [https://alanadi.com/destek]                                                         |
| Gizlilik politikası adresi                   | [https://alanadi.com/kvkk] (KVKK Aydınlatma Metni'nin web sayfası)                   |
| Hesap silme adresi (Google zorunlu)          | [https://alanadi.com/hesap] — giriş yapıp "Hesabı sil" (talep + yönetici onayı)      |
| Anahtar kelimeler (iOS, en çok 100 karakter) | maliyet,metraj,inşaat,yaklaşık maliyet,keşif,DXF,konut,şantiye,müteahhit,birim fiyat |

## Uzun açıklama

REPİO(M), konut projelerinin yaklaşık maliyetini dakikalar içinde hesaplar.

- **Bildiğin kadarını gir:** Toplam inşaat alanı yeterli; kat, daire tipi ve sistem bilgisi ekledikçe hesap ayrıntılanır.
- **7 adımda proje:** Proje, daire tipleri, katlar, diğer bilgiler, proje geneli, özet ve sonuç. Her değişiklik otomatik kaydedilir.
- **Düzenlenebilir sonuç:** Metraj ve birim fiyatı kalem kalem değiştir, istediğinde formüle dön.
- **Excel ve PDF rapor:** Canlı formüllü Excel ve düzenli PDF; tek dokunuşla paylaş.
- **Çizimden maliyet (DXF):** Mimari ve statik çizimini yükle; katlar, mahaller, kaplamalar, beton-kalıp-donatı ve kapı-pencere çizimden okunur. Çizim telefonunda okunur, sunucuya gönderilmez.
- **İsteğe bağlı yapay zekâ kontrolü:** Açık rızanla, yazısız plan görüntüleri üzerinden kontrol notları ve yeni kalemler için fiyat önerisi.
- **Güncel fiyat listeleri:** Fiyatlar düzenli güncellenir; eski projeler hangi listeyle hesaplandığını korur.

Örnek proje ve örnek çizimle ücretsiz deneyebilirsin. Çizim analizi için paket satın alınır (tek seferlik; otomatik yenilenmez).

## Uygulama içi ürünler (tek seferlik / tüketilebilir)

| Ürün kimliği     | Ad          | Açıklama                        |
| ---------------- | ----------- | ------------------------------- |
| `baslangic_ay`   | Başlangıç   | 30 gün geçerli 2 analiz hakkı   |
| `profesyonel_ay` | Profesyonel | 30 gün geçerli 6 analiz hakkı   |
| `ofis_yil`       | Ofis        | 365 gün geçerli 60 analiz hakkı |
| `ek_analiz`      | Ek analiz   | 365 gün geçerli 1 analiz hakkı  |

Fiyatlar her iki mağazanın panelinde ayrıca girilir (yönetici ekranındaki fiyatlar yalnız web içindir). Ürün kimliği,
veritabanındaki paket kimliğiyle aynı olmalıdır; aksi halde satın alma doğrulanmaz.

## Apple — Gizlilik Etiketi (App Privacy)

İzleme (tracking): **Hayır**. Üçüncü taraf reklam: **Yok**.

| Veri türü                                                     | Toplanıyor | Kullanıcıyla bağlantılı | Amaç                                                   |
| ------------------------------------------------------------- | ---------- | ----------------------- | ------------------------------------------------------ |
| İletişim bilgisi — e-posta adresi                             | Evet       | Evet                    | Uygulama işlevi (hesap)                                |
| Kullanıcı içeriği — diğer (projeler, çizimden okunan ölçüler) | Evet       | Evet                    | Uygulama işlevi                                        |
| Satın almalar — satın alma geçmişi                            | Evet       | Evet                    | Uygulama işlevi                                        |
| Tanımlayıcılar — kullanıcı kimliği                            | Evet       | Evet                    | Uygulama işlevi                                        |
| Teşhis — çökme verisi                                         | Evet       | Hayır                   | Uygulama işlevi (hata giderme; kişisel veri ayıklanır) |
| Kullanım verisi — ürün etkileşimi                             | Evet       | Hayır                   | Analiz (kişiye bağlanmayan günlük sayaçlar)            |

Yapay zekâ kontrolü: yalnız açık rızayla; yazısız plan görüntüleri ve mahal/alan özeti (kişisel veri içermeyecek
şekilde) işlenir — "Kullanıcı içeriği" kapsamında.

Hesap silme: uygulama içinden başlatılır (Hesap → Hesabımı silmek istiyorum); onay süresince hesap kilitlenir.

## Google Play — Veri Güvenliği (Data safety)

- Veriler aktarım sırasında şifreleniyor: **Evet** (HTTPS).
- Kullanıcı verilerinin silinmesini isteyebilir: **Evet** (uygulama içi ve web adresi).
- Üçüncü taraflarla paylaşım: Hizmet sağlayıcılar (Supabase — barındırma; Sentry — hata kaydı; Anthropic — yalnız
  rızayla yapay zekâ kontrolü; Google Play — ödeme). Google'ın tanımına göre "hizmet sağlayıcıya aktarım" paylaşım
  sayılmaz; yine de avukatla kontrol edilmeli.

| Veri türü                                                       | Toplanıyor                                       | İsteğe bağlı mı | Amaç                  |
| --------------------------------------------------------------- | ------------------------------------------------ | --------------- | --------------------- |
| Kişisel bilgi — e-posta                                         | Evet                                             | Hayır           | Hesap yönetimi        |
| Uygulama etkinliği — uygulama içi işlemler                      | Evet                                             | Hayır           | Analiz (anonim sayaç) |
| Uygulama bilgisi ve performansı — kilitlenme günlükleri, teşhis | Evet                                             | Hayır           | Uygulama işlevi       |
| Finansal bilgi — satın alma geçmişi                             | Evet                                             | Hayır           | Uygulama işlevi       |
| Dosyalar ve belgeler — (çizim dosyası)                          | **Hayır** — cihazda okunur, sunucuya gönderilmez | —               | —                     |
| Diğer kullanıcı içeriği — projeler                              | Evet                                             | Hayır           | Uygulama işlevi       |

## Ekran görüntüleri (yapılacak)

Gerçek cihazda ya da simülatörde, örnek proje ve örnek çizimle (gerçek kişi/çizim bilgisi olmadan):

1. Projelerim (örnek proje kartıyla)
2. 3. Katlar adımı
3. 7. Sonuç — toplam maliyet kartları
4. Sonuç tablosu — düzenlenmiş (sarı) hücre
5. Çizimden maliyet — kontrol ekranı (Katlar, plan önizlemesi)
6. Paketler

Boyutlar: iPhone 6,9" (1320×2868) zorunlu; **iPad** desteği açık olduğu için 13" iPad görüntüleri de gerekir
(iPad'i kapatmak bir karardır, sor). Android: telefon (en az 2 adet, 1080×1920 ve üzeri).

## İnceleme notu (App Review / Play)

- Deneme hesabı: inceleme için ayrı bir hesap açılır, birkaç analiz hakkı yönetici ekranından tanımlanır; bilgileri
  yalnız mağaza panelindeki "inceleme bilgileri" alanına girilir (depoya yazılmaz).
- Örnek çizim: uygulamada "Örnek çizimle dene" — dosya gerekmez.
- Ödeme: yalnız uygulama içi satın alma; uygulamada web ödemesine yönlendirme yoktur.
