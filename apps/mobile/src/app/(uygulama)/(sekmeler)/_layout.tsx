/** Alt sekmeler: Projelerim, Paketler, Hesap. */
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { R } from '../../../bilesenler/tema';

const Simge = ({ c, renk }: { c: string; renk: string }) => (
  <Text style={{ color: renk, fontSize: 18 }}>{c}</Text>
);

export default function Sekmeler() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: R.vurguKoyu,
        tabBarInactiveTintColor: R.soluk,
        headerTintColor: R.ana,
        sceneStyle: { backgroundColor: R.zemin },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Projelerim', tabBarIcon: ({ color }) => <Simge c="▦" renk={String(color)} /> }}
      />
      <Tabs.Screen
        name="paketler"
        options={{ title: 'Paketler', tabBarIcon: ({ color }) => <Simge c="◈" renk={String(color)} /> }}
      />
      <Tabs.Screen
        name="hesap"
        options={{ title: 'Hesap', tabBarIcon: ({ color }) => <Simge c="●" renk={String(color)} /> }}
      />
    </Tabs>
  );
}
