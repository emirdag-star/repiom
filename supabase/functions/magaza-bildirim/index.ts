// Mağaza bildirimleri (iade): App Store Server Notifications V2 ve Google Play Gerçek Zamanlı Geliştirici Bildirimleri.
// Bildirimin içeriğine güvenilmez: yalnız işlem kimliği alınır, iade durumu mağaza API'sinden yeniden sorgulanır.
// Ek katman: adres ?anahtar=MAGAZA_BILDIRIM_ANAHTARI ile çağrılmalı. "verify_jwt = false" (supabase/config.toml).
import { db } from '../_ortak/ortak.ts';
import { appleIslem, googleIptalMi, jwsGovde } from '../_ortak/magaza.ts';

const ANAHTAR = Deno.env.get('MAGAZA_BILDIRIM_ANAHTARI') ?? '';
const tamam = () => new Response('ok');

async function iade(platform: 'ios' | 'android', islem: string, neden: string) {
  await db('rpc/magaza_iade', {
    method: 'POST',
    govde: { p_platform: platform, p_islem: islem, p_neden: neden },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Yalnız POST.', { status: 405 });
  if (!ANAHTAR || new URL(req.url).searchParams.get('anahtar') !== ANAHTAR)
    return new Response('Yetkisiz', { status: 401 });
  const g = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!g) return new Response('Geçersiz', { status: 400 });
  try {
    // Apple: { signedPayload }
    if (typeof g.signedPayload === 'string') {
      const p = jwsGovde<{ notificationType?: string; data?: { signedTransactionInfo?: string } }>(
        g.signedPayload,
      );
      if (!['REFUND', 'REVOKE'].includes(p.notificationType ?? '') || !p.data?.signedTransactionInfo)
        return tamam();
      const { transactionId } = jwsGovde<{ transactionId: string }>(p.data.signedTransactionInfo);
      const t = await appleIslem(String(transactionId)); // mağazadan yeniden oku
      if (t.revocationDate) await iade('ios', t.transactionId, 'App Store ' + (p.notificationType ?? ''));
      return tamam();
    }
    // Google: { message: { data: base64(JSON) } }
    const m = g.message as { data?: string } | undefined;
    if (m?.data) {
      const d = JSON.parse(atob(m.data)) as { voidedPurchaseNotification?: { purchaseToken?: string } };
      const jeton = d.voidedPurchaseNotification?.purchaseToken;
      if (jeton && (await googleIptalMi(jeton))) await iade('android', jeton, 'Google Play iadesi');
      return tamam();
    }
    return tamam();
  } catch (e) {
    // 5xx: mağaza bildirimi daha sonra yeniden gönderir.
    console.error('magaza-bildirim', (e as Error).message);
    return new Response('Geçici hata', { status: 503 });
  }
});
