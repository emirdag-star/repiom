// Uçtan uca test için web derlemesi: sunucu adresi 127.0.0.1 (telefon için yazılan yerel ağ adresi yerine).
import { execSync } from 'node:child_process';

execSync('pnpm exec expo export --platform web --output-dir dist', {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:55321', EXPO_PUBLIC_SAHTE_MAGAZA: '1' },
});
