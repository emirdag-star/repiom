/** Oturum açık bölüm: önce eksik onaylar (güncellenen metinler), sonra sekmeler ve proje ekranı. */
import { Stack } from 'expo-router';
import { YenidenOnay } from '../../ekranlar/Kimlik';
import { R } from '../../bilesenler/tema';

export const unstable_settings = { anchor: '(sekmeler)' };

export default function UygulamaDuzeni() {
  return (
    <YenidenOnay>
      <Stack screenOptions={{ headerTintColor: R.ana, contentStyle: { backgroundColor: R.zemin } }}>
        <Stack.Screen name="(sekmeler)" options={{ headerShown: false }} />
        <Stack.Screen name="proje/[id]" options={{ title: 'Proje', headerBackTitle: 'Projelerim' }} />
        <Stack.Screen name="cizim" options={{ title: 'Çizimden maliyet', headerBackTitle: 'Geri' }} />
      </Stack>
    </YenidenOnay>
  );
}
