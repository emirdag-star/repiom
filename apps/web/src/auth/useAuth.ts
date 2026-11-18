import { useContext } from 'react';
import { AuthContext, type AuthDurumu } from './authContext';

export function useAuth(): AuthDurumu {
  const d = useContext(AuthContext);
  if (!d) throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  return d;
}
