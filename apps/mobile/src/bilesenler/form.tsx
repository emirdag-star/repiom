/**
 * Form alanları (web'deki components/form.tsx ile aynı davranış): etiketli, ekran okuyucuya uygun; boş = girilmedi.
 * Sayılar Türkçe yazımla okunur (6.000 · 2,5).
 */
import type { RawValue } from '@repiom/core';
import { sayiOku } from '@repiom/istemci/sayi';
import { useState, type ReactNode } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { Dugme } from './temel';
import { R, S } from './tema';

const girdiStili = {
  borderWidth: 1,
  borderColor: R.cizgi,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 16,
  color: R.ana,
  backgroundColor: '#fff',
  minHeight: 44,
} as const;

function Kap({
  etiket,
  aciklama,
  hata,
  children,
}: {
  etiket: string;
  aciklama?: ReactNode;
  hata?: string | null;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: R.ana }}>{etiket}</Text>
      {children}
      {aciklama ? <Text style={S.not}>{aciklama}</Text> : null}
      {hata ? (
        <Text accessibilityRole="alert" style={{ color: R.hata, fontSize: 13 }}>
          {hata}
        </Text>
      ) : null}
    </View>
  );
}

const sayiYaz = (x: RawValue) =>
  x === '' || x === null || x === undefined ? '' : String(x).replace('.', ',');

export function SayiAlani({
  etiket,
  aciklama,
  deger,
  degistir,
  min = 0,
  max,
  tamSayi = false,
}: {
  etiket: string;
  aciklama?: string;
  deger: RawValue;
  degistir: (x: number | '') => void;
  min?: number;
  max?: number;
  tamSayi?: boolean;
}) {
  const [metin, setMetin] = useState(sayiYaz(deger));
  const [hata, setHata] = useState<string | null>(null);
  const [oncekiDeger, setOncekiDeger] = useState(deger);
  if (!Object.is(oncekiDeger, deger)) {
    setOncekiDeger(deger);
    const d = deger === '' || deger === null || deger === undefined ? null : Number(deger);
    if (sayiOku(metin) !== d) setMetin(sayiYaz(deger));
  }
  const yaz = (s: string) => {
    setMetin(s);
    const x = sayiOku(s);
    if (x === null) {
      setHata(null);
      return degistir('');
    }
    if (Number.isNaN(x)) return setHata('Geçerli bir sayı yaz (ör. 120 ya da 2,5).');
    if (tamSayi && !Number.isInteger(x)) return setHata('Tam sayı yaz.');
    if (x < min) return setHata(`En az ${String(min).replace('.', ',')} olmalı.`);
    if (max !== undefined && x > max) return setHata(`En çok ${String(max).replace('.', ',')} olabilir.`);
    setHata(null);
    degistir(x);
  };
  const klavye: KeyboardTypeOptions = tamSayi ? 'number-pad' : 'decimal-pad';
  return (
    <Kap etiket={etiket} aciklama={aciklama} hata={hata}>
      <TextInput
        accessibilityLabel={etiket}
        accessibilityHint={aciklama}
        keyboardType={klavye}
        value={metin}
        onChangeText={yaz}
        style={[girdiStili, hata ? { borderColor: R.hata } : null]}
      />
    </Kap>
  );
}

export function MetinAlani({
  etiket,
  aciklama,
  deger,
  degistir,
  enCok = 200,
  gizli,
  klavye,
  otomatik,
}: {
  etiket: string;
  aciklama?: string;
  deger: RawValue;
  degistir: (x: string) => void;
  enCok?: number;
  gizli?: boolean;
  klavye?: KeyboardTypeOptions;
  otomatik?: 'email' | 'password' | 'new-password' | 'off';
}) {
  return (
    <Kap etiket={etiket} aciklama={aciklama}>
      <TextInput
        accessibilityLabel={etiket}
        maxLength={enCok}
        value={deger === null || deger === undefined ? '' : String(deger)}
        onChangeText={degistir}
        secureTextEntry={gizli}
        keyboardType={klavye}
        autoCapitalize={klavye === 'email-address' || gizli ? 'none' : 'sentences'}
        autoComplete={
          Platform.OS === 'web' && otomatik === 'password' ? ('current-password' as 'password') : otomatik
        }
        style={girdiStili}
      />
    </Kap>
  );
}

export type Secenek = readonly [string, string] | string;

export function SecimAlani({
  etiket,
  aciklama,
  deger,
  degistir,
  secenekler,
  bosSecenek = true,
}: {
  etiket: string;
  aciklama?: string;
  deger: RawValue;
  degistir: (x: string) => void;
  secenekler: readonly Secenek[];
  bosSecenek?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const liste: [string, string][] = [
    ...(bosSecenek ? ([['', 'Seçilmedi']] as [string, string][]) : []),
    ...secenekler.map((s) =>
      typeof s === 'string' ? ([s, s] as [string, string]) : ([s[0], s[1]] as [string, string]),
    ),
  ];
  const v = deger === null || deger === undefined ? '' : String(deger);
  const gorunen = liste.find(([k]) => k === v)?.[1] ?? (v || 'Seçilmedi');
  return (
    <Kap etiket={etiket} aciklama={aciklama}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${etiket}: ${gorunen}`}
        accessibilityHint="Seçenekleri açar"
        onPress={() => setAcik(true)}
        style={[girdiStili, { justifyContent: 'center' }]}
      >
        <Text style={{ fontSize: 16, color: R.ana }}>{gorunen} ▾</Text>
      </Pressable>
      <Modal visible={acik} animationType="slide" onRequestClose={() => setAcik(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: R.kart }}>
          <View style={[S.arasi, { padding: 16 }]}>
            <Text accessibilityRole="header" style={S.baslik2}>
              {etiket}
            </Text>
            <Dugme metin="Kapat" kucuk bas={() => setAcik(false)} />
          </View>
          <FlatList
            data={liste}
            keyExtractor={([k]) => k || '_bos'}
            renderItem={({ item: [k, ad] }) => (
              <Pressable
                role="radio"
                aria-checked={k === v}
                onPress={() => {
                  degistir(k);
                  setAcik(false);
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: R.cizgi,
                  backgroundColor: k === v ? R.zemin : R.kart,
                }}
              >
                <Text style={{ fontSize: 16, color: R.ana, fontWeight: k === v ? '700' : '400' }}>
                  {k === v ? '✓ ' : ''}
                  {ad}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </Kap>
  );
}

export function OnayKutusu({
  etiket,
  deger,
  degistir,
  children,
}: {
  etiket: string;
  deger: RawValue | boolean;
  degistir: (x: boolean) => void;
  children?: ReactNode;
}) {
  const isaretli = Boolean(deger);
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Pressable
        role="checkbox"
        aria-label={etiket}
        aria-checked={isaretli}
        onPress={() => degistir(!isaretli)}
        hitSlop={8}
        style={{
          width: 26,
          height: 26,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: isaretli ? R.vurguKoyu : R.soluk,
          backgroundColor: isaretli ? R.vurguKoyu : '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {isaretli ? <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text> : null}
      </Pressable>
      <View style={{ flex: 1 }}>
        {children ?? (
          <Text style={S.metin} onPress={() => degistir(!isaretli)}>
            {etiket}
          </Text>
        )}
      </View>
    </View>
  );
}
