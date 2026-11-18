/* OTOMATİK ÜRETİLDİ: araclar/veri_uret.py. Elle düzenlemeyin; kaynak REPIOM_Hesap_Mantigi_v4.xlsx */
(function(g){g.REPIOM_VERI={
"girdi": [
{
"ad": "ARSA",
"etiket": "Arsa m²",
"deger": 3500,
"formul": null,
"not_": "Kullanıcı girer"
},
{
"ad": "TAKS",
"etiket": "TAKS",
"deger": 0.22,
"formul": null,
"not_": "Kullanıcı girer"
},
{
"ad": "KAKS",
"etiket": "KAKS",
"deger": 2,
"formul": null,
"not_": "Kullanıcı girer"
},
{
"ad": "K_INSAAT",
"etiket": "İnşaat alanı katsayısı",
"deger": 1.56,
"formul": null,
"not_": "Varsayılan 1,56; kullanıcı değiştirebilir"
},
{
"ad": "BLOK_ADEDI",
"etiket": "Blok adedi",
"deger": 2,
"formul": null,
"not_": "Kullanıcı girer (en fazla 10)"
},
{
"ad": "TOPLAM_OTURUM",
"etiket": "Toplam blok oturumu m²",
"deger": null,
"formul": "v.ARSA*v.TAKS",
"not_": "Otomatik; blok oturumları toplamı bunu aşarsa uyarı"
},
{
"ad": "CEVRE_ALAN",
"etiket": "Çevre düzenleme alanı m²",
"deger": null,
"formul": "v.ARSA-v.TOPLAM_OTURUM",
"not_": "Otomatik"
},
{
"ad": "TIA",
"etiket": "Toplam inşaat alanı m²",
"deger": null,
"formul": "v.ARSA*v.KAKS*v.K_INSAAT",
"not_": "Otomatik; kullanıcı elle de girebilir"
},
{
"ad": "TOPLAM_DAIRE",
"etiket": "Projedeki toplam daire adedi",
"deger": 90,
"formul": null,
"not_": "Otomatik: tüm blokların daire toplamı (örnekte A+B = 45+45)"
},
{
"ad": "IL_KATSAYI",
"etiket": "İl katsayısı",
"deger": 1,
"formul": null,
"not_": "İl seçimine göre \"İl Katsayıları\" sayfasından gelir; yalnız piyasa fiyatlarına uygulanır"
},
{
"ad": "SURE_AY",
"etiket": "İnşaat süresi (ay)",
"deger": 18,
"formul": null,
"not_": "Kullanıcı girer; varsayılan 18"
},
{
"ad": "SATIS_OFISI",
"etiket": "Satış ofisi yapılacak mı (1=evet, 0=hayır)",
"deger": 1,
"formul": null,
"not_": "Seçmeli"
},
{
"ad": "ORNEK_DAIRE",
"etiket": "Örnek daire yapılacak mı (1/0)",
"deger": 1,
"formul": null,
"not_": "Seçmeli"
},
{
"ad": "JENERATOR",
"etiket": "Jeneratör (1/0)",
"deger": 1,
"formul": null,
"not_": "Seçmeli"
},
{
"ad": "TRAFO",
"etiket": "Trafo (1/0)",
"deger": 1,
"formul": null,
"not_": "Seçmeli"
},
{
"ad": "S_HAMAM",
"etiket": "Hamam (1/0)",
"deger": 0,
"formul": null,
"not_": "Sosyal tesis seçimi"
},
{
"ad": "S_SAUNA",
"etiket": "Sauna (1/0)",
"deger": 0,
"formul": null,
"not_": "Sosyal tesis seçimi"
},
{
"ad": "S_FIN",
"etiket": "Fin hamamı (1/0)",
"deger": 0,
"formul": null,
"not_": "Sosyal tesis seçimi"
},
{
"ad": "S_FITNESS",
"etiket": "Fitness (1/0)",
"deger": 0,
"formul": null,
"not_": "Sosyal tesis seçimi"
},
{
"ad": "S_HAVUZ",
"etiket": "Havuz (1/0)",
"deger": 0,
"formul": null,
"not_": "Sosyal tesis seçimi"
},
{
"ad": "HAVUZ_M2",
"etiket": "Havuz su yüzeyi m²",
"deger": 100,
"formul": null,
"not_": "Havuz varsa kullanıcı girer; varsayılan 100"
},
{
"ad": "TABAN",
"etiket": "Taban oturumu m²",
"deger": 405,
"formul": null,
"not_": "Kullanıcı girer"
},
{
"ad": "BIA",
"etiket": "Blok inşaat alanı m²",
"deger": 5700,
"formul": null,
"not_": "Kullanıcı girer"
},
{
"ad": "CEPHE_TIP",
"etiket": "Dış cephe kaplaması",
"deger": "EPS",
"formul": null,
"not_": "EPS / XPS / TAŞYÜNÜ / ÖZEL"
},
{
"ad": "N_ASANSOR",
"etiket": "Asansör adedi",
"deger": 2,
"formul": null,
"not_": "Kullanıcı girer"
},
{
"ad": "N_MERDIVEN",
"etiket": "Merdiven adedi",
"deger": 2,
"formul": null,
"not_": "Kullanıcı girer"
},
{
"ad": "ISITMA",
"etiket": "Isıtma sistemi",
"deger": "KOMBİ",
"formul": null,
"not_": "KOMBİ / MERKEZİ"
},
{
"ad": "ISITMA_SEKLI",
"etiket": "Isıtma şekli",
"deger": "RADYATÖR",
"formul": null,
"not_": "RADYATÖR / YERDEN ISITMA"
},
{
"ad": "BANYO_TAVAN",
"etiket": "Banyo WC asma tavan",
"deger": "YEŞİL ALÇIPAN",
"formul": null,
"not_": "YEŞİL ALÇIPAN / ALÜMİNYUM PANEL (birim fiyatı etkiler)"
},
{
"ad": "CATI_TIP",
"etiket": "Çatı tipi",
"deger": "KIRMA",
"formul": null,
"not_": "KIRMA (çelik+OSB+kiremit) / TERAS"
},
{
"ad": "DOSEME",
"etiket": "Döşeme sistemi",
"deger": "ASMOLEN",
"formul": null,
"not_": "ASMOLEN / KİRİŞLİ"
},
{
"ad": "SU_DEPOSU",
"etiket": "Su deposu",
"deger": "MODÜLER",
"formul": null,
"not_": "YOK / BETONARME / MODÜLER"
},
{
"ad": "N_DILATASYON",
"etiket": "Dilatasyon adedi",
"deger": 0,
"formul": null,
"not_": "Blokta dilatasyon derzi sayısı; varsayılan 0"
},
{
"ad": "MANTO_SIVA",
"etiket": "Mantolama altına sıva (1=evet, 0=hayır)",
"deger": 0,
"formul": null,
"not_": "Evet ise dış cephe sıvası net cephenin tamamı, hayır ise %10"
},
{
"ad": "N_BOD",
"etiket": "Bodrum kat adedi",
"deger": 1,
"formul": null,
"not_": ""
},
{
"ad": "H_BOD",
"etiket": "Bodrum kat yüksekliği m",
"deger": 3,
"formul": null,
"not_": ""
},
{
"ad": "A_BOD",
"etiket": "Bodrum kat m²",
"deger": 405,
"formul": null,
"not_": ""
},
{
"ad": "N_NOR",
"etiket": "Normal kat adedi",
"deger": 9,
"formul": null,
"not_": ""
},
{
"ad": "H_NOR",
"etiket": "Normal kat yüksekliği m",
"deger": 3,
"formul": null,
"not_": ""
},
{
"ad": "A_NOR",
"etiket": "Normal kat m²",
"deger": 430,
"formul": null,
"not_": ""
},
{
"ad": "N_DUK",
"etiket": "Dükkan katı adedi",
"deger": 0,
"formul": null,
"not_": ""
},
{
"ad": "H_DUK",
"etiket": "Dükkan katı yüksekliği m",
"deger": 0,
"formul": null,
"not_": ""
},
{
"ad": "A_DUK",
"etiket": "Dükkan katı m²",
"deger": 0,
"formul": null,
"not_": ""
},
{
"ad": "N_OTO",
"etiket": "Otopark katı adedi",
"deger": 1,
"formul": null,
"not_": ""
},
{
"ad": "H_OTO",
"etiket": "Otopark katı yüksekliği m",
"deger": 4,
"formul": null,
"not_": ""
},
{
"ad": "A_OTO",
"etiket": "Otopark katı m²",
"deger": 405,
"formul": null,
"not_": ""
},
{
"ad": "KAT_YERALTI",
"etiket": "Yer altı kat adedi",
"deger": null,
"formul": "v.N_BOD+v.N_OTO",
"not_": "VARSAYIM: bodrum ve otopark katları zemin altında"
},
{
"ad": "H_YERALTI",
"etiket": "Yer altı yüksekliği m",
"deger": null,
"formul": "v.N_BOD*v.H_BOD+v.N_OTO*v.H_OTO",
"not_": ""
},
{
"ad": "H_USTU",
"etiket": "Zemin üstü yükseklik m",
"deger": null,
"formul": "v.N_NOR*v.H_NOR+v.N_DUK*v.H_DUK",
"not_": ""
},
{
"ad": "KAT_TOPLAM",
"etiket": "Toplam kat adedi",
"deger": null,
"formul": "v.N_BOD+v.N_NOR+v.N_DUK+v.N_OTO",
"not_": ""
},
{
"ad": "H_TEMEL",
"etiket": "Temel (radye) kalınlığı m",
"deger": null,
"formul": "Math.max(0.5,v.K_TEMEL_A+v.K_TEMEL_B*v.KAT_TOPLAM)",
"not_": "Kat sayısına göre tahmin"
},
{
"ad": "CEVRE_T",
"etiket": "Taban çevre uzunluğu m",
"deger": null,
"formul": "v.K_CEVRE*Math.sqrt(v.TABAN)",
"not_": "Alandan çevre tahmini"
},
{
"ad": "CEVRE_N",
"etiket": "Normal kat çevre uzunluğu m",
"deger": null,
"formul": "v.K_CEVRE*Math.sqrt(v.A_NOR)",
"not_": ""
},
{
"ad": "CEPHE_BRUT",
"etiket": "Brüt cephe alanı m²",
"deger": null,
"formul": "v.CEVRE_N*v.H_USTU",
"not_": "Çevre × zemin üstü yükseklik"
},
{
"ad": "PENCERE_ALAN",
"etiket": "Pencere alanı m²",
"deger": null,
"formul": "v.CEPHE_BRUT*v.K_PENCERE",
"not_": ""
},
{
"ad": "CEPHE_NET",
"etiket": "Net (dolu) cephe alanı m²",
"deger": null,
"formul": "v.CEPHE_BRUT-v.PENCERE_ALAN",
"not_": ""
},
{
"ad": "ND",
"etiket": "Bloktaki daire adedi",
"deger": null,
"formul": "SP(t=>t.N)",
"not_": ""
},
{
"ad": "DA",
"etiket": "Daire brüt alanları toplamı m²",
"deger": null,
"formul": "SP(t=>(t.N)*(t.A))",
"not_": ""
},
{
"ad": "DA_NET",
"etiket": "Daire net alanları toplamı m²",
"deger": null,
"formul": "v.DA*v.K_NET",
"not_": ""
},
{
"ad": "ODA_TOPLAM",
"etiket": "Oda+salon toplamı",
"deger": null,
"formul": "SP(t=>(t.N)*(t.ODA))+v.ND",
"not_": "Her dairede oda sayısı + 1 salon"
},
{
"ad": "BANYO_TOPLAM",
"etiket": "Banyo toplamı (genel+ebeveyn)",
"deger": null,
"formul": "v.ND+SP(t=>(t.N)*(t.EBANYO))",
"not_": ""
},
{
"ad": "BALKON_TOPLAM",
"etiket": "Balkon toplamı",
"deger": null,
"formul": "SP(t=>(t.N)*(t.BALKON))",
"not_": ""
},
{
"ad": "KLIMA_TOPLAM",
"etiket": "Klima toplamı",
"deger": null,
"formul": "SP(t=>(t.N)*(t.KLIMA))",
"not_": ""
},
{
"ad": "PENCERE_ADET",
"etiket": "Pencere adedi",
"deger": null,
"formul": "v.ODA_TOPLAM+SP(t=>(t.N)*(t.AYRI))",
"not_": "Her oda/salon + ayrı mutfak"
},
{
"ad": "ISLAK_ZEMIN",
"etiket": "Islak hacim zemin alanı m²",
"deger": null,
"formul": "v.ND*v.K_BANYO_M2+SP(t=>(t.N)*(t.EBANYO))*v.K_EBANYO_M2+SP(t=>(t.N)*(t.ALATURKA))*v.K_WC_M2",
"not_": ""
},
{
"ad": "MUTFAK_ZEMIN",
"etiket": "Ayrı mutfak zemin alanı m²",
"deger": null,
"formul": "SP(t=>(t.N)*(t.AYRI))*v.K_MUTFAK_M2",
"not_": "Amerikan mutfakta zemin parke kabul edildi"
},
{
"ad": "BALKON_ALAN",
"etiket": "Balkon zemin alanı m²",
"deger": null,
"formul": "v.BALKON_TOPLAM*v.K_BALKON_M2",
"not_": ""
},
{
"ad": "SERAMIK_ZEMIN",
"etiket": "Seramik zemin m²",
"deger": null,
"formul": "v.ISLAK_ZEMIN+v.MUTFAK_ZEMIN+v.BALKON_ALAN+v.ND*v.K_DAIRE_HOL",
"not_": "Islak hacim + ayrı mutfak + balkon + daire holü"
},
{
"ad": "SERAMIK_DUVAR",
"etiket": "Seramik duvar m²",
"deger": null,
"formul": "v.BANYO_TOPLAM*v.K_BANYO_DUVAR+SP(t=>(t.N)*(t.ALATURKA))*v.K_WC_DUVAR+v.ND*v.K_TEZGAH_ARASI",
"not_": ""
},
{
"ad": "HOL_ALAN",
"etiket": "Kat holü alanı m²",
"deger": null,
"formul": "Math.max(v.N_NOR*v.A_NOR-v.DA,v.K_HOL*v.N_NOR*v.A_NOR)",
"not_": "Normal kat alanı - daireler; en az %12"
},
{
"ad": "DUVAR_IC",
"etiket": "İç duvar alanı m²",
"deger": null,
"formul": "v.N_NOR*v.A_NOR*v.K_ICDUVAR+(v.N_BOD*v.A_BOD+v.N_DUK*v.A_DUK)*v.K_ICDUVAR_BODRUM",
"not_": ""
},
{
"ad": "DUVAR_DIS",
"etiket": "Dış duvar alanı m²",
"deger": null,
"formul": "v.CEPHE_NET*(1-v.K_BA_CEPHE)",
"not_": "Dolu cepheden kolon-kiriş-perde payı düşülür"
},
{
"ad": "DUVAR_YUZEY",
"etiket": "Daire içi duvar yüzeyi m²",
"deger": null,
"formul": "v.DA_NET*v.K_DUVAR_YUZEY*v.H_NOR/3-v.SERAMIK_DUVAR",
"not_": "Sıva-boya yapılacak yüzey (seramik hariç)"
},
{
"ad": "ORTAK_DUVAR",
"etiket": "Ortak alan duvar yüzeyi m²",
"deger": null,
"formul": "v.HOL_ALAN*v.K_HOL_DUVAR+v.N_MERDIVEN*v.KAT_TOPLAM*v.K_MERD_DUVAR",
"not_": "Kat holleri + merdiven kovaları"
},
{
"ad": "ASMA_TAVAN",
"etiket": "Alçıpan asma tavan alanı m²",
"deger": null,
"formul": "v.ND*v.K_ASMA_TAVAN+v.HOL_ALAN",
"not_": "Daire antre/koridor + kat holleri"
},
{
"ad": "TAVAN_SIVA",
"etiket": "Sıvalı tavan alanı m²",
"deger": null,
"formul": "v.DA_NET-v.ISLAK_ZEMIN-v.ND*v.K_ASMA_TAVAN-v.BALKON_ALAN",
"not_": ""
},
{
"ad": "PAY",
"etiket": "Bloğun proje payı",
"deger": null,
"formul": "v.BIA/v.TIA",
"not_": "Proje geneli kalemler bloklara inşaat alanı oranında paylaştırılır"
}
],
"katsayi": [
{
"ad": "K_CEVRE",
"etiket": "Çevre katsayısı",
"deger": 4.5,
"not_": "Çevre = 4,5 × √alan. Kare planda 4,0; 1:2 dikdörtgende 4,24; girinti-çıkıntı payıyla 4,5"
},
{
"ad": "K_PENCERE",
"etiket": "Pencere oranı",
"deger": 0.22,
"not_": "Pencere alanı / brüt cephe alanı"
},
{
"ad": "K_BA_CEPHE",
"etiket": "Cephede betonarme oranı",
"deger": 0.25,
"not_": "Dolu cephede kolon-kiriş-perde payı (tuğla örülmeyen kısım)"
},
{
"ad": "K_NET",
"etiket": "Net/brüt daire oranı",
"deger": 0.85,
"not_": "Daire net alanı / brüt alanı"
},
{
"ad": "K_HOL",
"etiket": "Kat holü asgari oranı",
"deger": 0.12,
"not_": "Kat holü + merdiven + asansör önü / normal kat alanı"
},
{
"ad": "K_KAZI",
"etiket": "Kazı genişleme katsayısı",
"deger": 1.25,
"not_": "Kazı taban alanı / taban oturumu (çalışma boşluğu + şev)"
},
{
"ad": "K_KAZI_EK",
"etiket": "Kazı ek derinliği m",
"deger": 0.4,
"not_": "Grobeton + temel altı dolgu için"
},
{
"ad": "K_GERIDOLGU",
"etiket": "Geri dolgu genişliği m",
"deger": 1.5,
"not_": "Perde çevresinde doldurulan bant genişliği"
},
{
"ad": "K_DOLGU_H",
"etiket": "Temel altı dolgu kalınlığı m",
"deger": 0.3,
"not_": ""
},
{
"ad": "K_TEMEL_TASMA",
"etiket": "Temel taşma katsayısı",
"deger": 1.1,
"not_": "Radye alanı / taban oturumu"
},
{
"ad": "K_TEMEL_A",
"etiket": "Temel kalınlığı sabiti m",
"deger": 0.3,
"not_": "Radye kalınlığı = 0,30 + 0,05 × toplam kat (en az 0,50)"
},
{
"ad": "K_TEMEL_B",
"etiket": "Temel kalınlığı kat çarpanı m",
"deger": 0.05,
"not_": ""
},
{
"ad": "K_GRO_H",
"etiket": "Grobeton kalınlığı m",
"deger": 0.1,
"not_": ""
},
{
"ad": "K_BACA",
"etiket": "Bina bacası aralığı m",
"deger": 25,
"not_": "Bina çevresinde her 25 m için 1 baca + 2"
},
{
"ad": "K_KANAL",
"etiket": "Ø200 kanal katsayısı",
"deger": 0.75,
"not_": "Kanal uzunluğu / taban çevresi"
},
{
"ad": "K_BETON_ASM",
"etiket": "Beton - asmolen döşeme m³/m²",
"deger": 0.36,
"not_": "Kat betonu (kolon+perde+kiriş+döşeme) / blok inşaat alanı; temel ve bodrum perdesi ayrı"
},
{
"ad": "K_BETON_KIR",
"etiket": "Beton - kirişli döşeme m³/m²",
"deger": 0.32,
"not_": "Aynı tanım, kirişli plak sistem"
},
{
"ad": "K_PERDE",
"etiket": "Bodrum perde kalınlığı m",
"deger": 0.3,
"not_": "Çevre perdesi"
},
{
"ad": "K_DONATI",
"etiket": "Donatı t/m²",
"deger": 0.04,
"not_": "Ton donatı / m² blok inşaat alanı (senin düzeltmen)"
},
{
"ad": "K_KALIP",
"etiket": "Kat betonarme işçiliği alan katsayısı",
"deger": 1.2,
"not_": "Düz ölçü metrajı / blok inşaat alanı (senin düzeltmen)"
},
{
"ad": "K_ASMOLEN",
"etiket": "Asmolen m³/m²",
"deger": 0.11,
"not_": "Asmolen blok hacmi / blok inşaat alanı"
},
{
"ad": "K_CATI",
"etiket": "Çatı eğim+saçak katsayısı",
"deger": 1.2,
"not_": "Çatı yüzeyi / normal kat alanı"
},
{
"ad": "K_CATI_CELIK",
"etiket": "Çatı çeliği kg/m²",
"deger": 12,
"not_": "Kg çelik / normal kat alanı"
},
{
"ad": "K_DERE",
"etiket": "Gizli dere genişliği m",
"deger": 0.8,
"not_": "Kırma çatıda CTP uygulanan dere bandı"
},
{
"ad": "K_EGIM_H",
"etiket": "Eğim+koruma betonu kalınlığı m",
"deger": 0.12,
"not_": "Teras çatıda ortalama"
},
{
"ad": "K_ICDUVAR",
"etiket": "İç duvar m²/m²",
"deger": 0.9,
"not_": "İç bölme duvar alanı / normal kat alanı"
},
{
"ad": "K_ICDUVAR_BODRUM",
"etiket": "Bodrum-dükkan iç duvar m²/m²",
"deger": 0.3,
"not_": ""
},
{
"ad": "K_TUGLA",
"etiket": "Tuğla adet/m²",
"deger": 27,
"not_": "19×19 yatay delikli tuğla, %5 zayiat dahil"
},
{
"ad": "K_KUM_10",
"etiket": "Kum - 10 cm duvar m³/m²",
"deger": 0.025,
"not_": "Örgü harcı kumu"
},
{
"ad": "K_KUM_135",
"etiket": "Kum - 13,5 cm duvar m³/m²",
"deger": 0.032,
"not_": ""
},
{
"ad": "K_CIMENTO",
"etiket": "Çimento t/m³ kum",
"deger": 0.27,
"not_": "Ton çimento / m³ kum (300 dozlu harç)"
},
{
"ad": "K_LENTO",
"etiket": "Lento m³/boşluk",
"deger": 0.03,
"not_": "Kapı ve pencere başına"
},
{
"ad": "K_BANYO_M2",
"etiket": "Genel banyo zemin m²",
"deger": 4.5,
"not_": ""
},
{
"ad": "K_EBANYO_M2",
"etiket": "Ebeveyn banyo zemin m²",
"deger": 3.5,
"not_": ""
},
{
"ad": "K_WC_M2",
"etiket": "Alaturka WC zemin m²",
"deger": 1.5,
"not_": ""
},
{
"ad": "K_MUTFAK_M2",
"etiket": "Ayrı mutfak zemin m²",
"deger": 10,
"not_": ""
},
{
"ad": "K_BALKON_M2",
"etiket": "Balkon zemin m²",
"deger": 5,
"not_": "Balkon başına"
},
{
"ad": "K_DAIRE_HOL",
"etiket": "Daire holü (antre) seramik zemin m²",
"deger": 6,
"not_": "Daire başına; parkeden düşülür, seramiğe eklenir (senin düzeltmen; m² değeri önerimdir)"
},
{
"ad": "K_BANYO_DUVAR",
"etiket": "Banyo duvar seramiği m²",
"deger": 22,
"not_": "Banyo başına"
},
{
"ad": "K_WC_DUVAR",
"etiket": "Alaturka WC duvar seramiği m²",
"deger": 12,
"not_": ""
},
{
"ad": "K_TEZGAH_ARASI",
"etiket": "Tezgah arası seramik m²",
"deger": 3,
"not_": "Daire başına"
},
{
"ad": "K_SERAMIK_ZAYIAT",
"etiket": "Seramik zayiat",
"deger": 1.07,
"not_": ""
},
{
"ad": "K_DUVAR_YUZEY",
"etiket": "Duvar yüzeyi katsayısı",
"deger": 2.6,
"not_": "m² duvar yüzeyi / m² net daire alanı (3,00 m kat yüksekliğinde)"
},
{
"ad": "K_HOL_DUVAR",
"etiket": "Kat holü duvar katsayısı",
"deger": 2.2,
"not_": "m² duvar / m² hol"
},
{
"ad": "K_MERD_DUVAR",
"etiket": "Merdiven kovası duvar m²/kat",
"deger": 30,
"not_": "Merdiven başına, kat başına"
},
{
"ad": "K_ASMA_TAVAN",
"etiket": "Daire içi asma tavan m²",
"deger": 6,
"not_": "Antre-koridor, daire başına"
},
{
"ad": "K_ZPROFIL",
"etiket": "Z profil m/daire",
"deger": 10,
"not_": ""
},
{
"ad": "K_YALITIM",
"etiket": "Su yalıtımı duvar dönüş katsayısı",
"deger": 1.3,
"not_": "Islak zeminde duvara dönüş payı"
},
{
"ad": "K_PERDELIK",
"etiket": "Perdelik m/oda",
"deger": 3,
"not_": "Oda ve salon başına"
},
{
"ad": "K_ACINIM",
"etiket": "Perdelik/ışıklık açınım m",
"deger": 0.5,
"not_": "Saten+boya için m → m² çevirimi"
},
{
"ad": "K_ISIKLIK",
"etiket": "Gizli ışıklık m/daire",
"deger": 14,
"not_": "Işık bandı olan dairede salon çevresi"
},
{
"ad": "K_SAFT",
"etiket": "Şaft kara sıva m²/daire",
"deger": 1,
"not_": "(senin düzeltmen)"
},
{
"ad": "K_MERD_MERMER",
"etiket": "Merdiven mermeri m²/kat",
"deger": 14,
"not_": "Basamak+rıht+sahanlık, merdiven başına kat başına"
},
{
"ad": "K_DENIZLIK",
"etiket": "Denizlik m²/pencere",
"deger": 0.42,
"not_": "1,40 m × 0,30 m"
},
{
"ad": "K_ASANSOR_SOVE",
"etiket": "Asansör kapı sövesi m²/durak",
"deger": 1.2,
"not_": ""
},
{
"ad": "K_KORKULUK",
"etiket": "Merdiven korkuluk m/kat",
"deger": 7,
"not_": "Merdiven başına kat başına"
},
{
"ad": "K_BALKON_KORK",
"etiket": "Balkon cam korkuluk m",
"deger": 4.5,
"not_": "Balkon başına"
},
{
"ad": "K_CEVRE_DUVAR_H",
"etiket": "Çevre duvarı yüksekliği m",
"deger": 1.5,
"not_": "Arsa çevre duvarı; iki yüzü sıva-boya"
},
{
"ad": "K_SOVE",
"etiket": "Söve m/pencere",
"deger": 4.8,
"not_": "Pencere çevresi"
},
{
"ad": "K_SIVA_ORAN",
"etiket": "Mantolama dışı sıva oranı",
"deger": 0.1,
"not_": "Mantolama yapılan binada sıvalı kalan yüzey (balkon içi, parapet)"
},
{
"ad": "K_TEKNIK_KAPI",
"etiket": "Teknik hacim kapısı adet/yer altı kat",
"deger": 4,
"not_": "+2 sabit"
},
{
"ad": "K_MUSLUK",
"etiket": "Ara musluk adet/daire",
"deger": 6,
"not_": "+4 her ebeveyn banyo için"
},
{
"ad": "K_ANK_BUZDOLABI",
"etiket": "Ankastre sette buzdolabı (1/0)",
"deger": 0,
"not_": "ONAY: Ankastre \"VAR\" seçilince buzdolabı dahil mi?"
},
{
"ad": "K_ANK_BULASIK",
"etiket": "Ankastre sette bulaşık makinesi (1/0)",
"deger": 0,
"not_": "Ankastre \"VAR\" seçilince bulaşık makinesi dahil mi? (senin düzeltmen: HAYIR)"
},
{
"ad": "K_YUKSEK_BINA",
"etiket": "Yüksek bina sınırı m",
"deger": 30.5,
"not_": "ONAY: Daire içi yangın tesisatı yalnız bu yüksekliğin üstünde hesaplanır"
},
{
"ad": "K_YERDEN",
"etiket": "Yerden ısıtma fiyat çarpanı",
"deger": 1.5,
"not_": "Isıtma tesisatı birim fiyatına uygulanır"
},
{
"ad": "K_XPS",
"etiket": "XPS fiyat çarpanı",
"deger": 1.1,
"not_": "Mantolama birim fiyatına"
},
{
"ad": "K_TASYUNU",
"etiket": "Taşyünü fiyat çarpanı",
"deger": 1.3,
"not_": "Mantolama birim fiyatına"
},
{
"ad": "K_ALU_TAVAN",
"etiket": "Alüminyum panel tavan fiyat çarpanı",
"deger": 1.25,
"not_": "Islak zemin asma tavan birim fiyatına"
},
{
"ad": "K_PERSONEL",
"etiket": "Dolaylı personel: m²/kişi",
"deger": 1500,
"not_": "Personel sayısı = toplam inşaat alanı / 1.500 (en az 4)"
},
{
"ad": "K_SGK",
"etiket": "Personel işveren yükü TL/ay",
"deger": 35000,
"not_": "Kişi başı SGK+vergi (fiyat listesindeki varsayım)"
},
{
"ad": "K_MAAS",
"etiket": "Personel ortalama maaş TL/ay",
"deger": 70000,
"not_": "Kişi başı (fiyat listesindeki varsayım)"
},
{
"ad": "K_KABA",
"etiket": "Kaba inşaat süre oranı",
"deger": 0.55,
"not_": "Kule vinç kira süresi / inşaat süresi"
},
{
"ad": "K_JCB",
"etiket": "JCB saat/ay",
"deger": 40,
"not_": ""
},
{
"ad": "K_MOBIL",
"etiket": "Mobil vinç gün/ay",
"deger": 2,
"not_": ""
},
{
"ad": "K_TESLIM",
"etiket": "Teslim-bakım süresi ay",
"deger": 6,
"not_": ""
},
{
"ad": "K_ALLRISK",
"etiket": "All risk sigorta oranı",
"deger": 0.0025,
"not_": "Yapım maliyeti üzerinden"
},
{
"ad": "K_ONGORULEMEYEN",
"etiket": "Öngörülemeyen oranı",
"deger": 0.02,
"not_": "Diğer tüm kalemlerin toplamı üzerinden; kullanıcı değiştirebilir"
},
{
"ad": "BAZ_M2",
"etiket": "Fiyat listesinin baz inşaat alanı m²",
"deger": 15000,
"not_": "Götürü fiyatlar bu büyüklüğe göre verilmişti; m² başına çevirmek için"
},
{
"ad": "BAZ_DAIRE",
"etiket": "Fiyat listesinin baz daire adedi",
"deger": 100,
"not_": ""
},
{
"ad": "BAZ_CEVRE",
"etiket": "Baz çevre düzenleme alanı m²",
"deger": 3750,
"not_": "VARSAYIM: 15.000 m² inşaat ≈ 4.800 m² arsa, TAKS 0,22 → 3.750 m² açık alan"
}
],
"kalem": [
{
"i": 0,
"baslik": true,
"grup": 1,
"ad": "TOPRAK İŞLERİ"
},
{
"i": 1,
"grup": 1,
"ad": "Kazı, Yükleme ve Nakliye",
"birim": "m³",
"metraj": "v.TABAN*v.K_KAZI*(v.H_YERALTI+v.H_TEMEL+v.K_KAZI_EK)",
"aciklama": "Taban oturumu × 1,25 × (yer altı yüksekliği + temel kalınlığı + 0,40)",
"piyasa": "320",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 2,
"grup": 1,
"ad": "Geri Dolgu (Kazı Malzemesiyle)",
"birim": "m³",
"metraj": "v.CEVRE_T*v.K_GERIDOLGU*(v.H_YERALTI+v.H_TEMEL)",
"aciklama": "Taban çevresi × 1,50 m bant × kazı derinliği",
"piyasa": "250",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 3,
"grup": 1,
"ad": "Temel Altı Kırmataş Dolgu",
"birim": "m³",
"metraj": "v.TABAN*v.K_TEMEL_TASMA*v.K_DOLGU_H",
"aciklama": "Radye alanı × 0,30 m",
"piyasa": "650",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 4,
"grup": 1,
"ad": "Parsel Bacası (Altyapı Rögarı)",
"birim": "adet",
"metraj": "RUP(v.CEVRE_T/v.K_BACA,0)+2",
"aciklama": "Taban çevresi / 25 m + 2",
"piyasa": "12000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 5,
"grup": 1,
"ad": "Ø200 Kanalizasyon Hattı (Kazı + Boru + Dolgu)",
"birim": "m",
"metraj": "v.CEVRE_T*v.K_KANAL",
"aciklama": "Taban çevresi × 0,75",
"piyasa": "1400",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 6,
"grup": 1,
"ad": "Ø150 Drenaj Hattı (Kazı + Boru + Filtre Dolgu)",
"birim": "m",
"metraj": "IF(v.KAT_YERALTI>0,v.CEVRE_T,0)",
"aciklama": "Yer altı katı varsa taban çevresi",
"piyasa": "1100",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 7,
"baslik": true,
"grup": 2,
"ad": "BETONARME İŞLERİ"
},
{
"i": 8,
"grup": 2,
"ad": "Hazır Beton Temini (C30/37)",
"birim": "m³",
"metraj": "v.BIA*IF(v.DOSEME==\"ASMOLEN\",v.K_BETON_ASM,v.K_BETON_KIR)+v.TABAN*v.K_TEMEL_TASMA*v.H_TEMEL+v.CEVRE_T*v.H_YERALTI*v.K_PERDE",
"aciklama": "İnşaat alanı × 0,36 (asmolen) veya 0,32 (kirişli) + radye hacmi + bodrum çevre perdesi",
"piyasa": "3350",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 9,
"grup": 2,
"ad": "Grobeton Temini (C16/20)",
"birim": "m³",
"metraj": "v.TABAN*v.K_TEMEL_TASMA*v.K_GRO_H",
"aciklama": "Radye alanı × 0,10 m",
"piyasa": "2750",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 10,
"grup": 2,
"ad": "Betonarme Demiri Temini",
"birim": "ton",
"metraj": "v.BIA*v.K_DONATI",
"aciklama": "Blok inşaat alanı × 0,040 t/m²",
"piyasa": "31700",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 11,
"grup": 2,
"ad": "Radye Temel İşçiliği (Kalıp + Demir + Beton Döküm)",
"birim": "m²",
"metraj": "v.TABAN*v.K_TEMEL_TASMA",
"aciklama": "Radye alanı",
"piyasa": "1200",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 12,
"grup": 2,
"ad": "Kat Betonarme İşçiliği (Kalıp + Demir, Düz Ölçü)",
"birim": "m²",
"metraj": "v.BIA*v.K_KALIP",
"aciklama": "Blok inşaat alanı × 1,20",
"piyasa": "2000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 13,
"grup": 2,
"ad": "Asmolen Dolgu Bloğu Temini",
"birim": "m³",
"metraj": "IF(v.DOSEME==\"ASMOLEN\",v.BIA*v.K_ASMOLEN,0)",
"aciklama": "Asmolen döşemede inşaat alanı × 0,11; kirişlide 0",
"piyasa": "1850",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 14,
"grup": 2,
"ad": "PVC Su Tutucu Bant",
"birim": "m",
"metraj": "IF(v.KAT_YERALTI>0,v.CEVRE_T*(v.KAT_YERALTI+1),0)",
"aciklama": "Taban çevresi × (yer altı kat adedi + 1): temel-perde ve kat derzleri",
"piyasa": "180",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 15,
"grup": 2,
"ad": "Betonarme Yardımcı Malzemeleri (Nalburiye, Kür, Kalıp Yağı vb.)",
"birim": "m²",
"metraj": "v.BIA",
"aciklama": "Blok inşaat alanı",
"piyasa": "150",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 16,
"baslik": true,
"grup": 3,
"ad": "YALITIM İŞLERİ"
},
{
"i": 17,
"grup": 3,
"ad": "Temel Altı Su Yalıtımı (Çift Kat Membran)",
"birim": "m²",
"metraj": "v.TABAN*v.K_TEMEL_TASMA",
"aciklama": "Radye alanı",
"piyasa": "650",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 18,
"grup": 3,
"ad": "Bodrum Perde Yalıtımı (Sürme Yalıtım + Isı Yalıtım Levhası + Drenaj Levhası)",
"birim": "m²",
"metraj": "v.CEVRE_T*v.H_YERALTI",
"aciklama": "Taban çevresi × yer altı yüksekliği",
"piyasa": "750",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 19,
"grup": 3,
"ad": "Otopark Üstü Su Yalıtımı (Membran + Koruma Betonu)",
"birim": "m²",
"metraj": "IF(v.N_OTO>0,Math.max(v.A_OTO-v.TABAN,0),0)",
"aciklama": "Otoparkın bina oturumu dışına taşan (üstü açık) kısmı",
"piyasa": "850",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 20,
"grup": 3,
"ad": "Su Deposu İç Yalıtımı",
"birim": "m²",
"metraj": "IF(v.SU_DEPOSU==\"BETONARME\",Math.max(60,v.ND*1.5),0)",
"aciklama": "Betonarme depoda daire başı 1,5 m² (en az 60 m²); modüler depoda 0",
"piyasa": "600",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 21,
"grup": 3,
"ad": "Havuz İçi Su Yalıtımı",
"birim": "m²",
"metraj": "v.S_HAVUZ*v.PAY*v.HAVUZ_M2*1.6",
"aciklama": "Havuz varsa su yüzeyi × 1,6 (duvarlar dahil), blok payı kadar",
"piyasa": "900",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 22,
"grup": 3,
"ad": "Düşey Dilatasyon Derzi",
"birim": "m",
"metraj": "v.N_DILATASYON*(v.H_USTU+v.H_YERALTI)",
"aciklama": "Dilatasyon adedi × bina toplam yüksekliği",
"piyasa": "900",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 23,
"grup": 3,
"ad": "Yatay (Döşeme) Dilatasyon Profili",
"birim": "m",
"metraj": "v.N_DILATASYON*Math.sqrt(v.TABAN/1.5)*(v.KAT_TOPLAM+1)",
"aciklama": "Dilatasyon adedi × bina genişliği × döşeme adedi",
"piyasa": "1300",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 24,
"baslik": true,
"grup": 4,
"ad": "ÇATI İŞLERİ"
},
{
"i": 25,
"grup": 4,
"ad": "Kırma Çatı Kaplaması (OSB + Su Yalıtım Örtüsü + Kiremit)",
"birim": "m²",
"metraj": "IF(v.CATI_TIP==\"KIRMA\",v.A_NOR*v.K_CATI,0)",
"aciklama": "Kırma çatıda normal kat alanı × 1,20; teras çatıda 0",
"piyasa": "1600",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 26,
"grup": 4,
"ad": "Çatı CTP Kaplama (Gizli Dere / Teras)",
"birim": "m²",
"metraj": "IF(v.CATI_TIP==\"KIRMA\",v.CEVRE_N*v.K_DERE,v.A_NOR*1.1)",
"aciklama": "Kırma çatıda gizli dere (çevre × 0,80 m); teras çatıda kat alanı × 1,10",
"piyasa": "1400",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 27,
"grup": 4,
"ad": "Çatı Çelik Konstrüksiyon Malzemesi",
"birim": "kg",
"metraj": "IF(v.CATI_TIP==\"KIRMA\",v.A_NOR*v.K_CATI_CELIK,0)",
"aciklama": "Kırma çatıda normal kat alanı × 12 kg/m²",
"piyasa": "34",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 28,
"grup": 4,
"ad": "Çatı Çelik Konstrüksiyon Montaj İşçiliği",
"birim": "götürü",
"metraj": "IF(v.CATI_TIP==\"KIRMA\",1,0)",
"aciklama": "Kırma çatıda 1 (blok başı götürü)",
"piyasa": "RND(Q(27)*35,-3)",
"fiyatAciklama": "Çatı çeliği kg × 35 TL/kg (listede 450.000 TL sabit götürü idi)",
"opsiyonel": false
},
{
"i": 29,
"grup": 4,
"ad": "Teras Çatı Eğim ve Koruma Betonu",
"birim": "m³",
"metraj": "IF(v.CATI_TIP==\"TERAS\",v.A_NOR*v.K_EGIM_H,0)",
"aciklama": "Teras çatıda kat alanı × 0,12 m; kırma çatıda 0",
"piyasa": "3800",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 30,
"baslik": true,
"grup": 5,
"ad": "DUVAR İŞLERİ"
},
{
"i": 31,
"grup": 5,
"ad": "Tuğla Temini - 10 cm (İç Duvar)",
"birim": "adet",
"metraj": "v.DUVAR_IC*v.K_TUGLA",
"aciklama": "İç duvar alanı × 27 adet/m²",
"piyasa": "8.5",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 32,
"grup": 5,
"ad": "Tuğla Temini - 13,5 cm (Dış Duvar)",
"birim": "adet",
"metraj": "v.DUVAR_DIS*v.K_TUGLA",
"aciklama": "Dış duvar alanı × 27 adet/m²",
"piyasa": "10.5",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 33,
"grup": 5,
"ad": "Kum Temini (Duvar Harcı)",
"birim": "m³",
"metraj": "v.DUVAR_IC*v.K_KUM_10+v.DUVAR_DIS*v.K_KUM_135",
"aciklama": "İç duvar × 0,025 + dış duvar × 0,032",
"piyasa": "600",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 34,
"grup": 5,
"ad": "Çimento Temini (Duvar Harcı)",
"birim": "ton",
"metraj": "Q(33)*v.K_CIMENTO",
"aciklama": "Kum m³ × 0,27 t",
"piyasa": "3400",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 35,
"grup": 5,
"ad": "Lento Temini (Kapı ve Pencere Üstü)",
"birim": "m³",
"metraj": "(v.PENCERE_ADET+Q(82)+Q(80))*v.K_LENTO",
"aciklama": "(Pencere + iç kapı + daire kapısı adedi) × 0,03 m³",
"piyasa": "9500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 36,
"grup": 5,
"ad": "Tuğla Duvar Örme İşçiliği",
"birim": "m²",
"metraj": "v.DUVAR_IC+v.DUVAR_DIS",
"aciklama": "İç + dış duvar alanı",
"piyasa": "400",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 37,
"baslik": true,
"grup": 6,
"ad": "İNCE İŞLER"
},
{
"i": 38,
"grup": 6,
"ad": "Şap (6 cm)",
"birim": "m²",
"metraj": "v.DA_NET",
"aciklama": "Daire net alanları toplamı",
"piyasa": "380",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 39,
"grup": 6,
"ad": "Laminat Parke",
"birim": "m²",
"metraj": "v.DA_NET-v.SERAMIK_ZEMIN",
"aciklama": "Daire net alanı - seramik zeminler (ıslak hacim, ayrı mutfak, balkon, daire holü)",
"piyasa": "650",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 40,
"grup": 6,
"ad": "Seramik / Porselen Karo Temini",
"birim": "m²",
"metraj": "(v.SERAMIK_ZEMIN+v.SERAMIK_DUVAR)*v.K_SERAMIK_ZAYIAT",
"aciklama": "(Seramik zemin + duvar) × 1,07 zayiat",
"piyasa": "450",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 41,
"grup": 6,
"ad": "Seramik Döşeme ve Kaplama İşçiliği",
"birim": "m²",
"metraj": "v.SERAMIK_ZEMIN+v.SERAMIK_DUVAR",
"aciklama": "Seramik zemin + duvar",
"piyasa": "400",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 42,
"grup": 6,
"ad": "Kaba Alçı Sıva - Duvar",
"birim": "m²",
"metraj": "v.DUVAR_YUZEY+v.ORTAK_DUVAR",
"aciklama": "Daire içi duvar yüzeyi + ortak alan duvarları",
"piyasa": "340",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 43,
"grup": 6,
"ad": "Kaba Alçı Sıva - Tavan",
"birim": "m²",
"metraj": "v.TAVAN_SIVA",
"aciklama": "Daire net alanı - asma tavanlı alanlar - balkon",
"piyasa": "380",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 44,
"grup": 6,
"ad": "Saten Alçı - Duvar",
"birim": "m²",
"metraj": "Q(42)",
"aciklama": "Kaba alçı duvar ile aynı",
"piyasa": "170",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 45,
"grup": 6,
"ad": "Saten Alçı - Tavan",
"birim": "m²",
"metraj": "Q(43)",
"aciklama": "Kaba alçı tavan ile aynı",
"piyasa": "190",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 46,
"grup": 6,
"ad": "İç Cephe Boyası - Duvar",
"birim": "m²",
"metraj": "Q(42)",
"aciklama": "Kaba alçı duvar ile aynı",
"piyasa": "220",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 47,
"grup": 6,
"ad": "Tavan Boyası",
"birim": "m²",
"metraj": "v.TAVAN_SIVA+v.ASMA_TAVAN",
"aciklama": "Sıvalı tavan + alçıpan asma tavan",
"piyasa": "150",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 48,
"grup": 6,
"ad": "Alçıpan Asma Tavan (Antre, Koridor, Kat Holleri)",
"birim": "m²",
"metraj": "v.ASMA_TAVAN",
"aciklama": "Daire başı 6 m² (antre-koridor) + kat holleri",
"piyasa": "750",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 49,
"grup": 6,
"ad": "Asma Tavan Gölge Boşluğu (Z Profil)",
"birim": "m",
"metraj": "v.ND*v.K_ZPROFIL",
"aciklama": "Daire başı 10 m",
"piyasa": "120",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 50,
"grup": 6,
"ad": "Islak Hacim Asma Tavanı (Banyo, WC)",
"birim": "m²",
"metraj": "v.ISLAK_ZEMIN",
"aciklama": "Islak hacim zemin alanı",
"piyasa": "RND(900*IF(v.BANYO_TAVAN==\"YEŞİL ALÇIPAN\",1,v.K_ALU_TAVAN),0)",
"fiyatAciklama": "Alüminyum panel seçilirse × 1,25",
"opsiyonel": false
},
{
"i": 51,
"grup": 6,
"ad": "Kara Sıva - Otopark ve Bodrum (Tavan + Duvar)",
"birim": "m²",
"metraj": "v.N_OTO*v.A_OTO+v.N_BOD*v.A_BOD+v.CEVRE_T*v.H_YERALTI",
"aciklama": "Otopark ve bodrum tavanı + çevre perde yüzeyi",
"piyasa": "550",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 52,
"grup": 6,
"ad": "Kara Sıva - Seramik Altı Duvarlar ve Şaft İçleri",
"birim": "m²",
"metraj": "v.SERAMIK_DUVAR+v.ND*v.K_SAFT",
"aciklama": "Seramik altı duvarlar + daire başı 1 m² şaft içi",
"piyasa": "550",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 53,
"grup": 6,
"ad": "Islak Hacim ve Balkon Su Yalıtımı",
"birim": "m²",
"metraj": "(v.ISLAK_ZEMIN+v.BALKON_ALAN)*v.K_YALITIM",
"aciklama": "(Islak zemin + balkon) × 1,30 duvar dönüşü",
"piyasa": "380",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 54,
"grup": 6,
"ad": "Alçıpan Perdelik",
"birim": "m",
"metraj": "v.ODA_TOPLAM*v.K_PERDELIK",
"aciklama": "Oda+salon adedi × 3 m",
"piyasa": "450",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 55,
"grup": 6,
"ad": "Alçıpan Perdelik Saten Alçı ve Boyası",
"birim": "m²",
"metraj": "Q(54)*v.K_ACINIM",
"aciklama": "Perdelik m × 0,50 m açınım",
"piyasa": "550",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 56,
"grup": 6,
"ad": "Alçıpan Gizli Işıklık (LED Hariç)",
"birim": "m",
"metraj": "SP(t=>(t.N)*(t.ISIK))*v.K_ISIKLIK",
"aciklama": "Işık bandı olan daire adedi × 14 m",
"piyasa": "600",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 57,
"grup": 6,
"ad": "Gizli Işıklık Saten Alçı ve Boyası",
"birim": "m²",
"metraj": "Q(56)*v.K_ACINIM",
"aciklama": "Işıklık m × 0,50 m açınım",
"piyasa": "550",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 58,
"grup": 6,
"ad": "Klima Altyapısı (Bakır Boru, Drenaj, Kablo)",
"birim": "adet",
"metraj": "v.KLIMA_TOPLAM",
"aciklama": "Daire tiplerindeki klima adetleri toplamı",
"piyasa": "6500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 59,
"grup": 6,
"ad": "Mermer Zemin ve Merdiven Kaplaması (Kat Holleri, Basamaklar)",
"birim": "m²",
"metraj": "v.N_MERDIVEN*v.KAT_TOPLAM*v.K_MERD_MERMER+v.HOL_ALAN",
"aciklama": "Merdiven × kat × 14 m² + kat holü zeminleri",
"piyasa": "4500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 60,
"grup": 6,
"ad": "Mermer Denizlik, Söve ve Asansör Kapı Çevresi",
"birim": "m²",
"metraj": "v.PENCERE_ADET*v.K_DENIZLIK+v.N_ASANSOR*v.KAT_TOPLAM*v.K_ASANSOR_SOVE",
"aciklama": "Pencere × 0,42 m² + asansör × durak × 1,2 m²",
"piyasa": "5000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 61,
"grup": 6,
"ad": "Sürgülü Kapı Sistemi (Masterslide)",
"birim": "adet",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer",
"piyasa": "45000",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 62,
"grup": 6,
"ad": "Duvar Kağıdı Uygulama İşçiliği",
"birim": "m²",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer",
"piyasa": "150",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 63,
"grup": 6,
"ad": "Duvar Kağıdı Yüzey Hazırlığı",
"birim": "m²",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer",
"piyasa": "120",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 64,
"grup": 6,
"ad": "Duvar Kağıdı Temini",
"birim": "m²",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer",
"piyasa": "250",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 65,
"grup": 6,
"ad": "Şaft ve Tesisat Boşluklarının Fileli Dolgusu",
"birim": "adet",
"metraj": "v.ND*2",
"aciklama": "Daire başı 2 adet şaft/boşluk",
"piyasa": "1500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 66,
"grup": 6,
"ad": "Bahçe Çevre Duvarı Sıva ve Boyası",
"birim": "m²",
"metraj": "v.PAY*4*Math.sqrt(v.ARSA)*v.K_CEVRE_DUVAR_H*2",
"aciklama": "Arsa çevresi (4×√arsa) × 1,5 m × 2 yüz, blok payı kadar",
"piyasa": "800",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 67,
"grup": 6,
"ad": "Otopark Dilatasyon Profili",
"birim": "m",
"metraj": "v.N_DILATASYON*Math.sqrt(v.TABAN/1.5)*v.N_OTO",
"aciklama": "Dilatasyon adedi × bina genişliği × otopark katı",
"piyasa": "2800",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 68,
"grup": 6,
"ad": "Otopark Zemini Yüzey Sertleştirici",
"birim": "m²",
"metraj": "v.N_OTO*v.A_OTO",
"aciklama": "Otopark alanı",
"piyasa": "280",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 69,
"grup": 6,
"ad": "Merdiven Korkuluğu (Küpeşte Dahil)",
"birim": "m",
"metraj": "v.N_MERDIVEN*v.KAT_TOPLAM*v.K_KORKULUK",
"aciklama": "Merdiven × kat × 7 m",
"piyasa": "3500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 70,
"grup": 6,
"ad": "Cam Korkuluk (Balkon ve Fransız Pencere)",
"birim": "m",
"metraj": "v.BALKON_TOPLAM*v.K_BALKON_KORK",
"aciklama": "Balkon adedi × 4,5 m (balkon korkulukları bu kalemde)",
"piyasa": "6500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 71,
"baslik": true,
"grup": 7,
"ad": "CEPHE İŞLERİ"
},
{
"i": 72,
"grup": 7,
"ad": "Mantolama - Isı Yalıtımlı Cephe (Dekoratif Sıva ve Boya Dahil)",
"birim": "m²",
"metraj": "IF(v.CEPHE_TIP==\"ÖZEL\",0,v.CEPHE_NET)",
"aciklama": "Net cephe alanı; \"ÖZEL\" seçilirse 0",
"piyasa": "RND(950*IF(v.CEPHE_TIP==\"XPS\",v.K_XPS,IF(v.CEPHE_TIP==\"TAŞYÜNÜ\",v.K_TASYUNU,1)),0)",
"fiyatAciklama": "EPS baz; XPS × 1,10; taşyünü × 1,30",
"opsiyonel": false
},
{
"i": 73,
"grup": 7,
"ad": "Parapet ve Pencere Sövesi (Malzeme + İşçilik)",
"birim": "m",
"metraj": "v.PENCERE_ADET*v.K_SOVE+v.CEVRE_N",
"aciklama": "Pencere × 4,8 m + çatı parapeti (kat çevresi)",
"piyasa": "450",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 74,
"grup": 7,
"ad": "Dış Cephe Sıvası",
"birim": "m²",
"metraj": "IF(v.CEPHE_TIP==\"ÖZEL\",v.CEPHE_NET,IF(v.MANTO_SIVA==1,v.CEPHE_NET,v.CEPHE_NET*v.K_SIVA_ORAN))",
"aciklama": "Mantolama altına sıva yapılıyorsa ya da cephe \"Özel\" ise net cephenin tamamı; mantolama doğrudan duvara yapılıyorsa net cephenin %10'u (balkon ve parapet içleri)",
"piyasa": "600",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 75,
"grup": 7,
"ad": "Alüminyum Kompozit Cephe Kaplaması",
"birim": "m²",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer",
"piyasa": "4500",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 76,
"grup": 7,
"ad": "Cephe Taş Kaplama Şeritleri",
"birim": "m",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer",
"piyasa": "2200",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 77,
"grup": 7,
"ad": "Giydirme Cam Cephe (Dükkan Vitrinleri)",
"birim": "m²",
"metraj": "v.N_DUK*v.K_CEVRE*Math.sqrt(v.A_DUK)*0.4*v.H_DUK*0.7",
"aciklama": "Dükkan katı varsa: çevrenin %40'ı (ön cephe) × kat yüksekliği × 0,70",
"piyasa": "14000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 78,
"grup": 7,
"ad": "Dış Cephe Taş / Kültür Tuğlası / Ateş Tuğlası Kaplama",
"birim": "m²",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer",
"piyasa": "2800",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 79,
"baslik": true,
"grup": 8,
"ad": "KAPI VE PENCERE İŞLERİ"
},
{
"i": 80,
"grup": 8,
"ad": "Daire Giriş Kapısı (Çelik)",
"birim": "adet",
"metraj": "v.ND",
"aciklama": "Daire adedi",
"piyasa": "28000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 81,
"grup": 8,
"ad": "Yangın Kapısı (Merdiven Kovası)",
"birim": "adet",
"metraj": "(v.N_MERDIVEN+1)*v.KAT_TOPLAM",
"aciklama": "(Merdiven + 1) × kat adedi",
"piyasa": "18000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 82,
"grup": 8,
"ad": "Daire İçi Oda Kapıları (Ahşap)",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.ODA+1+t.EBANYO+t.ALATURKA))",
"aciklama": "Daire başı: oda sayısı + genel banyo + ebeveyn banyo + alaturka WC",
"piyasa": "7500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 83,
"grup": 8,
"ad": "Salon Kapısı",
"birim": "adet",
"metraj": "v.ND",
"aciklama": "Daire başı 1",
"piyasa": "12000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 84,
"grup": 8,
"ad": "Mutfak Kapısı",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.AYRI))",
"aciklama": "Ayrı mutfaklı daire adedi",
"piyasa": "9000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 85,
"grup": 8,
"ad": "Süpürgelik ve Kapı Eşiği (Tolero)",
"birim": "daire",
"metraj": "v.ND",
"aciklama": "Daire başı 1 takım",
"piyasa": "5000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 86,
"grup": 8,
"ad": "Bina Giriş Kapısı (Alüminyum Camlı)",
"birim": "adet",
"metraj": "1",
"aciklama": "Blok başı 1",
"piyasa": "120000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 87,
"grup": 8,
"ad": "Otopark Giriş Kapısı (Motorlu Seksiyonel)",
"birim": "adet",
"metraj": "IF(v.N_OTO>0,1,0)",
"aciklama": "Otopark katı varsa 1",
"piyasa": "220000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 88,
"grup": 8,
"ad": "Teknik Hacim Kapıları (Elektrik, Pano, Depo Odaları vb.)",
"birim": "adet",
"metraj": "v.KAT_YERALTI*v.K_TEKNIK_KAPI+2",
"aciklama": "Yer altı katı × 4 + 2",
"piyasa": "12000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 89,
"grup": 8,
"ad": "PVC Pencere ve Balkon Kapısı Doğraması (Isıcam Dahil)",
"birim": "m²",
"metraj": "v.PENCERE_ALAN",
"aciklama": "Brüt cephe × 0,22",
"piyasa": "6000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 90,
"baslik": true,
"grup": 9,
"ad": "MOBİLYA VE AHŞAP İŞLERİ"
},
{
"i": 91,
"grup": 9,
"ad": "Mutfak Dolabı - [daire tipi]",
"birim": "daire",
"metraj": "SP(t=>(t.TIP==\"2+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "14000+1600*SP(t=>(t.TIP==\"2+1\")*t.A)",
"fiyatAciklama": "14.000 + 1.600 × daire brüt m² (85 m² → 150.000; 110 m² → 190.000)",
"opsiyonel": false
},
{
"i": 92,
"grup": 9,
"ad": "Mutfak Dolabı 3+1",
"birim": "adet",
"metraj": "SP(t=>(t.TIP==\"3+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "14000+1600*SP(t=>(t.TIP==\"3+1\")*t.A)",
"fiyatAciklama": "Aynı formül",
"opsiyonel": false
},
{
"i": 93,
"grup": 9,
"ad": "Mutfak Dolabı - Dubleks / Çatı Katı",
"birim": "daire",
"metraj": "SP(t=>(t.N)*(t.DUBLEKS))",
"aciklama": "Dubleks/çatı katı daire adedi",
"piyasa": "210000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 94,
"grup": 9,
"ad": "Banyo Dolabı (Lavabolu) - Genel Banyo",
"birim": "adet",
"metraj": "v.ND",
"aciklama": "Daire başı 1",
"piyasa": "22000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 95,
"grup": 9,
"ad": "Banyo Dolabı (Lavabolu) - Ebeveyn Banyosu",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.EBANYO))",
"aciklama": "Ebeveyn banyo adedi",
"piyasa": "18000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 96,
"grup": 9,
"ad": "Vestiyer - [daire tipi]",
"birim": "daire",
"metraj": "SP(t=>(t.TIP==\"2+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "1000+400*SP(t=>(t.TIP==\"2+1\")*t.A)",
"fiyatAciklama": "1.000 + 400 × daire brüt m² (85 m² → 35.000; 110 m² → 45.000)",
"opsiyonel": false
},
{
"i": 97,
"grup": 9,
"ad": "Vestiyer Dolabı 3+1",
"birim": "adet",
"metraj": "SP(t=>(t.TIP==\"3+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "1000+400*SP(t=>(t.TIP==\"3+1\")*t.A)",
"fiyatAciklama": "Aynı formül",
"opsiyonel": false
},
{
"i": 98,
"grup": 9,
"ad": "Giyinme Odası Dolabı",
"birim": "adet",
"metraj": "SP(t=>(t.N)*((t.ODA>=3)*1))",
"aciklama": "3 ve üzeri odalı daire adedi",
"piyasa": "70000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 99,
"grup": 9,
"ad": "Örnek Daire Mobilya ve Tefrişatı",
"birim": "götürü",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer (örnek daire Satış Ofisi bölümünde ayrıca var)",
"piyasa": "1500000",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 100,
"grup": 9,
"ad": "Mutfak Tezgahı",
"birim": "m",
"metraj": "SP(t=>(t.N)*(3+0.5*t.ODA))",
"aciklama": "Daire başı 3 m + 0,5 m × oda sayısı (2+1 → 4,0 m; 3+1 → 4,5 m)",
"piyasa": "9000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 101,
"grup": 9,
"ad": "Ebeveyn Banyosu Tezgahı",
"birim": "m",
"metraj": "SP(t=>(t.N)*(t.EBANYO))*0.9",
"aciklama": "Ebeveyn banyo × 0,90 m",
"piyasa": "7500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 102,
"grup": 9,
"ad": "Genel Banyo Tezgahı",
"birim": "m",
"metraj": "v.ND*1",
"aciklama": "Daire başı 1,00 m",
"piyasa": "7500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 103,
"grup": 9,
"ad": "Evye",
"birim": "adet",
"metraj": "v.ND",
"aciklama": "Daire başı 1",
"piyasa": "6500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 104,
"grup": 9,
"ad": "Dubleks İç Merdiveni",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.DUBLEKS))",
"aciklama": "Dubleks daire adedi",
"piyasa": "180000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 105,
"grup": 9,
"ad": "Şaft Kapakları",
"birim": "adet",
"metraj": "v.BANYO_TOPLAM+v.ND",
"aciklama": "Banyo adedi + mutfak (daire başı 1)",
"piyasa": "3500",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 106,
"grup": 9,
"ad": "Posta Kutusu",
"birim": "adet",
"metraj": "v.ND",
"aciklama": "Daire başı 1",
"piyasa": "900",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 107,
"grup": 9,
"ad": "Diğer Ahşap İşleri",
"birim": "daire",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer",
"piyasa": "25000",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 108,
"baslik": true,
"grup": 10,
"ad": "BANYO VE WC DONANIMI"
},
{
"i": 109,
"grup": 10,
"ad": "Duşakabin - [daire tipi]",
"birim": "adet",
"metraj": "SP(t=>((t.TIP==\"2+1\")*t.N*(1+t.EBANYO)))",
"aciklama": "O tipteki banyo adedi (TİPE BAĞLI SATIR)",
"piyasa": "14000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 110,
"grup": 10,
"ad": "Duşakabin 3+1",
"birim": "adet",
"metraj": "SP(t=>((t.TIP==\"3+1\")*t.N*(1+t.EBANYO)))",
"aciklama": "O tipteki banyo adedi (TİPE BAĞLI SATIR)",
"piyasa": "16000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 111,
"grup": 10,
"ad": "Duşakabin - Dubleks / Çatı Katı",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.DUBLEKS*(1+t.EBANYO)))",
"aciklama": "Dubleks dairelerdeki banyo adedi",
"piyasa": "18000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 112,
"grup": 10,
"ad": "Banyo Takımı (Vitrifiye + Armatür + Aksesuar) - [daire tipi]",
"birim": "daire",
"metraj": "SP(t=>(t.TIP==\"2+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "25000+30000*(1+SP(t=>(t.TIP==\"2+1\")*t.EBANYO))",
"fiyatAciklama": "25.000 + 30.000 × dairedeki banyo adedi (1 banyo → 55.000; 2 banyo → 85.000)",
"opsiyonel": false
},
{
"i": 113,
"grup": 10,
"ad": "Banyo Seti(Vitrifiye+Armatür+Aksesuar) 3+1",
"birim": "adet",
"metraj": "SP(t=>(t.TIP==\"3+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "25000+30000*(1+SP(t=>(t.TIP==\"3+1\")*t.EBANYO))",
"fiyatAciklama": "Aynı formül",
"opsiyonel": false
},
{
"i": 114,
"grup": 10,
"ad": "Banyo Takımı (Vitrifiye + Armatür + Aksesuar) - Dubleks / Çatı Katı",
"birim": "daire",
"metraj": "SP(t=>(t.N)*(t.DUBLEKS))",
"aciklama": "Dubleks daire adedi",
"piyasa": "95000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 115,
"baslik": true,
"grup": 11,
"ad": "BEYAZ EŞYA VE KLİMA"
},
{
"i": 116,
"grup": 11,
"ad": "Ankastre Fırın",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.ANKASTRE))",
"aciklama": "Ankastre \"VAR\" olan daire adedi",
"piyasa": "16000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 117,
"grup": 11,
"ad": "Ankastre Davlumbaz",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.ANKASTRE))",
"aciklama": "Ankastre \"VAR\" olan daire adedi",
"piyasa": "9000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 118,
"grup": 11,
"ad": "Ankastre Ocak",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.ANKASTRE))",
"aciklama": "Ankastre \"VAR\" olan daire adedi",
"piyasa": "9000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 119,
"grup": 11,
"ad": "Buzdolabı",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.ANKASTRE))*v.K_ANK_BUZDOLABI",
"aciklama": "Ankastre daire adedi × (buzdolabı dahil mi: varsayılan HAYIR)",
"piyasa": "45000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 120,
"grup": 11,
"ad": "Bulaşık Makinesi",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.ANKASTRE))*v.K_ANK_BULASIK",
"aciklama": "Ankastre daire adedi × (bulaşık makinesi dahil mi: varsayılan HAYIR)",
"piyasa": "22000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 121,
"grup": 11,
"ad": "Klima Cihazı (Split, Montaj Dahil)",
"birim": "adet",
"metraj": "SP(t=>(t.N)*(t.ANKASTRE)*(t.KLIMA))",
"aciklama": "Ankastre \"VAR\" olan dairelerdeki klima adetleri toplamı",
"piyasa": "42000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 122,
"baslik": true,
"grup": 12,
"ad": "ELEKTRİK İŞLERİ"
},
{
"i": 123,
"grup": 12,
"ad": "Daire İçi Elektrik Tesisatı - [daire tipi]",
"birim": "daire",
"metraj": "v.ND-SP(t=>(t.TIP==\"3+1\")*t.N)",
"aciklama": "3+1 dışındaki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "18000+1200*SP(t=>(t.TIP==\"2+1\")*t.A)",
"fiyatAciklama": "18.000 + 1.200 × daire brüt m² (85 m² → 120.000; 110 m² → 150.000)",
"opsiyonel": false
},
{
"i": 124,
"grup": 12,
"ad": "3+1 Elektrik İşleri",
"birim": "adet",
"metraj": "SP(t=>(t.TIP==\"3+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "18000+1200*SP(t=>(t.TIP==\"3+1\")*t.A)",
"fiyatAciklama": "Aynı formül",
"opsiyonel": false
},
{
"i": 125,
"grup": 12,
"ad": "Daire Aydınlatma Armatürleri ve Anahtar-Priz",
"birim": "daire",
"metraj": "v.ND",
"aciklama": "Daire başı 1 takım",
"piyasa": "40000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 126,
"grup": 12,
"ad": "Ortak Alan Elektrik Tesisatı (Kat Holleri, Merdiven)",
"birim": "blok",
"metraj": "1",
"aciklama": "Blok başı 1",
"piyasa": "45000*v.KAT_TOPLAM",
"fiyatAciklama": "45.000 TL × toplam kat (listede ≈10 kat için 450.000)",
"opsiyonel": false
},
{
"i": 127,
"grup": 12,
"ad": "Otopark Katı Elektrik Tesisatı",
"birim": "kat",
"metraj": "v.N_OTO",
"aciklama": "Otopark katı adedi",
"piyasa": "800*v.A_OTO",
"fiyatAciklama": "800 TL × otopark kat alanı (VARSAYIM: listedeki 1.200.000 ≈ 1.500 m² kat)",
"opsiyonel": false
},
{
"i": 128,
"grup": 12,
"ad": "Bodrum, Sığınak ve Teknik Hacim Elektrik Tesisatı",
"birim": "götürü",
"metraj": "IF(v.N_BOD>0,1,0)",
"aciklama": "Bodrum varsa 1",
"piyasa": "RND(900000/v.BAZ_M2,0)*v.BIA",
"fiyatAciklama": "60 TL × blok inşaat alanı",
"opsiyonel": false
},
{
"i": 129,
"grup": 12,
"ad": "Bina Dağıtım Panosu (Blok Panosu)",
"birim": "adet",
"metraj": "1",
"aciklama": "Blok başı 1",
"piyasa": "180000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 130,
"grup": 12,
"ad": "Ortak Alan Tali Panoları",
"birim": "adet",
"metraj": "v.KAT_YERALTI+1",
"aciklama": "Yer altı kat adedi + 1",
"piyasa": "120000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 131,
"grup": 12,
"ad": "Site Ana Dağıtım Panosu (ADP)",
"birim": "götürü",
"metraj": "v.PAY",
"aciklama": "Proje geneli 1 adet; blok payı kadar",
"piyasa": "650000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 132,
"grup": 12,
"ad": "Enerji Bağlantı ve Güvence Bedelleri",
"birim": "götürü",
"metraj": "v.PAY",
"aciklama": "Proje geneli; blok payı kadar",
"piyasa": "RND(1500000/v.BAZ_M2,0)*v.TIA",
"fiyatAciklama": "100 TL × toplam inşaat alanı",
"opsiyonel": false
},
{
"i": 133,
"grup": 12,
"ad": "Jeneratör (Kabinli Dizel)",
"birim": "götürü",
"metraj": "v.JENERATOR*v.PAY",
"aciklama": "Jeneratör seçildiyse blok payı kadar",
"piyasa": "Math.max(1200000,2800000/v.BAZ_DAIRE*v.TOPLAM_DAIRE)",
"fiyatAciklama": "28.000 TL × toplam daire (en az 1.200.000)",
"opsiyonel": false
},
{
"i": 134,
"grup": 12,
"ad": "Trafo Merkezi (Trafo + Köşk + OG Hücre)",
"birim": "götürü",
"metraj": "v.TRAFO*v.PAY",
"aciklama": "Trafo seçildiyse blok payı kadar",
"piyasa": "Math.max(2000000,3500000/v.BAZ_DAIRE*v.TOPLAM_DAIRE)",
"fiyatAciklama": "35.000 TL × toplam daire (en az 2.000.000)",
"opsiyonel": false
},
{
"i": 135,
"baslik": true,
"grup": 13,
"ad": "MEKANİK TESİSAT İŞLERİ"
},
{
"i": 136,
"grup": 13,
"ad": "Daire İçi Sıhhi Tesisat (Temiz Su + Pis Su)",
"birim": "daire",
"metraj": "v.ND",
"aciklama": "Daire adedi (fiyat daire başı)",
"piyasa": "85000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 137,
"grup": 13,
"ad": "Ara Musluk ve Bağlantı Elemanları",
"birim": "adet",
"metraj": "v.ND*v.K_MUSLUK+SP(t=>(t.N)*(t.EBANYO))*4",
"aciklama": "Daire başı 6 + ebeveyn banyo başı 4",
"piyasa": "1200",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 138,
"grup": 13,
"ad": "Dubleks / Çatı Katı Sıhhi Tesisat Farkı",
"birim": "daire",
"metraj": "SP(t=>(t.N)*(t.DUBLEKS))",
"aciklama": "Dubleks/çatı katı daire adedi",
"piyasa": "110000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 139,
"grup": 13,
"ad": "Daire İçi Isıtma Tesisatı - [daire tipi]",
"birim": "daire",
"metraj": "SP(t=>(t.TIP==\"2+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "(4000+600*SP(t=>(t.TIP==\"2+1\")*t.A))*IF(v.ISITMA_SEKLI==\"RADYATÖR\",1,v.K_YERDEN)",
"fiyatAciklama": "(4.000 + 600 × brüt m²) × yerden ısıtmada 1,5",
"opsiyonel": false
},
{
"i": 140,
"grup": 13,
"ad": "Isıtma Tesisatı 3+1",
"birim": "adet",
"metraj": "SP(t=>(t.TIP==\"3+1\")*t.N)",
"aciklama": "O tipteki daire adedi (TİPE BAĞLI SATIR)",
"piyasa": "(4000+600*SP(t=>(t.TIP==\"3+1\")*t.A))*IF(v.ISITMA_SEKLI==\"RADYATÖR\",1,v.K_YERDEN)",
"fiyatAciklama": "Aynı formül",
"opsiyonel": false
},
{
"i": 141,
"grup": 13,
"ad": "Daire İçi Yangın Tesisatı (Sprinkler) - [daire tipi]",
"birim": "daire",
"metraj": "IF(v.H_USTU>v.K_YUKSEK_BINA,SP(t=>(t.TIP==\"2+1\")*t.N),0)",
"aciklama": "Bina yüksekliği 30,50 m'yi aşıyorsa o tipteki daire adedi; aşmıyorsa 0 (ONAY GEREKLİ)",
"piyasa": "30000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 142,
"grup": 13,
"ad": "Yangın Tesisatı 3+1",
"birim": "adet",
"metraj": "IF(v.H_USTU>v.K_YUKSEK_BINA,SP(t=>(t.TIP==\"3+1\")*t.N),0)",
"aciklama": "Aynı kural",
"piyasa": "38000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 143,
"grup": 13,
"ad": "Radyatör, Havlupan ve Vanalar",
"birim": "daire",
"metraj": "IF(v.ISITMA_SEKLI==\"RADYATÖR\",v.ND,0)",
"aciklama": "Radyatörlü sistemde daire adedi; yerden ısıtmada 0",
"piyasa": "45000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 144,
"grup": 13,
"ad": "Kombi Cihazı (Yoğuşmalı)",
"birim": "adet",
"metraj": "IF(v.ISITMA==\"KOMBİ\",v.ND,0)",
"aciklama": "Kombili sistemde daire adedi; merkezide 0",
"piyasa": "38000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 145,
"grup": 13,
"ad": "Bodrum, Sığınak ve Teknik Hacim Mekanik Tesisatı",
"birim": "götürü",
"metraj": "IF(v.N_BOD>0,1,0)",
"aciklama": "Bodrum varsa 1",
"piyasa": "RND(1500000/v.BAZ_M2,0)*v.BIA",
"fiyatAciklama": "100 TL × blok inşaat alanı",
"opsiyonel": false
},
{
"i": 146,
"grup": 13,
"ad": "Kazan Dairesi, Otopark Havalandırma ve Yangın Tesisatı",
"birim": "götürü",
"metraj": "1",
"aciklama": "Blok başı 1 (götürü)",
"piyasa": "1500*v.N_OTO*v.A_OTO+IF(v.ISITMA==\"MERKEZİ\",25000*v.ND,0)",
"fiyatAciklama": "1.500 TL × otopark alanı (havalandırma+yangın) + merkezi sistemde 25.000 TL × daire (kazan dairesi)",
"opsiyonel": false
},
{
"i": 147,
"grup": 13,
"ad": "Doğalgaz İç Tesisatı",
"birim": "daire",
"metraj": "v.ND",
"aciklama": "Daire adedi",
"piyasa": "18000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 148,
"grup": 13,
"ad": "Modüler Su Deposu (Hidrofor)",
"birim": "götürü",
"metraj": "IF(v.SU_DEPOSU==\"MODÜLER\",v.PAY,0)",
"aciklama": "Modüler depo seçildiyse blok payı kadar",
"piyasa": "450000/v.BAZ_DAIRE*v.TOPLAM_DAIRE",
"fiyatAciklama": "4.500 TL × toplam daire",
"opsiyonel": false
},
{
"i": 149,
"grup": 13,
"ad": "Peyzaj Sulama Deposu",
"birim": "götürü",
"metraj": "IF(v.CEVRE_ALAN>1000,v.PAY,0)",
"aciklama": "Çevre düzenleme alanı 1.000 m²'den büyükse blok payı kadar",
"piyasa": "200000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 150,
"baslik": true,
"grup": 14,
"ad": "ASANSÖR İŞLERİ"
},
{
"i": 151,
"grup": 14,
"ad": "Asansör (Temin ve Montaj)",
"birim": "adet",
"metraj": "v.N_ASANSOR",
"aciklama": "Asansör adedi",
"piyasa": "600000+80000*v.KAT_TOPLAM",
"fiyatAciklama": "600.000 + 80.000 × durak (10 durak → 1.400.000)",
"opsiyonel": false
},
{
"i": 152,
"baslik": true,
"grup": 15,
"ad": "ÇEVRE DÜZENLEME VE ALTYAPI"
},
{
"i": 153,
"grup": 15,
"ad": "Atıksu ve Yağmursuyu Hatları",
"birim": "m",
"metraj": "3.2*Math.sqrt(v.ARSA)",
"aciklama": "Arsa çevresinin %80'i (3,2 × √arsa)",
"piyasa": "2200",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 154,
"grup": 15,
"ad": "Elektrik ve Zayıf Akım Altyapısı",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(1800000/v.BAZ_CEVRE,0)*v.CEVRE_ALAN",
"fiyatAciklama": "480 TL × çevre düzenleme alanı",
"opsiyonel": false
},
{
"i": 155,
"grup": 15,
"ad": "Peyzaj (Toprak, Bitkilendirme, Sert Zemin, Çocuk Oyun Alanı)",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(6000000/v.BAZ_CEVRE,0)*v.CEVRE_ALAN",
"fiyatAciklama": "1.600 TL × çevre düzenleme alanı",
"opsiyonel": false
},
{
"i": 156,
"grup": 15,
"ad": "Peyzaj Mobilyaları (Bank, Çöp Kovası, Aydınlatma)",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(600000/v.BAZ_CEVRE,0)*v.CEVRE_ALAN",
"fiyatAciklama": "160 TL × çevre düzenleme alanı",
"opsiyonel": false
},
{
"i": 157,
"grup": 15,
"ad": "Kamelya",
"birim": "adet",
"metraj": "RUP(v.CEVRE_ALAN/1500,0)",
"aciklama": "Her 1.500 m² çevre alanına 1 kamelya",
"piyasa": "180000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 158,
"grup": 15,
"ad": "Diğer Peyzaj İşleri",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(750000/v.BAZ_CEVRE,0)*v.CEVRE_ALAN",
"fiyatAciklama": "200 TL × çevre düzenleme alanı",
"opsiyonel": false
},
{
"i": 159,
"grup": 15,
"ad": "Çevre Güvenlik Kamera Sistemi",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "900000/v.BAZ_DAIRE*v.TOPLAM_DAIRE",
"fiyatAciklama": "9.000 TL × toplam daire",
"opsiyonel": false
},
{
"i": 160,
"grup": 15,
"ad": "Site Girişi (Güvenlik Kulübesi, Bariyer, Giriş Takı)",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 adet",
"piyasa": "1500000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 161,
"baslik": true,
"grup": 16,
"ad": "SOSYAL TESİSLER"
},
{
"i": 162,
"grup": 16,
"ad": "Hamam",
"birim": "adet",
"metraj": "v.S_HAMAM",
"aciklama": "Seçildiyse 1",
"piyasa": "1800000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 163,
"grup": 16,
"ad": "Sauna",
"birim": "adet",
"metraj": "v.S_SAUNA",
"aciklama": "Seçildiyse 1",
"piyasa": "650000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 164,
"grup": 16,
"ad": "Fin Hamamı",
"birim": "adet",
"metraj": "v.S_FIN",
"aciklama": "Seçildiyse 1",
"piyasa": "750000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 165,
"grup": 16,
"ad": "Fitness Salonu (Ekipman Dahil)",
"birim": "adet",
"metraj": "v.S_FITNESS",
"aciklama": "Seçildiyse 1",
"piyasa": "1800000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 166,
"grup": 16,
"ad": "Kapalı Yüzme Havuzu (Mekanik Dahil)",
"birim": "adet",
"metraj": "v.S_HAVUZ",
"aciklama": "Seçildiyse 1",
"piyasa": "45000*v.HAVUZ_M2",
"fiyatAciklama": "45.000 TL × havuz m² (100 m² → 4.500.000)",
"opsiyonel": false
},
{
"i": 167,
"grup": 16,
"ad": "Sosyal Tesis Mobilya ve Tefrişatı",
"birim": "götürü",
"metraj": "IF(v.S_HAMAM+v.S_SAUNA+v.S_FIN+v.S_FITNESS+v.S_HAVUZ>0,1,0)",
"aciklama": "Herhangi bir sosyal tesis varsa 1",
"piyasa": "300000*(v.S_HAMAM+v.S_SAUNA+v.S_FIN+v.S_FITNESS+v.S_HAVUZ)",
"fiyatAciklama": "300.000 TL × seçilen tesis sayısı",
"opsiyonel": false
},
{
"i": 168,
"baslik": true,
"grup": 17,
"ad": "GENEL GİDERLER"
},
{
"i": 169,
"grup": 17,
"ad": "Dolaylı Personel - SGK ve Vergiler",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "Math.max(4,RUP(v.TIA/v.K_PERSONEL,0))*v.K_SGK*v.SURE_AY",
"fiyatAciklama": "Personel sayısı (inşaat alanı / 1.500, en az 4) × 35.000 TL × süre",
"opsiyonel": false
},
{
"i": 170,
"grup": 17,
"ad": "Dolaylı Personel - Maaş ve Diğer Ödemeler",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "Math.max(4,RUP(v.TIA/v.K_PERSONEL,0))*v.K_MAAS*v.SURE_AY",
"fiyatAciklama": "Personel sayısı × 70.000 TL × süre",
"opsiyonel": false
},
{
"i": 171,
"grup": 17,
"ad": "Şantiye Mobilizasyonu (Konteyner, Ofis, Çevre Çiti vb.)",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "Math.max(750000,RND(2500000/v.BAZ_M2,0)*v.TIA)",
"fiyatAciklama": "167 TL × toplam inşaat alanı (en az 750.000)",
"opsiyonel": false
},
{
"i": 172,
"grup": 17,
"ad": "İşçi Kampı Mobilizasyonu",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "Math.max(500000,RND(2000000/v.BAZ_M2,0)*v.TIA)",
"fiyatAciklama": "133 TL × toplam inşaat alanı (en az 500.000)",
"opsiyonel": false
},
{
"i": 173,
"grup": 17,
"ad": "Şantiye Elektrik Gideri",
"birim": "ay",
"metraj": "v.SURE_AY",
"aciklama": "İnşaat süresi",
"piyasa": "120000/v.BAZ_M2*v.TIA",
"fiyatAciklama": "8 TL × toplam inşaat alanı / ay",
"opsiyonel": false
},
{
"i": 174,
"grup": 17,
"ad": "Şantiye Su Gideri",
"birim": "ay",
"metraj": "v.SURE_AY",
"aciklama": "İnşaat süresi",
"piyasa": "RND(35000/v.BAZ_M2*v.TIA,-2)",
"fiyatAciklama": "2,33 TL × toplam inşaat alanı / ay",
"opsiyonel": false
},
{
"i": 175,
"grup": 17,
"ad": "Şantiye Doğalgaz Gideri",
"birim": "ay",
"metraj": "v.SURE_AY",
"aciklama": "İnşaat süresi",
"piyasa": "RND(20000/v.BAZ_M2*v.TIA,-2)",
"fiyatAciklama": "1,33 TL × toplam inşaat alanı / ay",
"opsiyonel": false
},
{
"i": 176,
"grup": 17,
"ad": "Şantiye İşletme Giderleri",
"birim": "ay",
"metraj": "v.SURE_AY",
"aciklama": "İnşaat süresi",
"piyasa": "RND(250000/v.BAZ_M2*v.TIA,-2)",
"fiyatAciklama": "16,7 TL × toplam inşaat alanı / ay",
"opsiyonel": false
},
{
"i": 177,
"grup": 17,
"ad": "Binek Araç Kirası (2 Araç)",
"birim": "ay",
"metraj": "v.SURE_AY",
"aciklama": "İnşaat süresi",
"piyasa": "110000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 178,
"grup": 17,
"ad": "Binek Araç Yakıt, Bakım ve Otoyol Giderleri",
"birim": "ay",
"metraj": "v.SURE_AY",
"aciklama": "İnşaat süresi",
"piyasa": "60000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 179,
"grup": 17,
"ad": "All Risk İnşaat Sigortası",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "1100000",
"fiyatAciklama": "%0,25 × yapım maliyeti (bloklar + çevre + sosyal tesis toplamı); uygulamada otomatik",
"opsiyonel": false
},
{
"i": 180,
"grup": 17,
"ad": "OSGB Hizmeti",
"birim": "ay",
"metraj": "v.SURE_AY",
"aciklama": "İnşaat süresi",
"piyasa": "25000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 181,
"grup": 17,
"ad": "İSG - Kişisel Koruyucu Donanım",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(900000/v.BAZ_M2,0)*v.TIA",
"fiyatAciklama": "60 TL × toplam inşaat alanı",
"opsiyonel": false
},
{
"i": 182,
"grup": 17,
"ad": "İSG - Toplu Koruma (İskele Filesi, Korkuluk, Güvenlik Ağı)",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(1800000/v.BAZ_M2,0)*v.TIA",
"fiyatAciklama": "120 TL × toplam inşaat alanı",
"opsiyonel": false
},
{
"i": 183,
"grup": 17,
"ad": "Noter Giderleri",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "250000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 184,
"grup": 17,
"ad": "Finansman Giderleri",
"birim": "götürü",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer (finansman yapısına bağlı)",
"piyasa": "15000000",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 185,
"grup": 17,
"ad": "İyileştirme ve Revizyon Giderleri",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(1500000/v.BAZ_M2,0)*v.TIA",
"fiyatAciklama": "100 TL × toplam inşaat alanı",
"opsiyonel": false
},
{
"i": 186,
"grup": 17,
"ad": "Vergi ve Harçlar",
"birim": "götürü",
"metraj": "0",
"aciklama": "OPSİYONEL: varsayılan 0, kullanıcı sonuç ekranında girer (kapsamı belirsiz; ONAY GEREKLİ)",
"piyasa": "5000000",
"fiyatAciklama": "",
"opsiyonel": true
},
{
"i": 187,
"grup": 17,
"ad": "Mali Müşavirlik ve Hukuk Hizmetleri",
"birim": "ay",
"metraj": "v.SURE_AY",
"aciklama": "İnşaat süresi",
"piyasa": "60000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 188,
"baslik": true,
"grup": 18,
"ad": "SATIŞ OFİSİ VE PAZARLAMA GİDERLERİ"
},
{
"i": 189,
"grup": 18,
"ad": "Satış Ofisi - Betonarme İşleri",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)",
"piyasa": "1800000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 190,
"grup": 18,
"ad": "Satış Ofisi - İnce İşler",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)",
"piyasa": "1500000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 191,
"grup": 18,
"ad": "Satış Ofisi - Yalıtım İşleri",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)",
"piyasa": "250000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 192,
"grup": 18,
"ad": "Satış Ofisi - Dekorasyon",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)",
"piyasa": "2000000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 193,
"grup": 18,
"ad": "Satış Ofisi - Cephe Kaplama",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)",
"piyasa": "900000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 194,
"grup": 18,
"ad": "Satış Ofisi - Elektrik İşleri",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)",
"piyasa": "600000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 195,
"grup": 18,
"ad": "Satış Ofisi - Mekanik İşler",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)",
"piyasa": "700000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 196,
"grup": 18,
"ad": "Satış Ofisi - Diğer İşler",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1 (götürü; ≈150 m² ofis varsayımı)",
"piyasa": "500000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 197,
"grup": 18,
"ad": "Örnek Daire Hazırlığı",
"birim": "götürü",
"metraj": "v.SATIS_OFISI*v.ORNEK_DAIRE",
"aciklama": "Satış ofisi ve örnek daire varsa 1",
"piyasa": "2500000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 198,
"grup": 18,
"ad": "Satış Personeli (5 Kişi, Primler Dahil)",
"birim": "ay",
"metraj": "v.SATIS_OFISI*v.SURE_AY",
"aciklama": "Satış ofisi varsa inşaat süresi",
"piyasa": "550000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 199,
"grup": 18,
"ad": "Reklam ve Pazarlama Danışmanlığı",
"birim": "ay",
"metraj": "v.SATIS_OFISI*v.SURE_AY",
"aciklama": "Satış ofisi varsa inşaat süresi",
"piyasa": "150000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 200,
"grup": 18,
"ad": "Reklam ve Medya Bütçesi",
"birim": "götürü",
"metraj": "v.SATIS_OFISI",
"aciklama": "Satış ofisi varsa 1",
"piyasa": "6000000/v.BAZ_DAIRE*v.TOPLAM_DAIRE",
"fiyatAciklama": "60.000 TL × toplam daire",
"opsiyonel": false
},
{
"i": 201,
"grup": 18,
"ad": "Satış Ofisi İşletme Giderleri",
"birim": "ay",
"metraj": "v.SATIS_OFISI*v.SURE_AY",
"aciklama": "Satış ofisi varsa inşaat süresi",
"piyasa": "60000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 202,
"grup": 18,
"ad": "Satış Ofisi Elektrik Gideri",
"birim": "ay",
"metraj": "v.SATIS_OFISI*v.SURE_AY",
"aciklama": "Satış ofisi varsa inşaat süresi",
"piyasa": "15000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 203,
"grup": 18,
"ad": "Satış Ofisi Su Gideri",
"birim": "ay",
"metraj": "v.SATIS_OFISI*v.SURE_AY",
"aciklama": "Satış ofisi varsa inşaat süresi",
"piyasa": "3000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 204,
"grup": 18,
"ad": "Satış Ofisi Doğalgaz Gideri",
"birim": "ay",
"metraj": "v.SATIS_OFISI*v.SURE_AY",
"aciklama": "Satış ofisi varsa inşaat süresi",
"piyasa": "6000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 205,
"baslik": true,
"grup": 19,
"ad": "İŞ MAKİNESİ KİRALAMA"
},
{
"i": 206,
"grup": 19,
"ad": "Beko Loder (JCB) Kiralama",
"birim": "saat",
"metraj": "v.SURE_AY*v.K_JCB",
"aciklama": "İnşaat süresi × 40 saat/ay",
"piyasa": "1800",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 207,
"grup": 19,
"ad": "Mobil Vinç Kiralama",
"birim": "gün",
"metraj": "v.SURE_AY*v.K_MOBIL",
"aciklama": "İnşaat süresi × 2 gün/ay",
"piyasa": "22000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 208,
"grup": 19,
"ad": "Kule Vinç Kiralama",
"birim": "ay",
"metraj": "RUP(v.BLOK_ADEDI/2,0)*RND(v.SURE_AY*v.K_KABA,0)",
"aciklama": "Her 2 bloğa 1 kule vinç × kaba inşaat süresi (sürenin %55'i)",
"piyasa": "200000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 209,
"baslik": true,
"grup": 20,
"ad": "TESLİM VE BAKIM GİDERLERİ"
},
{
"i": 210,
"grup": 20,
"ad": "Teslim ve Bakım Personeli",
"birim": "ay",
"metraj": "v.K_TESLIM",
"aciklama": "6 ay",
"piyasa": "180000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 211,
"grup": 20,
"ad": "Teslim ve Bakım Diğer Giderleri",
"birim": "ay",
"metraj": "v.K_TESLIM",
"aciklama": "6 ay",
"piyasa": "75000",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 212,
"baslik": true,
"grup": 21,
"ad": "PROJE, RUHSAT VE YAPI DENETİM GİDERLERİ"
},
{
"i": 213,
"grup": 21,
"ad": "Yapı Denetim Hizmet Bedeli",
"birim": "m²",
"metraj": "v.TIA",
"aciklama": "Toplam inşaat alanı",
"piyasa": "220",
"fiyatAciklama": "",
"opsiyonel": false
},
{
"i": 214,
"grup": 21,
"ad": "Yapı Ruhsatı Harç ve Giderleri",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(2500000/v.BAZ_M2,0)*v.TIA",
"fiyatAciklama": "167 TL × toplam inşaat alanı",
"opsiyonel": false
},
{
"i": 215,
"grup": 21,
"ad": "İskan (Yapı Kullanma İzni) Giderleri",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(1200000/v.BAZ_M2,0)*v.TIA",
"fiyatAciklama": "80 TL × toplam inşaat alanı",
"opsiyonel": false
},
{
"i": 216,
"grup": 21,
"ad": "Proje Hizmetleri (Mimari, Statik, Mekanik, Elektrik)",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(6000000/v.BAZ_M2,0)*v.TIA",
"fiyatAciklama": "400 TL × toplam inşaat alanı",
"opsiyonel": false
},
{
"i": 217,
"grup": 21,
"ad": "Test ve Laboratuvar Giderleri",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "RND(600000/v.BAZ_M2,0)*v.TIA",
"fiyatAciklama": "40 TL × toplam inşaat alanı",
"opsiyonel": false
},
{
"i": 218,
"baslik": true,
"grup": 22,
"ad": "ÖNGÖRÜLEMEYEN GİDERLER"
},
{
"i": 219,
"grup": 22,
"ad": "Öngörülemeyen Giderler",
"birim": "götürü",
"metraj": "1",
"aciklama": "1 (götürü)",
"piyasa": "15000000",
"fiyatAciklama": "%5 × diğer tüm kalemlerin toplamı (kullanıcı oranı değiştirebilir); uygulamada otomatik",
"opsiyonel": false
}
],
"il": [
{
"ad": "Adana",
"k": 0.9
},
{
"ad": "Adıyaman",
"k": 0.85
},
{
"ad": "Afyonkarahisar",
"k": 0.85
},
{
"ad": "Ağrı",
"k": 0.88
},
{
"ad": "Aksaray",
"k": 0.85
},
{
"ad": "Amasya",
"k": 0.85
},
{
"ad": "Ankara",
"k": 0.95
},
{
"ad": "Antalya",
"k": 0.95
},
{
"ad": "Ardahan",
"k": 0.88
},
{
"ad": "Artvin",
"k": 0.88
},
{
"ad": "Aydın",
"k": 0.9
},
{
"ad": "Balıkesir",
"k": 0.9
},
{
"ad": "Bartın",
"k": 0.85
},
{
"ad": "Batman",
"k": 0.85
},
{
"ad": "Bayburt",
"k": 0.88
},
{
"ad": "Bilecik",
"k": 0.85
},
{
"ad": "Bingöl",
"k": 0.88
},
{
"ad": "Bitlis",
"k": 0.88
},
{
"ad": "Bolu",
"k": 0.85
},
{
"ad": "Burdur",
"k": 0.85
},
{
"ad": "Bursa",
"k": 0.95
},
{
"ad": "Çanakkale",
"k": 0.9
},
{
"ad": "Çankırı",
"k": 0.85
},
{
"ad": "Çorum",
"k": 0.85
},
{
"ad": "Denizli",
"k": 0.9
},
{
"ad": "Diyarbakır",
"k": 0.9
},
{
"ad": "Düzce",
"k": 0.85
},
{
"ad": "Edirne",
"k": 0.85
},
{
"ad": "Elazığ",
"k": 0.85
},
{
"ad": "Erzincan",
"k": 0.85
},
{
"ad": "Erzurum",
"k": 0.85
},
{
"ad": "Eskişehir",
"k": 0.9
},
{
"ad": "Gaziantep",
"k": 0.9
},
{
"ad": "Giresun",
"k": 0.85
},
{
"ad": "Gümüşhane",
"k": 0.88
},
{
"ad": "Hakkari",
"k": 0.88
},
{
"ad": "Hatay",
"k": 0.9
},
{
"ad": "Iğdır",
"k": 0.88
},
{
"ad": "Isparta",
"k": 0.85
},
{
"ad": "İstanbul",
"k": 1.0
},
{
"ad": "İzmir",
"k": 0.95
},
{
"ad": "Kahramanmaraş",
"k": 0.9
},
{
"ad": "Karabük",
"k": 0.85
},
{
"ad": "Karaman",
"k": 0.85
},
{
"ad": "Kars",
"k": 0.88
},
{
"ad": "Kastamonu",
"k": 0.85
},
{
"ad": "Kayseri",
"k": 0.9
},
{
"ad": "Kırıkkale",
"k": 0.85
},
{
"ad": "Kırklareli",
"k": 0.85
},
{
"ad": "Kırşehir",
"k": 0.85
},
{
"ad": "Kilis",
"k": 0.85
},
{
"ad": "Kocaeli",
"k": 0.95
},
{
"ad": "Konya",
"k": 0.9
},
{
"ad": "Kütahya",
"k": 0.85
},
{
"ad": "Malatya",
"k": 0.9
},
{
"ad": "Manisa",
"k": 0.9
},
{
"ad": "Mardin",
"k": 0.85
},
{
"ad": "Mersin",
"k": 0.9
},
{
"ad": "Muğla",
"k": 0.95
},
{
"ad": "Muş",
"k": 0.88
},
{
"ad": "Nevşehir",
"k": 0.85
},
{
"ad": "Niğde",
"k": 0.85
},
{
"ad": "Ordu",
"k": 0.85
},
{
"ad": "Osmaniye",
"k": 0.85
},
{
"ad": "Rize",
"k": 0.85
},
{
"ad": "Sakarya",
"k": 0.9
},
{
"ad": "Samsun",
"k": 0.9
},
{
"ad": "Siirt",
"k": 0.88
},
{
"ad": "Sinop",
"k": 0.85
},
{
"ad": "Sivas",
"k": 0.85
},
{
"ad": "Şanlıurfa",
"k": 0.9
},
{
"ad": "Şırnak",
"k": 0.88
},
{
"ad": "Tekirdağ",
"k": 0.9
},
{
"ad": "Tokat",
"k": 0.85
},
{
"ad": "Trabzon",
"k": 0.9
},
{
"ad": "Tunceli",
"k": 0.88
},
{
"ad": "Uşak",
"k": 0.85
},
{
"ad": "Van",
"k": 0.88
},
{
"ad": "Yalova",
"k": 0.9
},
{
"ad": "Yozgat",
"k": 0.85
},
{
"ad": "Zonguldak",
"k": 0.85
}
],
"blokSon": 151
};})(typeof window!=="undefined"?window:globalThis);
