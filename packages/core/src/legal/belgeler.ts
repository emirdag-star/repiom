/**
 * Sözleşme ve aydınlatma metinleri — TASLAK (avukat incelemesi gerekir). Prototip kaynak/belgeler.js ve
 * kaynak/belgeler_metin.js dosyalarından aktarıldı; içerik değiştirilmedi. {{alan}} yer tutucuları SIRKET bilgisiyle doldurulur.
 * Bir metin değiştiğinde surum güncellenmeli ve aynı sürüm yeni bir migration ile belge_surumleri tablosuna eklenmeli;
 * uygulama yeni sürüm için kullanıcıdan yeniden onay ister.
 */

/** Şirket ve banka bilgileri: köşeli parantezli alanlar YER TUTUCU. */
export const SIRKET = {
  unvan: '[ŞİRKET UNVANI] Ltd. Şti.',
  mersis: '[MERSİS NO]',
  vergiDairesi: '[VERGİ DAİRESİ]',
  vergiNo: '[VERGİ NO]',
  adres: '[AÇIK ADRES]',
  eposta: '[destek@alanadi.com]',
  kvkkEposta: '[kvkk@alanadi.com]',
  kep: '[KEP ADRESİ]',
  telefon: '[TELEFON]',
  site: '[www.alanadi.com]',
  banka: '[BANKA ADI]',
  iban: 'TR[00 0000 0000 0000 0000 0000 00]',
  alici: '[ŞİRKET UNVANI] Ltd. Şti.',
  yzSaglayici: 'Anthropic PBC (ABD)',
} as const;

export type BelgeId =
  | 'kullanici_sozlesmesi'
  | 'kvkk_aydinlatma'
  | 'acik_riza_yurtdisi'
  | 'on_bilgilendirme'
  | 'mesafeli_satis'
  | 'ticari_ileti';

export interface Belge {
  ad: string;
  surum: string;
  metin: string;
}

export const BELGELER: Record<BelgeId, Belge> = {
  kullanici_sozlesmesi: {
    ad: 'Kullanıcı Sözleşmesi',
    surum: '2026-11-taslak-1',
    metin:
      '# Kullanıcı Sözleşmesi\n## 1. Taraflar\nBu sözleşme, {{unvan}} ("REPİO" veya "Şirket"; MERSİS: {{mersis}}; adres: {{adres}}; e-posta: {{eposta}}) ile REPİO(M) web ve mobil uygulamasına ("Uygulama") üye olan kişi ("Kullanıcı") arasında, Kullanıcı\'nın üyelik sırasında elektronik ortamda onay vermesiyle kurulur.\n## 2. Konu\nSözleşmenin konusu; konut inşaatı için yaklaşık maliyet hesaplama, raporlama ve ücretli "Çizimden Maliyet (DXF Analizi)" hizmetlerinin kullanım koşullarıdır. Ücretli hizmetlerin satışı ayrıca Mesafeli Satış Sözleşmesi ile düzenlenir.\n## 3. Üyelik\n- Kullanıcı, verdiği bilgilerin doğru ve güncel olduğunu, hesap ve şifresinin güvenliğinden kendisinin sorumlu olduğunu kabul eder.\n- Üyelik 18 yaşını doldurmuş, ayırt etme gücüne sahip kişilere ve tüzel kişiler adına yetkili temsilcilere açıktır.\n- Hesabın üçüncü kişilerce kullanıldığı fark edilirse Kullanıcı derhal {{eposta}} adresine bildirir.\n## 4. Hizmetin niteliği ve sorumluluğun sınırı\n- Uygulamanın ürettiği metraj, birim fiyat ve maliyetler **yaklaşık** değerlerdir; piyasa koşulları, il katsayıları, varsayımlar ve kullanıcı girdileri ile sınırlıdır. Teklif, keşif, hakediş, ihale veya resmi yaklaşık maliyet yerine geçmez.\n- Çizimden analizde sonuçlar, yüklenen çizimin düzenine ve içeriğine bağlıdır. Okunamayan, eksik ya da hatalı çizilmiş unsurlar sonuçları etkiler. Kullanıcı, kontrol ekranında okunan değerleri incelemekle ve sonuçları kendi mesleki değerlendirmesiyle doğrulamakla yükümlüdür.\n- Yapay zekâ ile üretilen "tahmini" fiyat ve kontrol notları öneri niteliğindedir ve açıkça işaretlenir.\n- Şirket, kast ve ağır ihmal halleri saklı kalmak üzere, sonuçların kullanılmasıyla verilen ticari kararlardan doğan dolaylı zararlardan sorumlu değildir.\n## 5. Kullanıcının yükümlülükleri\n- Kullanıcı, yüklediği çizimler üzerinde gerekli hak ve izinlere sahip olduğunu (müşteri, mimar ve mühendislerin izinleri dahil) kabul eder; üçüncü kişilere ait çizimleri yetkisiz yüklemez.\n- Uygulamayı tersine mühendislik, otomatik toplu sorgulama, güvenlik açığı arama veya hizmeti aksatacak şekilde kullanamaz.\n- Yüklenen dosyaların zararlı yazılım içermemesinden Kullanıcı sorumludur.\n## 6. Fikri haklar\nUygulamanın yazılımı, hesap mantığı, kalem listeleri, rapor biçimleri ve markası Şirket\'e aittir. Kullanıcı\'nın girdiği proje bilgileri ve yüklediği çizimler Kullanıcı\'ya aittir; Şirket bunları yalnızca hizmeti sunmak için işler. Çizimin kendisi sunucuda saklanmaz; okunan özet ve sonuçlar Kullanıcı\'nın projesinde saklanır.\n## 7. Kişisel veriler\nKişisel veriler KVKK Aydınlatma Metni\'nde açıklandığı şekilde işlenir. Yurt dışına aktarım gerektiren yapay zekâ kontrolü yalnızca Kullanıcı\'nın ayrıca verdiği açık rızaya bağlıdır ve isteğe bağlıdır.\n## 8. Ücretli hizmetler\nPaket, analiz hakkı ve fiyatlar Uygulama\'da gösterilir. Analiz hakkı, çizim başarıyla okunduğunda düşer; okunamayan çizim için hak düşmez. Kullanılmayan haklar paket süresi sonunda sona erer.\n## 9. Sözleşmenin değiştirilmesi ve sona ermesi\n- Şirket, bu sözleşmeyi değiştirebilir; değişiklik Kullanıcı\'ya Uygulama içinde bildirilir ve yeni sürüm için onay istenir.\n- Kullanıcı hesabını dilediği zaman kapatabilir. Şirket, sözleşmeye aykırılık halinde hesabı askıya alabilir veya kapatabilir; peşin ödenmiş ve kullanılmamış hizmet bedellerine ilişkin mevzuat hükümleri saklıdır.\n## 10. Uyuşmazlıklar\nBu sözleşmeye Türk hukuku uygulanır. Tüketici sıfatını taşıyan kullanıcılar için Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. Diğer kullanıcılar için [İL] mahkemeleri ve icra daireleri yetkilidir.\n## 11. Delil sözleşmesi\nŞirket\'in elektronik kayıtları (onay kayıtları, işlem kayıtları, sistem günlükleri) HMK m. 193 uyarınca kesin delil niteliğindedir; Kullanıcı\'nın karşı delil sunma hakkı saklıdır.',
  },
  kvkk_aydinlatma: {
    ad: 'KVKK Aydınlatma Metni',
    surum: '2026-11-taslak-1',
    metin:
      "# Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni\n6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") m. 10 ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca, veri sorumlusu sıfatıyla {{unvan}} (adres: {{adres}}) olarak sizi bilgilendiriyoruz.\n## 1. İşlenen kişisel veriler\n- **Kimlik ve iletişim:** e-posta adresi; fatura için ad soyad / unvan, T.C. kimlik no veya vergi no, vergi dairesi, fatura adresi.\n- **Müşteri işlem:** projeler ve girdiler, analiz kayıtları, paket ve analiz hakkı hareketleri, ödeme kayıtları (havale referansı, ödeme kuruluşu işlem numarası). Kart bilgileri Şirket'e ulaşmaz; ödeme kuruluşunca işlenir.\n- **Onay kayıtları:** hangi metni hangi sürümüyle ne zaman onayladığınız ve tarayıcı bilgisi.\n- **İşlem güvenliği:** oturum bilgileri, IP adresi ve sistem günlükleri.\n- **Çizim içeriği:** Yüklediğiniz DXF dosyaları cihazınızda okunur; dosyanın kendisi sunucularımıza yüklenmez. Çizimde yer alan kişisel veriler (ör. pafta antedindeki isimler) işlenmez; yalnızca kat, mahal, alan ve yapı elemanı bilgileri projeye aktarılır.\n## 2. İşleme amaçları ve hukuki sebepler\n- Üyelik ve hizmetin sunulması, maliyet hesaplama ve raporlama, analiz hakkının yönetimi — **sözleşmenin kurulması ve ifası** (KVKK m. 5/2-c).\n- Fatura düzenlenmesi, muhasebe ve vergi kayıtları, ticari defterler — **hukuki yükümlülük** (m. 5/2-ç; VUK, TTK, 6563 sayılı Kanun).\n- Onay ve işlem kayıtlarının saklanması, uyuşmazlıklarda ispat — **bir hakkın tesisi, kullanılması veya korunması** (m. 5/2-e).\n- Bilgi güvenliği, kötüye kullanımın önlenmesi, hizmetin iyileştirilmesi — **meşru menfaat** (m. 5/2-f).\n- Kampanya ve yenilik bildirimleri — yalnızca **açık rızanız / ticari ileti onayınız** ile.\n- İsteğe bağlı yapay zekâ kontrolü için yurt dışına aktarım — Açık Rıza Metni'nde ayrıca açıklanır.\n## 3. Aktarım\n- **Barındırma ve altyapı hizmet sağlayıcıları** (veri işleyen sıfatıyla): [SUNUCU/BULUT SAĞLAYICI, ÜLKE].\n- **Ödeme kuruluşu:** [iyzico Ödeme Hizmetleri A.Ş. / seçilecek kuruluş] — kartla ödemelerde; mobil uygulama içi satın almalarda Apple Inc. / Google LLC.\n- **Mali müşavir, e-fatura/e-arşiv hizmet sağlayıcısı, bankalar** — hukuki yükümlülükler için.\n- **Yetkili kamu kurum ve kuruluşları** — talep halinde ve mevzuat gereği.\n- **Yapay zekâ sağlayıcısı ({{yzSaglayici}})** — yalnızca açık rıza verirseniz; plan görselleri ve okunan metraj özeti, kişisel veri ayıklanarak.\n## 4. Toplama yöntemi\nVeriler Uygulama'daki formlar, yüklediğiniz dosyaların cihazınızda okunması, ödeme kuruluşundan dönen sonuçlar ve sistem kayıtları aracılığıyla, kısmen otomatik yollarla elektronik ortamda toplanır.\n## 5. Saklama süresi\nÜyelik süresince ve sona ermesinden sonra ilgili mevzuattaki süreler (fatura ve ticari kayıtlar için 10 yıl, işlem güvenliği kayıtları için [2] yıl) boyunca saklanır; süre sonunda silinir, yok edilir veya anonim hale getirilir.\n## 6. Haklarınız (KVKK m. 11)\nVerilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini, şartları oluştuğunda silinmesini veya yok edilmesini ve bunların aktarılan kişilere bildirilmesini isteme, otomatik sistemlerle analiz sonucu aleyhinize bir sonuca itiraz etme ve kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme haklarına sahipsiniz.\nBaşvurularınızı Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak yazılı şekilde {{adres}} adresine, KEP ile {{kep}} adresine veya sistemimizde kayıtlı e-posta adresinizden {{kvkkEposta}} adresine iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz sonuçlandırılır.",
  },
  acik_riza_yurtdisi: {
    ad: 'Açık Rıza Metni (yurt dışına aktarım)',
    surum: '2026-11-taslak-1',
    metin:
      "# Açık Rıza Metni — Yapay Zekâ Kontrolü ve Yurt Dışına Aktarım\nBu rıza **isteğe bağlıdır**. Vermemeniz halinde Çizimden Maliyet analizi yine yapılır; yalnızca yapay zekâ kontrolü ve yapay zekâ ile fiyat tahmini kullanılmaz, yeni kalemler varsayılan tahmini fiyatla gelir.\n## Aktarılan bilgiler\n- Okunan kat planlarının görüntüsü (yazılar olmadan çizgi görüntüsü), mahal adları ve alanları, kaplama bilgileri, kapı-pencere ve yapı elemanı ölçüleri.\n- Pafta antedi, isim, adres, ada-parsel gibi bilgiler aktarılmaz. Aktarılan içerik kural olarak kişisel veri içermez; çizimde istisnai olarak bir kişisel veri bulunması halinde bu rıza o veriyi de kapsar.\n## Alıcı ve ülke\n{{yzSaglayici}} — Amerika Birleşik Devletleri. Sağlayıcı, bu içeriği yalnızca istenen kontrolü yapmak için işler; ticari kullanım koşulları gereği içeriği model eğitimi için kullanmaz. [AVUKAT: sağlayıcı sözleşmesindeki saklama süresi ve veri işleme eki burada belirtilmeli.]\n## Amaç\nOkunan metrajın çizimle tutarlılığının kontrolü, gözden kaçmış kalemlerin işaretlenmesi ve fiyat listesinde bulunmayan kalemler için tahmini birim fiyat önerilmesi.\n## Riskler (KVKK m. 9/6-a)\nAktarımın yapılacağı ülke için Kişisel Verileri Koruma Kurulu'nun yeterlilik kararı bulunmamaktadır ve [standart sözleşme / bağlayıcı şirket kuralları] ile uygun güvence sağlanamamış olabilir. Bu durumda verileriniz Türkiye'deki koruma düzeyine eşdeğer bir korumadan yararlanamayabilir ve o ülkedeki kamu makamlarının erişimine konu olabilir.\n## Geri alma\nRızanızı dilediğiniz zaman {{kvkkEposta}} adresine bildirerek veya Uygulama ayarlarından geri alabilirsiniz; geri alma ileriye etkilidir.\n[AVUKAT NOTU: 1 Eylül 2024 sonrası düzenli aktarımlar için açık rıza tek başına dayanak değildir. Tercihen sağlayıcı ile Kurul'un 2 No.lu standart sözleşmesi (veri sorumlusundan veri işleyene) imzalanıp 5 iş günü içinde Kurul'a bildirilmeli; aktarımın kişisel veri içermeyecek şekilde tasarlanması (antet ve yazıların ayıklanması) ayrıca risk azaltıcıdır.]",
  },
  on_bilgilendirme: {
    ad: 'Ön Bilgilendirme Formu',
    surum: '2026-11-taslak-1',
    metin:
      '# Ön Bilgilendirme Formu\n6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, sözleşme kurulmadan önce:\n## Satıcı\n{{unvan}} · MERSİS {{mersis}} · {{vergiDairesi}} V.D. {{vergiNo}} · {{adres}} · {{telefon}} · {{eposta}} · KEP {{kep}}\n## Hizmet\nREPİO(M) "Çizimden Maliyet" dijital hizmeti: seçilen pakete göre belirli sayıda proje analizi hakkı ve paket süresince ücretli özelliklere erişim. Paket adı, analiz hakkı, süre ve toplam bedel (vergiler dahil) ödeme ekranında gösterilir.\n## Ödeme ve ifa\n- Ödeme kredi/banka kartı ile [ödeme kuruluşu] üzerinden ya da havale/EFT ile yapılır. Havalede hak, ödemenin hesaba geçtiği ve açıklamadaki referans kodunun eşleştiği anda tanımlanır.\n- Hizmet elektronik ortamda, ödeme onayıyla birlikte anında ifa edilir. Ek teslimat veya kargo bedeli yoktur.\n## Cayma hakkı\n- Mesafeli Sözleşmeler Yönetmeliği m. 15/1-ğ uyarınca **elektronik ortamda anında ifa edilen hizmetlerde** ve m. 15/1-h kapsamında tüketicinin onayı ile cayma süresi dolmadan ifasına başlanan hizmetlerde cayma hakkı kullanılamaz. [AVUKAT: bent harflerini 2022 değişikliği sonrası metinle teyit edin.]\n- Tüketici, ödeme ekranında hizmetin hemen ifasına başlanmasını onaylar. Hiç analiz hakkı kullanılmamış paketlerde, satın almadan itibaren 14 gün içinde {{eposta}} adresine bildirimle cayma talebi [Şirket politikası olarak] kabul edilir ve bedel 14 gün içinde aynı ödeme aracıyla iade edilir.\n## Şikâyet ve itiraz\nTalep ve şikâyetler {{eposta}} adresine iletilebilir. Uyuşmazlıklarda, her yıl belirlenen parasal sınırlar dahilinde tüketicinin yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyeti, sınırı aşan uyuşmazlıklarda Tüketici Mahkemesi yetkilidir.\n## Teknik koşullar\nHizmet güncel bir web tarayıcısı veya mobil uygulama ve internet bağlantısı gerektirir. DXF dosyaları cihazda okunur; dosya boyutu ve cihaz belleği okuma süresini etkiler.',
  },
  mesafeli_satis: {
    ad: 'Mesafeli Satış Sözleşmesi',
    surum: '2026-11-taslak-1',
    metin:
      "# Mesafeli Satış Sözleşmesi\n## Madde 1 — Taraflar\n**Satıcı:** {{unvan}}, {{adres}}, {{vergiDairesi}} V.D. {{vergiNo}}, {{eposta}}.\n**Alıcı:** Ödeme ekranında fatura bilgilerini giren ve sözleşmeyi elektronik ortamda onaylayan Kullanıcı.\n## Madde 2 — Konu\nAlıcı'nın Uygulama üzerinden satın aldığı dijital hizmet paketinin (abonelik veya ek proje analizi) satışı ve ifasına ilişkin tarafların hak ve yükümlülükleri.\n## Madde 3 — Hizmetin özellikleri ve bedel\nPaketin adı, içerdiği analiz hakkı, geçerlilik süresi, birim ve toplam bedeli (KDV dahil) ve ödeme yöntemi, ödeme ekranında ve Alıcı'ya gönderilen onay bildiriminde yer alır ve bu sözleşmenin ayrılmaz parçasıdır.\n## Madde 4 — İfa\n- Kartla ödemede hak, ödeme kuruluşunun onayıyla; havale/EFT'de ödeme Satıcı hesabına geçip referans kodu eşleştiğinde, en geç [2] iş günü içinde tanımlanır.\n- Abonelik yenilemesinde yeni süre, mevcut aboneliğin bitiş tarihinden başlar. Kullanılmayan haklar süre sonunda sona erer.\n- Bir analiz hakkı, yüklenen çizim başarıyla okunup kontrol ekranı açıldığında kullanılmış sayılır. Çizim okunamazsa hak düşmez. Hazır örnek çizimle deneme ücretsizdir ve hak düşmez.\n## Madde 5 — Cayma hakkı\nAlıcı tüketici ise, elektronik ortamda anında ifa edilen hizmet niteliği gereği ve hizmetin hemen ifasına başlanmasına verdiği onay ile Mesafeli Sözleşmeler Yönetmeliği m. 15 uyarınca cayma hakkı bulunmamaktadır. Satıcı, hiç kullanılmamış paketler için 14 gün içinde iade talebini kabul eder; bedel 14 gün içinde aynı ödeme aracıyla iade edilir. Kurumsal (tacir) alıcılar için cayma hakkı hükümleri uygulanmaz.\n## Madde 6 — Fatura\nFatura, Alıcı'nın girdiği bilgilerle elektronik olarak düzenlenir ve kayıtlı e-posta adresine gönderilir. Bilgilerin doğruluğundan Alıcı sorumludur.\n## Madde 7 — Hizmetin kesintisi\nPlanlı bakım ve mücbir sebepler dışında hizmetin [24] saati aşan kesintilerinde, kesinti süresi abonelik süresine eklenir.\n## Madde 8 — Mobil uygulama içi satın alma\nApp Store veya Google Play üzerinden yapılan satın almalarda ödeme, yenileme, iptal ve iade ilgili mağazanın koşullarına tabidir.\n## Madde 9 — Yetkili merci\nTüketici uyuşmazlıklarında Ticaret Bakanlığınca ilan edilen parasal sınırlar dahilinde Tüketici Hakem Heyetleri, sınırı aşan uyuşmazlıklarda Tüketici Mahkemeleri yetkilidir.\n## Madde 10 — Yürürlük\nAlıcı, ödeme ekranında bu sözleşmeyi ve Ön Bilgilendirme Formu'nu okuyup onayladığında sözleşme kurulur. Onay kaydı ve sözleşme metni Satıcı tarafından saklanır ve Alıcı'nın erişimine açıktır.",
  },
  ticari_ileti: {
    ad: 'Ticari Elektronik İleti İzni',
    surum: '2026-11-taslak-1',
    metin:
      "# Ticari Elektronik İleti Onayı\n6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik uyarınca; {{unvan}} tarafından kampanya, yeni özellik, eğitim ve etkinlik duyurularının e-posta adresime gönderilmesine onay veriyorum.\n- Bu onay isteğe bağlıdır; vermemem üyeliğimi ve hizmeti etkilemez.\n- Onayımı her iletideki ret bağlantısıyla, Uygulama ayarlarından veya İleti Yönetim Sistemi (İYS) üzerinden dilediğim zaman geri alabilirim.\n- Üyelik, ödeme ve hizmetle ilgili zorunlu bilgilendirmeler bu onaydan bağımsız olarak gönderilir.\n[NOT: Ticari ileti göndermeden önce Şirket İYS'ye kaydolmalı ve onaylar İYS'ye iletilmelidir.]",
  },
};

/** Kayıtta zorunlu onaylar. */
export const KAYIT_ZORUNLU: BelgeId[] = ['kullanici_sozlesmesi', 'kvkk_aydinlatma'];
/** Kayıtta isteğe bağlı (önceden işaretli olmaz). */
export const KAYIT_ISTEGE_BAGLI: BelgeId[] = ['acik_riza_yurtdisi', 'ticari_ileti'];
/** Ödemede zorunlu onaylar. */
export const ODEME_ZORUNLU: BelgeId[] = ['on_bilgilendirme', 'mesafeli_satis'];

/** Belge metni, {{alan}} yer tutucuları şirket bilgisiyle doldurulmuş olarak. */
export function belgeMetni(id: BelgeId): string {
  const s = SIRKET as Record<string, string>;
  return BELGELER[id].metin.replace(/\{\{(\w+)\}\}/g, (_, k: string) => (s[k] != null ? s[k] : `{{${k}}}`));
}
