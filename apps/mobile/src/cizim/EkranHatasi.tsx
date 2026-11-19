/** Kontrol ekranı çizilirken hata olursa: kullanıcıya Türkçe mesaj ve hak iadesi (web'deki EkranHatasi ile aynı). */
import { Component, type ReactNode } from 'react';
import { Text } from 'react-native';
import { Kart } from '../bilesenler/temel';
import { S } from '../bilesenler/tema';

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
    if (this.state.hata)
      return (
        <Kart baslik="Kontrol ekranı açılamadı">
          <Text style={S.metin}>
            Çizim okundu ama sonuçlar gösterilemedi. Analiz hakkın iade edildi; lütfen tekrar dene.
          </Text>
        </Kart>
      );
    return this.props.children;
  }
}
