import { Navigate, Outlet, useLocation } from 'react-router';
import { Yukleniyor } from '../components/Yukleniyor';
import { useAuth } from './useAuth';
import { YenidenOnay } from './YenidenOnay';

/**
 * Oturum yoksa giriş ekranına yönlendirir; girişten sonra kullanıcı geldiği sayfaya döner.
 * Eksik ya da sürümü değişmiş zorunlu belge onayı varsa önce onay istenir.
 */
export function OturumGerekli() {
  const { yukleniyor, oturum } = useAuth();
  const konum = useLocation();
  if (yukleniyor) return <Yukleniyor />;
  if (!oturum) return <Navigate to="/giris" replace state={{ donus: konum.pathname + konum.search }} />;
  return (
    <YenidenOnay>
      <Outlet />
    </YenidenOnay>
  );
}
