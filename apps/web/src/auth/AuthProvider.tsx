import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthDurumu {
  /** Oturum bilgisi henüz okunmadıysa true. */
  yukleniyor: boolean;
  oturum: Session | null;
  cikisYap: () => Promise<void>;
}

const AuthContext = createContext<AuthDurumu | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [oturum, setOturum] = useState<Session | null>(null);
  const [yukleniyor, setYukleniyor] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let iptal = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!iptal) setOturum(data.session);
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_olay, yeni) => setOturum(yeni));
    return () => {
      iptal = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const deger = useMemo<AuthDurumu>(
    () => ({
      yukleniyor,
      oturum,
      cikisYap: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [yukleniyor, oturum],
  );

  return <AuthContext.Provider value={deger}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthDurumu {
  const d = useContext(AuthContext);
  if (!d) throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  return d;
}
