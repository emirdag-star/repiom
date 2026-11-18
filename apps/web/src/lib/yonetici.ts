import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from './supabase';

/** Yönetici yetkisi sunucuda (yonetici_mi fonksiyonu) belirlenir; istemci yalnız gösterim için sorar. */
export function useYoneticiMi() {
  const { oturum } = useAuth();
  return useQuery({
    queryKey: ['yonetici_mi', oturum?.user.id],
    enabled: Boolean(oturum && supabase),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('yonetici_mi');
      if (error) throw error;
      return data === true;
    },
  });
}
