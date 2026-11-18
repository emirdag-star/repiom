/* REPİO(M) hesap motoru. Arayüzden bağımsızdır; tarayıcıda ve Node'da çalışır.
   Formüller, katsayılar ve fiyatlar kaynak/veri.js içindedir (REPIOM_Hesap_Mantigi_v4.xlsx'ten üretilir). */
(function (g) {
  'use strict';
  var V = g.REPIOM_VERI;
  var IF = function (c, a, b) { return c ? a : b; };
  var RND = function (x, n) { var p = Math.pow(10, n || 0); return Math.round(x * p) / p; };
  var RUP = function (x, n) { var p = Math.pow(10, n || 0); return Math.ceil(x * p - 1e-9) / p; };
  var cache = {};
  function fn(expr) {
    if (!cache[expr]) cache[expr] = new Function('v', 'Q', 'SP', 'IF', 'RND', 'RUP', 'return (' + expr + ');');
    return cache[expr];
  }

  /* Tipe bağlı satırlar: şablondaki "2+1 / 3+1 / Çatı Katı" satırlarının yerine girilen her daire tipi için üretilir. */
  var odaFiyat = function (kucuk, buyuk) { return function (t) { return t.ODA >= 3 ? buyuk : kucuk; }; };
  var TIP_SATIR = {
    91: { ad: 'Mutfak Dolabı', dubleks: false, metraj: function (t) { return t.N; }, fiyat: function (t) { return 14000 + 1600 * t.A; }, aciklama: '14.000 + 1.600 × daire brüt m²' },
    96: { ad: 'Vestiyer Dolabı', dubleks: true, metraj: function (t) { return t.N; }, fiyat: function (t) { return 1000 + 400 * t.A; }, aciklama: '1.000 + 400 × daire brüt m²' },
    109: { ad: 'Duşakabin', dubleks: false, metraj: function (t) { return t.N * (1 + t.EBANYO); }, fiyat: odaFiyat(14000, 16000), aciklama: '2 odaya kadar 14.000; 3 oda ve üzeri 16.000' },
    112: { ad: 'Banyo Seti (Vitrifiye+Armatür+Aksesuar)', dubleks: false, metraj: function (t) { return t.N; }, fiyat: function (t) { return 25000 + 30000 * (1 + t.EBANYO); }, aciklama: '25.000 + 30.000 × dairedeki banyo adedi' },
    123: { ad: 'Elektrik İşleri', dubleks: true, metraj: function (t) { return t.N; }, fiyat: function (t) { return 18000 + 1200 * t.A; }, aciklama: '18.000 + 1.200 × daire brüt m²' },
    139: { ad: 'Isıtma Tesisatı', dubleks: true, metraj: function (t) { return t.N; }, fiyat: function (t, v) { return (4000 + 600 * t.A) * (v.ISITMA_SEKLI === 'RADYATÖR' ? 1 : v.K_YERDEN); }, aciklama: '(4.000 + 600 × brüt m²) × yerden ısıtmada 1,5' },
    141: { ad: 'Yangın Tesisatı', dubleks: true, metraj: function (t, v) { return v.H_USTU > v.K_YUKSEK_BINA ? t.N : 0; }, fiyat: odaFiyat(30000, 38000), aciklama: 'Yalnız bina yüksekliği 30,50 m üstündeyse; 2 odaya kadar 30.000, 3 oda ve üzeri 38.000' }
  };
  var TIP_ATLA = { 92: 1, 97: 1, 110: 1, 113: 1, 124: 1, 140: 1, 142: 1 };

  function katsayilar(ozel) {
    var k = {};
    V.katsayi.forEach(function (x) { k[x.ad] = x.deger; });
    Object.keys(ozel || {}).forEach(function (a) { k[a] = ozel[a]; });
    return k;
  }
  function ilKatsayisi(il) {
    var x = V.il.filter(function (i) { return i.ad === il; })[0];
    return x ? x.k : 1;
  }
  /* ---------- Girdi modeli ve eksik bilgiyi tamamlama ----------
     Kullanıcı yalnız bildiği kadarını girer; boş bırakılan her şey aşağıdaki varsayımlarla tamamlanır.
     Varsayımlar kullanıcıya gösterilmez. */
  var VARS = {
    normalKat: 5, ortakAlan: 0.12, taks: 0.30, katM2: 450,
    yukseklik: { bodrum: 3, otopark: 3, dukkan: 4.5, normal: 3, dubleks: 2.8 },
    gomulu: { bodrum: 'EVET', otopark: 'EVET', dukkan: 'HAYIR', normal: 'HAYIR', dubleks: 'HAYIR' },
    brut: { 1: 70, 2: 100, 3: 130, 4: 170, 5: 220 }, dubleksCarpan: 1.4,
    sistem: { cephe: 'EPS', isitma: 'KOMBİ', isitmaSekli: 'RADYATÖR', banyoTavan: 'YEŞİL ALÇIPAN', cati: 'KIRMA', doseme: 'ASMOLEN', suDeposu: 'MODÜLER', dilatasyon: 0, merdiven: 1, mantoAltiSiva: 'EVET' }
  };
  var TURLER = ['bodrum', 'otopark', 'dukkan', 'normal', 'dubleks'];
  var bos = function (x) { return x === undefined || x === null || x === ''; };
  var sayiMi = function (x) { return !bos(x) && isFinite(+x); };
  var num = function (x) { return sayiMi(x) ? +x : 0; };
  var gomulukDeger = function (x) { return x === 'EVET' ? 1 : x === 'YARI' || x === 'YARI GÖMÜLÜ' ? 0.5 : 0; };
  var varYok = function (x, vars) { return x === 'VAR' || x === true ? 1 : x === 'YOK' || x === false ? 0 : vars; };

  function tipTamamla(t) {
    var oda = parseInt(String(t.duzen || '').split('+')[0], 10);
    if (!(oda > 0)) oda = 2;
    var dub = t.dubleks === true || t.dubleks === 'VAR' || t.dubleks === 'EVET';
    var brut = sayiMi(t.brut) && +t.brut > 0 ? +t.brut : VARS.brut[Math.min(oda, 5)] * (dub ? VARS.dubleksCarpan : 1);
    return {
      id: t.id, ad: String(t.ad || '').trim(), duzen: String(t.duzen || (oda + '+1')).trim(), ODA: oda, A: brut,
      BALKON: sayiMi(t.balkon) ? +t.balkon : (oda >= 3 ? 2 : 1),
      AYRI: t.mutfak === 'AMERİKAN' ? 0 : 1,
      ISIK: varYok(t.isikBandi, 0), ALATURKA: varYok(t.alaturka, 0),
      EBANYO: sayiMi(t.ebeveynBanyo) ? +t.ebeveynBanyo : (oda >= 3 ? 1 : 0),
      ANKASTRE: varYok(t.ankastre, 1), KLIMA: num(t.klima), DUBLEKS: dub ? 1 : 0
    };
  }
  var URETILEN = {
    v2: tipTamamla({ id: '_v2', duzen: '2+1', brut: 100 }),
    v3: tipTamamla({ id: '_v3', duzen: '3+1', brut: 130 }),
    vd: tipTamamla({ id: '_vd', duzen: '4+1', dubleks: true })
  };
  function daireDagit(katM2, dubleks) {
    var daireAlan = katM2 / (1 + VARS.ortakAlan);
    if (dubleks) { var n = Math.max(1, Math.round(daireAlan * 2 / URETILEN.vd.A)); return [{ tip: URETILEN.vd, adet: n }]; }
    var n2 = Math.round(daireAlan * 0.5 / URETILEN.v2.A), n3 = Math.round(daireAlan * 0.5 / URETILEN.v3.A);
    if (n2 + n3 === 0) n2 = 1;
    return [{ tip: URETILEN.v2, adet: n2 }, { tip: URETILEN.v3, adet: n3 }].filter(function (d) { return d.adet > 0; });
  }
  function detayliMi(b) {
    return (b.katlar || []).some(function (k) {
      return num(k.m2) > 0 || (k.daireler || []).some(function (d) { return num(d.adet) > 0 && d.tip; });
    });
  }
  /* Bir kat satırının alanı: normal katta daireler + ortak alan; dubleks katta bu toplam iki seviyeye bölünür. */
  function katAlani(r) {
    if (r.tur !== 'normal' && r.tur !== 'dubleks') return r.m2;
    if (r._m2) return r._m2;
    var d = r.daireler.reduce(function (s, x) { return s + x.adet * x.tip.A; }, 0) * (1 + VARS.ortakAlan);
    return r.tur === 'dubleks' ? d / 2 : d;
  }
  function seviye(r) { return r.tur === 'dubleks' ? 2 : 1; }
  function blokAlani(rows) { return rows.reduce(function (s, r) { return s + r.tekrar * seviye(r) * katAlani(r); }, 0); }

  function katlariTamamla(b, tipMap, otBlok) {
    var ham = (b.katlar || []).filter(function (k) { return TURLER.indexOf(k.tur) >= 0 && !(sayiMi(k.tekrar) && +k.tekrar <= 0); });
    var rows = ham.map(function (k) {
      return {
        tur: k.tur, tekrar: sayiMi(k.tekrar) ? Math.round(+k.tekrar) : 1,
        h: sayiMi(k.yukseklik) && +k.yukseklik > 0 ? +k.yukseklik : VARS.yukseklik[k.tur],
        g: gomulukDeger(bos(k.gomulu) ? VARS.gomulu[k.tur] : k.gomulu),
        m2: num(k.m2), _m2: num(k._m2),
        daireler: (k.daireler || []).filter(function (d) { return num(d.adet) > 0 && tipMap[d.tip]; }).map(function (d) { return { tip: tipMap[d.tip], adet: num(d.adet) }; })
      };
    });
    /* Bilinen bir kat alanı: önce girilen m², sonra dairelerden çıkan kat alanı, sonra toplam oturumdan blok payı. */
    var bilinen = 0;
    rows.forEach(function (r) {
      if (r.tur === 'normal' || r.tur === 'dubleks') { if (r.daireler.length || r._m2) bilinen = Math.max(bilinen, katAlani(r)); }
      else bilinen = Math.max(bilinen, r.m2);
    });
    if (!bilinen) bilinen = otBlok || VARS.katM2;
    rows.forEach(function (r) {
      if ((r.tur === 'normal' || r.tur === 'dubleks') && !r.daireler.length) { r._m2 = r._m2 || bilinen; r.daireler = daireDagit(r._m2, r.tur === 'dubleks'); }
      if (r.tur !== 'normal' && r.tur !== 'dubleks' && !(r.m2 > 0)) r.m2 = bilinen;
    });
    return rows;
  }
  function katlariUret(hedef, ot) {
    var n, katM2, bodM2;
    if (ot > 0 && hedef > ot * 1.5) { n = Math.max(1, Math.round(hedef / ot - 1)); katM2 = (hedef - ot) / n; bodM2 = ot; }
    else { n = VARS.normalKat; katM2 = hedef / (n + 1); bodM2 = katM2; }
    return [
      { tur: 'bodrum', tekrar: 1, h: VARS.yukseklik.bodrum, g: 1, m2: bodM2, _m2: 0, daireler: [] },
      { tur: 'normal', tekrar: n, h: VARS.yukseklik.normal, g: 0, m2: 0, _m2: katM2, daireler: daireDagit(katM2, false) }
    ];
  }

  /* Kullanıcının girdiğini tam bir modele çevirir. Dönen nesnede her blokun kat satırları eksiksizdir. */
  function tamamla(p) {
    var tipMap = {};
    (p.tipler || []).forEach(function (t) { if (t && t.id) tipMap[t.id] = tipTamamla(t); });
    var gir = p.bloklar && p.bloklar.length ? p.bloklar : [{}];
    var nBlok = gir.length, otGir = num(p.toplamOturum), otBlok = otGir ? otGir / nBlok : 0, tia = num(p.toplamInsaatAlani);
    var bl = gir.map(function (b, n) {
      return { ad: String(b.ad || '').trim() || ('Blok ' + (n + 1)), girdi: b, detayli: detayliMi(b) };
    });
    bl.forEach(function (x) { if (x.detayli) x.katlar = katlariTamamla(x.girdi, tipMap, otBlok); });
    var detaylar = bl.filter(function (x) { return x.detayli; });
    var detAlan = detaylar.reduce(function (s, x) { return s + blokAlani(x.katlar); }, 0);
    var eksik = bl.filter(function (x) { return !x.detayli; }), uyari = [], f = function (x) { return Math.round(x).toLocaleString('tr-TR'); };
    if (eksik.length) {
      var hedef = tia > detAlan ? (tia - detAlan) / eksik.length : 0;
      if (!hedef && detaylar.length) hedef = detAlan / detaylar.length;
      if (!hedef && otBlok) hedef = otBlok * (VARS.normalKat + 1);
      if (!hedef) return { hata: 'Hesap için en az toplam inşaat alanını ya da bir bloğun kat bilgilerini gir.' };
      if (tia && tia <= detAlan) uyari.push('Girdiğin toplam inşaat alanı (' + f(tia) + ' m²) kat bilgisi girilen blokların alanından (' + f(detAlan) + ' m²) küçük; kat bilgisi girilmeyen bloklar diğer blokların ortalamasıyla hesaplandı.');
      eksik.forEach(function (x) { x.katlar = katlariUret(hedef, otBlok); });
    } else if (tia && Math.abs(detAlan - tia) / tia > 0.01) {
      uyari.push('Kat ve daire bilgilerine göre toplam inşaat alanı ' + f(detAlan) + ' m² çıktı; girdiğin ' + f(tia) + ' m² yerine bu kullanıldı.');
    }
    bl.forEach(function (x) {
      var s = x.girdi.sistem || {}, d = {};
      Object.keys(VARS.sistem).forEach(function (a) { d[a] = bos(s[a]) ? VARS.sistem[a] : s[a]; });
      d.asansor = s.asansor;
      x.sistem = d;
    });
    return { bloklar: bl, uyari: uyari, nBlok: nBlok, otGir: otGir, tia: tia, tumuDetayli: !eksik.length };
  }

  /* Tamamlanmış bir bloğu hesap motorunun değişkenlerine çevirir. */
  function blokDegiskenleri(x, pv) {
    var v = Object.assign({}, pv), rows = x.katlar, s = x.sistem;
    var top = function (tur, f) { return rows.filter(function (r) { return r.tur === tur; }).reduce(function (a, r) { return a + f(r); }, 0); };
    [['BOD', 'bodrum'], ['OTO', 'otopark'], ['DUK', 'dukkan']].forEach(function (k) {
      var n = top(k[1], function (r) { return r.tekrar; });
      v['N_' + k[0]] = n;
      v['A_' + k[0]] = n ? top(k[1], function (r) { return r.tekrar * r.m2; }) / n : 0;
      v['H_' + k[0]] = n ? top(k[1], function (r) { return r.tekrar * r.h; }) / n : 0;
    });
    var konut = rows.filter(function (r) { return r.tur === 'normal' || r.tur === 'dubleks'; });
    var nk = konut.reduce(function (a, r) { return a + r.tekrar * seviye(r); }, 0);
    v.N_NOR = nk;
    v.A_NOR = nk ? konut.reduce(function (a, r) { return a + r.tekrar * seviye(r) * katAlani(r); }, 0) / nk : 0;
    v.H_NOR = nk ? konut.reduce(function (a, r) { return a + r.tekrar * seviye(r) * r.h; }, 0) / nk : 0;
    v.BIA = blokAlani(rows);
    v.TABAN = rows.reduce(function (a, r) { return Math.max(a, katAlani(r)); }, 0);
    v.H_YERALTI = rows.reduce(function (a, r) { return a + r.tekrar * seviye(r) * r.h * r.g; }, 0);
    v.H_USTU = rows.reduce(function (a, r) { return a + r.tekrar * seviye(r) * r.h * (1 - r.g); }, 0);
    v.KAT_YERALTI = rows.reduce(function (a, r) { return a + (r.g > 0 ? r.tekrar : 0); }, 0);
    var katToplam = v.N_BOD + v.N_OTO + v.N_DUK + v.N_NOR;
    v.CEPHE_TIP = s.cephe; v.ISITMA = s.isitma; v.ISITMA_SEKLI = s.isitmaSekli; v.BANYO_TAVAN = s.banyoTavan;
    v.CATI_TIP = s.cati; v.DOSEME = s.doseme; v.SU_DEPOSU = s.suDeposu; v.N_DILATASYON = num(s.dilatasyon); v.MANTO_SIVA = s.mantoAltiSiva === 'EVET' ? 1 : 0;
    v.N_MERDIVEN = sayiMi(s.merdiven) ? +s.merdiven : 1;
    v.N_ASANSOR = sayiMi(s.asansor) ? +s.asansor : (katToplam >= 4 ? v.N_MERDIVEN : 0);
    /* Daire tipleri: aynı tip dubleks katta ve normal katta kullanılmışsa iki ayrı satır olur. */
    var T = [], tm = {};
    konut.forEach(function (r) {
      r.daireler.forEach(function (d) {
        var dub = d.tip.DUBLEKS || r.tur === 'dubleks' ? 1 : 0, key = d.tip.id + '|' + dub;
        if (!tm[key]) { tm[key] = Object.assign({}, d.tip, { N: 0, DUBLEKS: dub }); T.push(tm[key]); }
        tm[key].N += d.adet * r.tekrar;
      });
    });
    var ovr = x.girdi._ovr || {};
    Object.keys(ovr).forEach(function (a) { v[a] = ovr[a]; });
    var SP = function (f) { return T.reduce(function (a, t) { return a + Number(f(t)); }, 0); };
    var sabit = { TOPLAM_OTURUM: 1, CEVRE_ALAN: 1, TIA: 1, KAT_YERALTI: 1, H_YERALTI: 1, H_USTU: 1 };
    V.girdi.forEach(function (g) { if (g.formul && !sabit[g.ad]) v[g.ad] = fn(g.formul)(v, null, SP, IF, RND, RUP); });
    Object.keys(v).forEach(function (a) { if (typeof v[a] === 'number' && !isFinite(v[a])) v[a] = 0; });
    return { v: v, T: T, SP: SP };
  }
  function tipEtiket(t, hepsi) {
    var ad = t.ad && t.ad !== t.duzen ? t.ad + ' (' + t.duzen + ')' : t.duzen;
    var ayni = hepsi.filter(function (y) { return (y.ad && y.ad !== y.duzen ? y.ad + ' (' + y.duzen + ')' : y.duzen) === ad; }).length > 1;
    return ad + (ayni ? ' ' + Math.round(t.A) + ' m²' : '');
  }

  function projeDegiskenleri(p, k, m) {
    var v = Object.assign({}, k);
    v.IL_KATSAYI = ilKatsayisi(p.il);
    v.SURE_AY = num(p.sureAy) || 18;
    var e = function (x) { return x === true || x === 'VAR' || x === 'EVET' ? 1 : 0; };
    v.SATIS_OFISI = e(p.satisOfisi); v.ORNEK_DAIRE = e(p.ornekDaire); v.JENERATOR = e(p.jenerator); v.TRAFO = e(p.trafo);
    v.S_HAMAM = e(p.hamam); v.S_SAUNA = e(p.sauna); v.S_FIN = e(p.finHamami); v.S_FITNESS = e(p.fitness); v.S_HAVUZ = e(p.havuz);
    v.HAVUZ_M2 = num(p.havuzM2) || 100;
    if (sayiMi(p.ongorulemeyenOrani)) v.K_ONGORULEMEYEN = +p.ongorulemeyenOrani / 100;
    v.BLOK_ADEDI = m.nBlok;
    return v;
  }

  function satir(k, ad, metraj, piyasa, ek) {
    var tam = function (x) { return isFinite(x) ? x : 0; };
    metraj = tam(metraj); piyasa = tam(piyasa);
    return Object.assign({ i: k.i, grup: k.grup, ad: ad, birim: k.birim, metraj: metraj, piyasaFiyat: piyasa,
      piyasaTutar: metraj * piyasa, aciklama: k.aciklama,
      fiyatAciklama: k.fiyatAciklama || '', opsiyonel: !!k.opsiyonel, anahtar: String(k.i) }, ek || {});
  }

  /* Yüklenen fiyat listesinde bu kalemin fiyatı varsa onu döner (il katsayısından önce). Kod: K + 3 haneli kalem sırası. */
  function kalemKodu(i) { return 'K' + ('00' + i).slice(-3); }
  function sabitFiyat(v, i) {
    var f = v._FIYAT && v._FIYAT[kalemKodu(i)];
    return typeof f === 'number' && isFinite(f) ? f : null;
  }
  /* lo..hi aralığındaki kalemleri hesaplar. Fiyatlar piyasa birim fiyatıdır ve il katsayısıyla çarpılır. */
  function kalemleriHesapla(lo, hi, v, T, SP, ek) {
    var K = V.kalem, memo = {}, il = v.IL_KATSAYI || 1, out = [];
    var Q = function (i) {
      if (!(i in memo)) memo[i] = fn(K[i].metraj)(v, Q, SP, IF, RND, RUP);
      return memo[i];
    };
    for (var i = lo; i <= hi; i++) {
      var k = K[i];
      if (k.baslik) { out.push({ baslik: true, grup: k.grup, ad: k.ad }); continue; }
      if (TIP_ATLA[i]) continue;
      if (TIP_SATIR[i]) {
        var ts = TIP_SATIR[i];
        T.filter(function (t) { return ts.dubleks || !t.DUBLEKS; }).forEach(function (t) {
          var f = sabitFiyat(v, i), et = tipEtiket(t, T);
          if (f === null) f = ts.fiyat(t, v);
          out.push(satir(k, k.ad.replace('[daire tipi]', et), ts.metraj(t, v), f * il, { anahtar: i + '|' + et, aciklama: 'Bu tipteki ' + (i === 109 ? 'banyo' : 'daire') + ' adedi', fiyatAciklama: ts.aciklama, tipSatiri: true, tipOda: t.ODA }));
        });
        continue;
      }
      var m = Q(i), sf = sabitFiyat(v, i);
      var pf = ek && ek.sifirFiyat && ek.sifirFiyat[i] ? 0 : (sf !== null ? sf : fn(k.piyasa)(v, Q, SP, IF, RND, RUP)) * il;
      out.push(satir(k, k.ad, m, pf));
    }
    return out;
  }
  function numarala(rows) {
    var n = 0;
    rows.forEach(function (r) { if (r.baslik) { n = 0; r.no = String(r.grup); } else { n++; r.no = r.grup + '.' + n; } });
    return rows;
  }
  function duzeltmeleriUygula(rows, d) {
    d = d || {};
    rows.forEach(function (r) {
      if (r.baslik) return;
      var x = d[r.anahtar];
      if (!x) return;
      if (x.metraj != null) { r.metraj = +x.metraj; r.metrajElle = true; }
      if (x.piyasa != null) { r.piyasaFiyat = +x.piyasa; r.piyasaElle = true; }
      r.piyasaTutar = r.metraj * r.piyasaFiyat;
    });
    return rows;
  }
  /* Çizimden gelen ya da kullanıcının eklediği ek kalemler: kendi grubunun sonuna eklenir. e: {grup, ad, birim, metraj, fiyat, kaynak, aciklama} */
  function ekKalemleriEkle(rows, ekler, il) {
    (ekler || []).forEach(function (e, n) {
      var son = -1;
      rows.forEach(function (r, j) { if (r.grup === e.grup) son = j; });
      if (son < 0) return;
      var m = +e.metraj || 0, f = (+e.fiyat || 0) * (il || 1);
      rows.splice(son + 1, 0, { i: null, grup: e.grup, ad: e.ad + (e.kaynak === 'tahmini' ? ' (tahmini fiyat)' : ''), birim: e.birim || '', metraj: m, piyasaFiyat: f, piyasaTutar: m * f, aciklama: e.aciklama || '',
        fiyatAciklama: e.kaynak === 'tahmini' ? 'Tahmini fiyat (yapay zekâ) — kontrol edin' : (e.kaynak || ''), opsiyonel: false, anahtar: 'E|' + e.ad + '|' + (e.birim || ''), ek: true, tahmini: e.kaynak === 'tahmini' });
    });
    return rows;
  }
  function basliklariTopla(rows) {
    var cur = null, top = { piyasa: 0 };
    rows.forEach(function (r) {
      if (r.baslik) { cur = r; r.piyasaTutar = 0; }
      else { cur.piyasaTutar += r.piyasaTutar; top.piyasa += r.piyasaTutar; }
    });
    return top;
  }

  function uyarilar(p, m, pv) {
    var u = m.uyari.slice(), f = function (x) { return Math.round(x).toLocaleString('tr-TR'); };
    if (m.tumuDetayli && m.otGir && Math.abs(pv.TOPLAM_OTURUM - m.otGir) / m.otGir > 0.01)
      u.push('Kat bilgilerine göre toplam oturum alanı ' + f(pv.TOPLAM_OTURUM) + ' m² çıktı; girdiğin ' + f(m.otGir) + ' m² yerine bu kullanıldı.');
    if (num(p.arsa) && num(p.arsa) < pv.TOPLAM_OTURUM) u.push('Arsa alanı (' + f(num(p.arsa)) + ' m²) toplam oturum alanından (' + f(pv.TOPLAM_OTURUM) + ' m²) küçük; çevre düzenleme alanı 0 alındı.');
    return u;
  }

  /* Ana giriş: proje girdilerinden tüm tabloları üretir. */
  function hesapla(p, secenek) {
    secenek = secenek || {};
    var m = tamamla(p);
    if (m.hata) return { hata: m.hata };
    var k = katsayilar(secenek.katsayilar), pv = projeDegiskenleri(p, k, m), d = p.duzeltmeler || {};
    pv._FIYAT = secenek.fiyatlar || null;
    /* Proje değişkenleri blok sonuçlarına bağlı: önce bloklar ön hesaplanır, sonra toplamlar kurulur. */
    var on = m.bloklar.map(function (x) { return blokDegiskenleri(x, pv); });
    pv.TIA = on.reduce(function (a, o) { return a + o.v.BIA; }, 0);
    pv.TOPLAM_OTURUM = on.reduce(function (a, o) { return a + o.v.TABAN; }, 0);
    pv.ARSA = num(p.arsa) || pv.TOPLAM_OTURUM / VARS.taks;
    pv.CEVRE_ALAN = Math.max(0, pv.ARSA - pv.TOPLAM_OTURUM);
    pv.TOPLAM_DAIRE = on.reduce(function (a, o) { return a + o.v.ND; }, 0);
    Object.keys(p._ovr || {}).forEach(function (a) { pv[a] = p._ovr[a]; });
    var bloklar = m.bloklar.map(function (x, n) {
      var b = blokDegiskenleri(x, pv);
      var rows = kalemleriHesapla(0, V.blokSon, b.v, b.T, b.SP);
      ekKalemleriEkle(rows, (p.ekKalemler || {})['blok' + n], b.v.IL_KATSAYI);
      numarala(rows);
      duzeltmeleriUygula(rows, d['blok' + n]);
      return { ad: x.ad, v: b.v, T: b.T, katlar: x.katlar, satirlar: rows, toplam: basliklariTopla(rows) };
    });
    var bt = { piyasa: bloklar.reduce(function (s, b) { return s + b.toplam.piyasa; }, 0) };

    /* Proje geneli: all risk ve öngörülemeyen gerçek toplamlar üzerinden iki aşamada hesaplanır. */
    var SP0 = function () { return 0; }, I_ALLRISK = 179, I_ONG = 219;
    var gecici = kalemleriHesapla(V.blokSon + 1, V.kalem.length - 1, pv, [], SP0, { sifirFiyat: (function () { var o = {}; o[I_ALLRISK] = 1; o[I_ONG] = 1; return o; })() });
    numarala(gecici); duzeltmeleriUygula(gecici, d.proje); basliklariTopla(gecici);
    var grupTop = function (g, alan) { return gecici.filter(function (r) { return r.baslik && r.grup === g; })[0][alan]; };
    var ar = gecici.filter(function (r) { return r.i === I_ALLRISK; })[0], og = gecici.filter(function (r) { return r.i === I_ONG; })[0];
    if (!ar.piyasaElle) ar.piyasaFiyat = pv.K_ALLRISK * (bt.piyasa + grupTop(15, 'piyasaTutar') + grupTop(16, 'piyasaTutar'));
    ar.piyasaTutar = ar.metraj * ar.piyasaFiyat;
    var pt = basliklariTopla(gecici);
    if (!og.piyasaElle) og.piyasaFiyat = pv.K_ONGORULEMEYEN * (bt.piyasa + pt.piyasa);
    og.piyasaTutar = og.metraj * og.piyasaFiyat;
    pt = basliklariTopla(gecici);

    /* Tüm proje: blok kalemlerinde metrajlar toplanır, birim fiyat ağırlıklı ortalamadır. */
    var harita = {}, sira = [];
    bloklar.forEach(function (b) {
      var sonBaslik = null;
      b.satirlar.forEach(function (r) {
        var a = r.baslik ? 'B' + r.grup : r.anahtar;
        if (!harita[a]) {
          harita[a] = r.baslik ? { baslik: true, grup: r.grup, ad: r.ad } : Object.assign({}, r, { metraj: 0, piyasaTutar: 0, metrajElle: false, piyasaElle: false });
          if (r.baslik || !sonBaslik) sira.push(a); else sira.splice(sira.lastIndexOf(sonBaslik.son) + 1, 0, a);
        }
        if (r.baslik) sonBaslik = { son: a }; else {
          sonBaslik.son = a;
          var h = harita[a]; h.metraj += r.metraj; h.piyasaTutar += r.piyasaTutar;
        }
      });
    });
    var tum = sira.map(function (a) {
      var h = harita[a];
      if (!h.baslik) h.piyasaFiyat = h.metraj ? h.piyasaTutar / h.metraj : h.piyasaFiyat;
      return h;
    }).concat(gecici.map(function (r) { return Object.assign({}, r); }));
    numarala(tum);
    var tt = basliklariTopla(tum);

    var kdv = (p.kdvOrani == null || p.kdvOrani === '' ? 20 : +p.kdvOrani) / 100;
    return {
      proje: pv, bloklar: bloklar, projeGeneli: { satirlar: gecici, toplam: pt }, tumProje: { satirlar: tum, toplam: tt },
      ozet: { piyasa: tt.piyasa, kdvOrani: kdv, piyasaKdv: tt.piyasa * kdv,
        piyasaKdvDahil: tt.piyasa * (1 + kdv), m2Piyasa: pv.TIA ? tt.piyasa / pv.TIA : 0, m2KdvDahil: pv.TIA ? tt.piyasa * (1 + kdv) / pv.TIA : 0,
        toplamInsaatAlani: pv.TIA, toplamDaire: pv.TOPLAM_DAIRE },
      uyarilar: uyarilar(p, m, pv)
    };
  }

  /* ---------- Hazır şablon ve örnek proje (giriş formunu doldurur) ---------- */
  var sid = 0;
  function yeniId() { sid++; return 't' + Date.now().toString(36) + sid; }
  function bosTip(ad, duzen, brut) {
    return { id: yeniId(), ad: ad || '', duzen: duzen || '', brut: bos(brut) ? '' : brut, dubleks: false, balkon: '', mutfak: '', isikBandi: '', alaturka: '', ebeveynBanyo: '', ankastre: '', klima: '' };
  }
  function bosSistem() { return { cephe: '', mantoAltiSiva: '', asansor: '', merdiven: '', isitma: '', isitmaSekli: '', banyoTavan: '', cati: '', doseme: '', suDeposu: '', dilatasyon: '' }; }
  function bosKat(tur) { return { tur: tur, tekrar: 1, yukseklik: '', gomulu: '', m2: '', daireler: tur === 'normal' || tur === 'dubleks' ? [{ tip: '', adet: '' }] : [] }; }
  function bosBlok(n) { return { ad: String.fromCharCode(65 + n) + ' BLOK', katlar: [], sistem: bosSistem() }; }
  function bosProje() {
    return { ad: '', il: 'İstanbul', arsa: '', blokAdedi: '', toplamOturum: '', toplamInsaatAlani: '', tipler: [], bloklar: [bosBlok(0)],
      sureAy: 18, satisOfisi: false, ornekDaire: false, jenerator: false, trafo: false, hamam: false, sauna: false, finHamami: false, fitness: false, havuz: false, havuzM2: 100, kdvOrani: 20, ongorulemeyenOrani: 2 };
  }
  /* Site bloğu: blok başına 1 bodrum + 1 otopark (gömülü), 10 normal kat; her katta 2 × 2+1 (100 m²) ve 2 × 3+1 (130 m²); 2 asansör; kombi.
     Toplam inşaat alanı girilmişse normal kat adedi ona göre ayarlanır. */
  function siteBlogu(p) {
    p = p || bosProje();
    var t1 = bosTip('TİP1', '2+1', 100), t2 = bosTip('TİP2', '3+1', 130);
    var katM2 = Math.round((2 * 100 + 2 * 130) * (1 + VARS.ortakAlan));
    var nBlok = Math.max(1, num(p.blokAdedi) || p.bloklar.length || 1), nNor = 10;
    if (num(p.toplamInsaatAlani)) nNor = Math.max(1, Math.round(num(p.toplamInsaatAlani) / nBlok / katM2 - 2));
    p.tipler = [t1, t2];
    p.bloklar = [];
    for (var n = 0; n < nBlok; n++) {
      var b = bosBlok(n);
      b.katlar = [
        { tur: 'bodrum', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: katM2, daireler: [] },
        { tur: 'otopark', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: katM2, daireler: [] },
        { tur: 'normal', tekrar: nNor, yukseklik: 3, gomulu: 'HAYIR', m2: '', daireler: [{ tip: t1.id, adet: 2 }, { tip: t2.id, adet: 2 }] }
      ];
      b.sistem = Object.assign(bosSistem(), { cephe: 'EPS', asansor: 2, merdiven: 1, isitma: 'KOMBİ', isitmaSekli: 'RADYATÖR' });
      p.bloklar.push(b);
    }
    if (!bos(p.blokAdedi)) p.blokAdedi = nBlok;
    return p;
  }
  /* Örnek proje: kullanıcının KONUT İNŞAATI MALİYET HESAPLAMA PROGRAMIrev şablonundaki Yenikent Sitesi. */
  function ornekProje() {
    var p = bosProje();
    var t = [bosTip('TİP1', '2+1', 100), bosTip('TİP2', '3+1', 120), bosTip('TİP3', '1+1', 70), bosTip('TİP4', '4+1', 200), bosTip('TİPDUBLEKS5', '3+1', 180)];
    t[4].dubleks = true;
    [[2, 1, 1], [3, 2, 2], [1, 1, 1], [3, 3, 3], [4, 3, 3]].forEach(function (x, i) { t[i].balkon = x[0]; t[i].ebeveynBanyo = x[1]; t[i].klima = x[2]; });
    Object.assign(p, { ad: 'YENİKENT SİTESİ', arsa: 2000, blokAdedi: 2, toplamOturum: 800, toplamInsaatAlani: 4000, tipler: t });
    var a = bosBlok(0);
    a.katlar = [
      { tur: 'bodrum', tekrar: 1, yukseklik: 3, gomulu: 'EVET', m2: 400, daireler: [] },
      { tur: 'otopark', tekrar: 1, yukseklik: 2.6, gomulu: 'YARI', m2: 400, daireler: [] },
      { tur: 'dukkan', tekrar: 1, yukseklik: 4.5, gomulu: 'HAYIR', m2: 400, daireler: [] },
      { tur: 'normal', tekrar: 1, yukseklik: 2.97, gomulu: 'HAYIR', m2: '', daireler: [{ tip: t[0].id, adet: 2 }, { tip: t[1].id, adet: 2 }] },
      { tur: 'normal', tekrar: 1, yukseklik: 2.97, gomulu: 'HAYIR', m2: '', daireler: [{ tip: t[2].id, adet: 4 }] },
      { tur: 'normal', tekrar: 1, yukseklik: 2.97, gomulu: 'HAYIR', m2: '', daireler: [{ tip: t[3].id, adet: 2 }] },
      { tur: 'dubleks', tekrar: 1, yukseklik: 2.8, gomulu: 'HAYIR', m2: '', daireler: [{ tip: t[4].id, adet: 2 }] }
    ];
    a.sistem = Object.assign(bosSistem(), { asansor: 2, merdiven: 2 });
    p.bloklar = [a, bosBlok(1)];
    return p;
  }

  g.REPIOM = { hesapla: hesapla, tamamla: tamamla, kalemKodu: kalemKodu, TIP_ATLA: TIP_ATLA, ornekProje: ornekProje, siteBlogu: siteBlogu, bosProje: bosProje, bosBlok: bosBlok, bosKat: bosKat, bosTip: bosTip, bosSistem: bosSistem, katAlani: katAlani, TURLER: TURLER, veri: V, TIP_SATIR: TIP_SATIR };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.REPIOM;
})(typeof window !== 'undefined' ? window : globalThis);
