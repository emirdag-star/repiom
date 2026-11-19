# Yayın el kitabı — kendi sunucumuz

Kararlar (ürün sahibi, 20.11.2026): uygulama **Türkiye'deki kendi sunucumuzda** Docker Compose ile çalışır
(veritabanı, kimlik, API, sunucu fonksiyonları ve web aynı sunucuda); yedekler **sürekli** (birkaç dakikalık en çok
veri kaybı) ve sunucu dışı kopya **Cloudflare R2 (AB)**; hata kaydı Sentry (AB); kullanım ölçümü çerezsiz, kendi
sayaçlarımız; GitHub yok (kod SSH ile doğrudan sunucuya gider); alan adı ve e-posta servisi henüz yok.

Kurulum dosyaları `sunucu/` klasöründe; ayrıntılar aşağıda.

## 0. Yayından önce kapanması gerekenler (engelleyici)

`pnpm yayin:denetim --ortam <sunucu/.env kopyası>` bunları denetler (yayın betiği bunu sunucuda kendisi çalıştırır).

1. **Avukat:** hukuki metinler (TASLAK / [AVUKAT] notları), şirket bilgileri (`packages/core/src/legal/belgeler.ts` →
   `SIRKET`). Yurt dışına aktarım artık yalnız şunlar için: **Cloudflare R2 (şifreli yedek, AB)**, **Sentry (hata kaydı,
   AB)**, **Anthropic (yalnız rızayla yapay zekâ, ABD)**, **e-posta servisi**. Veritabanı Türkiye'de. Aydınlatma
   metni bu alıcılara göre güncellenmeli (sürüm değişince kullanıcılardan yeniden onay istenir).
2. **Mali müşavir:** e-fatura / e-arşiv.
3. **Alan adı** (DNS A kaydı sunucunun IP'sine) ve kurumsal e-posta adresleri.

## 1. Sunucudaki yığın (`sunucu/compose.yaml`)

| Servis                 | Görev                                                                                                                           | Dışarı açık mı                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `yonlendirici` (Caddy) | Web uygulaması + `/auth/v1`, `/rest/v1`, `/functions/v1` yönlendirmesi, **otomatik HTTPS** (Let's Encrypt), güvenlik başlıkları | **Evet: 80, 443**                       |
| `db`                   | Postgres (Supabase imajı) + pgBackRest (her WAL kaydı şifreli olarak R2'ye)                                                     | Hayır                                   |
| `yedekci`              | Gece yedekleri (pazar tam, diğer günler fark), saklama, durum                                                                   | Hayır                                   |
| `auth`                 | Kayıt / giriş / e-posta (GoTrue), Türkçe şablonlar                                                                              | Yönlendirici üzerinden                  |
| `rest`                 | Veritabanı API'si (PostgREST; erişim kuralları RLS ile)                                                                         | Yönlendirici üzerinden                  |
| `functions`            | Sunucu fonksiyonları (ödeme, yapay zekâ, mağaza, hesap silme)                                                                   | Yönlendirici üzerinden; `test-*` kapalı |
| `goc`                  | Her başlatmada eksik migration'ları uygular (tek seferlik)                                                                      | Hayır                                   |
| `studio` + `meta`      | Yönetim paneli — yalnız gerektiğinde (`--profile yonetim`), yalnız `127.0.0.1:3000` (SSH tüneliyle)                             | Hayır                                   |

Sürümler, testlerin çalıştığı yerel Supabase sürümleriyle aynıdır. Realtime, dosya depolama, günlük toplama ve
bağlantı havuzu kullanılmadığı için kurulmaz.

## 2. Sunucunun ilk kurulumu (bir kez)

Önerilen en az: 4 çekirdek, 8 GB bellek, 80 GB SSD, Ubuntu 24.04.

1. **Güvenlik:** yalnız SSH anahtarıyla giriş (parola kapalı), güvenlik duvarında yalnız 22, 80, 443 açık; otomatik
   güvenlik güncellemeleri (`unattended-upgrades`); Docker günlükleri için boyut sınırı (`/etc/docker/daemon.json`:
   `"log-opts": {"max-size": "50m", "max-file": "5"}`).
2. **Docker** (resmi depo) ve `git` kur.
3. Kod deposu (GitHub yerine sunucuda çıplak depo):

```bash
sudo mkdir -p /opt/repiom.git /opt/repiom && sudo chown $USER /opt/repiom.git /opt/repiom
git init --bare /opt/repiom.git && git clone /opt/repiom.git /opt/repiom
```

Bu bilgisayarda bir kez: `git remote add sunucu ssh://<kullanici>@<sunucu>/opt/repiom.git` ve `git push sunucu main`,
sonra sunucuda `cd /opt/repiom && git pull`. 4. **Ayarlar:** `cd /opt/repiom/sunucu && docker run --rm -v "$PWD":/s -w /s node:24-alpine node anahtar-uret.mjs > .env`
→ `.env` içindeki boşları doldur (alan adı, SMTP, R2, iyzico, Anthropic, Apple/Google, Sentry). `chmod 600 .env`.
**`YEDEK_SIFRESI`'ni ayrıca parola yöneticisine kaydet** — kaybolursa yedekler açılamaz. 5. **Başlat:** `docker compose up -d --build` → `docker compose ps` (hepsi "healthy"). İlk açılışta migration'lar ve
ilk fiyat listesi yüklenir, ilk tam yedek alınır. 6. **Yönetici e-postası** (bir kez):
`docker compose exec db psql -U postgres -c "insert into public.yonetici_epostalar (email) values ('<adres>')"`.

## 3. Yayın (her güncellemede)

```powershell
pnpm yayinla --ssh <kullanici@sunucu>
```

Kuru çalışır; adımları okuyup onaylayınca sonuna `--uygula` eklenir. Sıra: testler → `git push sunucu main` →
sunucuda `git pull` → **sunucuda yayın denetimi** (engel varsa durur) → **anlık yedek** → `docker compose up -d --build`
(migration otomatik) → durum.

Mobil uygulamanın sunucu adresi `https://<alan-adı>`; anahtar `ANON_KEY` (gizli değildir):

```powershell
cd apps/mobile; npx eas-cli@latest env:create --environment production
```

```powershell
cd apps/mobile; npx eas-cli@latest build --platform all --profile production
```

## 4. Yayın sonrası kontrol

1. `https://<alan-adı>` açılıyor; sertifika geçerli; tarayıcı konsolunda güvenlik politikası hatası yok.
2. Yeni hesap → Türkçe doğrulama e-postası → giriş → örnek proje → Excel/PDF; şifremi unuttum e-postası.
3. `docker compose exec yedekci yedek info` → "status: ok", son yedek ve WAL arşivi güncel.
4. Sentry'ye deneme hatası düşüyor; olayda e-posta, IP, istek gövdesi YOK.
5. Yönetici → Kullanım panosu sayıları artıyor.

## 5. Yedekleme

**Hedef: bir arızada en çok birkaç dakikalık veri kaybı; son 2 hafta içinde herhangi bir dakikaya dönebilme.**

| Katman             | Ne yapar                                                           | Sıklık                                     | Nerede  |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------ | ------- |
| Sürekli WAL arşivi | Veritabanındaki her değişiklik (WAL dosyası) şifrelenip gönderilir | Sürekli; en geç **60 sn** (`ARSIV_SURESI`) | R2 (AB) |
| Tam yedek          | Veritabanının tamamı                                               | **Pazar 03:30**                            | R2      |
| Fark yedeği        | Son tam yedekten bu yana değişenler                                | **Her gece 03:30**                         | R2      |
| Saklama            | Son **2 tam yedek** ve aradaki tüm WAL (≈ 2 hafta)                 | Her yedekten sonra                         | R2      |
| Yayın öncesi       | Artımlı anlık yedek                                                | Her yayında                                | R2      |

- Araç: **pgBackRest** (Alpine resmi paketi). Şifreleme sunucuda yapılır (**AES-256**, `YEDEK_SIFRESI`); R2'ye yalnız
  şifreli veri gider (Cloudflare içeriği okuyamaz).
- R2 hazırlığı: AB yetki alanında kova (`repiom-yedek`), yalnız bu kovaya yazma/okuma yetkili API anahtarı. Kovada
  "silme koruması" (Object Lock / yaşam döngüsü) açılabilir; saklamayı pgBackRest yönetir.
- İzleme: `yedekci` servisinin sağlık durumu (son başarılı yedek 26 saatten eskiyse **unhealthy**);
  `docker compose exec yedekci yedek info` (yedek listesi, arşiv aralığı); veritabanında
  `select * from pg_stat_archiver` (başarısız arşiv sayısı 0 kalmalı).

### Geri yükleme

```bash
cd /opt/repiom/sunucu && ./geri-yukle.sh "2026-11-20 14:35:00+03"
```

Belirtilen dakikaya döner (`son` yazılırsa arşivdeki en son ana). Betik önce şimdiki durumun yedeğini alır, servisleri
durdurur, yalnız değişen dosyaları geri yükler, WAL kayıtlarını hedef ana kadar oynatır, servisleri başlatır ve yeni bir
tam yedek alır. Hedef andan sonraki tüm değişiklikler (ödemeler dahil) geri alınır: bakım duyurusuyla ve iki kişiyle.

**Sunucu tamamen kaybolursa:** yeni sunucuda 2. bölümdeki kurulum, **aynı `.env`** (özellikle `YEDEK_SIFRESI`,
`JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, R2 bilgileri) → `docker compose up -d db` yerine önce
`./geri-yukle.sh son` → `docker compose up -d`. Bu yüzden `.env`'in şifreli bir kopyası sunucu dışında (parola
yöneticisinde) tutulmalı.

### Aylık geri yükleme denemesi (zorunlu alışkanlık)

Yedeğin gerçekten açıldığı ancak denenerek bilinir. Ayda bir, **bu bilgisayarda** (sunucuya dokunmadan):
`sunucu/.env`'in kopyasıyla (R2 bilgileri ve `YEDEK_SIFRESI` aynı, `SITE_ADRESI=http://localhost:8080`) yerel deneme
yığınını boş birimlerle başlat → `./geri-yukle.sh son --yerel --env-file <kopya>` → kullanıcı / proje / ödeme
sayılarını üretimle karşılaştır → sonucu not et → `docker compose down -v` ile sil. 19.11.2026'da yerelde denendi:
silinen kayıt hedef dakikaya dönülerek geri geldi, hedef andan sonraki kayıt geri alındı.

## 6. İzleme

- **Sentry:** yeni hata türünde e-posta uyarısı.
- **Sunucu:** disk doluluğu (%80 uyarı), bellek; `docker compose ps` (unhealthy servis yok); sertifika yenileme
  Caddy'de otomatik.
- **Yapay zekâ maliyeti:** Yönetici → Yapay zekâ kullanımı; Anthropic panelinde aylık harcama sınırı.
- **Kullanım:** Yönetici → Kullanım.

## 7. Geri dönüş (hatalı yayın)

- Kod: sunucuda `git checkout <önceki sürüm> && cd sunucu && docker compose up -d --build`.
- Veritabanı migration'ı geri alınmaz; düzeltme migration'ı yazılır. Gerekirse yayın öncesi alınan anlık yedeğin
  zamanına `./geri-yukle.sh` ile dönülür.

## 8. Yerel deneme (bu bilgisayarda)

```powershell
cd sunucu; docker compose -f compose.yaml -f compose.yerel.yaml --env-file .env.yerel up -d --build
```

`.env.yerel`: `node anahtar-uret.mjs` çıktısında `SITE_ADRESI=http://localhost:8080`, `SITE_URL=http://localhost:8080`,
`SMTP_HOST=posta`, `SMTP_PORT=1025`, `YEREL_DENEME=1`, `YEDEK_DEPO_TURU=posix`, `YEDEK_DEPO_YOLU=/yedek-deposu`.
Web: http://localhost:8080 · e-postalar: http://localhost:8025. Bu dosya depoya girmez.
