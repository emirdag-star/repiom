/** Giriş ekranı: boş formda Türkçe doğrulama mesajları (sunucuya gidilmez). */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { GirisEkrani } from '../src/ekranlar/Kimlik';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('../src/lib/supabase', () => ({ supabase: null, supabaseAyarHatasi: null }));

test('boş girişte Türkçe hata mesajları görünür', async () => {
  await render(<GirisEkrani />);
  fireEvent.press(screen.getByRole('button', { name: 'Giriş yap' }));
  expect(await screen.findByText('E-posta adresini yaz.')).toBeTruthy();
});
