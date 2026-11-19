import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './styles/global.css';
import './styles/odeme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { App } from './App';
import { olaySay } from '@repiom/istemci/olcum';
import './lib/supabase';
import { hataKaydiniBaslat } from './lib/hataKaydi';

hataKaydiniBaslat();
olaySay('uygulama_acilis');

const kok = document.getElementById('root');
if (!kok) throw new Error('Uygulama kök öğesi bulunamadı.');
// React hataları da hata kaydına (Sentry kapalıysa etkisiz).
createRoot(kok, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
