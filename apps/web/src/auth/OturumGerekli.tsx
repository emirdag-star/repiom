import { Navigate, Outlet, useLocation } from 'react-router';
import { Yukleniyor } from '../components/Yukleniyor';
import { useAuth } from './AuthProvider';

/** Oturum yoksa giriş ekranına yönlendirir; girişten sonra kullanıcı geldiği sayfaya döner. */
export function OturumGerekli() {
  const { yukleniyor, oturum } = useAuth();
  const konum = useLocation();
  if (yukleniyor) return <Yukleniyor />;
  if (!oturum) return <Navigate to="/giris" replace state={{ donus: konum.pathname }} />;
  return <Outlet />;
}
