import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './styles/global.css';
import './styles/odeme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const kok = document.getElementById('root');
if (!kok) throw new Error('Uygulama kök öğesi bulunamadı.');
createRoot(kok).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
