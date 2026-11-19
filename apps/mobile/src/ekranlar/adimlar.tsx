/** 7 adımın ilk beşi (girdi adımları). Alanlar ve kurallar web'deki adımlarla birebir aynıdır. */
import {
  emptyBlock,
  emptyFloor,
  emptyType,
  FLOOR_KINDS,
  PROVINCES,
  siteBlockTemplate,
  type BlockInput,
  type BlockSystemInput,
  type FloorKind,
  type ProjectInput,
} from '@repiom/core';
import { KAT_ADI, tipEtiketi } from '@repiom/istemci/bicim';
import type { ProjeEditoru } from '@repiom/istemci/useProjeEditoru';
import { VAR_YOK } from '@repiom/istemci/sayi';
import { Text, View } from 'react-native';
import { MetinAlani, OnayKutusu, SayiAlani, SecimAlani } from '../bilesenler/form';
import { Dugme, Kart, onayIste, Sekmeler } from '../bilesenler/temel';
import { S } from '../bilesenler/tema';

export interface AdimOzellikleri {
  editor: ProjeEditoru;
  girdi: ProjectInput;
  degistir: (fn: (taslak: ProjectInput) => void) => void;
  blok: number;
  blokSec: (n: number) => void;
  adimaGit: (yol: string) => void;
}

const ILLER = PROVINCES.map((p) => p.ad);

function BlokSekmeleri({
  girdi,
  blok,
  blokSec,
  kopyala,
  kopyaMetni,
}: Pick<AdimOzellikleri, 'girdi' | 'blok' | 'blokSec'> & { kopyala: () => void; kopyaMetni: string }) {
  const bloklar = girdi.bloklar ?? [];
  if (bloklar.length < 2) return null;
  return (
    <View style={{ gap: 8 }}>
      <Sekmeler
        etiket="Bloklar"
        secenekler={bloklar.map((b, n) => [String(n), String(b.ad || `Blok ${n + 1}`)] as const)}
        secili={String(blok)}
        sec={(x) => blokSec(Number(x))}
      />
      {blok > 0 && <Dugme kucuk metin={`Önceki bloğun ${kopyaMetni} kopyala`} bas={kopyala} />}
    </View>
  );
}

export function ProjeAdimi({ girdi, degistir, blokSec }: AdimOzellikleri) {
  const bloklar = girdi.bloklar ?? [];
  const blokAdedi = (n: number | '') =>
    degistir((p) => {
      p.blokAdedi = n;
      const hedef = Math.max(1, Math.min(10, n === '' ? (p.bloklar ?? []).length || 1 : n));
      const b = p.bloklar ?? (p.bloklar = []);
      while (b.length < hedef) b.push(emptyBlock(b.length));
      b.length = hedef;
    });
  const sablon = async () => {
    const dolu = (girdi.tipler ?? []).length > 0 || bloklar.some((b) => (b.katlar ?? []).length > 0);
    if (
      dolu &&
      !(await onayIste({
        baslik: 'Şablon uygulansın mı?',
        metin: 'Şablon, girdiğin daire tiplerinin ve katların yerine geçecek.',
        evet: 'Şablonu uygula',
      }))
    )
      return;
    degistir((p) => Object.assign(p, siteBlockTemplate(structuredClone(p))));
    blokSec(0);
  };
  return (
    <>
      <Kart baslik="Hazır şablon">
        <Text style={S.not}>
          Site bloğu: blok başına 1 bodrum, 1 otopark, 10 normal kat; her katta 2 adet 2+1 ve 2 adet 3+1
          daire; 2 asansör. Toplam inşaat alanını girdiysen kat sayısı ona göre ayarlanır.
        </Text>
        <Dugme metin="Site bloğu şablonunu uygula" bas={() => void sablon()} />
      </Kart>
      <Kart baslik="Proje bilgileri">
        <Text style={S.not}>
          Bildiğin kadarını gir. Hesap için toplam inşaat alanı yeterli; kat ve daire bilgisi girersen hesap o
          bilgilere göre yapılır ve toplam inşaat alanı yok sayılır.
        </Text>
        <MetinAlani etiket="Proje adı" deger={girdi.ad} degistir={(x) => degistir((p) => void (p.ad = x))} />
        <SecimAlani
          etiket="İl"
          deger={girdi.il}
          secenekler={ILLER}
          bosSecenek={false}
          degistir={(x) => degistir((p) => void (p.il = x))}
        />
        <SayiAlani
          etiket="Toplam inşaat alanı (m²)"
          deger={girdi.toplamInsaatAlani}
          degistir={(x) => degistir((p) => void (p.toplamInsaatAlani = x))}
        />
        <SayiAlani
          etiket="Arsa alanı (m²)"
          deger={girdi.arsa}
          degistir={(x) => degistir((p) => void (p.arsa = x))}
        />
        <SayiAlani
          etiket="Blok adedi"
          deger={girdi.blokAdedi}
          tamSayi
          min={1}
          max={10}
          degistir={blokAdedi}
        />
        <SayiAlani
          etiket="Toplam oturum alanı (m²)"
          deger={girdi.toplamOturum}
          degistir={(x) => degistir((p) => void (p.toplamOturum = x))}
        />
        <Text accessibilityRole="header" style={S.baslik3}>
          Blok adları
        </Text>
        {bloklar.map((b, n) => (
          <MetinAlani
            key={n}
            etiket={`${n + 1}. blok`}
            deger={b.ad}
            enCok={60}
            degistir={(x) => degistir((p) => void (p.bloklar![n]!.ad = x))}
          />
        ))}
      </Kart>
    </>
  );
}

const DUZENLER = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1', '6+1'];

export function DaireTipleriAdimi({ girdi, degistir }: AdimOzellikleri) {
  const tipler = girdi.tipler ?? [];
  const sil = async (n: number) => {
    const id = tipler[n]!.id;
    const kullaniliyor = (girdi.bloklar ?? []).some((b) =>
      (b.katlar ?? []).some((k) => (k.daireler ?? []).some((d) => d.tip === id)),
    );
    if (
      kullaniliyor &&
      !(await onayIste({
        baslik: 'Daire tipi silinsin mi?',
        metin: 'Bu tip bazı katlarda kullanılıyor; o katlardan da çıkarılacak.',
        evet: 'Sil',
        tehlikeli: true,
      }))
    )
      return;
    degistir((p) => {
      p.tipler!.splice(n, 1);
      (p.bloklar ?? []).forEach((b) =>
        (b.katlar ?? []).forEach((k) => (k.daireler = (k.daireler ?? []).filter((d) => d.tip !== id))),
      );
    });
  };
  return (
    <Kart baslik="Daire tipleri">
      <Text style={S.not}>
        Tipler bütün bloklarda ortaktır. Katlar adımında her kata bu tiplerden daire yerleştirirsin. Bu adımı
        boş bırakabilirsin; daireler kat alanından tahmin edilir.
      </Text>
      {!tipler.length && <Text style={S.metin}>Henüz daire tipi yok.</Text>}
      {tipler.map((t, n) => {
        const tip = (fn: (x: (typeof tipler)[number]) => void) => degistir((p) => fn(p.tipler![n]!));
        return (
          <View style={S.altkart} key={t.id}>
            <View style={S.arasi}>
              <Text accessibilityRole="header" style={S.baslik3}>
                {tipEtiketi(t)}
              </Text>
              <Dugme
                kucuk
                metin="Sil"
                erisimEtiketi={`${tipEtiketi(t)} tipini sil`}
                bas={() => void sil(n)}
              />
            </View>
            <MetinAlani
              etiket="Tip adı (ör. TİP1)"
              deger={t.ad}
              enCok={40}
              degistir={(x) => tip((y) => void (y.ad = x))}
            />
            <SecimAlani
              etiket="Oda düzeni"
              deger={t.duzen}
              secenekler={DUZENLER}
              degistir={(x) => tip((y) => void (y.duzen = x))}
            />
            <SayiAlani
              etiket="Brüt alan (m²)"
              deger={t.brut}
              degistir={(x) => tip((y) => void (y.brut = x))}
            />
            <SayiAlani
              etiket="Balkon adedi"
              deger={t.balkon}
              tamSayi
              max={10}
              degistir={(x) => tip((y) => void (y.balkon = x))}
            />
            <SecimAlani
              etiket="Mutfak"
              deger={t.mutfak}
              secenekler={[
                ['KAPALI', 'Kapalı'],
                ['AMERİKAN', 'Amerikan'],
              ]}
              degistir={(x) => tip((y) => void (y.mutfak = x))}
            />
            <SecimAlani
              etiket="Işık bandı"
              deger={t.isikBandi}
              secenekler={VAR_YOK}
              degistir={(x) => tip((y) => void (y.isikBandi = x))}
            />
            <SecimAlani
              etiket="Alaturka WC"
              deger={t.alaturka}
              secenekler={VAR_YOK}
              degistir={(x) => tip((y) => void (y.alaturka = x))}
            />
            <SayiAlani
              etiket="Ebeveyn banyo adedi"
              deger={t.ebeveynBanyo}
              tamSayi
              max={5}
              degistir={(x) => tip((y) => void (y.ebeveynBanyo = x))}
            />
            <SecimAlani
              etiket="Ankastre"
              deger={t.ankastre}
              secenekler={VAR_YOK}
              degistir={(x) => tip((y) => void (y.ankastre = x))}
            />
            <SayiAlani
              etiket="Klima adedi"
              deger={t.klima}
              tamSayi
              max={20}
              degistir={(x) => tip((y) => void (y.klima = x))}
            />
            <OnayKutusu
              etiket="Dubleks daire"
              deger={t.dubleks}
              degistir={(x) => tip((y) => void (y.dubleks = x))}
            />
          </View>
        );
      })}
      <Dugme
        metin="Daire tipi ekle"
        bas={() =>
          degistir((p) => void (p.tipler ??= []).push(emptyType(`TİP${(p.tipler ?? []).length + 1}`)))
        }
      />
    </Kart>
  );
}

function katEkle(b: BlockInput, tur: FloorKind) {
  const katlar = b.katlar ?? (b.katlar = []);
  const sira = FLOOR_KINDS.indexOf(tur);
  let yer = katlar.length;
  for (let i = katlar.length - 1; i >= 0; i--) {
    if (FLOOR_KINDS.indexOf(katlar[i]!.tur as FloorKind) <= sira) {
      yer = i + 1;
      break;
    }
    if (i === 0) yer = 0;
  }
  katlar.splice(yer, 0, emptyFloor(tur));
}

export function KatlarAdimi({ girdi, degistir, blok, blokSec, adimaGit }: AdimOzellikleri) {
  const b = girdi.bloklar![blok]!;
  const katlar = b.katlar ?? [];
  const tipSecenek = (girdi.tipler ?? []).map((t) => [t.id, tipEtiketi(t)] as const);
  const blokDegistir = (fn: (x: BlockInput) => void) => degistir((p) => fn(p.bloklar![blok]!));
  const sayac: Record<string, number> = {};
  katlar.forEach(
    (k) => (sayac[k.tur] = (sayac[k.tur] ?? 0) + (Number(k.tekrar) || (k.tekrar === '' ? 1 : 0))),
  );
  const ozet = FLOOR_KINDS.filter((t) => sayac[t])
    .map((t) => `${sayac[t]} ${KAT_ADI[t]!.toLocaleLowerCase('tr')}`)
    .join(', ');
  return (
    <Kart baslik="Kat bilgileri">
      <BlokSekmeleri
        girdi={girdi}
        blok={blok}
        blokSec={blokSec}
        kopyaMetni="katlarını"
        kopyala={() =>
          degistir(
            (p) => void (p.bloklar![blok]!.katlar = structuredClone(p.bloklar![blok - 1]!.katlar ?? [])),
          )
        }
      />
      <Text style={S.not}>
        Aynı düzendeki katları tek satırda gir ve "kaç kez tekrar ediyor" alanına adedini yaz. Normal ve
        dubleks katlarda kat alanı, dairelerin brüt alanına %12 ortak alan eklenerek hesaplanır.
      </Text>
      {!katlar.length && (
        <Text style={S.metin}>
          Bu blok için kat girilmedi. Boş bırakırsan blok, toplam inşaat alanından hesaplanır.
        </Text>
      )}
      {katlar.map((k, n) => {
        const konut = k.tur === 'normal' || k.tur === 'dubleks';
        const sira = katlar.slice(0, n + 1).filter((x) => x.tur === k.tur).length;
        const baslik = `${KAT_ADI[k.tur] ?? k.tur} ${sira}`;
        const kat = (fn: (x: (typeof katlar)[number]) => void) => blokDegistir((x) => fn(x.katlar![n]!));
        return (
          <View style={S.altkart} key={n}>
            <View style={S.arasi}>
              <Text accessibilityRole="header" style={S.baslik3}>
                {baslik}
              </Text>
              <Dugme
                kucuk
                metin="Sil"
                erisimEtiketi={`${baslik} satırını sil`}
                bas={() => blokDegistir((x) => void x.katlar!.splice(n, 1))}
              />
            </View>
            <SayiAlani
              etiket="Kaç kez tekrar ediyor"
              deger={k.tekrar}
              tamSayi
              min={1}
              max={200}
              degistir={(x) => kat((y) => void (y.tekrar = x))}
            />
            <SayiAlani
              etiket="Kat yüksekliği (m)"
              deger={k.yukseklik}
              max={20}
              degistir={(x) => kat((y) => void (y.yukseklik = x))}
            />
            <SecimAlani
              etiket="Gömülü mü"
              deger={k.gomulu}
              secenekler={[
                ['EVET', 'Evet'],
                ['YARI', 'Yarı gömülü'],
                ['HAYIR', 'Hayır'],
              ]}
              degistir={(x) => kat((y) => void (y.gomulu = x))}
            />
            {!konut && (
              <SayiAlani etiket="Kat alanı (m²)" deger={k.m2} degistir={(x) => kat((y) => void (y.m2 = x))} />
            )}
            {konut && (
              <>
                <Text style={[S.metin, { fontWeight: '700' }]}>
                  {k.tur === 'dubleks'
                    ? 'Bu kattaki dubleks daireler (m² iki seviyenin toplamı)'
                    : 'Bu kattaki daireler'}
                </Text>
                {tipSecenek.length ? (
                  <>
                    {(k.daireler ?? []).map((d, i) => (
                      <View
                        key={i}
                        style={{ gap: 6, borderLeftWidth: 3, borderLeftColor: '#d1d5db', paddingLeft: 8 }}
                      >
                        <SecimAlani
                          etiket="Daire tipi"
                          deger={d.tip}
                          secenekler={tipSecenek}
                          degistir={(x) => kat((y) => void (y.daireler![i]!.tip = x))}
                        />
                        <SayiAlani
                          etiket="Adet"
                          deger={d.adet}
                          tamSayi
                          max={100}
                          degistir={(x) => kat((y) => void (y.daireler![i]!.adet = x))}
                        />
                        <Dugme
                          kucuk
                          metin="Daireyi sil"
                          erisimEtiketi={`${baslik}: ${i + 1}. daire satırını sil`}
                          bas={() => kat((y) => void y.daireler!.splice(i, 1))}
                        />
                      </View>
                    ))}
                    <Dugme
                      kucuk
                      metin="Daire ekle"
                      bas={() => kat((y) => void (y.daireler ??= []).push({ tip: '', adet: '' }))}
                    />
                  </>
                ) : (
                  <View style={{ gap: 4 }}>
                    <Text style={S.not}>
                      Daire yerleştirmek için önce daire tipi tanımla. Boş bırakırsan daireler kat alanından
                      tahmin edilir.
                    </Text>
                    <Dugme
                      tur="baglanti"
                      metin="Daire tipleri adımına git"
                      bas={() => adimaGit('daire-tipleri')}
                    />
                  </View>
                )}
              </>
            )}
          </View>
        );
      })}
      <Text style={S.baslik3}>Kat ekle</Text>
      <View style={S.satir}>
        {FLOOR_KINDS.map((t) => (
          <Dugme key={t} kucuk metin={`+ ${KAT_ADI[t]}`} bas={() => blokDegistir((x) => katEkle(x, t))} />
        ))}
      </View>
      {ozet ? (
        <Text style={S.metin}>
          {String(b.ad || `Blok ${blok + 1}`)}: <Text style={{ fontWeight: '700' }}>{ozet}</Text>
        </Text>
      ) : null}
    </Kart>
  );
}

export function DigerBilgilerAdimi({ girdi, degistir, blok, blokSec }: AdimOzellikleri) {
  const s = girdi.bloklar![blok]!.sistem ?? {};
  const set = (alan: keyof BlockSystemInput) => (x: string | number) =>
    degistir((p) => {
      (p.bloklar![blok]!.sistem ??= {})[alan] = x;
    });
  return (
    <Kart baslik="Diğer bilgiler">
      <BlokSekmeleri
        girdi={girdi}
        blok={blok}
        blokSec={blokSec}
        kopyaMetni="bilgilerini"
        kopyala={() =>
          degistir(
            (p) => void (p.bloklar![blok]!.sistem = structuredClone(p.bloklar![blok - 1]!.sistem ?? {})),
          )
        }
      />
      <Text style={S.not}>Bilmediklerini "Seçilmedi" bırakabilirsin; tipik konut değerleri kullanılır.</Text>
      <SecimAlani
        etiket="Dış cephe kaplaması"
        deger={s.cephe}
        secenekler={[
          ['EPS', 'EPS'],
          ['XPS', 'XPS'],
          ['TAŞYÜNÜ', 'Taşyünü'],
          ['ÖZEL', 'Özel'],
        ]}
        degistir={set('cephe')}
      />
      <SecimAlani
        etiket="Mantolama altına sıva yapılacak mı?"
        aciklama="Seçilmezse Evet sayılır."
        deger={s.mantoAltiSiva}
        secenekler={[
          ['EVET', 'Evet'],
          ['HAYIR', 'Hayır'],
        ]}
        degistir={set('mantoAltiSiva')}
      />
      <SayiAlani etiket="Asansör adedi" deger={s.asansor} tamSayi max={20} degistir={set('asansor')} />
      <SayiAlani
        etiket="Merdiven adedi"
        deger={s.merdiven}
        tamSayi
        min={1}
        max={20}
        degistir={set('merdiven')}
      />
      <SecimAlani
        etiket="Isıtma sistemi"
        deger={s.isitma}
        secenekler={[
          ['KOMBİ', 'Kombi'],
          ['MERKEZİ', 'Merkezi'],
        ]}
        degistir={set('isitma')}
      />
      <SecimAlani
        etiket="Isıtma şekli"
        deger={s.isitmaSekli}
        secenekler={[
          ['RADYATÖR', 'Radyatör'],
          ['YERDEN ISITMA', 'Yerden ısıtma'],
        ]}
        degistir={set('isitmaSekli')}
      />
      <SecimAlani
        etiket="Banyo-WC asma tavan"
        deger={s.banyoTavan}
        secenekler={[
          ['YEŞİL ALÇIPAN', 'Yeşil alçıpan'],
          ['ALÜMİNYUM PANEL', 'Alüminyum panel'],
        ]}
        degistir={set('banyoTavan')}
      />
      <SecimAlani
        etiket="Çatı tipi"
        deger={s.cati}
        secenekler={[
          ['KIRMA', 'Kırma çatı'],
          ['TERAS', 'Teras çatı'],
        ]}
        degistir={set('cati')}
      />
      <SecimAlani
        etiket="Döşeme sistemi"
        deger={s.doseme}
        secenekler={[
          ['ASMOLEN', 'Asmolen'],
          ['KİRİŞLİ', 'Kirişli'],
        ]}
        degistir={set('doseme')}
      />
      <SecimAlani
        etiket="Su deposu"
        deger={s.suDeposu}
        secenekler={[
          ['YOK', 'Yok'],
          ['BETONARME', 'Betonarme'],
          ['MODÜLER', 'Modüler'],
        ]}
        degistir={set('suDeposu')}
      />
      <SayiAlani
        etiket="Dilatasyon adedi"
        deger={s.dilatasyon}
        tamSayi
        max={20}
        degistir={set('dilatasyon')}
      />
    </Kart>
  );
}

type Onay =
  'satisOfisi' | 'ornekDaire' | 'jenerator' | 'trafo' | 'hamam' | 'sauna' | 'finHamami' | 'fitness' | 'havuz';

export function ProjeGeneliAdimi({ girdi, degistir }: AdimOzellikleri) {
  const onay = (alan: Onay, etiket: string) => (
    <OnayKutusu
      etiket={etiket}
      deger={girdi[alan]}
      degistir={(x) => degistir((p: ProjectInput) => void (p[alan] = x))}
    />
  );
  return (
    <Kart baslik="Proje geneli">
      <SayiAlani
        etiket="İnşaat süresi (ay)"
        aciklama="Boş bırakılırsa 18 ay."
        deger={girdi.sureAy}
        tamSayi
        min={1}
        max={120}
        degistir={(x) => degistir((p) => void (p.sureAy = x))}
      />
      <SayiAlani
        etiket="KDV oranı (%)"
        aciklama="Boş bırakılırsa %20."
        deger={girdi.kdvOrani}
        max={100}
        degistir={(x) => degistir((p) => void (p.kdvOrani = x))}
      />
      <SayiAlani
        etiket="Öngörülemeyen giderler oranı (%)"
        aciklama="Boş bırakılırsa %2."
        deger={girdi.ongorulemeyenOrani}
        max={100}
        degistir={(x) => degistir((p) => void (p.ongorulemeyenOrani = x))}
      />
      <Text accessibilityRole="header" style={S.baslik3}>
        Tesisler
      </Text>
      {onay('satisOfisi', 'Satış ofisi yapılacak')}
      {onay('ornekDaire', 'Örnek daire yapılacak')}
      {onay('jenerator', 'Jeneratör')}
      {onay('trafo', 'Trafo')}
      <Text accessibilityRole="header" style={S.baslik3}>
        Sosyal tesisler
      </Text>
      {onay('hamam', 'Hamam')}
      {onay('sauna', 'Sauna')}
      {onay('finHamami', 'Fin hamamı')}
      {onay('fitness', 'Fitness')}
      {onay('havuz', 'Havuz')}
      {girdi.havuz ? (
        <SayiAlani
          etiket="Havuz su yüzeyi (m²)"
          deger={girdi.havuzM2}
          degistir={(x) => degistir((p) => void (p.havuzM2 = x))}
        />
      ) : null}
    </Kart>
  );
}
