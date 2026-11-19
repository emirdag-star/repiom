# Yayın el kitabı

Kararlar (ürün sahibi, 20.11.2026): veritabanı **Supabase Cloud Frankfurt**, web **Cloudflare Pages**, hata kaydı
**Sentry (AB)**, kullanım ölçümü **çerezsiz, kendi sayaçlarımız**, yedek **Supabase günlük + haftalık şifreli kopya
(Cloudflare R2, AB)**, GitHub **şimdilik yok** (yayın bu bilgisayardan), alan adı ve e-posta servisi **henüz yok**.

Hiçbir adım otomatik olarak gerçek hesaplara dokunmaz: betikler varsayılan olarak yalnız ne yapacaklarını yazdırır.
Gizli değerler `docs/uretim-ortam.ornek` şablonuyla, **depo dışındaki** bir dosyada tutulur.

## 0. Yayından önce kapanması gerekenler (engelleyici)

`pnpm yayin:denetim --ortam <üretim dosyası>` bunları denetler.

1. **Avukat:** hukuki metinler (TASLAK / [AVUKAT] notları), şirket bilgileri (`packages/core/src/legal/belgeler.ts` →
   `SIRKET`), yurt dışına aktarım:
   - Supabase (Frankfurt, barındırma), Sentry (Almanya, hata kaydı), Anthropic (ABD, yalnız rızayla yapay zekâ),
     Cloudflare (web dağıtımı, yedek depolama) için standart sözleşmeler ve Kurul'a bildirim;
   - KVKK aydınlatma metnine bu alıcıların eklenmesi (metin sürümü değişince kullanıcılardan yeniden onay istenir);
   - mağaza satışında Ön Bilgilendirme / Mesafeli Satış metinlerinin gerekip gerekmediği;
   - fatura kayıtlarının saklama süresi (VUK) ve hesap silmeyle ilişkisi.
2. **Mali müşavir:** e-fatura / e-arşiv (Faz 6'da sonraya bırakıldı).
3. **Alan adı** ve kurumsal e-posta adresleri (destek, KVKK, KEP).

## 1. Hesapları açma sırası

| Hizmet                                | Ne için                                                          | Not                                                                    |
| ------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Supabase (Pro)                        | Veritabanı, kimlik, sunucu fonksiyonları                         | Bölge **Frankfurt (eu-central-1)**; yaklaşık 25 $/ay                   |
| Cloudflare                            | Web (Pages), alan adı DNS, yedek deposu (R2, **AB yetki alanı**) | Pages ücretsiz; R2 birkaç GB için kuruşlar                             |
| Sentry                                | Hata kaydı                                                       | **Veri bölgesi: AB (de.sentry.io)**; 3 proje: web, mobil, fonksiyonlar |
| Resend (ya da AB'de başka SMTP)       | Kayıt doğrulama ve şifre sıfırlama e-postaları                   | Alan adı doğrulaması gerekir                                           |
| iyzico (canlı)                        | Web kart ödemesi                                                 | Sandbox denemesi Faz 6'da bekliyor                                     |
| Anthropic                             | Yapay zekâ adımı                                                 | Gerçek anahtarla deneme Faz 7'de bekliyor                              |
| Apple Developer / Google Play Console | Mobil yayın ve satın alma                                        | `docs/magaza-listeleri.md`                                             |
| Expo (EAS)                            | Mobil derleme ve mağazaya gönderim                               | Ücretsiz plan yeterli                                                  |

## 2. Supabase üretim projesi

```powershell
pnpm exec supabase login
pnpm exec supabase link --project-ref <proje-ref>
```

Panelde (Authentication):

- **Site URL:** `https://<alan-adi>`; **Redirect URLs:** `https://<alan-adi>/**`
- **E-posta doğrulaması açık** (`Confirm email`). Yerelde kapalıdır; üretimde açık olmalı (kayıt ekranı "E-postanı
  kontrol et" durumunu zaten gösterir).
- **SMTP:** Resend bilgileri; gönderen `REPİO(M) <bildirim@alan-adi>`.
- **E-posta şablonları:** `supabase/templates/*.html` (Türkçe) — konu satırları `supabase/config.toml` içinde.
- **Şifre kuralı:** en az 8 karakter, harf + rakam (uygulamadaki kuralla aynı).
- Sızdırılmış şifre denetimi ve CAPTCHA (Pro) açılması önerilir.

Yönetici e-postası tohum veriyle üretime gitmez; SQL düzenleyicide bir kez:

```sql
insert into public.yonetici_epostalar (email) values ('<yonetici e-postası, küçük harf>');
```

## 3. Yayın

```powershell
pnpm yayin:denetim --ortam C:\gizli\repiom.uretim.env
```

```powershell
pnpm yayinla --ortam C:\gizli\repiom.uretim.env
```

İkinci komut kuru çalışır; adımları okuyup onaylayınca sonuna `--uygula` eklenir. Sıra: denetim → testler →
`db push` (migration) → fonksiyon gizli değerleri → fonksiyonlar (_*test-* hariç_*) → web derleme → Cloudflare Pages.
`_headers` dosyası güvenlik başlıklarını (CSP, HSTS…) ve `_redirects` tek sayfa yönlendirmesini taşır.

Mobil:

```powershell
cd apps/mobile; npx eas-cli@latest env:create --environment production
```

```powershell
cd apps/mobile; npx eas-cli@latest build --platform all --profile production
```

## 4. Yayın sonrası kontrol (her yayında)

1. Web açılıyor; tarayıcı konsolunda güvenlik politikası (CSP) hatası yok.
2. Yeni hesapla kayıt → doğrulama e-postası (Türkçe) → giriş → örnek proje → Excel/PDF.
3. Örnek çizimle deneme; şifremi unuttum e-postası.
4. Sentry'ye deneme hatası düşüyor ve olayda e-posta, IP, istek gövdesi YOK.
5. Yönetici → Kullanım panosunda sayılar artıyor.

## 5. Yedekleme

- **Günlük:** Supabase Pro kendiliğinden (7 gün saklar).
- **Haftalık şifreli kopya:** `pnpm yedek -- --db "<Session pooler bağlantı adresi>"` → Cloudflare R2 (AB). R2 kovasında
  **yaşam döngüsü kuralı: 84 günden eski nesneleri sil** (12 hafta). `YEDEK_SIFRESI` parola yöneticisinde ayrıca
  saklanır; kaybolursa yedek açılamaz.
- GitHub olmadığı için haftalık görev bu bilgisayarda çalışır (bilgisayar o saatte açık olmalı). Windows Görev
  Zamanlayıcı'ya eklemek bir sistem ayarıdır; istersen birlikte kurarız. Komut:
  `node scripts/yedek.mjs --db "<adres>"` (değişkenler kullanıcı ortamından okunur).
- **Aylık geri yükleme denemesi:** en son yedeği indir, `pnpm yedek:geri-yukle <dosya>` → yerel veritabanına yüklenir ve
  kayıt sayıları yazılır. Üretimdeki sayılarla karşılaştır, sonucu not et.
- Felaket kurtarma: önce Supabase panelinden günlük yedeğe dön; o da yoksa yeni projeye `--yalniz-ac` ile açılan
  `roller.sql`, `sema.sql`, `veri.sql` sırasıyla yüklenir (iki kişiyle, adım adım).

## 6. İzleme

- **Sentry:** yeni hata türünde e-posta uyarısı; haftada bir hata listesine bakılır.
- **Supabase:** Advisors (güvenlik ve performans uyarıları) ayda bir; veritabanı boyutu ve fonksiyon hata oranı.
- **Yapay zekâ maliyeti:** Yönetici → Yapay zekâ kullanımı (token toplamları); Anthropic panelinde aylık harcama sınırı.
- **Kullanım:** Yönetici → Kullanım (kayıt, proje, analiz, satın alma, adımlara ulaşma).

## 7. Geri dönüş

- Web: Cloudflare Pages → önceki dağıtımı "Rollback" ile geri al (veri etkilenmez).
- Fonksiyon: önceki sürümün kodu ile `supabase functions deploy <ad>`.
- Veritabanı migration'ı geri alınmaz; hatalı migration için yeni bir düzeltme migration'ı yazılır. Büyük migration'dan
  önce elle haftalık yedek alınır.
