import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useYoneticiMi } from '../lib/yonetici';
import { Logo } from './Logo';

export function Yerlesim() {
  const { oturum, cikisYap } = useAuth();
  const yonetici = useYoneticiMi();
  return (
    <>
      <a className="atla" href="#icerik">
        İçeriğe geç
      </a>
      <header className="ust-serit">
        <Link to="/" className="marka-baglanti" aria-label="REPİO(M) ana sayfa">
          <Logo />
          <span className="marka">
            REPİO<span>(M)</span>
          </span>
        </Link>
        <span className="alt-baslik">Akıllı İnşaat Maliyeti Hesaplayıcısı</span>
        {oturum && (
          <nav className="ust-menu" aria-label="Ana menü">
            <NavLink to="/" end>
              Projelerim
            </NavLink>
            {yonetici.data && <NavLink to="/yonetici">Yönetici</NavLink>}
            <span className="kullanici" title={oturum.user.email ?? ''}>
              {oturum.user.email}
            </span>
            <button type="button" className="ikincil koyu" onClick={() => void cikisYap()}>
              Çıkış yap
            </button>
          </nav>
        )}
      </header>
      <main id="icerik" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
