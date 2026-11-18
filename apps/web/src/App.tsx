import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { OturumGerekli } from './auth/OturumGerekli';
import { OnaySaglayici } from './components/OnayPenceresi';
import { Yerlesim } from './components/Yerlesim';
import { BulunamadiSayfasi } from './pages/BulunamadiSayfasi';
import { CizimSayfasi } from './pages/CizimSayfasi';
import { GirisSayfasi } from './pages/GirisSayfasi';
import { KayitSayfasi } from './pages/KayitSayfasi';
import { ProjeAkisiSayfasi } from './pages/ProjeAkisiSayfasi';
import { ProjelerimSayfasi } from './pages/ProjelerimSayfasi';
import { YoneticiSayfasi } from './pages/YoneticiSayfasi';

const sorguIstemcisi = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const yonlendirici = createBrowserRouter([
  {
    element: <Yerlesim />,
    children: [
      { path: '/giris', element: <GirisSayfasi /> },
      { path: '/kayit', element: <KayitSayfasi /> },
      {
        element: <OturumGerekli />,
        children: [
          { path: '/', element: <ProjelerimSayfasi /> },
          { path: '/proje/:projeId/:adim', element: <ProjeAkisiSayfasi /> },
          { path: '/yonetici', element: <YoneticiSayfasi /> },
          { path: '/cizim', element: <CizimSayfasi /> },
        ],
      },
      { path: '*', element: <BulunamadiSayfasi /> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={sorguIstemcisi}>
      <AuthProvider>
        <OnaySaglayici>
          <RouterProvider router={yonlendirici} />
        </OnaySaglayici>
      </AuthProvider>
    </QueryClientProvider>
  );
}
