import { useLocalSearchParams } from 'expo-router';
import { ProjeAkisiEkrani } from '../../../ekranlar/ProjeAkisi';

export default function ProjeYolu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProjeAkisiEkrani key={id} id={String(id)} />;
}
