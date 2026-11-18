// Hesap silme onayı (yalnız yönetici): ödeme kayıtlarını kişisel bilgilerden arındırır ve kullanıcıyı siler
// (projeler, onaylar, haklar ve analiz kayıtları kullanıcıyla birlikte silinir).
import { belirtec, cors, db, hata, kullanici, SERVIS, URL_, yanit } from '../_ortak/ortak.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return hata(req, 405, 'Yalnız POST.');
  const y = await kullanici(req);
  if (!y) return hata(req, 401, 'Oturum gerekli.');
  const yonetici = await db('rpc/yonetici_mi', { method: 'POST', jwt: belirtec(req), govde: {} }).catch(
    () => false,
  );
  if (yonetici !== true) return hata(req, 403, 'Bu işlem için yönetici yetkisi gerekir.');
  const g = await req.json().catch(() => ({}));
  let hedef: string;
  try {
    hedef = await db('rpc/hesap_anonimlestir', {
      method: 'POST',
      govde: { p_talep: Number(g.talep), p_karar_veren: y.id },
    });
  } catch (e) {
    return hata(req, 400, (e as Error).message);
  }
  const r = await fetch(`${URL_}/auth/v1/admin/users/${hedef}`, {
    method: 'DELETE',
    headers: { apikey: SERVIS, authorization: 'Bearer ' + SERVIS },
  });
  if (!r.ok) return hata(req, 502, 'Kullanıcı silinemedi; tekrar dene.');
  return yanit(req, 200, { silindi: true });
});
