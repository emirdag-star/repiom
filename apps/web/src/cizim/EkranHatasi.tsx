/** Kontrol ekranı çizilirken beklenmeyen hata olursa kullanıcıya Türkçe mesaj gösterir ve hakkı iade ettirir. */
import { Component, type ReactNode } from 'react';
import { Link } from 'react-router';

export class EkranHatasi extends Component<
  { children: ReactNode; hataOlunca: () => void },
  { hata: boolean }
> {
  override state = { hata: false };
  static getDerivedStateFromError() {
    return { hata: true };
  }
  override componentDidCatch() {
    this.props.hataOlunca();
  }
  override render() {
    if (!this.state.hata) return this.props.children;
    return (
      <section className="kart" role="alert">
        <h1>Kontrol ekranı açılamadı</h1>
        <p>
          Çizim okundu ama sonuçlar gösterilirken bir sorun oluştu. Analiz hakkın iade edildi; tekrar
          deneyebilirsin.
        </p>
        <Link className="dugme" to="/">
          Projelerime dön
        </Link>
      </section>
    );
  }
}
