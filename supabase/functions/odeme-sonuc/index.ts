// iyzico dönüşü: kullanıcı ödeme formundan bu adrese POST ile döner (token). Sonuç iyzico'dan SUNUCUDA sorgulanır;
// başarılı ve tutar tutuyorsa hak tanımlanır. Oturum belirteci gelmez: "verify_jwt = false" (supabase/config.toml).
import { db, IZINLI } from '../_ortak/ortak.ts';
import { iyzico } from '../_ortak/iyzico.ts';

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const donusHam = u.searchParams.get('donus') ?? '';
  const donus = IZINLI.some((k) => donusHam === k || donusHam.startsWith(k + '/'))
    ? donusHam
    : (IZINLI[0] ?? '/');
  const git = (d: string) =>
    new Response(null, {
      status: 303,
      headers: { Location: donus + (donus.includes('?') ? '&' : '?') + 'odeme=' + d },
    });

  const form = await req.formData().catch(() => null);
  const token = String(form?.get('token') ?? '');
  if (!token) return git('hata');
  const o = (
    await db(`odemeler?select=id,durum,tutar&saglayici_ref=eq.${encodeURIComponent(token)}&yontem=eq.kart`)
  )?.[0];
  if (!o) return git('hata');
  if (o.durum !== 'bekliyor') return git(o.durum === 'onaylandi' ? 'tamam' : 'hata');
  const r = await iyzico('/payment/iyzipos/checkoutform/auth/ecom/detail', {
    locale: 'tr',
    conversationId: String(o.id),
    token,
  });
  const tamam =
    r.status === 'success' &&
    r.paymentStatus === 'SUCCESS' &&
    Number(r.paidPrice) >= Number(o.tutar) &&
    String(r.conversationId) === String(o.id);
  if (!tamam) {
    await db('rpc/odeme_reddet', {
      method: 'POST',
      govde: { p_id: o.id, p_neden: String(r.errorMessage ?? 'Ödeme tamamlanmadı') },
    }).catch(() => {});
    return git('hata');
  }
  try {
    await db('rpc/odeme_onayla', {
      method: 'POST',
      govde: { p_id: o.id, p_saglayici_ref: String(r.paymentId ?? token) },
    });
  } catch {
    return git('hata');
  }
  return git('tamam');
});
