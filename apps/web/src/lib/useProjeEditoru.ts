// Ortak proje düzenleyici (web ve mobil); erişim anahtarı web oturumundan verilir.
import { useProjeEditoru as ortakEditor } from '@repiom/istemci/useProjeEditoru';
import { useAuth } from '../auth/useAuth';

export type { KayitDurumu, ProjeEditoru } from '@repiom/istemci/useProjeEditoru';

export function useProjeEditoru(id: string) {
  const { oturum } = useAuth();
  return ortakEditor(id, oturum?.access_token);
}
