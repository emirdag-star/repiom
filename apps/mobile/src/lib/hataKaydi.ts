/**
 * Mobil hata kaydı (Sentry, AB bölgesi). EXPO_PUBLIC_SENTRY_DSN verilmezse kapalıdır.
 * Kişisel veri gönderilmez: ortak süzgeç her olayı ve kırıntıyı arındırır; IP, ekran görüntüsü, oturum kaydı kapalı.
 */
import { kiritiyiAyikla, olayiAyikla } from '@repiom/istemci/hataKaydi';
import * as Sentry from '@sentry/react-native';

export const HATA_KAYDI_ACIK = Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN);

export function hataKaydiniBaslat() {
  if (!HATA_KAYDI_ACIK) return;
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ORTAM ?? 'uretim',
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    beforeSend: (olay) => olayiAyikla(olay),
    beforeBreadcrumb: (k) => (k.category === 'console' ? null : kiritiyiAyikla(k)),
  });
}

export { Sentry };
