/** Özet ve Sonuç adımları: düzenlenebilir maliyet tablosu (web ile aynı düzeltme kuralları), Excel/PDF paylaşımı. */
import type { CalculationResult, ItemRow, ProjectInput } from '@repiom/core';
import { sayi, tl } from '@repiom/istemci/bicim';
import { turkceHata } from '@repiom/istemci/hatalar';
import { sayiOku } from '@repiom/istemci/sayi';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { OnayKutusu } from '../bilesenler/form';
import { Dugme, HataKutusu, Kart, onayIste, Sekmeler, Uyari } from '../bilesenler/temel';
import { R, S } from '../bilesenler/tema';
import { excelPaylas, pdfPaylas } from '../lib/rapor';
import type { AdimOzellikleri } from './adimlar';

function Uyarilar({ uyarilar }: { uyarilar: string[] }) {
  return (
    <>
      {uyarilar.map((u, i) => (
        <Uyari key={i}>{u}</Uyari>
      ))}
    </>
  );
}

export function OzetAdimi({ editor, girdi, adimaGit }: AdimOzellikleri) {
  const s = editor.sonuc!;
  if (s.hata !== undefined)
    return (
      <Kart baslik="Özet">
        <Uyari>{s.hata}</Uyari>
        <Dugme metin="Proje bilgilerine dön" bas={() => adimaGit('proje')} />
      </Kart>
    );
  const o = s.ozet;
  return (
    <Kart baslik="Özet">
      <Uyarilar uyarilar={s.uyarilar} />
      {s.bloklar.map((b, i) => (
        <View
          key={i}
          style={[S.arasi, { borderBottomWidth: 1, borderBottomColor: R.cizgi, paddingVertical: 6 }]}
        >
          <Text style={[S.metin, { fontWeight: '700', flex: 1 }]}>{b.ad}</Text>
          <Text style={S.not}>
            {sayi(b.v.KAT_TOPLAM as number)} kat · {sayi(b.v.ND as number)} daire · {sayi(b.v.BIA as number)}{' '}
            m²
          </Text>
        </View>
      ))}
      <Text style={S.metin}>
        Toplam:{' '}
        <Text style={{ fontWeight: '700' }}>
          {sayi(o.toplamDaire)} daire · {sayi(o.toplamInsaatAlani)} m²
        </Text>
      </Text>
      <Text style={S.not}>
        İl: {String(girdi.il || '—')} · Süre: {String(s.proje.SURE_AY)} ay · KDV: %{sayi(o.kdvOrani * 100)}
      </Text>
      <Dugme tur="birincil" metin="Maliyet hesapla" bas={() => adimaGit('sonuc')} />
    </Kart>
  );
}

/** Düzenlenebilir sayı hücresi: odaktan çıkınca kaydeder. */
function Hucre({
  deger,
  elle,
  etiket,
  kaydet,
}: {
  deger: number;
  elle: boolean;
  etiket: string;
  kaydet: (x: number | null) => void;
}) {
  const goster = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');
  const [metin, setMetin] = useState(goster(deger));
  const [hata, setHata] = useState(false);
  const [onceki, setOnceki] = useState(deger);
  if (!Object.is(onceki, deger)) {
    setOnceki(deger);
    setMetin(goster(deger));
  }
  const bitir = () => {
    const x = sayiOku(metin);
    if (x === null) return kaydet(null);
    if (Number.isNaN(x) || x < 0) return setHata(true);
    setHata(false);
    if (Math.round(x * 100) !== Math.round(deger * 100)) kaydet(x);
  };
  return (
    <TextInput
      accessibilityLabel={etiket}
      keyboardType="decimal-pad"
      value={metin}
      onChangeText={setMetin}
      onEndEditing={bitir}
      onBlur={bitir}
      style={{
        borderWidth: 1,
        borderColor: hata ? R.hata : R.cizgi,
        backgroundColor: elle ? R.elle : '#fff',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        minWidth: 96,
        minHeight: 40,
        textAlign: 'right',
        color: R.ana,
      }}
    />
  );
}

type Sekme = 'tum' | 'pg' | `b${number}`;
const tablo = (s: CalculationResult, k: Sekme) =>
  k === 'tum' ? s.tumProje : k === 'pg' ? s.projeGeneli : (s.bloklar[+k.slice(1)] ?? s.tumProje);

export function SonucAdimi({ editor, girdi, degistir, adimaGit }: AdimOzellikleri) {
  const [sekme, setSekme] = useState<Sekme>('tum');
  const [sifirGizle, setSifirGizle] = useState(true);
  const [acik, setAcik] = useState<Record<string, boolean>>({});
  const [mesgul, setMesgul] = useState<'' | 'excel' | 'pdf'>('');
  const [hata, setHata] = useState<string | null>(null);
  const s = editor.sonuc!;
  if (s.hata !== undefined)
    return (
      <Kart>
        <Uyari>{s.hata}</Uyari>
        <Dugme metin="Proje bilgilerine dön" bas={() => adimaGit('proje')} />
      </Kart>
    );
  const o = s.ozet;
  const sekmeler: (readonly [Sekme, string])[] = [
    ['tum', 'Tüm Proje'],
    ...s.bloklar.map((b, n) => [`b${n}` as Sekme, b.ad] as const),
    ['pg', 'Proje Geneli'],
  ];
  const veri = tablo(s, sekme);
  const duzenlenebilir = sekme !== 'tum';
  const duzAnahtar = sekme === 'pg' ? 'proje' : `blok${sekme.slice(1)}`;
  const duzeltmeSayisi = Object.values(girdi.duzeltmeler ?? {}).reduce(
    (a, d) => a + Object.keys(d).length,
    0,
  );
  const duzelt = (r: ItemRow, alan: 'metraj' | 'piyasa', x: number | null) =>
    degistir((p: ProjectInput) => {
      const dk = ((p.duzeltmeler ??= {})[duzAnahtar] ??= {});
      const d = (dk[r.anahtar] ??= {});
      if (x === null) delete d[alan];
      else d[alan] = x;
      if (!Object.keys(d).length) delete dk[r.anahtar];
    });
  const indir = async (tur: 'excel' | 'pdf') => {
    setMesgul(tur);
    setHata(null);
    try {
      await (tur === 'excel' ? excelPaylas(s, girdi) : pdfPaylas(s, girdi));
    } catch (e) {
      setHata(`Rapor hazırlanamadı. ${turkceHata(e)}`);
    } finally {
      setMesgul('');
    }
  };
  const hepsiniKaldir = async () => {
    if (
      await onayIste({
        baslik: 'Elle düzeltmeler kaldırılsın mı?',
        metin: 'Tüm elle düzeltmeler kaldırılıp formül değerlerine dönülecek.',
        evet: 'Hepsini kaldır',
        tehlikeli: true,
      })
    )
      degistir((p) => void (p.duzeltmeler = {}));
  };

  // Her satırın bağlı olduğu ana başlığın açık olup olmadığı (başlıktan sonraki kalemler ona aittir).
  const acikMi: boolean[] = [];
  for (const r of veri.satirlar)
    acikMi.push(r.baslik ? Boolean(acik[sekme + r.grup]) : (acikMi[acikMi.length - 1] ?? true));
  const satirlar = veri.satirlar.map((r, i) => {
    if (r.baslik) {
      const k = sekme + r.grup;
      const grupAcik = acikMi[i]!;
      return (
        <Pressable
          key={`g${r.grup}-${i}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: grupAcik }}
          onPress={() => setAcik((a) => ({ ...a, [k]: !a[k] }))}
          style={[S.arasi, { backgroundColor: R.zemin, padding: 10, borderRadius: 6, minHeight: 44 }]}
        >
          <Text style={[S.metin, { fontWeight: '700', flex: 1 }]}>
            {grupAcik ? '▾' : '▸'} {r.no}. {r.ad}
          </Text>
          <Text style={[S.metin, { fontWeight: '700' }]}>{sayi(r.piyasaTutar ?? 0)}</Text>
        </Pressable>
      );
    }
    if (!acikMi[i] || (sifirGizle && !r.metraj)) return null;
    const elle = Boolean(r.metrajElle || r.piyasaElle);
    return (
      <View
        key={r.anahtar}
        style={{ borderBottomWidth: 1, borderBottomColor: R.cizgi, paddingVertical: 8, gap: 6 }}
      >
        <Text style={S.metin}>
          {r.no} · {r.ad} <Text style={S.not}>({r.birim})</Text>
        </Text>
        <View style={[S.satir, { justifyContent: 'space-between' }]}>
          {duzenlenebilir ? (
            <>
              <View style={{ gap: 2 }}>
                <Text style={S.not}>Metraj</Text>
                <Hucre
                  deger={r.metraj}
                  elle={Boolean(r.metrajElle)}
                  etiket={`${r.ad} – metraj`}
                  kaydet={(x) => duzelt(r, 'metraj', x)}
                />
              </View>
              <View style={{ gap: 2 }}>
                <Text style={S.not}>Birim fiyat (TL)</Text>
                <Hucre
                  deger={r.piyasaFiyat}
                  elle={Boolean(r.piyasaElle)}
                  etiket={`${r.ad} – birim fiyat`}
                  kaydet={(x) => duzelt(r, 'piyasa', x)}
                />
              </View>
            </>
          ) : (
            <Text style={S.not}>
              {sayi(r.metraj, 2)} × {sayi(r.piyasaFiyat, 2)} TL
            </Text>
          )}
          <Text style={[S.metin, { fontWeight: '700' }]}>{sayi(r.piyasaTutar)} TL</Text>
        </View>
        {duzenlenebilir && elle && (
          <Dugme
            kucuk
            metin="Formüle dön"
            erisimEtiketi={`${r.ad}: formüle dön`}
            bas={() => degistir((p) => void delete p.duzeltmeler?.[duzAnahtar]?.[r.anahtar])}
          />
        )}
      </View>
    );
  });

  return (
    <>
      <Uyarilar uyarilar={s.uyarilar} />
      <Kart>
        {(
          [
            [
              'Toplam maliyet (KDV hariç)',
              tl(o.piyasa),
              `${sayi(o.toplamInsaatAlani)} m² · ${sayi(o.toplamDaire)} daire`,
              'toplam-kdv-haric',
            ],
            [
              'm² maliyeti (KDV hariç)',
              `${sayi(o.m2Piyasa)} TL/m²`,
              `KDV dahil: ${sayi(o.m2KdvDahil)} TL/m²`,
              '',
            ],
            [`KDV (%${sayi(o.kdvOrani * 100)})`, tl(o.piyasaKdv), '', ''],
            ['Toplam maliyet (KDV dahil)', tl(o.piyasaKdvDahil), '', 'toplam-kdv-dahil'],
          ] as const
        ).map(([e, d, a, id]) => (
          <View key={e} style={{ gap: 2 }}>
            <Text style={S.not}>{e}</Text>
            <Text testID={id || undefined} style={{ fontSize: 20, fontWeight: '800', color: R.ana }}>
              {d}
            </Text>
            {a ? <Text style={S.not}>{a}</Text> : null}
          </View>
        ))}
        <View style={S.satir}>
          <Dugme
            tur="birincil"
            metin={mesgul === 'excel' ? 'Excel hazırlanıyor…' : 'Excel paylaş'}
            devreDisi={Boolean(mesgul)}
            bas={() => void indir('excel')}
          />
          <Dugme
            tur="birincil"
            metin={mesgul === 'pdf' ? 'PDF hazırlanıyor…' : 'PDF paylaş'}
            devreDisi={Boolean(mesgul)}
            bas={() => void indir('pdf')}
          />
        </View>
        <HataKutusu mesaj={hata} />
      </Kart>
      <Kart baslik={`${String(girdi.ad || 'Proje')} – Yaklaşık Maliyet Tablosu`}>
        <Sekmeler etiket="Tablolar" secenekler={sekmeler} secili={sekme} sec={setSekme} />
        <Text style={S.not}>
          {duzenlenebilir
            ? 'Metraj ve birim fiyatı değiştirebilirsin; değişen hücre sarı görünür ve girdileri değiştirsen de korunur. Başlığa dokununca kalemler açılır.'
            : 'Bu sekme blokların ve proje genelinin toplamıdır; birim fiyatlar ağırlıklı ortalamadır. Düzeltme için bir blok ya da Proje Geneli sekmesine geç. Başlığa dokununca kalemler açılır.'}
        </Text>
        <OnayKutusu etiket="Metrajı 0 olan kalemleri gizle" deger={sifirGizle} degistir={setSifirGizle} />
        <Text style={S.not}>Sekme toplamı: {tl(veri.toplam.piyasa)}</Text>
        {satirlar}
        {duzeltmeSayisi > 0 && (
          <View style={S.satir}>
            <Text style={S.not}>{duzeltmeSayisi} kalemde elle düzeltme var.</Text>
            <Dugme tur="baglanti" metin="Hepsini kaldır" bas={() => void hepsiniKaldir()} />
          </View>
        )}
        <Dugme metin="Girdilere dön" bas={() => adimaGit('ozet')} />
      </Kart>
    </>
  );
}
