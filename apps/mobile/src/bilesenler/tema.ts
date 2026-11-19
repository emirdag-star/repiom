/** Web ile aynı renkler (prototip). Kontrast WCAG AA: düğme zemini vurgu-koyu + beyaz yazı 5,2:1. */
import { StyleSheet } from 'react-native';

export const R = {
  ana: '#1f2937',
  vurgu: '#f0692b',
  vurguKoyu: '#c2410c',
  zemin: '#f3f4f6',
  kart: '#ffffff',
  cizgi: '#d1d5db',
  soluk: '#4b5563',
  hata: '#b91c1c',
  hataZemin: '#fef2f2',
  uyariZemin: '#fef3c7',
  uyariYazi: '#92400e',
  basariZemin: '#ecfdf5',
  basariYazi: '#065f46',
  elle: '#fef9c3',
} as const;

export const S = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.zemin },
  icerik: { padding: 16, paddingBottom: 48, gap: 12 },
  kart: {
    backgroundColor: R.kart,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: R.cizgi,
    padding: 14,
    gap: 10,
  },
  altkart: { borderWidth: 1, borderColor: R.cizgi, borderRadius: 8, padding: 12, gap: 8 },
  baslik1: { fontSize: 22, fontWeight: '700', color: R.ana },
  baslik2: { fontSize: 18, fontWeight: '700', color: R.ana },
  baslik3: { fontSize: 16, fontWeight: '700', color: R.ana },
  metin: { fontSize: 15, color: R.ana, lineHeight: 21 },
  not: { fontSize: 13, color: R.soluk, lineHeight: 18 },
  satir: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  arasi: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  uyari: {
    backgroundColor: R.uyariZemin,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  uyariYazi: { color: R.uyariYazi, fontSize: 14 },
  basari: {
    backgroundColor: R.basariZemin,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  basariYazi: { color: R.basariYazi, fontSize: 14 },
});
