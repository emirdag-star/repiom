/**
 * Hata kaydı (Sentry, AB bölgesi). VITE_SENTRY_DSN verilmezse kapalıdır (yerel geliştirme ve testler).
 * Kişisel veri gönderilmez: ortak süzgeç (packages/istemci/hataKaydi) her olayı ve kırıntıyı arındırır;
 * oturum kaydı (replay), performans izleme ve varsayılan kişisel veri (IP, çerez) kapalı.
 */
import { kiritiyiAyikla, olayiAyikla } from '@repiom/istemci/hataKaydi';
import * as Sentry from '@sentry/react';

export function hataKaydiniBaslat() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_ORTAM as string | undefined) ?? 'uretim',
    release: (import.meta.env.VITE_SURUM as string | undefined) ?? undefined,
    // Kullanıcı, çerez, başlık, gövde ve sorgu dizgisi toplanmaz (süzgeç ayrıca ikinci katman).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    tracesSampleRate: 0,
    integrations: (varsayilan) => varsayilan.filter((i) => !['Replay', 'BrowserTracing'].includes(i.name)),
    beforeSend: (olay) => olayiAyikla(olay),
    beforeBreadcrumb: (k) => (k.category === 'console' ? null : kiritiyiAyikla(k)),
  });
}
