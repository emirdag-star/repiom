import type { Session } from '@supabase/supabase-js';
import { createContext } from 'react';

export interface AuthDurumu {
  /** Oturum bilgisi henüz okunmadıysa true. */
  yukleniyor: boolean;
  oturum: Session | null;
  cikisYap: () => Promise<void>;
}

export const AuthContext = createContext<AuthDurumu | null>(null);
