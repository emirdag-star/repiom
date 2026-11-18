// iyzico istemcisi (IYZWSv2 imzası). Sandbox: https://sandbox-api.iyzipay.com — canlı: https://api.iyzipay.com
// Gerçek üye işyeri anahtarlarıyla sandbox'ta denenmeden canlıya alınmamalı.
const TABAN = Deno.env.get('IYZICO_URL') ?? 'https://sandbox-api.iyzipay.com';
const API = Deno.env.get('IYZICO_API_KEY') ?? '';
const GIZLI = Deno.env.get('IYZICO_SECRET_KEY') ?? '';
export const iyzicoHazir = () => Boolean(API && GIZLI);

async function hmacHex(anahtar: string, veri: string) {
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(anahtar),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(veri))))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** iyzico API çağrısı (POST, JSON). */
export async function iyzico(yol: string, govde: unknown): Promise<Record<string, unknown>> {
  const metin = JSON.stringify(govde);
  const rnd = crypto.randomUUID().replace(/-/g, '');
  const imza = await hmacHex(GIZLI, rnd + yol + metin);
  const yetki = btoa(`apiKey:${API}&randomKey:${rnd}&signature:${imza}`);
  const r = await fetch(TABAN + yol, {
    method: 'POST',
    headers: { Authorization: 'IYZWSv2 ' + yetki, 'x-iyzi-rnd': rnd, 'Content-Type': 'application/json' },
    body: metin,
  });
  return (await r
    .json()
    .catch(() => ({ status: 'failure', errorMessage: 'iyzico yanıtı okunamadı' }))) as Record<
    string,
    unknown
  >;
}
