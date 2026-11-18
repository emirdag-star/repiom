/* REPİO(M) fiyat listesi araçları (yönetici): güncelleme tablosunu Excel olarak üretir,
   doldurulmuş Excel'i okur (kütüphanesiz; tarayıcının açma desteğiyle) ve farkları çıkarır. */
(function (g) {
  'use strict';
  var R = g.REPIOM;
  var ORAN = { 179: 1, 219: 1 };   /* All risk ve öngörülemeyen: toplamın yüzdesi; fiyat listesinde yer almaz */

  /* Kalem listesi: kod, sıra, ad, birim, sabit fiyatlı mı, uygulamadaki varsayılan fiyat ya da formül açıklaması */
  function kalemler() {
    var out = [], grup = 0, n = 0;
    R.veri.kalem.forEach(function (k) {
      if (k.baslik) { grup = k.grup; n = 0; out.push({ baslik: true, sira: String(grup), ad: k.ad }); return; }
      if (R.TIP_ATLA[k.i] || ORAN[k.i]) return;
      n++;
      var sabit = /^-?[\d.]+$/.test(String(k.piyasa)) && !R.TIP_SATIR[k.i];   /* tipe bağlı satırlar oda/m² formülüyle fiyatlanır */
      out.push({ kod: R.kalemKodu(k.i), sira: grup + '.' + n, ad: k.ad, birim: k.birim, sabit: sabit, varsayilan: sabit ? +k.piyasa : null, formul: sabit ? '' : (k.fiyatAciklama || (R.TIP_SATIR[k.i] && R.TIP_SATIR[k.i].aciklama) || 'Proje büyüklüğüne göre hesaplanır') });
    });
    return out;
  }
  /* Bir kalemin geçerli fiyatı: listede varsa o, yoksa uygulamanın varsayılanı (formüllü kalemlerde null). */
  function gecerli(k, liste) { var f = liste && liste[k.kod]; return typeof f === 'number' ? f : k.varsayilan; }

  /* ---------- Güncelleme tablosu (Excel) ---------- */
  function guncellemeTablosu(liste, bilgi) {
    var I = g.REPIOM_RAPOR._ic, S = I.STIL, s = new I.Sayfa('Birim Fiyatlar');
    s.genislik = [8, 8, 58, 9, 11, 18, 46, 18];
    s.ekle([{ v: 'REPİO(M) birim fiyat güncelleme tablosu', s: S.altBaslik }]);
    s.ekle([{ v: (bilgi || '') + ' Yalnız sarı "YENİ Birim Fiyat" sütununu doldur; boş bıraktığın kalemin fiyatı değişmez. Kod sütununa dokunma, satır ekleyip silme. Fiyatlar TL, KDV hariç, İstanbul bazı.', s: S.notYazi }]); s.birlesik.push('A2:H2');
    s.bos();
    s.ekle(['Kod', 'Sıra', 'İş Kalemi', 'Birim', 'Fiyat türü', 'Mevcut Birim Fiyat', 'Formül (formüllü kalemlerde)', 'YENİ Birim Fiyat'].map(function (x) { return { v: x, s: S.baslikSatiri }; }));
    s.dondur = 4;
    kalemler().forEach(function (k) {
      if (k.baslik) { s.ekle([{ v: '', s: S.grup }, { v: k.sira, s: S.grup }, { v: k.ad, s: S.grup }, { v: '', s: S.grup }, { v: '', s: S.grup }, { v: '', s: S.grup }, { v: '', s: S.grup }, { v: '', s: S.grup }]); return; }
      var f = gecerli(k, liste), ozel = liste && typeof liste[k.kod] === 'number' && !k.sabit;
      s.ekle([{ v: k.kod, s: S.metin }, { v: k.sira, s: S.metin }, { v: k.ad, s: S.metin }, { v: k.birim || '', s: S.metin }, { v: k.sabit || ozel ? 'Sabit' : 'Formül', s: S.metin },
        { v: f === null ? '' : f, s: S.ondalik }, { v: k.sabit ? '' : (ozel ? 'Sabit fiyatla değiştirilmiş. Formül: ' : '') + k.formul, s: S.metin }, { v: '', s: S.elle }]);
    });
    s.bos();
    s.ekle([{ v: 'All risk sigortası ve öngörülemeyen giderler toplam maliyetin yüzdesi olduğu için bu tabloda yer almaz.', s: S.notYazi }]);
    s.ekle([{ v: 'Formüllü kalemlere rakam yazarsan o kalem proje büyüklüğünden bağımsız sabit fiyatla hesaplanır. Formülün kendisini değiştirmek için geliştiriciye bildir.', s: S.notYazi }]);
    return I.xlsx([s]);
  }

  /* ---------- Excel okuma ---------- */
  async function ac(veri, ofs, boy, yontem) {
    var parca = veri.subarray(ofs, ofs + boy);
    if (yontem === 0) return parca;
    if (yontem !== 8) throw new Error('Desteklenmeyen sıkıştırma');
    var akis = new Blob([parca]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(akis).arrayBuffer());
  }
  async function zipAc(buf) {
    var v = new Uint8Array(buf), d = new DataView(v.buffer, v.byteOffset, v.byteLength), son = -1;
    for (var i = v.length - 22; i >= Math.max(0, v.length - 70000); i--) if (d.getUint32(i, true) === 0x06054b50) { son = i; break; }
    if (son < 0) throw new Error('Dosya bir Excel (.xlsx) dosyası değil.');
    var adet = d.getUint16(son + 10, true), p = d.getUint32(son + 16, true), dosyalar = {}, td = new TextDecoder();
    for (var n = 0; n < adet; n++) {
      var yontem = d.getUint16(p + 10, true), boy = d.getUint32(p + 20, true), adBoy = d.getUint16(p + 28, true), ekBoy = d.getUint16(p + 30, true), notBoy = d.getUint16(p + 32, true), yerel = d.getUint32(p + 42, true);
      var ad = td.decode(v.subarray(p + 46, p + 46 + adBoy));
      dosyalar[ad] = { yontem: yontem, boy: boy, yerel: yerel };
      p += 46 + adBoy + ekBoy + notBoy;
    }
    return {
      oku: async function (ad) {
        var f = dosyalar[ad]; if (!f) return null;
        var veriBas = f.yerel + 30 + d.getUint16(f.yerel + 26, true) + d.getUint16(f.yerel + 28, true);
        return td.decode(await ac(v, veriBas, f.boy, f.yontem));
      }
    };
  }
  var ent = function (s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, function (m, c) { return String.fromCharCode(+c); }).replace(/&amp;/g, '&'); };
  function metinler(xml) { return (xml.match(/<t[^>]*>[\s\S]*?<\/t>|<t[^>]*\/>/g) || []).map(function (t) { return ent(t.replace(/<[^>]+>/g, '')); }).join(''); }
  function sutunNo(ref) { var s = ref.replace(/\d+/g, ''), n = 0; for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64; return n - 1; }
  /* Excel dosyasındaki sayfaları satır dizileri olarak döner: { 'Sayfa adı': [[...], ...] } */
  async function excelOku(buf) {
    var z = await zipAc(buf);
    var wb = await z.oku('xl/workbook.xml'); if (!wb) throw new Error('Dosya bir Excel (.xlsx) dosyası değil.');
    var rels = await z.oku('xl/_rels/workbook.xml.rels') || '', hedef = {};
    (rels.match(/<Relationship\b[^>]*>/g) || []).forEach(function (r) { var id = (r.match(/Id="([^"]+)"/) || [])[1], t = (r.match(/Target="([^"]+)"/) || [])[1]; if (id && t) hedef[id] = t.replace(/^\/?xl\//, '').replace(/^\//, ''); });
    var ss = await z.oku('xl/sharedStrings.xml'), paylasilan = ss ? (ss.match(/<si>[\s\S]*?<\/si>/g) || []).map(metinler) : [];
    var sonuc = {};
    var sayfalar = wb.match(/<sheet\b[^>]*>/g) || [];
    for (var i = 0; i < sayfalar.length; i++) {
      var ad = ent((sayfalar[i].match(/name="([^"]*)"/) || [])[1] || ''), rid = (sayfalar[i].match(/r:id="([^"]+)"/) || sayfalar[i].match(/\bid="([^"]+)"/) || [])[1];
      var xml = await z.oku('xl/' + (hedef[rid] || ('worksheets/sheet' + (i + 1) + '.xml')));
      if (!xml) continue;
      var satirlar = [];
      (xml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) || []).forEach(function (row) {
        var rn = +(row.match(/\br="(\d+)"/) || [])[1] - 1, dizi = [];
        (row.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || []).forEach(function (c) {
          var ref = (c.match(/\br="([A-Z]+\d+)"/) || [])[1], t = (c.match(/\bt="([^"]+)"/) || [])[1], val = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1], deger;
          if (t === 's') deger = paylasilan[+val];
          else if (t === 'inlineStr') deger = metinler(c);
          else if (t === 'str' || t === 'e') deger = val === undefined ? '' : ent(val);
          else if (t === 'b') deger = val === '1';
          else deger = val === undefined ? null : +val;
          if (ref) dizi[sutunNo(ref)] = deger;
        });
        satirlar[rn] = dizi;
      });
      sonuc[ad] = satirlar;
    }
    return sonuc;
  }
  /* Türkçe ya da İngilizce yazılmış sayıyı çevirir: 1.250,50 / 1250.5 / "1250" */
  function sayiCevir(x) {
    if (typeof x === 'number') return isFinite(x) ? x : null;
    if (x === null || x === undefined) return null;
    var s = String(x).replace(/\s|TL|₺/gi, '');
    if (!s) return null;
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    else if (/,\d{1,2}$/.test(s) || (s.indexOf(',') >= 0 && s.indexOf('.') >= 0 && s.lastIndexOf(',') > s.lastIndexOf('.'))) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
    var n = +s; return isFinite(n) ? n : null;
  }
  /* Güncelleme tablosundan yeni fiyatları ayıklar. Eski tablolardaki "YENİ Piyasa Birim Fiyat" başlığını da tanır. */
  function yeniFiyatlar(sayfalar) {
    var bulunan = null;
    Object.keys(sayfalar).some(function (ad) {
      var rows = sayfalar[ad];
      for (var r = 0; r < Math.min(rows.length, 15); r++) {
        var row = rows[r] || [], kod = -1, yeni = -1;
        row.forEach(function (h, j) { var t = String(h || '').toLocaleUpperCase('tr').replace(/\s+/g, ' ').trim(); if (t === 'KOD') kod = j; if (/^YENİ( PİYASA)? BİRİM FİYAT/.test(t)) yeni = j; });
        if (kod >= 0 && yeni >= 0) { bulunan = { rows: rows, bas: r, kod: kod, yeni: yeni }; return true; }
      }
      return false;
    });
    if (!bulunan) throw new Error('Dosyada "Kod" ve "YENİ Birim Fiyat" sütunları bulunamadı. Yönetici sayfasından indirdiğin güncelleme tablosunu kullan.');
    var gecerliKodlar = {}, out = {}, hatalar = [];
    kalemler().forEach(function (k) { if (!k.baslik) gecerliKodlar[k.kod] = k; });
    for (var r = bulunan.bas + 1; r < bulunan.rows.length; r++) {
      var row = bulunan.rows[r] || [], kod = String(row[bulunan.kod] || '').trim().toUpperCase(), ham = row[bulunan.yeni];
      if (!kod || ham === null || ham === undefined || ham === '') continue;
      if (!gecerliKodlar[kod]) { hatalar.push(kod + ': bilinmeyen kod'); continue; }
      var n = sayiCevir(ham);
      if (n === null || n < 0) { hatalar.push(kod + ': "' + ham + '" geçerli bir fiyat değil'); continue; }
      out[kod] = n;
    }
    return { fiyatlar: out, hatalar: hatalar };
  }
  /* Mevcut listeyle karşılaştırma: yalnız değişen kalemler */
  function farklar(yeni, mevcut) {
    return kalemler().filter(function (k) { return !k.baslik && yeni[k.kod] !== undefined; }).map(function (k) {
      var eski = gecerli(k, mevcut);
      return { kod: k.kod, sira: k.sira, ad: k.ad, birim: k.birim, eski: eski, yeni: yeni[k.kod], oran: eski ? (yeni[k.kod] - eski) / eski : null, formulDegisir: !k.sabit && !(mevcut && typeof mevcut[k.kod] === 'number') };
    }).filter(function (f) { return f.eski === null || Math.abs(f.yeni - f.eski) > 1e-9; });
  }

  g.REPIOM_FIYAT = { kalemler: kalemler, guncellemeTablosu: guncellemeTablosu, excelOku: excelOku, yeniFiyatlar: yeniFiyatlar, farklar: farklar, sayiCevir: sayiCevir };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.REPIOM_FIYAT;
})(typeof window !== 'undefined' ? window : globalThis);
