/** Giriş, kayıt ve güncellenen metinlerin yeniden onayı (web ile aynı kurallar; onaylar sunucuda kaydedilir). */
import { BELGELER } from '@repiom/core';
import { girisSemasi, kayitSemasi } from '@repiom/istemci/formlar';
import { turkceHata } from '@repiom/istemci/hatalar';
import { eksikOnaylar, onayKaydet } from '@repiom/istemci/onaylar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { BelgeBaglantisi } from '../bilesenler/Belge';
import { MetinAlani, OnayKutusu } from '../bilesenler/form';
import { Dugme, HataKutusu, Kart, Logo } from '../bilesenler/temel';
import { R, S } from '../bilesenler/tema';
import { useOturum } from '../lib/oturum';
import { supabase, supabaseAyarHatasi } from '../lib/supabase';
import { Platform as P } from 'react-native';

const ilkHata = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) => {
  const h: Record<string, string> = {};
  r.error?.issues.forEach((i) => {
    const k = String(i.path[0] ?? '');
    h[k] ??= i.message;
  });
  return h;
};

function Cerceve({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={S.ekran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={S.icerik} keyboardShouldPersistTaps="handled">
        <View style={[S.satir, { marginTop: 24, marginBottom: 8 }]}>
          <Logo boyut={40} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: R.ana }}>
            REPİO<Text style={{ color: R.vurguKoyu }}>(M)</Text>
          </Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Hata = ({ m }: { m?: string }) =>
  m ? (
    <Text accessibilityRole="alert" style={{ color: R.hata, fontSize: 13 }}>
      {m}
    </Text>
  ) : null;

export function GirisEkrani() {
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [sunucu, setSunucu] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);

  const gonder = async () => {
    setSunucu(null);
    const r = girisSemasi.safeParse({ eposta, sifre });
    setHatalar(ilkHata(r));
    if (!r.success) return;
    if (!supabase) return setSunucu(supabaseAyarHatasi);
    setMesgul(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: r.data.eposta,
        password: r.data.sifre,
      });
      if (error) setSunucu(turkceHata(error));
    } catch (e) {
      setSunucu(turkceHata(e));
    } finally {
      setMesgul(false);
    }
  };

  return (
    <Cerceve>
      <Kart baslik="Giriş yap">
        <HataKutusu mesaj={supabaseAyarHatasi ?? sunucu} />
        <MetinAlani
          etiket="E-posta"
          deger={eposta}
          degistir={setEposta}
          klavye="email-address"
          otomatik="email"
        />
        <Hata m={hatalar.eposta} />
        <MetinAlani etiket="Şifre" deger={sifre} degistir={setSifre} gizli otomatik="password" />
        <Hata m={hatalar.sifre} />
        <Dugme
          tur="birincil"
          metin={mesgul ? 'Giriş yapılıyor…' : 'Giriş yap'}
          devreDisi={mesgul}
          bas={() => void gonder()}
        />
        <View style={S.satir}>
          <Text style={S.metin}>Hesabın yok mu?</Text>
          <Link href="/kayit" asChild>
            <Text
              accessibilityRole="link"
              style={{ color: R.vurguKoyu, fontWeight: '700', textDecorationLine: 'underline' }}
            >
              Kayıt ol
            </Text>
          </Link>
        </View>
      </Kart>
    </Cerceve>
  );
}

export function KayitEkrani() {
  const router = useRouter();
  const [f, setF] = useState({
    eposta: '',
    sifre: '',
    sifreTekrar: '',
    sozlesme: false,
    kvkk: false,
    riza: false,
    ileti: false,
  });
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [sunucu, setSunucu] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [dogrulama, setDogrulama] = useState<string | null>(null);
  const set =
    <K extends keyof typeof f>(k: K) =>
    (x: (typeof f)[K]) =>
      setF((o) => ({ ...o, [k]: x }));

  const gonder = async () => {
    setSunucu(null);
    const r = kayitSemasi.safeParse(f);
    setHatalar(ilkHata(r));
    if (!r.success) return;
    if (!supabase) return setSunucu(supabaseAyarHatasi);
    setMesgul(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: r.data.eposta,
        password: r.data.sifre,
        options: {
          data: {
            onaylar: [
              f.sozlesme && 'kullanici_sozlesmesi',
              f.kvkk && 'kvkk_aydinlatma',
              f.riza && 'acik_riza_yurtdisi',
              f.ileti && 'ticari_ileti',
            ].filter(Boolean),
            tarayici: `REPİO(M) mobil · ${P.OS} ${String(P.Version)}`,
          },
        },
      });
      if (error) return setSunucu(turkceHata(error));
      if (!data.session) setDogrulama(r.data.eposta);
    } catch (e) {
      setSunucu(turkceHata(e));
    } finally {
      setMesgul(false);
    }
  };

  if (dogrulama)
    return (
      <Cerceve>
        <Kart baslik="E-postanı kontrol et">
          <Text style={S.metin} accessibilityLiveRegion="polite">
            <Text style={{ fontWeight: '700' }}>{dogrulama}</Text> adresine bir doğrulama bağlantısı
            gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
          </Text>
          <Dugme metin="Giriş ekranına dön" bas={() => router.replace('/giris')} />
        </Kart>
      </Cerceve>
    );

  return (
    <Cerceve>
      <Kart baslik="Kayıt ol">
        <HataKutusu mesaj={supabaseAyarHatasi ?? sunucu} />
        <MetinAlani
          etiket="E-posta"
          deger={f.eposta}
          degistir={set('eposta')}
          klavye="email-address"
          otomatik="email"
        />
        <Hata m={hatalar.eposta} />
        <MetinAlani
          etiket="Şifre"
          aciklama="En az 8 karakter; harf ve rakam içermeli."
          deger={f.sifre}
          degistir={set('sifre')}
          gizli
          otomatik="new-password"
        />
        <Hata m={hatalar.sifre} />
        <MetinAlani
          etiket="Şifre (tekrar)"
          deger={f.sifreTekrar}
          degistir={set('sifreTekrar')}
          gizli
          otomatik="new-password"
        />
        <Hata m={hatalar.sifreTekrar} />
        <Text accessibilityRole="header" style={S.baslik3}>
          Sözleşme ve izinler
        </Text>
        <OnayKutusu
          etiket="Kullanıcı Sözleşmesi'ni okudum ve kabul ediyorum (zorunlu)"
          deger={f.sozlesme}
          degistir={set('sozlesme')}
        >
          <Text style={S.metin}>
            Kullanıcı Sözleşmesi'ni okudum ve kabul ediyorum. <Text style={{ color: R.hata }}>(zorunlu)</Text>
          </Text>
          <BelgeBaglantisi id="kullanici_sozlesmesi" metin="Kullanıcı Sözleşmesi'ni oku" />
        </OnayKutusu>
        <Hata m={hatalar.sozlesme} />
        <OnayKutusu etiket="KVKK Aydınlatma Metni'ni okudum (zorunlu)" deger={f.kvkk} degistir={set('kvkk')}>
          <Text style={S.metin}>
            Kişisel verilerimin işlenmesine ilişkin KVKK Aydınlatma Metni'ni okudum.{' '}
            <Text style={{ color: R.hata }}>(zorunlu)</Text>
          </Text>
          <BelgeBaglantisi id="kvkk_aydinlatma" metin="KVKK Aydınlatma Metni'ni oku" />
        </OnayKutusu>
        <Hata m={hatalar.kvkk} />
        <OnayKutusu
          etiket="İsteğe bağlı: yapay zekâ kontrolü için yurt dışına aktarım açık rızası"
          deger={f.riza}
          degistir={set('riza')}
        >
          <Text style={S.metin}>
            İsteğe bağlı: çizim analizinde plan görsellerimin yapay zekâ kontrolü için yurt dışına
            aktarılmasına açık rıza veriyorum.
          </Text>
          <BelgeBaglantisi id="acik_riza_yurtdisi" metin="Açık rıza metnini oku" />
        </OnayKutusu>
        <OnayKutusu
          etiket="İsteğe bağlı: ticari elektronik ileti izni"
          deger={f.ileti}
          degistir={set('ileti')}
        >
          <Text style={S.metin}>
            İsteğe bağlı: kampanya ve yenilikler için ticari elektronik ileti almak istiyorum.
          </Text>
          <BelgeBaglantisi id="ticari_ileti" metin="Ticari ileti metnini oku" />
        </OnayKutusu>
        <Dugme
          tur="birincil"
          metin={mesgul ? 'Kayıt yapılıyor…' : 'Kayıt ol'}
          devreDisi={mesgul}
          bas={() => void gonder()}
        />
        <Dugme tur="baglanti" metin="Zaten hesabın var mı? Giriş yap" bas={() => router.replace('/giris')} />
      </Kart>
    </Cerceve>
  );
}

/** Eksik / sürümü değişmiş onay varsa uygulama yerine onay ekranı. */
export function YenidenOnay({ children }: { children: ReactNode }) {
  const { oturum, cikisYap } = useOturum();
  const istemci = useQueryClient();
  const eksik = useQuery({
    queryKey: ['eksik-onaylar', oturum?.user.id],
    queryFn: eksikOnaylar,
    enabled: Boolean(oturum),
  });
  const [secili, setSecili] = useState<Record<string, boolean>>({});
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);
  if (!eksik.data?.length) return <>{children}</>;
  const liste = eksik.data;
  const tamam = liste.filter((e) => e.zorunlu).every((e) => secili[e.belge]);
  const gonder = async () => {
    setHata(null);
    setMesgul(true);
    try {
      await onayKaydet(liste.filter((e) => secili[e.belge]).map((e) => e.belge));
      await onayKaydet(
        liste.filter((e) => !e.zorunlu && !secili[e.belge]).map((e) => e.belge),
        false,
      );
      await istemci.invalidateQueries({ queryKey: ['eksik-onaylar'] });
    } catch (e) {
      setHata(turkceHata(e));
    } finally {
      setMesgul(false);
    }
  };
  return (
    <Cerceve>
      <Kart baslik="Güncellenen metinler">
        <Text style={S.metin}>Devam etmek için aşağıdaki metinleri okuyup onaylaman gerekiyor.</Text>
        <HataKutusu mesaj={hata} />
        {liste.map((e) => (
          <OnayKutusu
            key={e.belge}
            etiket={`${BELGELER[e.belge].ad} (${e.zorunlu ? 'zorunlu' : 'isteğe bağlı'})`}
            deger={Boolean(secili[e.belge])}
            degistir={(x) => setSecili((s) => ({ ...s, [e.belge]: x }))}
          >
            <Text style={S.metin}>
              {BELGELER[e.belge].ad} (sürüm {BELGELER[e.belge].surum}){' '}
              {e.zorunlu ? '(zorunlu)' : '(isteğe bağlı)'}
            </Text>
            <BelgeBaglantisi id={e.belge} metin="Metni oku" />
          </OnayKutusu>
        ))}
        <View style={S.satir}>
          <Dugme metin="Çıkış yap" bas={() => void cikisYap()} />
          <Dugme
            tur="birincil"
            metin="Onayla ve devam et"
            devreDisi={!tamam || mesgul}
            bas={() => void gonder()}
          />
        </View>
      </Kart>
    </Cerceve>
  );
}
