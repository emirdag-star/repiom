/* REPİO(M) — DXF analiz modülü (ücretli). Tarayıcıda çalışır, ek kütüphane yok.
   Mimari ve statik DXF'i okur; kat planlarını, mahalleri, kapı/pencereleri, kalıp planlarını, temeli ve özel kalemleri çıkarır;
   uygulamanın hesap motoruna verilecek proje girdisini (_ovr ölçümleri, metraj düzeltmeleri, ek kalemler) üretir.
   Python prototipi (dxf_prototip/kod) ile birebir aynı kurallar. */
(function (g) {
  'use strict';

  /* ---------- yardımcılar ---------- */
  function pyRound(x) { var r = Math.round(x); return (Math.abs(x % 1) === 0.5 && r % 2 !== 0) ? r - 1 : r; }
  function sayac() { var m = new Map(); return { ekle: function (k, n) { m.set(k, (m.get(k) || 0) + (n == null ? 1 : n)); }, al: function (k) { return m.get(k) || 0; }, map: m,
    enSik: function (n) { var a = Array.from(m.entries()); a.sort(function (x, y) { return y[1] - x[1]; }); return n ? a.slice(0, n) : a; }, sil: function (k) { m.delete(k); }, boyut: function () { return m.size; } }; }
  function alan(P) { var s = 0, n = P.length; for (var i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function cevre(P) { var s = 0, n = P.length; for (var i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); } return s; }
  function hullAlan(P) {
    var seen = {}, Q = [];
    P.forEach(function (p) { var k = p[0] + ',' + p[1]; if (!seen[k]) { seen[k] = 1; Q.push(p); } });
    Q.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    if (Q.length < 3) return 0;
    var cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], up = [];
    Q.forEach(function (p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    for (var i = Q.length - 1; i >= 0; i--) { var p = Q[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return alan(lo.slice(0, -1).concat(up.slice(0, -1)));
  }
  function sayi(s) { return /,\d/.test(s) ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s); }
  function metin(s) {
    s = s.replace(/\\U\+([0-9A-Fa-f]{4})/g, function (_, h) { return String.fromCharCode(parseInt(h, 16)); });
    s = s.replace(/\\[ACFHQTWfpi][^;]*;/g, '').split('\\P').join(' ').split('\\~').join(' ').replace(/[{}]/g, '');
    s = s.replace(/\\[LlOoKk]/g, '').split('%%c').join('Ø').split('%%d').join('°').split('%%p').join('±');
    return s.trim();
  }
  function bosluk(s) { return s.replace(/\s+/g, ' '); }
  function norm(s) { return bosluk(s.split('%%U').join('').split('%%u').join('')).trim(); }

  /* ---------- 1. DXF okuyucu: satır satır, yalnız ENTITIES bölümü + $INSUNITS ---------- */
  var U8 = new TextDecoder('utf-8', { fatal: true }), W1254 = new TextDecoder('windows-1254');
  function satirCoz(b, i, j) {
    var ascii = true;
    for (var k = i; k < j; k++) if (b[k] > 127) { ascii = false; break; }
    if (ascii) { var s = ''; for (var k2 = i; k2 < j; k2 += 4096) s += String.fromCharCode.apply(null, b.subarray(k2, Math.min(j, k2 + 4096))); return s; }
    var p = b.subarray(i, j);
    try { return U8.decode(p); } catch (e) { return W1254.decode(p); }
  }
  /* parcalar: Uint8Array parçaları veren async yineleyici. Dönüş: {T, I, L, P, header} */
  async function oku(parcalar, ilerleme) {
    var T = [], I = [], L = [], P = [], header = {};
    var bolum = null, bekle = false, hdrAd = null, v = null, kod = null, degerSirasi = false, okunan = 0, artik = null;
    function kapat() {
      if (!v) return;
      var t = v.t, a = v.a;
      if (t === 'TEXT' || t === 'MTEXT') T.push({ m: metin((a[1] || '') + (v.c3 || '')), x: +a[10] || 0, y: +a[20] || 0, h: +a[40] || 0, k: a[8] || '', tip: t });
      else if (t === 'INSERT') I.push({ ad: a[2] || '', x: +a[10] || 0, y: +a[20] || 0, k: a[8] || '' });
      else if (t === 'LINE') L.push([a[8] || '', +a[10] || 0, +a[20] || 0, +a[11] || 0, +a[21] || 0]);
      else if (t === 'LWPOLYLINE') P.push({ k: a[8] || '', P: v.pts });
      v = null;
    }
    function cift(k, s) {
      if (k === 0) {
        if (bolum === 'ENTITIES') kapat();
        if (s === 'SECTION') { bekle = true; bolum = null; return; }
        if (s === 'ENDSEC') { bolum = null; return; }
        if (bolum === 'ENTITIES') v = { t: s, a: {}, pts: s === 'LWPOLYLINE' ? [] : null, c3: '' };
        return;
      }
      if (bekle && k === 2) { bolum = s; bekle = false; return; }
      if (bolum === 'HEADER') { if (k === 9) hdrAd = s; else if (hdrAd && !(hdrAd in header)) header[hdrAd] = s; return; }
      if (!v) return;
      if (v.pts && k === 10) { v.pts.push([+s, 0]); if (!(10 in v.a)) v.a[10] = s; return; }
      if (v.pts && k === 20) { if (v.pts.length) v.pts[v.pts.length - 1][1] = +s; if (!(20 in v.a)) v.a[20] = s; return; }
      if (k === 3 && v.t === 'MTEXT') { v.c3 += s; return; }
      if (!(k in v.a)) v.a[k] = s;
    }
    for await (var b of parcalar) {
      if (artik) { var bb = new Uint8Array(artik.length + b.length); bb.set(artik); bb.set(b, artik.length); b = bb; artik = null; }
      var bas = 0;
      for (var i = 0; i < b.length; i++) {
        if (b[i] !== 10) continue;
        var son = i; if (son > bas && b[son - 1] === 13) son--;
        var s = satirCoz(b, bas, son); bas = i + 1;
        if (!degerSirasi) { var st = s.trim(); kod = /^-?\d+$/.test(st) ? parseInt(st, 10) : null; degerSirasi = true; }
        else { if (kod !== null) cift(kod, s); degerSirasi = false; }
      }
      if (bas < b.length) artik = b.slice(bas);
      okunan += b.length; if (ilerleme) ilerleme(okunan);
    }
    kapat();
    return { T: T, I: I, L: L, P: P, header: header };
  }
  function dosyaOku(file, ilerleme) {
    var r = file.stream().getReader();
    var it = { [Symbol.asyncIterator]: function () { return { next: function () { return r.read(); } }; } };
    return oku(it, ilerleme);
  }

  /* ---------- 2. Kat başlıkları ve plan bölgeleri ---------- */
  function katBasligi(s) {
    var u = s.toUpperCase().replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
    if (!/PLAN/.test(u) || /VAZIYET|YERLESIM|CEVRE PLAN|DEPOSU|ALAN HESAB|KESIT|GORUNUS|DETAY/.test(u)) return null;
    if (/KALIP|APLIKASYON|DONATI|TEMEL|JET GROUT|IKSA/.test(u)) return null;
    var bm = /\b([A-Z])\s*BLOK/.exec(u), blok = bm ? bm[1] : '';
    var gov = u.replace(/\b[A-Z]\s*BLOK\b/g, '');
    if (/CATI\s+PLAN/.test(gov) && !/CATI\s+KATI/.test(gov)) return { blok: blok, tur: 'cati', katlar: ['ÇATI'], tekrar: 0 };
    if (/CATI\s+KATI/.test(gov)) return { blok: blok, tur: 'catikati', katlar: ['ÇATI KATI'], tekrar: 1 };
    var katlar = [], m, re1 = /(\d+)\s*\.?\s*BODRUM/g;
    while ((m = re1.exec(gov))) katlar.push(m[1] + '. BODRUM');
    if (/BODRUM/.test(gov) && !katlar.length) katlar.push('BODRUM');
    if (/OTOPARK/.test(gov)) katlar.push('OTOPARK');
    if (/ZEMIN/.test(gov)) katlar.push('ZEMİN');
    var g2 = gov.replace(/\d+\s*\.?\s*BODRUM/g, '').replace(/1\s*\/\s*\d+|O\s*:\s*1\s*\/\s*\d+/g, '');
    m = /([\d][\d\s\.,\-+VE]*)\s*\.?\s*(N\.\s*)?KAT/.exec(g2);
    if (m) (m[1].match(/\d+/g) || []).forEach(function (n) { katlar.push(n + '. KAT'); });
    if (!katlar.length) return null;
    var tur = /BODRUM/.test(gov) ? 'bodrum' : (/OTOPARK/.test(gov) && katlar.length === 1) ? 'otopark' : 'normal';
    return { blok: blok, tur: tur, katlar: katlar, tekrar: katlar.length };
  }
  function bolgeler(bs) {
    var sat = new Map();
    bs.forEach(function (b) { var k = pyRound(b[2] / 500); if (!sat.has(k)) sat.set(k, []); sat.get(k).push(b); });
    var ys = Array.from(sat.keys()).sort(function (a, b) { return a - b; }), out = [];
    ys.forEach(function (k, i) {
      var s = sat.get(k).slice().sort(function (a, b) { return a[1] - b[1]; }), y0 = Math.min.apply(null, s.map(function (b) { return b[2]; }));
      var ust = (i + 1 < ys.length ? Math.min.apply(null, ys.slice(i + 1).map(function (kk) { return Math.min.apply(null, sat.get(kk).map(function (b) { return b[2]; })); })) : y0 + 6000) - 100;
      s.forEach(function (b, j) {
        var sol = j ? (s[j - 1][1] + b[1]) / 2 : b[1] - (s.length > 1 ? (s[1][1] - b[1]) / 2 : 3000);
        var sag = j + 1 < s.length ? (s[j + 1][1] + b[1]) / 2 : b[1] + (j ? (b[1] - s[j - 1][1]) / 2 : 3000);
        out.push({ baslik: b[0], x0: sol, x1: sag, y0: y0 - 150, y1: ust });
      });
    });
    return out;
  }

  /* ---------- 3. Mimari: mahaller, kapı/pencere, çevre ---------- */
  var MAHAL = [
    [/^SALON|OTURMA/, 'Salon', 'kuru'], [/^E\.?\s*Y\.?\s*ODASI|EBEVEYN/, 'Ebeveyn yatak odası', 'kuru'], [/^Y\.?\s*ODASI|YATAK/, 'Yatak odası', 'kuru'],
    [/^ODA\s*\+\s*MUTFAK/, 'Oda + mutfak nişi', 'kuru'], [/^ODA/, 'Oda', 'kuru'], [/^MUTFAK/, 'Mutfak', 'mutfak'], [/^BANYO/, 'Banyo', 'islak'], [/^DUŞ|^DUS/, 'Duş / ebeveyn banyosu', 'islak'],
    [/^WC|^W\.C/, 'WC', 'islak'], [/^ANTRE|^HOL$|^ANTRE\/HOL|^KORİDOR|^KORIDOR/, 'Antre / hol', 'kuru'], [/^BALKON|^BLK|^TERAS/, 'Balkon / teras', 'balkon'],
    [/MER(D)?\.?\s*HOL|MERDİVEN HOL|^MERDİVEN|^MERD/, 'Merdiven / merdiven holü', 'ortak'], [/TEC\.?\s*HOL|^HOL\b|GİRİŞ HOL|GIRIS HOL/, 'Kat / giriş holü', 'ortak'],
    [/^ASANSÖR|^ASANSOR/, 'Asansör', 'ortak'], [/OTOPARK|GARAJ/, 'Otopark', 'teknik'], [/DEPO|KİLER|KILER/, 'Depo', 'teknik'],
    [/ENERJİ|ENERJI|TELEKOM|JENERAT|KAZAN|SU DEPOSU|HİDROFOR|POMPA|SIĞINAK|SIGINAK|ELEKTRİK|TRAFO|ÇÖP|COP/, 'Teknik hacim', 'teknik'], [/DÜKKAN|DUKKAN|MAĞAZA/, 'Dükkan', 'dukkan'],
    [/ÇATI ARASI|CATI ARASI/, 'Çatı arası', 'teknik']];
  function mahalTanit(ad) {
    var u = ad.trim().toUpperCase().replace(/i/g, 'İ');
    for (var i = 0; i < MAHAL.length; i++) if (MAHAL[i][0].test(u)) return [MAHAL[i][1], MAHAL[i][2]];
    return [null, null];
  }
  function gruplar(Ls, d) {
    var par = Ls.map(function (_, i) { return i; }), bul = function (i) { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
    var hucre = new Map();
    Ls.forEach(function (l, i) { [[l[0], l[1]], [l[2], l[3]]].forEach(function (p) { var k = Math.floor(p[0] / d) + ',' + Math.floor(p[1] / d); if (!hucre.has(k)) hucre.set(k, []); hucre.get(k).push(i); }); });
    hucre.forEach(function (ids, k) {
      var c = k.split(',').map(Number);
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) (hucre.get((c[0] + dx) + ',' + (c[1] + dy)) || []).forEach(function (j) { ids.forEach(function (i) { par[bul(i)] = bul(j); }); });
    });
    var gm = new Map();
    Ls.forEach(function (l, i) { var r = bul(i); if (!gm.has(r)) gm.set(r, []); gm.get(r).push(l); });
    return Array.from(gm.values());
  }
  function mimari(d) {
    var T = d.T.map(function (t) { return Object.assign({}, t, { m: bosluk(t.m) }); });
    var PL = d.L.filter(function (l) { return /PENCERE|PENC/i.test(l[0]); }).map(function (l) { return l.slice(1); });
    var KP = [];
    d.P.forEach(function (p) {
      if (/%30/.test(p.k) || p.P.length < 3) return;
      var a = alan(p.P); if (!(a > 5000 && a < 1e7)) return;
      var xs = p.P.map(function (q) { return q[0]; }), ys = p.P.map(function (q) { return q[1]; });
      KP.push([p.P, a, Math.min.apply(null, xs), Math.max.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, ys)]);
    });
    var plan = T.filter(function (t) { return /PLAN/.test(t.m.toUpperCase()) && t.m.length < 80 && t.h > 0; });
    if (!plan.length) return { hata: 'Mimari dosyada kat planı başlığı bulunamadı.', katlar: [] };
    var hm = Math.max.apply(null, plan.map(function (t) { return t.h; }));
    plan = plan.filter(function (t) { return t.h >= 0.6 * hm; });
    var say = sayac(); plan.forEach(function (t) { if (katBasligi(t.m)) say.ekle(pyRound(t.y / 500)); });
    plan = plan.filter(function (t) { return say.al(pyRound(t.y / 500)) >= 3; });
    var B = bolgeler(plan.map(function (t) { return [t.m, t.x, t.y]; })), katlar = [];
    B.forEach(function (r) {
      var kb = katBasligi(r.baslik);
      if (!kb || kb.tur === 'cati') return;
      var ic = T.filter(function (t) { return r.x0 <= t.x && t.x < r.x1 && r.y0 <= t.y && t.y < r.y1; }), mh = [];
      ic.forEach(function (t) {
        if (!/\bA\s*:\s*[\d.,]+\s*m/.test(t.m)) return;
        var parca = t.m.split(/\b(Döşeme|Zemin|Duvar|Tavan|A)\s*:\s*/), ad = parca[0].trim(), al = {};
        for (var i = 1; i < parca.length - 1; i += 2) al[parca[i]] = parca[i + 1].trim();
        var am = /^([\d.,]+)/.exec(al.A || '');
        if (!ad || !am) return;
        var st = mahalTanit(ad);
        mh.push({ ad: ad, std: st[0], tur: st[1], alan: sayi(am[1]), zemin: al['Döşeme'] != null ? al['Döşeme'] : (al.Zemin || ''), duvar: al.Duvar || '', tavan: al.Tavan || '', x: t.x, y: t.y, kaynak: 'birleşik etiket' });
      });
      if (!mh.length) {
        var alanlar = ic.filter(function (t) { return /^\d+[.,]\d+\s*m(²|2)$/.test(t.m); }), kul = {};
        ic.forEach(function (t) {
          if (/^[\d.,/+\-±]+/.test(t.m) || t.m.length > 30) return;
          var st = mahalTanit(t.m); if (!st[0]) return;
          var aday = [];
          alanlar.forEach(function (a, i) { if (!kul[i] && Math.abs(a.x - t.x) < 80 && t.y - a.y > 0 && t.y - a.y < 45) aday.push([Math.abs(a.x - t.x) + Math.abs(t.y - a.y - 18), i]); });
          if (!aday.length && st[0] !== 'Asansör') return;
          var A = 0;
          if (aday.length) { aday.sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }); var i = aday[0][1]; kul[i] = 1; A = sayi(/^([\d.,]+)/.exec(alanlar[i].m)[1]); }
          mh.push({ ad: t.m.trim(), std: st[0], tur: st[1], alan: A, zemin: '', duvar: '', tavan: '', x: t.x, y: t.y, kaynak: 'ad + alan yazısı' });
        });
      }
      var kapi = sayac(), pen = sayac();
      ic.forEach(function (t) {
        var m = /^([KPD]\d*)?\s*(\d{2,3})\s*\/\s*(\d{2,3})(?:\s*h\s*=\s*(\d+))?$/.exec(t.m);
        if (!m) return;
        var on = (m[1] || '').toUpperCase(), en = +m[2], boy = +m[3];
        if (on[0] === 'K' || (on[0] !== 'P' && boy >= 200)) kapi.ekle(en + '/' + boy); else pen.ekle(en + '/' + boy);
      });
      var py = pen.boyut() ? 'ölçü yazısı' : '';
      if (!pen.boyut()) {
        gruplar(PL.filter(function (l) { return r.x0 <= l[0] && l[0] < r.x1 && r.y0 <= l[1] && l[1] < r.y1; }), 40).forEach(function (gq) {
          var xs = [], ys = []; gq.forEach(function (l) { xs.push(l[0], l[2]); ys.push(l[1], l[3]); });
          var dx = Math.max.apply(null, xs) - Math.min.apply(null, xs), dy = Math.max.apply(null, ys) - Math.min.apply(null, ys), en = Math.max(dx, dy), kal = Math.min(dx, dy);
          if (en >= 40 && en <= 450 && kal <= 60) pen.ekle((pyRound(en / 10) * 10) + '/150');
        });
        if (pen.boyut()) py = 'pencere katmanı çizgileri (yükseklik 150 varsayıldı)';
      }
      mh.forEach(function (m_) {
        m_.cevre = null;
        if (!m_.alan) return;
        for (var i = 0; i < KP.length; i++) {
          var k = KP[i];
          if (Math.abs(k[1] / 1e4 - m_.alan) / m_.alan < 0.08 && k[2] <= m_.x && m_.x <= k[3] && k[4] - 60 <= m_.y && m_.y <= k[5]) { m_.cevre = cevre(k[0].concat([k[0][0]])) / 100; break; }
        }
      });
      katlar.push({ baslik: r.baslik, bolge: [r.x0, r.y0, r.x1, r.y1], blok: kb.blok, tur: kb.tur, katlar: kb.katlar, tekrar: kb.tekrar, genislik: r.x1 - r.x0, mahaller: mh,
        kapilar: Object.fromEntries(kapi.map), pencereler: Object.fromEntries(pen.map), pencere_yontemi: py });
    });
    var gs = katlar.map(function (k) { return k.genislik; }).sort(function (a, b) { return a - b; }), gen = gs.length ? gs[Math.floor(gs.length / 2)] : 0;
    var birim = gen >= 800 && gen <= 9000 ? 'cm' : gen > 8000 && gen <= 90000 ? 'mm' : gen >= 8 && gen <= 90 ? 'm' : '?';
    var bu = { 1: 'inç', 4: 'mm', 5: 'cm', 6: 'm', 0: 'belirsiz' }[parseInt(d.header.$INSUNITS || '0', 10)] || '?';
    return { birim_baslik: bu, birim: birim, plan_genisligi: gen, katlar: katlar };
  }

  /* ---------- 4. Statik: kalıp planları, temel, jet grout ---------- */
  function kumeler(cz, h) {
    h = h || 150;
    var par = new Map(), bul = function (a) { while (par.get(a) !== a) { par.set(a, par.get(par.get(a))); a = par.get(a); } return a; };
    var birles = function (a, b) { if (!par.has(a)) par.set(a, a); if (!par.has(b)) par.set(b, b); var ra = bul(a), rb = bul(b); par.set(ra, rb); };
    var hk = function (x, y) { return Math.floor(x / h) + ',' + Math.floor(y / h); };
    cz.forEach(function (l) {
      var ax = Math.floor(l[1] / h), ay = Math.floor(l[2] / h), a = ax + ',' + ay;
      birles(a, hk(l[3], l[4]));
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { var n = (ax + dx) + ',' + (ay + dy); if (par.has(n)) birles(a, n); }
    });
    var g2 = new Map();
    cz.forEach(function (l) { var r = bul(hk(l[1], l[2])); if (!g2.has(r)) g2.set(r, []); g2.get(r).push(l); });
    return Array.from(g2.values());
  }
  function icAlan(C, x0, y0, x1, y1, h) {
    h = h || 20;
    var nx = Math.floor((x1 - x0) / h) + 3, ny = Math.floor((y1 - y0) / h) + 3, gr = new Uint8Array(nx * ny);
    C.forEach(function (c) {
      var n = Math.floor(Math.max(Math.abs(c[2] - c[0]), Math.abs(c[3] - c[1])) / (h / 2)) + 1;
      for (var i = 0; i <= n; i++) {
        var t = i / n, x = Math.trunc((c[0] + (c[2] - c[0]) * t - x0) / h) + 1, y = Math.trunc((c[1] + (c[3] - c[1]) * t - y0) / h) + 1;
        if (x >= 0 && x < nx && y >= 0 && y < ny) gr[y * nx + x] = 1;
      }
    });
    var dis = new Uint8Array(nx * ny), q = new Int32Array(nx * ny), bas = 0, son = 0, n2 = 1; q[son++] = 0; dis[0] = 1;
    while (bas < son) {
      var k = q[bas++], x = k % nx, y = (k - x) / nx;
      var kom = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (var j = 0; j < 4; j++) { var xx = kom[j][0], yy = kom[j][1]; if (xx >= 0 && xx < nx && yy >= 0 && yy < ny) { var jj = yy * nx + xx; if (!dis[jj] && !gr[jj]) { dis[jj] = 1; q[son++] = jj; n2++; } } }
    }
    return (nx * ny - n2) * h * h;
  }
  function katKodu(ad) {
    var m = /^K(Z|Ç|B)(\d{2,3})$/.exec(ad); if (m) return { Z: 'Zemin', 'Ç': 'Çatı', B: 'Bodrum' }[m[1]];
    m = /^K(\d)B(\d{2,3})$/.exec(ad); if (m) return m[1] + '. bodrum';
    m = /^K(\d{3,4})$/.exec(ad); if (m) return m[1][0] + '. normal';
    return null;
  }
  function tekrarOku(b) {
    var u = b.toUpperCase(), m = /Z\+([\d+]+)\.?\s*N\./.exec(u);
    if (m) return 1 + (m[1].match(/\d+/g) || []).length;
    m = /ZEMİN,\s*([\d.,\s]+)\s*NORMAL/.exec(u);
    if (m) return 1 + (m[1].match(/\d+/g) || []).length;
    return 1;
  }
  var SIRA = { bodrum: 0, Bodrum: 1, Zemin: 2, normal: 3, 'Çatı': 4 };
  function statik(d) {
    var T = d.T.map(function (t) { return { m: norm(t.m), x: t.x, y: t.y, k: t.k }; });
    var cz = d.L.filter(function (l) { return /^BEAM/i.test(l[0]); });
    var SC = [];
    d.L.forEach(function (l) { if (/^(BEAM|COLUMN[34]$|LGP-SLAB|SLAB)/i.test(l[0])) SC.push(l.slice(1)); });
    d.P.forEach(function (p) { if (/^(BEAM|COLUMN[34]$|LGP-SLAB|SLAB)/i.test(p.k)) for (var i = 0; i < p.P.length; i++) { var a = p.P[i], b = p.P[(i + 1) % p.P.length]; SC.push([a[0], a[1], b[0], b[1]]); } });
    var kol = [];
    d.P.forEach(function (p) {
      if (!/^COLUMN[34]$/.test(p.k)) return;
      var Q = p.P, a = alan(Q);
      if (a >= 300 && a <= 200000 && Q.length >= 4) {
        var kp = (Q[0][0] !== Q[Q.length - 1][0] || Q[0][1] !== Q[Q.length - 1][1]) ? Q.concat([Q[0]]) : Q;
        kol.push([Q.reduce(function (s, q) { return s + q[0]; }, 0) / Q.length, Q.reduce(function (s, q) { return s + q[1]; }, 0) / Q.length, a, cevre(kp)]);
      }
    });
    var planlar = [];
    kumeler(cz).forEach(function (gq) {
      var xs = [], ys = [], boy = 0;
      gq.forEach(function (l) { xs.push(l[1], l[3]); ys.push(l[2], l[4]); boy += Math.hypot(l[3] - l[1], l[4] - l[2]); });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      if (boy < 5000 || Math.min(x1 - x0, y1 - y0) < 600) return;
      var ic = T.filter(function (t) { return x0 - 50 <= t.x && t.x <= x1 + 50 && y0 - 50 <= t.y && t.y <= y1 + 50; });
      var adlar = ic.filter(function (t) { return /^K[ZÇB\d][\dB]*$|^K[ZÇB\d][\dB]*\s/.test(t.m); }), kes = [];
      ic.forEach(function (t) { var m = /\((\d{2,3})\/(\d{2,3})\)/.exec(t.m); if (m && t.k.indexOf('BEAM') === 0 && !/^(P|HATIL)/.test(t.m)) kes.push([+m[1], +m[2]]); });
      var kod = sayac(); adlar.forEach(function (t) { kod.ekle(katKodu(/^(K\S+)/.exec(t.m)[1])); }); kod.sil(null);
      var dk = sayac(), dk2 = sayac();
      ic.forEach(function (t) { if (/^\d{2}cm$/.test(t.m) && t.k.indexOf('LGP-SLAB') === 0) dk.ekle(parseInt(t.m, 10)); var m = /\bd\s*=\s*(\d{2})/.exec(t.m); if (m) dk2.ekle(+m[1]); });
      var kk = kol.filter(function (k) { return x0 <= k[0] && k[0] <= x1 && y0 <= k[1] && k[1] <= y1; });
      var kc = sayac(); kes.forEach(function (k) { kc.ekle(k[0] + '/' + k[1]); });
      var adSet = {}; adlar.forEach(function (t) { adSet[t.m.split(' ')[0]] = 1; });
      var hp = []; gq.forEach(function (l) { hp.push([pyRound(l[1]), pyRound(l[2])], [pyRound(l[3]), pyRound(l[4])]); });
      planlar.push({ x0: x0, y0: y0, gen: (x1 - x0) / 100, yuk: (y1 - y0) / 100, kat: kod.boyut() ? kod.enSik(1)[0][0] : null, kiris_cizgi_m: boy / 100, kiris_adi: Object.keys(adSet).length,
        kiris_kesit: kc.enSik(6), ort_kiris_h: kes.length ? kes.reduce(function (s, k) { return s + k[1]; }, 0) / kes.length : null, ort_kiris_b: kes.length ? kes.reduce(function (s, k) { return s + k[0]; }, 0) / kes.length : null,
        doseme_kalinlik: (dk.boyut() ? dk : dk2).enSik(3), kolon_adet: kk.length, kolon_alan_m2: kk.reduce(function (s, k) { return s + k[2]; }, 0) / 1e4, kolon_cevre_m: kk.reduce(function (s, k) { return s + k[3]; }, 0) / 100,
        dis_sinir_m2: hullAlan(hp) / 1e4 });
    });
    planlar.forEach(function (p) {
      var x0 = p.x0 - 100, y0 = p.y0 - 100, x1 = p.x0 + p.gen * 100 + 100, y1 = p.y0 + p.yuk * 100 + 100;
      var a = icAlan(SC.filter(function (c) { return x0 <= c[0] && c[0] <= x1 && y0 <= c[1] && c[1] <= y1; }), x0, y0, x1, y1) / 1e4;
      if (a >= 0.6 * p.dis_sinir_m2) { p.doseme_alan_m2 = a; p.alan_yontemi = 'kiriş ve döşeme kenarlarından kapalı alan'; }
      else { p.doseme_alan_m2 = p.dis_sinir_m2; p.alan_yontemi = 'kapalı sınır bulunamadı, dış zarf (fazla çıkabilir)'; }
    });
    var bas = T.filter(function (t) { var u = t.m.toUpperCase(); return /KALIP PLAN/.test(u) && !/KOLON KALIP|KİRİŞ KALIP|DÖŞEME KALIP|MERDİVEN|ÜSTTEN|BACA/.test(u); });
    planlar.forEach(function (p) {
      var ad = bas.filter(function (t) { return p.x0 - 400 <= t.x && t.x <= p.x0 + p.gen * 100 && p.y0 - 900 <= t.y && t.y <= p.y0 + 50; });
      ad.sort(function (a, b) { return (Math.abs(a.x - p.x0) + Math.abs(a.y - p.y0)) - (Math.abs(b.x - p.x0) + Math.abs(b.y - p.y0)); });
      p.baslik = ad.length ? ad[0].m : '';
      var m = /\b([A-Z]) BLOK/.exec(p.baslik.toUpperCase()); p.blok = m ? m[1] : '';
      p.tekrar = p.baslik ? tekrarOku(p.baslik) : 1;
    });
    var asil = {};
    planlar.slice().sort(function (a, b) { return b.kiris_adi - a.kiris_adi; }).forEach(function (p) {
      var key = p.blok + '|' + p.kat;
      if (p.kat == null || p.kiris_adi < 5) p.kopya = 'adsız eş çizim (donatı/kalıp eşi)';
      else if (asil[key]) p.kopya = 'aynı kat ikinci kez çizilmiş';
      else { p.kopya = ''; asil[key] = p; }
    });
    var temel = {}, kal = [];
    T.forEach(function (t) { var m = /^(\d{2,3})\s*cm\s*RADYE/i.exec(t.m) || (t.k.indexOf('MAT_FND') === 0 ? /^(\d{2,3})cm$/.exec(t.m) : null); if (m) kal.push([+m[1], t]); });
    var tb = T.filter(function (t) { return /RADYE TEMEL (KALIP|APL)/.test(t.m.toUpperCase()); });
    var sinif = sayac(); T.forEach(function (t) { var m = /\b(C\d{2})\b/.exec(t.m); if (m) sinif.ekle(m[1]); });
    var bloklar = Array.from(new Set(planlar.filter(function (p) { return !p.kopya; }).map(function (p) { return p.blok; }))).sort();
    var sirala = function (p) { var k = p.kat || ''; return (SIRA[k.replace(/^\d\. /, '')] != null ? SIRA[k.replace(/^\d\. /, '')] : 5) * 10 - (/^\d/.test(k) && k.indexOf('bodrum') >= 0 ? +k[0] : 0); };
    bloklar.forEach(function (blok) {
      var as = planlar.filter(function (p) { return !p.kopya && p.blok === blok; });
      var ea = as.reduce(function (m, p) { return sirala(p) < sirala(m) ? p : m; }, as[0]);
      var d2 = null, bt = blok ? tb.filter(function (t) { return t.m.toUpperCase().indexOf(' ' + blok + ' BLOK') >= 0; }) : tb;
      if (bt.length && kal.length) { var b0 = bt[0]; d2 = kal.reduce(function (m, k) { return (Math.abs(k[1].y - b0.y) + Math.abs(k[1].x - b0.x) * 0.3) < (Math.abs(m[1].y - b0.y) + Math.abs(m[1].x - b0.x) * 0.3) ? k : m; })[0]; }
      else if (kal.length) { var ks = sayac(); kal.forEach(function (k) { ks.ekle(k[0]); }); d2 = ks.enSik(1)[0][0]; }
      temel[blok || 'A'] = { tip: (tb.length || kal.length) ? 'Radye' : 'bulunamadı', kalinlik_cm: d2, alan_m2: Math.round(ea.doseme_alan_m2 * 1.05 * 10) / 10, alan_kaynagi: 'en alt kat (' + ea.kat + ') döşeme alanı + %5' };
    });
    var jet = {}, jb = T.filter(function (t) { return /JET GROUT PLANI/.test(t.m.toUpperCase()); });
    T.forEach(function (t) {
      var m = /JET-?\s*GROUT ADED[İI]\s*=\s*(\d+)/.exec(t.m.toUpperCase()); if (!m) return;
      var yak = function (re, dy) { for (var i = 0; i < T.length; i++) { var u = T[i], x = re.exec(u.m.toUpperCase()); if (x && Math.abs(u.x - t.x) < 50 && u.y - t.y > 0 && u.y - t.y < dy) return +x[1]; } return null; };
      var boy = yak(/JET-?\s*GROUT BOYU\s*=\s*(\d+)/, 200), cap = yak(/JET-?\s*GROUT [ÇC]API\s*=\s*(\d+)/, 300);
      var yb = jb.length ? jb.reduce(function (a, b) { return (Math.abs(b.x - t.x) + Math.abs(b.y - t.y)) < (Math.abs(a.x - t.x) + Math.abs(a.y - t.y)) ? b : a; }) : null;
      var mb = yb ? /\b([A-Z]) BLOK/.exec(yb.m.toUpperCase()) : null;
      jet[mb ? mb[1] : 'A'] = { adet: +m[1], boy_m: boy != null ? boy / 100 : null, cap_cm: cap };
    });
    return { planlar: planlar, temel: temel, jet_grout: jet, beton_sinifi: sinif.boyut() ? sinif.enSik(1)[0][0] : null };
  }

  /* ---------- 5. Kaplama kuralları (kullanıcı onaylı) ---------- */
  var TUR = {
    kuru: { zemin: 'Laminat parke', duvar: 'Plastik boya', tavan: 'Plastik boya' }, mutfak: { zemin: 'Seramik', duvar: 'Plastik boya', tavan: 'Plastik boya' },
    islak: { zemin: 'Seramik', duvar: 'Seramik', tavan: 'Asma tavan (yeşil alçıpan)' }, balkon: { zemin: 'Seramik (dış mekân, donmaya dayanıklı)', duvar: 'Dış cephe kaplaması', tavan: 'Plastik boya (dış cephe)' },
    ortak: { zemin: 'Mermer', duvar: 'Plastik boya', tavan: 'Plastik boya' }, teknik: { zemin: 'Perdahlı beton', duvar: 'Kara sıva + boya', tavan: 'Kara sıva + boya' },
    dukkan: { zemin: 'Seramik', duvar: 'Plastik boya', tavan: 'Plastik boya' } };
  var SECENEK = { zemin: ['Laminat parke', 'Seramik', 'Seramik (dış mekân, donmaya dayanıklı)', 'Mermer', 'Granit seramik', 'Perdahlı beton', 'Epoksi'],
    duvar: ['Plastik boya', 'Seramik', 'Kara sıva + boya', 'Dış cephe kaplaması'], tavan: ['Plastik boya', 'Badana', 'Asma tavan (alçıpan)', 'Asma tavan (yeşil alçıpan)', 'Kara sıva + boya'] };
  var ESLES = [['SERAMIK', 'Seramik'], ['SERAMİK', 'Seramik'], ['GRANİT', 'Granit seramik'], ['GRANIT', 'Granit seramik'], ['MERMER', 'Mermer'], ['LAMİNAT', 'Laminat parke'], ['LAMINAT', 'Laminat parke'], ['PARKE', 'Laminat parke'],
    ['BOYA', 'Plastik boya'], ['PLASTİK BOYA', 'Plastik boya'], ['BADANA', 'Badana'], ['ŞAP', 'Perdahlı beton'], ['SAP', 'Perdahlı beton'], ['BETON', 'Perdahlı beton'], ['EPOKSİ', 'Epoksi'], ['ALÇIPAN', 'Asma tavan (alçıpan)']];
  function kaplamaStd(s) { var u = s.trim().toUpperCase(); for (var i = 0; i < ESLES.length; i++) if (u.indexOf(ESLES[i][0]) >= 0) return ESLES[i][1]; return s.trim(); }
  function secilen(m, y) {
    if (m.secim && m.secim[y]) return m.secim[y];
    var s = m[y]; return s ? kaplamaStd(s) : TUR[m.tur || 'kuru'][y];
  }

  /* ---------- 6. Proje girdisi üretimi ---------- */
  function katTuru(b) { var u = b.toUpperCase(); return u.indexOf('OTOPARK') >= 0 ? 'otopark' : u.indexOf('BODRUM') >= 0 ? 'bodrum' : 'normal'; }
  function statikKatAdi(b) {
    var u = b.toUpperCase(), m;
    if (u.indexOf('OTOPARK') >= 0) return null;
    if ((m = /(\d)\.\s*BODRUM/.exec(u))) return m[1] + '. bodrum';
    if (u.indexOf('BODRUM') >= 0) return 'Bodrum';
    if (u.indexOf('ZEMİN') >= 0) return 'Zemin';
    if (u.indexOf('ÇATI') >= 0) return 'Çatı';
    m = /(\d)\.\s*KAT/.exec(u); return m ? m[1] + '. normal' : null;
  }
  /* Yeni kalemlerin tahmini birim fiyatları (yapay zekâ servisi yoksa kullanılan başlangıç değerleri; kullanıcı onaylar). */
  var TAHMIN = { jetGrout: 2100, betonFark: { C35: 300, C40: 650 } };
  function projeOlustur(ad, M, S, sec) {
    sec = sec || {}; var H = sec.katYuksekligi || 3, donati = sec.donatiKgM3 || 110;
    var bl = Array.from(new Set(M.katlar.map(function (k) { return k.blok || 'A'; }))).sort();
    var P = { ad: ad, il: sec.il || 'İstanbul', arsa: '', blokAdedi: bl.length, toplamOturum: '', toplamInsaatAlani: '', tipler: [], bloklar: [], sureAy: 18, satisOfisi: false, ornekDaire: false,
      jenerator: false, trafo: false, hamam: false, sauna: false, finHamami: false, fitness: false, havuz: false, havuzM2: 100, kdvOrani: 20, ongorulemeyenOrani: 2, duzeltmeler: {}, ekKalemler: {}, _dxf: {} };
    var tipler = {}, tsira = [];
    bl.forEach(function (b, n) {
      var katlar = M.katlar.filter(function (k) { return (k.blok || 'A') === b; });
      var sp = S.planlar.filter(function (p) { return !p.kopya && (p.blok || 'A') === b; }), spm = {};
      sp.forEach(function (p) { spm[p.kat] = p; });
      var rows = [], olc = sayac(), BIA = 0, beton = 0;
      katlar.forEach(function (k) {
        var ms = k.mahaller, tek = k.tekrar, tur = katTuru(k.baslik);
        var salon = ms.filter(function (m) { return m.std === 'Salon' || m.std === 'Oda + mutfak nişi'; }).length;
        var catiK = k.baslik.toUpperCase().indexOf('ÇATI') >= 0;
        if (tur === 'normal' && salon === 0) tur = catiK ? 'cati_kati' : 'bodrum';
        var pl = spm[statikKatAdi(k.baslik)] || null;
        if (!pl && tur === 'normal') {
          var kn = /(\d)\.\s*KAT/.exec(k.baslik.toUpperCase()), z = spm.Zemin;
          if (z && (k.baslik.toUpperCase().indexOf('ZEMİN') >= 0 || (kn && z.tekrar > +kn[1]))) pl = z;
        }
        if (!pl && tur === 'otopark') pl = spm['1. bodrum'] || spm.Bodrum || null;
        var ak = pl ? pl.doseme_alan_m2 : ms.reduce(function (s, m) { return s + m.alan; }, 0) * 1.15;
        BIA += ak * tek;
        var row = { tur: tur, tekrar: tek, yukseklik: H, gomulu: (tur === 'bodrum' || tur === 'otopark') ? 'EVET' : 'HAYIR', m2: Math.round(ak * 10) / 10, daireler: [], _kaynak: k.baslik, _statik: pl ? pl.kat : 'yok' };
        if (tur === 'normal') {
          /* Daireler: her daire içi mahal en yakın salona bağlanır; her salon bir daire. Aynı oda sayısı ve yakın net alanlı daireler aynı tip olur. */
          var salonlar = ms.filter(function (m) { return m.std === 'Salon' || m.std === 'Oda + mutfak nişi'; }), grp = salonlar.map(function () { return []; });
          ms.forEach(function (m) {
            if (['kuru', 'mutfak', 'islak', 'balkon'].indexOf(m.tur) < 0) return;
            var en = 0, ed = Infinity; salonlar.forEach(function (sl, i) { var dd = Math.hypot(sl.x - m.x, sl.y - m.y); if (dd < ed) { ed = dd; en = i; } }); grp[en].push(m);
          });
          var adet = {};
          grp.forEach(function (g3, i) {
            var oda = Math.max(1, g3.filter(function (m) { return ['Yatak odası', 'Ebeveyn yatak odası', 'Oda'].indexOf(m.std) >= 0; }).length);
            if (salonlar[i].std === 'Oda + mutfak nişi') oda = 1;
            var net = g3.reduce(function (s2, m) { return s2 + m.alan; }, 0), eb = g3.filter(function (m) { return m.std === 'Duş / ebeveyn banyosu'; }).length, blk = g3.filter(function (m) { return m.tur === 'balkon'; }).length;
            var key = oda + '|' + pyRound(net / 5) * 5;
            if (!tipler[key]) { var no = tsira.length + 1; tipler[key] = { id: 'T' + no, ad: 'TİP' + no, duzen: oda + '+1', brut: pyRound(net / 0.85), dubleks: false, balkon: blk, mutfak: '', isikBandi: '', alaturka: '', ebeveynBanyo: eb, ankastre: '', klima: '' }; tsira.push(tipler[key]); }
            adet[tipler[key].id] = (adet[tipler[key].id] || 0) + 1;
          });
          row.daireler = Object.keys(adet).map(function (id) { return { tip: id, adet: adet[id] }; });
        }
        if (tur !== 'cati_kati') rows.push(row);
        ms.forEach(function (m) {
          var a = m.alan * tek, c = (m.cevre || 4.4 * Math.sqrt(Math.max(m.alan, 0.1))) * tek, h = H - 0.15;
          var di = (tur === 'normal' || tur === 'cati_kati') && ['kuru', 'mutfak', 'islak', 'balkon'].indexOf(m.tur) >= 0;
          if (di) olc.ekle('DA_NET', a);
          if (m.tur === 'islak') olc.ekle('ISLAK_ZEMIN', a);
          if (m.tur === 'mutfak') olc.ekle('MUTFAK_ZEMIN', a);
          if (m.tur === 'balkon') olc.ekle('BALKON_ALAN', a);
          if (m.tur === 'ortak') olc.ekle('HOL_ALAN', a);
          if (di && ['Seramik', 'Granit seramik', 'Seramik (dış mekân, donmaya dayanıklı)'].indexOf(secilen(m, 'zemin')) >= 0) olc.ekle('SERAMIK_ZEMIN', a);
          if (di && m.tur !== 'balkon') {
            var dv = secilen(m, 'duvar');
            if (m.tur === 'islak' && dv !== 'Seramik' && !(m.secim && m.secim.duvar)) { dv = 'Seramik'; olc.ekle('_islak_boya'); }
            if (dv === 'Seramik') olc.ekle('SERAMIK_DUVAR', Math.max(c * h - 1.9 * tek, 0)); else olc.ekle('DUVAR_YUZEY', Math.max(c * h - 1.9 * tek, 0));
          }
          if (m.cevre) olc.ekle('_cevre'); olc.ekle('_mahal');
        });
        Object.keys(k.pencereler).forEach(function (wh) { var x = wh.split('/').map(Number), s = k.pencereler[wh]; olc.ekle('PENCERE_ADET', s * tek); olc.ekle('PENCERE_ALAN', s * tek * x[0] * x[1] / 1e4); });
        olc.ekle('KAPI', Object.keys(k.kapilar).reduce(function (s, x) { return s + k.kapilar[x]; }, 0) * tek);
      });
      var ND = rows.reduce(function (s, r) { return s + r.daireler.reduce(function (a2, x) { return a2 + x.adet; }, 0) * r.tekrar; }, 0);
      olc.ekle('SERAMIK_DUVAR', ND * 3);
      sp.forEach(function (p) {
        var d = p.doseme_kalinlik.length ? p.doseme_kalinlik[0][0] : 15;
        var dos = (p.doseme_alan_m2 - p.kolon_alan_m2) * d / 100, kir = p.kiris_cizgi_m / 2 * (p.ort_kiris_b || 25) / 100 * Math.max((p.ort_kiris_h || 50) - d, 0) / 100, ko = p.kolon_alan_m2 * (H - d / 100);
        beton += (dos + kir + ko) * p.tekrar;
      });
      var tm = S.temel[b] || {}, tb2 = (tm.alan_m2 || 0) * (tm.kalinlik_cm || 0) / 100, top = beton + tb2;
      var r2 = function (x) { return Math.round(x * 100) / 100; }, ovr = {};
      olc.map.forEach(function (v, k) { if (k[0] !== '_' && k !== 'KAPI') ovr[k] = r2(v); });
      ovr.DA_NET = r2(olc.al('DA_NET'));
      if (tm.alan_m2) ovr.TABAN = r2(tm.alan_m2 / 1.1);
      if (tm.kalinlik_cm) ovr.H_TEMEL = tm.kalinlik_cm / 100;
      ovr.BIA = Math.round(BIA * 10) / 10;
      var blok = { ad: b + ' BLOK', katlar: rows, sistem: { cephe: '', mantoAltiSiva: '', asansor: '', merdiven: '', isitma: '', isitmaSekli: '', banyoTavan: '', cati: '', doseme: 'KİRİŞLİ', suDeposu: '', dilatasyon: '' }, _ovr: ovr };
      P.bloklar.push(blok);
      P.duzeltmeler['blok' + n] = { '8': { metraj: Math.round(top * 10) / 10 }, '10': { metraj: r2(top * donati / 1000) } };
      var ek = [], jg = (S.jet_grout || {})[b];
      if (jg && jg.boy_m) ek.push({ grup: 1, ad: 'Jet Grout Zemin İyileştirme Kolonu (Ø' + (jg.cap_cm || 60) + ' cm)', birim: 'm', metraj: jg.adet * jg.boy_m, fiyat: TAHMIN.jetGrout, kaynak: 'tahmini', aciklama: 'Çizimden: ' + jg.adet + ' adet × ' + jg.boy_m + ' m' });
      var sn = S.beton_sinifi;
      if (sn && sn !== 'C30' && sn !== 'C25') ek.push({ grup: 2, ad: 'Beton Sınıfı Farkı (C30/37 → ' + ({ C35: 'C35/45', C40: 'C40/50' }[sn] || sn) + ')', birim: 'm³', metraj: Math.round(top * 10) / 10, fiyat: TAHMIN.betonFark[sn] || 300, kaynak: 'tahmini', aciklama: 'Statik projede ' + sn + ' yazıyor; listedeki beton C30/37' });
      if (ek.length) P.ekKalemler['blok' + n] = ek;
      P._dxf[blok.ad] = { kat_betonu: Math.round(beton * 10) / 10, temel_betonu: Math.round(tb2 * 10) / 10, temel: tm, BIA: ovr.BIA, donati_kg_m3: donati, kapi: olc.al('KAPI'), islak_boya_duzeltildi: olc.al('_islak_boya'),
        cevre_olculen: olc.al('_cevre') + '/' + olc.al('_mahal'), beton_sinifi: S.beton_sinifi };
    });
    P.tipler = tsira;
    return P;
  }

  /* Analizin tamamı: iki DXF içeriği → {mimari, statik, proje}. mimari dosyası zorunlu, statik isteğe bağlı. */
  function analiz(ad, dm, ds, sec) {
    var M = mimari(dm);
    if (M.hata) return { hata: M.hata };
    if (!M.katlar.length) return { hata: 'Mimari dosyada okunabilir kat planı bulunamadı.' };
    var S = ds ? statik(ds) : { planlar: [], temel: {}, jet_grout: {}, beton_sinifi: null };
    var p = projeOlustur(ad, M, S, sec);
    if (!ds) p.bloklar.forEach(function (b, n) { delete p.duzeltmeler['blok' + n]; delete b._ovr.TABAN; delete b._ovr.H_TEMEL; delete b._ovr.BIA; });
    return { mimari: M, statik: S, proje: p };
  }

  /* Plan önizlemesi: bir bölgedeki çizgi, poligon ve yazıları tuvale çizer (kontrol ekranı ve yapay zekâ görseli için). */
  function planCiz(tuval, d, bolge, sec) {
    sec = sec || {};
    var x0 = bolge[0], y0 = bolge[1], x1 = bolge[2], y1 = bolge[3], W = tuval.width, Hh = tuval.height, c = tuval.getContext('2d');
    /* Bölge pafta satırı kadar geniş olabilir: çizilmiş içeriğin sınırına yakınlaş. */
    var ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity, gen = function (x, y) { if (x >= x0 && x <= x1 && y >= y0 && y <= y1) { if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y; } };
    d.L.forEach(function (l) { gen(l[1], l[2]); gen(l[3], l[4]); });
    d.P.forEach(function (p) { p.P.forEach(function (q) { gen(q[0], q[1]); }); });
    if (bx > ax && by > ay) { var pay = Math.max(bx - ax, by - ay) * 0.03; x0 = ax - pay; x1 = bx + pay; y0 = ay - pay; y1 = by + pay; }
    var k = Math.min(W / (x1 - x0), Hh / (y1 - y0)) * 0.96, ox = (W - (x1 - x0) * k) / 2, oy = (Hh - (y1 - y0) * k) / 2;
    var X = function (x) { return ox + (x - x0) * k; }, Y = function (y) { return Hh - oy - (y - y0) * k; };
    var ic = function (x, y) { return x >= x0 && x <= x1 && y >= y0 && y <= y1 && x >= bolge[0] && x <= bolge[2] && y >= bolge[1] && y <= bolge[3]; };
    c.fillStyle = sec.zemin || '#fff'; c.fillRect(0, 0, W, Hh); c.lineWidth = 1; c.strokeStyle = sec.cizgi || '#334155'; c.beginPath();
    d.L.forEach(function (l) { if (ic(l[1], l[2]) || ic(l[3], l[4])) { c.moveTo(X(l[1]), Y(l[2])); c.lineTo(X(l[3]), Y(l[4])); } });
    d.P.forEach(function (p) { var q = p.P; if (!q.length || !ic(q[0][0], q[0][1])) return; c.moveTo(X(q[0][0]), Y(q[0][1])); for (var i = 1; i < q.length; i++) c.lineTo(X(q[i][0]), Y(q[i][1])); });
    c.stroke();
    if (sec.yazi !== false) {
      c.fillStyle = sec.yaziRenk || '#b45309'; c.textBaseline = 'bottom';
      d.T.forEach(function (t) { if (!ic(t.x, t.y) || !t.m) return; var fs = Math.max(7, Math.min(16, (t.h || 15) * k * 1.2)); c.font = fs + 'px sans-serif'; c.fillText(t.m.slice(0, 40), X(t.x), Y(t.y)); });
    }
    (sec.isaret || []).forEach(function (m) { c.fillStyle = m.renk || 'rgba(240,105,43,.85)'; c.beginPath(); c.arc(X(m.x), Y(m.y), 5, 0, 7); c.fill(); });
    return tuval;
  }

  var API = { planCiz: planCiz, oku: oku, dosyaOku: dosyaOku, mimari: mimari, statik: statik, projeOlustur: projeOlustur, analiz: analiz, katBasligi: katBasligi, mahalTanit: mahalTanit,
    TUR: TUR, SECENEK: SECENEK, secilen: secilen, kaplamaStd: kaplamaStd, TAHMIN: TAHMIN };
  g.REPIOM_DXF = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
