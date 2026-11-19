/** Oturum durumu (web'deki AuthProvider'ın mobil karşılığı). */
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

interface OturumDurumu {
  yukleniyor: boolean;
  oturum: Session | null;
  cikisYap: () => Promise<void>;
}

const Baglam = createContext<OturumDurumu | null>(null);

export function OturumSaglayici({ children }: { children: ReactNode }) {
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
    const { data } = supabase.auth.onAuthStateChange((_o, yeni) => setOturum(yeni));
    return () => {
      iptal = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const deger = useMemo<OturumDurumu>(
    () => ({
      yukleniyor,
      oturum,
      cikisYap: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [yukleniyor, oturum],
  );
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useOturum(): OturumDurumu {
  const d = useContext(Baglam);
  if (!d) throw new Error('useOturum, OturumSaglayici içinde kullanılmalı.');
  return d;
}
