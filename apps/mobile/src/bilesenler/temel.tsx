/** Temel arayüz parçaları: logo, düğme, kart, hata/uyarı kutuları, yükleniyor, sekmeler, onay penceresi. */
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { R, S } from './tema';

export function Logo({ boyut = 36 }: { boyut?: number }) {
  return (
    <Svg
      width={boyut}
      height={boyut}
      viewBox="0 0 96 96"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Rect x="4" y="4" width="88" height="88" rx="14" fill="#F0692B" />
      <Path
        d="M28 74 V24 H50 a15 15 0 0 1 0 30 H28 M46 54 L62 74"
        stroke="#1F2937"
        strokeWidth="10"
        fill="none"
      />
      <Rect x="68" y="68" width="16" height="16" fill="#1F2937" />
    </Svg>
  );
}

type DugmeTuru = 'birincil' | 'ikincil' | 'tehlikeli' | 'baglanti';

export function Dugme({
  metin,
  bas,
  tur = 'ikincil',
  devreDisi,
  kucuk,
  erisimEtiketi,
  testID,
}: {
  metin: string;
  bas: () => void;
  tur?: DugmeTuru;
  devreDisi?: boolean;
  kucuk?: boolean;
  erisimEtiketi?: string;
  testID?: string;
}) {
  const zemin =
    tur === 'birincil'
      ? R.vurguKoyu
      : tur === 'tehlikeli'
        ? R.hata
        : tur === 'baglanti'
          ? 'transparent'
          : R.kart;
  const yazi =
    tur === 'birincil' || tur === 'tehlikeli' ? '#ffffff' : tur === 'baglanti' ? R.vurguKoyu : R.ana;
  return (
    <Pressable
      accessibilityRole={tur === 'baglanti' ? 'link' : 'button'}
      accessibilityLabel={erisimEtiketi ?? metin}
      accessibilityState={{ disabled: Boolean(devreDisi) }}
      disabled={devreDisi}
      onPress={bas}
      testID={testID}
      style={({ pressed }) => ({
        backgroundColor: zemin,
        borderWidth: tur === 'ikincil' ? 1 : 0,
        borderColor: R.cizgi,
        borderRadius: 8,
        paddingVertical: tur === 'baglanti' ? 4 : kucuk ? 8 : 12,
        paddingHorizontal: tur === 'baglanti' ? 0 : kucuk ? 12 : 16,
        minHeight: tur === 'baglanti' ? undefined : 44,
        justifyContent: 'center',
        opacity: devreDisi ? 0.5 : pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          color: yazi,
          fontWeight: tur === 'baglanti' ? '600' : '700',
          fontSize: kucuk ? 14 : 15,
          textAlign: 'center',
          textDecorationLine: tur === 'baglanti' ? 'underline' : 'none',
        }}
      >
        {metin}
      </Text>
    </Pressable>
  );
}

export function Kart({ children, baslik, stil }: { children: ReactNode; baslik?: string; stil?: ViewStyle }) {
  return (
    <View style={[S.kart, stil]}>
      {baslik ? (
        <Text accessibilityRole="header" style={S.baslik2}>
          {baslik}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function HataKutusu({ mesaj }: { mesaj: string | null | undefined }) {
  if (!mesaj) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={{
        backgroundColor: R.hataZemin,
        borderColor: R.hata,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
      }}
    >
      <Text style={{ color: R.hata, fontSize: 14 }}>{mesaj}</Text>
    </View>
  );
}

export function Uyari({ children }: { children: ReactNode }) {
  return (
    <View style={S.uyari} accessibilityLiveRegion="polite">
      <Text style={S.uyariYazi}>{children}</Text>
    </View>
  );
}

export function Basari({ children }: { children: ReactNode }) {
  return (
    <View style={S.basari} accessibilityLiveRegion="polite">
      <Text style={S.basariYazi}>{children}</Text>
    </View>
  );
}

export function Yukleniyor({ metin = 'Yükleniyor…' }: { metin?: string }) {
  return (
    <View style={{ padding: 24, alignItems: 'center', gap: 8 }} accessibilityLiveRegion="polite">
      <ActivityIndicator color={R.vurguKoyu} />
      <Text style={S.not}>{metin}</Text>
    </View>
  );
}

export function Sekmeler<T extends string>({
  secenekler,
  secili,
  sec,
  etiket,
}: {
  secenekler: readonly (readonly [T, string])[];
  secili: T;
  sec: (x: T) => void;
  etiket: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View role="tablist" aria-label={etiket} style={{ flexDirection: 'row', gap: 6 }}>
        {secenekler.map(([k, ad]) => {
          const aktif = k === secili;
          return (
            <Pressable
              key={k}
              role="tab"
              aria-selected={aktif}
              onPress={() => sec(k)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: aktif ? R.ana : R.kart,
                borderWidth: 1,
                borderColor: aktif ? R.ana : R.cizgi,
                minHeight: 44,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: aktif ? '#fff' : R.ana, fontWeight: '600' }}>{ad}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** Onay sorusu (iki seçenekli). Web önizlemesinde tarayıcının onay penceresi kullanılır. */
export function onayIste(o: {
  baslik: string;
  metin: string;
  evet: string;
  tehlikeli?: boolean;
}): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${o.baslik}\n\n${o.metin}`));
  return new Promise((coz) =>
    Alert.alert(o.baslik, o.metin, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => coz(false) },
      { text: o.evet, style: o.tehlikeli ? 'destructive' : 'default', onPress: () => coz(true) },
    ]),
  );
}
