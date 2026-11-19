/** Kök düzen: sorgu önbelleği, oturum ve korumalı yollar (oturum yoksa giriş/kayıt). */
import '../lib/supabase';
import { olaySay } from '@repiom/istemci/olcum';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Yukleniyor } from '../bilesenler/temel';
import { R } from '../bilesenler/tema';
import { OturumSaglayici, useOturum } from '../lib/oturum';

function Yollar() {
  const { yukleniyor, oturum } = useOturum();
  if (yukleniyor) return <Yukleniyor />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: R.zemin } }}>
      <Stack.Protected guard={!oturum}>
        <Stack.Screen name="giris" />
        <Stack.Screen name="kayit" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(oturum)}>
        <Stack.Screen name="(uygulama)" />
      </Stack.Protected>
    </Stack>
  );
}

olaySay('uygulama_acilis');

export default function KokDuzen() {
  const [istemci] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );
  return (
    <QueryClientProvider client={istemci}>
      <OturumSaglayici>
        <StatusBar style="dark" />
        <Yollar />
      </OturumSaglayici>
    </QueryClientProvider>
  );
}
