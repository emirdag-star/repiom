"""Ücretsiz deneme için kurgusal örnek çizim üretir (gerçek bir projeye ait değildir).
1 blok: 1. bodrum + zemin + 1-2-3. kat; her normal katta 3+1 ve 2+1 daire. Mimari ve statik DXF (cm), tüm katlar yan yana."""
import base64, json, sys, os
def dxf(varliklar):
    s = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1021', '9', '$INSUNITS', '70', '5', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES']
    for v in varliklar: s += v
    s += ['0', 'ENDSEC', '0', 'EOF']
    return '\r\n'.join(s) + '\r\n'
def yazi(m, x, y, h=15, k='YAZI'): return ['0', 'TEXT', '8', k, '10', '%.2f' % x, '20', '%.2f' % y, '30', '0', '40', str(h), '1', m]
def cizgi(x1, y1, x2, y2, k='DUVAR'): return ['0', 'LINE', '8', k, '10', '%.2f' % x1, '20', '%.2f' % y1, '30', '0', '11', '%.2f' % x2, '21', '%.2f' % y2, '31', '0']
def poligon(P, k):
    v = ['0', 'LWPOLYLINE', '8', k, '90', str(len(P)), '70', '1']
    for x, y in P: v += ['10', '%.2f' % x, '20', '%.2f' % y]
    return v
def dikdortgen(x, y, w, h, k): return poligon([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], k)
D31 = [('SALON', 600, 500, 'Laminat', 'Boya', 'Boya', 2, 'P1 160/140'), ('MUTFAK', 400, 250, 'Seramik', 'Seramik', 'Boya', 1, 'P2 120/140'), ('Y.ODASI', 400, 300, 'Laminat', 'Boya', 'Boya', 1, 'P2 120/140'),
       ('Y.ODASI', 350, 320, 'Laminat', 'Boya', 'Boya', 1, 'P2 120/140'), ('E.Y.ODASI', 450, 340, 'Laminat', 'Boya', 'Boya', 1, 'P1 160/140'), ('BANYO', 250, 200, 'Seramik', 'Seramik', 'Boya', 1, 'P3 60/60'),
       ('DUŞ', 200, 200, 'Seramik', 'Seramik', 'Boya', 1, 'P3 60/60'), ('WC', 150, 140, 'Seramik', 'Seramik', 'Boya', 0, ''), ('ANTRE', 400, 200, 'Seramik', 'Boya', 'Boya', 0, ''), ('BALKON', 400, 150, 'Seramik', 'Dış cephe', 'Boya', 0, '')]
D21 = [('SALON', 520, 500, 'Laminat', 'Boya', 'Boya', 2, 'P1 160/140'), ('MUTFAK', 360, 250, 'Seramik', 'Seramik', 'Boya', 1, 'P2 120/140'), ('Y.ODASI', 400, 300, 'Laminat', 'Boya', 'Boya', 1, 'P2 120/140'),
       ('E.Y.ODASI', 420, 330, 'Laminat', 'Boya', 'Boya', 1, 'P1 160/140'), ('BANYO', 250, 200, 'Seramik', 'Seramik', 'Boya', 1, 'P3 60/60'), ('ANTRE', 350, 200, 'Seramik', 'Boya', 'Boya', 0, ''), ('BALKON', 350, 150, 'Seramik', 'Dış cephe', 'Boya', 0, '')]
ORTAK = [('MERDİVEN HOLÜ', 400, 450, 'Mermer', 'Boya', 'Boya', 0, ''), ('ASANSÖR', 180, 180, 'Mermer', 'Boya', 'Boya', 0, '')]
BODRUM = [('DEPO', 600, 500, 'Şap', 'Boya', 'Boya', 0, ''), ('SIĞINAK', 700, 600, 'Şap', 'Boya', 'Boya', 0, ''), ('ENERJİ ODASI', 400, 300, 'Şap', 'Boya', 'Boya', 0, ''),
          ('SU DEPOSU', 400, 400, 'Şap', 'Boya', 'Boya', 0, ''), ('MERDİVEN HOLÜ', 400, 450, 'Mermer', 'Boya', 'Boya', 0, ''), ('ASANSÖR', 180, 180, 'Mermer', 'Boya', 'Boya', 0, '')]
def yerlestir(odalar, x0, y0, gen, V, kapi=True):
    x, y, satir_h = x0, y0, 0
    for ad, w, h, z, d, t, pen, pyazi in odalar:
        if x + w > x0 + gen: x = x0; y += satir_h + 20; satir_h = 0
        V.append(dikdortgen(x, y, w, h, 'ALAN HESABI'))
        for a in ((x, y, x + w, y), (x + w, y, x + w, y + h), (x + w, y + h, x, y + h), (x, y + h, x, y)): V.append(cizgi(*a))
        V.append(yazi('%s Döşeme : %s Duvar : %s Tavan : %s A: %.2f m²' % (ad, z, d, t, w * h / 1e4), x + 20, y + h / 2, 12, 'Yazı+DETAY'))
        if kapi and ad not in ('BALKON', 'ASANSÖR'): V.append(yazi('K2 90/220' if ad not in ('WC', 'BANYO', 'DUŞ') else 'K2 80/220', x + 30, y + 20, 10, 'Yazı+DETAY'))
        for i in range(pen): V.append(yazi(pyazi, x + 40 + i * 120, y + h - 25, 10, 'Yazı+DETAY'))
        x += w + 20; satir_h = max(satir_h, h)
def mimari():
    V = []
    basliklar = [('1. BODRUM KAT PLANI Ö:1/50', BODRUM, None), ('ZEMİN KAT PLANI Ö:1/50', D31, D21), ('1-2-3. KAT PLANI Ö:1/50', D31, D21)]
    for i, (b, A, Bd) in enumerate(basliklar):
        tx = 1500 + i * 3500
        V.append(yazi(b, tx, 0, 40, 'Yazı+DETAY'))
        x0, y0 = tx - 1300, 150
        for a in ((x0, y0, x0 + 2600, y0), (x0 + 2600, y0, x0 + 2600, y0 + 1700), (x0 + 2600, y0 + 1700, x0, y0 + 1700), (x0, y0 + 1700, x0, y0)): V.append(cizgi(*a))
        if Bd is None: yerlestir(A, x0 + 30, y0 + 30, 2500, V)
        else:
            yerlestir(A, x0 + 30, y0 + 30, 1100, V); yerlestir(ORTAK, x0 + 1150, y0 + 30, 420, V); yerlestir(Bd, x0 + 1600, y0 + 30, 980, V)
    return dxf(V)
def statik():
    V = []
    planlar = [('(-3.00) 1. BODRUM KAT TAVANI KALIP PLANI (1/50)', 'K1B'), ('(+0.00) ZEMİN, 1., 2. NORMAL KAT TAVANI KALIP PLANI (1/50)', 'KZ'), ('(+9.00) 3. NORMAL KAT TAVANI KALIP PLANI (1/50)', 'K3')]
    for i, (b, on) in enumerate(planlar):
        x0, y0 = i * 4000, 0
        V.append(yazi(b, x0 + 100, y0 - 300, 30, 'hs_YAZI'))
        no = 1
        X = [0, 500, 1000, 1500, 2000, 2500]; Y = [0, 550, 1100, 1650]
        for xa in X:
            V.append(cizgi(x0 + xa - 15, y0, x0 + xa - 15, y0 + Y[-1], 'BEAM3')); V.append(cizgi(x0 + xa + 15, y0, x0 + xa + 15, y0 + Y[-1], 'BEAM3'))
            for j in range(len(Y) - 1):
                V.append(yazi('%s%02d' % (on, no), x0 + xa + 25, y0 + (Y[j] + Y[j + 1]) / 2, 12, 'BEAM4')); V.append(yazi('(30/50)', x0 + xa + 25, y0 + (Y[j] + Y[j + 1]) / 2 - 20, 10, 'BEAM4')); no += 1
        for ya in Y:
            V.append(cizgi(x0, y0 + ya - 15, x0 + X[-1], y0 + ya - 15, 'BEAM3')); V.append(cizgi(x0, y0 + ya + 15, x0 + X[-1], y0 + ya + 15, 'BEAM3'))
            for j in range(len(X) - 1):
                V.append(yazi('%s%02d' % (on, no), x0 + (X[j] + X[j + 1]) / 2, y0 + ya + 25, 12, 'BEAM4')); V.append(yazi('(30/60)' if ya in (0, Y[-1]) else '(30/50)', x0 + (X[j] + X[j + 1]) / 2, y0 + ya + 45, 10, 'BEAM4')); no += 1
        for xa in X:
            for ya in Y: V.append(dikdortgen(x0 + xa - 15, y0 + ya - 30, 30, 60, 'COLUMN4'))
        # konsol balkon döşemesi (kuzey cephe) ve döşeme kalınlıkları
        V.append(poligon([(x0, y0), (x0 + X[-1], y0), (x0 + X[-1], y0 + Y[-1]), (x0 + 2000, y0 + Y[-1]), (x0 + 2000, y0 + Y[-1] + 150), (x0 + 500, y0 + Y[-1] + 150), (x0 + 500, y0 + Y[-1]), (x0, y0 + Y[-1])], 'LGP-SLAB3'))
        for xa in X[:-1]:
            for ya in Y[:-1]: V.append(yazi('15cm', x0 + xa + 200, y0 + ya + 250, 12, 'LGP-SLAB3'))
    # temel ve zemin iyileştirme
    V.append(yazi('(-3.60) RADYE TEMEL KALIP PLANI (1/50)', 12000, -300, 30, 'hs_YAZI')); V.append(yazi('60 cm RADYE TEMEL (C30 BETON)', 12500, 800, 20, 'YAZ3'))
    V.append(yazi('(-3.60) JET GROUT PLANI (1/100)', 16000, -300, 30, 'hs_YAZI'))
    V.append(yazi('JET-GROUT ADEDİ =48', 16500, 500, 15, 'YAZ3')); V.append(yazi('JET-GROUT BOYU  = 1000 cm.', 16500, 590, 15, 'YAZ3')); V.append(yazi('JET-GROUT ÇAPI = 60 cm', 16500, 690, 15, 'YAZ3'))
    V.append(yazi('MALZEME : C30 (fck:30MPa)', 12500, 1200, 15, 'MATERIAL3'))
    return dxf(V)
if __name__ == '__main__':
    m, s = mimari(), statik()
    out = os.path.join(os.path.dirname(__file__), '..', 'kaynak', 'ornek_dxf.js')
    open(out, 'w').write('/* Kurgusal örnek çizim (araclar/ornek_dxf_uret.py üretir): ücretsiz deneme için. */\nwindow.REPIOM_ORNEK_DXF = ' + json.dumps({'mimari': base64.b64encode(m.encode('utf-8')).decode(), 'statik': base64.b64encode(s.encode('utf-8')).decode()}) + ';\n')
    if len(sys.argv) > 1:
        open(os.path.join(sys.argv[1], 'ORNEK_MIMARI.dxf'), 'w', encoding='utf-8', newline='').write(m); open(os.path.join(sys.argv[1], 'ORNEK_STATIK.dxf'), 'w', encoding='utf-8', newline='').write(s)
    print('mimari', len(m), 'statik', len(s), 'bayt')
