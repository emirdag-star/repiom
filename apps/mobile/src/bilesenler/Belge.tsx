/** Sözleşme / aydınlatma metni: bağlantı ve tam ekran pencere (basit Markdown: #, ##, -, **). */
import { BELGELER, belgeMetni, type BelgeId } from '@repiom/core';
import { useState, type ReactNode } from 'react';
import { Modal, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Dugme } from './temel';
import { R, S } from './tema';

function satirIci(t: string): ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') ? (
      <Text key={i} style={{ fontWeight: '700' }}>
        {p.slice(2, -2)}
      </Text>
    ) : (
      p
    ),
  );
}

function Metin({ md }: { md: string }) {
  return (
    <View style={{ gap: 8 }}>
      {md.split('\n').map((s, i) => {
        const t = s.trim();
        if (!t) return null;
        const h = /^(#{1,3}) (.*)$/.exec(t);
        if (h)
          return (
            <Text key={i} accessibilityRole="header" style={h[1]!.length === 1 ? S.baslik2 : S.baslik3}>
              {h[2]}
            </Text>
          );
        if (t.startsWith('- '))
          return (
            <Text key={i} style={S.metin}>
              {'•  '}
              {satirIci(t.slice(2))}
            </Text>
          );
        return (
          <Text key={i} style={S.metin}>
            {satirIci(t)}
          </Text>
        );
      })}
    </View>
  );
}

export function BelgeBaglantisi({ id, metin }: { id: BelgeId; metin?: string }) {
  const [acik, setAcik] = useState(false);
  const b = BELGELER[id];
  return (
    <>
      <Dugme tur="baglanti" metin={metin ?? b.ad} bas={() => setAcik(true)} />
      <Modal visible={acik} animationType="slide" onRequestClose={() => setAcik(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: R.kart }}>
          <View style={[S.arasi, { padding: 16, borderBottomWidth: 1, borderBottomColor: R.cizgi }]}>
            <Text accessibilityRole="header" style={[S.baslik2, { flex: 1 }]}>
              {b.ad}
            </Text>
            <Dugme metin="Kapat" kucuk bas={() => setAcik(false)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            <Text style={S.not}>
              Sürüm {b.surum} · TASLAK — avukat incelemesinden geçmeden yayınlanmamalıdır.
            </Text>
            <Metin md={belgeMetni(id)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
