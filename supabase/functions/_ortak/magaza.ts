// Mağaza doğrulaması: App Store Server API (iOS) ve Google Play Developer API (Android).
// Satın alma ve iade bilgisi HER ZAMAN mağazanın API'sinden (kendi kimlik bilgimizle, TLS üzerinden) okunur; istemcinin ya
// da bildirimin söylediğine güvenilmez.
// Ortam: APPLE_ISSUER_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (.p8 içeriği), APPLE_BUNDLE_ID, GOOGLE_PACKAGE_NAME,
// GOOGLE_SERVICE_ACCOUNT (hizmet hesabı JSON'u). Yalnız test: SAHTE_MAGAZA=1 ve *_URL değişkenleri sahte servisi gösterir;
// sahte kipte anahtar yoksa çalışma anında geçici anahtar üretilir.
const SAHTE = Deno.env.get('SAHTE_MAGAZA') === '1';
const APPLE_URL = Deno.env.get('APPLE_API_URL') ?? 'https://api.storekit.itunes.apple.com';
const APPLE_SANDBOX_URL =
  Deno.env.get('APPLE_API_SANDBOX_URL') ?? 'https://api.storekit-sandbox.itunes.apple.com';
const GOOGLE_URL = Deno.env.get('GOOGLE_API_URL') ?? 'https://androidpublisher.googleapis.com';
const GOOGLE_TOKEN_URL = Deno.env.get('GOOGLE_TOKEN_URL') ?? 'https://oauth2.googleapis.com/token';
export const APPLE_BUNDLE_ID = Deno.env.get('APPLE_BUNDLE_ID') ?? '';
export const GOOGLE_PACKAGE_NAME = Deno.env.get('GOOGLE_PACKAGE_NAME') ?? '';

export class MagazaHatasi extends Error {
  constructor(
    mesaj: string,
    public durum = 400,
  ) {
    super(mesaj);
  }
}

/* ---------- JWT ---------- */
const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bayt = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = '';
  bayt.forEach((x) => (s += String.fromCharCode(x)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const pemBayt = (pem: string) =>
  Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));

/** JWS gövdesini imza denetlemeden çözer (yalnız mağaza API'sinin kendi yanıtı ya da kimlik çıkarmak için). */
export function jwsGovde<T>(jws: string): T {
  const p = jws.split('.')[1];
  if (!p) throw new MagazaHatasi('Mağaza yanıtı okunamadı.', 502);
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(p.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
    ),
  );
}

async function imzala(
  baslik: object,
  govde: object,
  anahtar: CryptoKey,
  alg: AlgorithmIdentifier | EcdsaParams,
) {
  const girdi = `${b64url(JSON.stringify(baslik))}.${b64url(JSON.stringify(govde))}`;
  const imza = await crypto.subtle.sign(alg, anahtar, new TextEncoder().encode(girdi));
  return `${girdi}.${b64url(imza)}`;
}

let appleAnahtar: CryptoKey | null = null;
async function appleJwt(): Promise<string> {
  const pem = Deno.env.get('APPLE_PRIVATE_KEY') ?? '';
  if (!appleAnahtar) {
    if (pem) {
      appleAnahtar = await crypto.subtle.importKey(
        'pkcs8',
        pemBayt(pem),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign'],
      );
    } else if (SAHTE) {
      appleAnahtar = (
        await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
      ).privateKey;
    } else throw new MagazaHatasi('App Store bağlantısı yapılandırılmadı.', 503);
  }
  const simdi = Math.floor(Date.now() / 1000);
  return imzala(
    { alg: 'ES256', kid: Deno.env.get('APPLE_KEY_ID') ?? 'SAHTE', typ: 'JWT' },
    {
      iss: Deno.env.get('APPLE_ISSUER_ID') ?? 'SAHTE',
      iat: simdi,
      exp: simdi + 1800,
      aud: 'appstoreconnect-v1',
      bid: APPLE_BUNDLE_ID,
    },
    appleAnahtar,
    { name: 'ECDSA', hash: 'SHA-256' },
  );
}

let googleJeton: { deger: string; bitis: number } | null = null;
async function googleErisim(): Promise<string> {
  if (googleJeton && googleJeton.bitis > Date.now() + 60_000) return googleJeton.deger;
  const ham = Deno.env.get('GOOGLE_SERVICE_ACCOUNT') ?? '';
  let anahtar: CryptoKey;
  let eposta = 'sahte@sahte.iam.gserviceaccount.com';
  if (ham) {
    const h = JSON.parse(ham) as { client_email: string; private_key: string };
    eposta = h.client_email;
    anahtar = await crypto.subtle.importKey(
      'pkcs8',
      pemBayt(h.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  } else if (SAHTE) {
    anahtar = (
      await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        false,
        ['sign'],
      )
    ).privateKey;
  } else throw new MagazaHatasi('Google Play bağlantısı yapılandırılmadı.', 503);
  const simdi = Math.floor(Date.now() / 1000);
  const jwt = await imzala(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: eposta,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: simdi,
      exp: simdi + 3600,
    },
    anahtar,
    { name: 'RSASSA-PKCS1-v1_5' },
  );
  const r = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  if (!r.ok) throw new MagazaHatasi('Google Play bağlantısı kurulamadı.', 502);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  googleJeton = { deger: j.access_token, bitis: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

/* ---------- iOS ---------- */
export interface AppleIslem {
  transactionId: string;
  productId: string;
  bundleId: string;
  type?: string;
  environment?: string;
  revocationDate?: number;
  revocationReason?: number;
}

/** İşlemi App Store'dan okur (önce canlı, bulunamazsa sandbox). */
export async function appleIslem(islemId: string): Promise<AppleIslem> {
  if (!/^\d{1,30}$/.test(islemId)) throw new MagazaHatasi('Geçersiz App Store işlemi.');
  const jwt = await appleJwt();
  for (const taban of [APPLE_URL, APPLE_SANDBOX_URL]) {
    const r = await fetch(`${taban}/inApps/v1/transactions/${islemId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (r.status === 404) continue;
    if (!r.ok) throw new MagazaHatasi('App Store doğrulaması yapılamadı.', 502);
    const { signedTransactionInfo } = (await r.json()) as { signedTransactionInfo: string };
    const t = jwsGovde<AppleIslem>(signedTransactionInfo);
    if (t.bundleId !== APPLE_BUNDLE_ID) throw new MagazaHatasi('Satın alma bu uygulamaya ait değil.', 403);
    return t;
  }
  throw new MagazaHatasi('App Store işlemi bulunamadı.', 404);
}

/* ---------- Android ---------- */
export interface GoogleSatin {
  purchaseState: number;
  consumptionState: number;
  orderId?: string;
  productId?: string;
}

export async function googleSatin(urun: string, jeton: string): Promise<GoogleSatin> {
  if (!/^[A-Za-z0-9._:-]{10,500}$/.test(jeton)) throw new MagazaHatasi('Geçersiz Google Play işlemi.');
  const r = await fetch(
    `${GOOGLE_URL}/androidpublisher/v3/applications/${encodeURIComponent(GOOGLE_PACKAGE_NAME)}/purchases/products/${encodeURIComponent(urun)}/tokens/${encodeURIComponent(jeton)}`,
    { headers: { Authorization: `Bearer ${await googleErisim()}` } },
  );
  if (r.status === 404 || r.status === 400) throw new MagazaHatasi('Google Play işlemi bulunamadı.', 404);
  if (!r.ok) throw new MagazaHatasi('Google Play doğrulaması yapılamadı.', 502);
  return (await r.json()) as GoogleSatin;
}

/** Son 30 günde iptal/iade edilmiş satın almalar arasında jeton var mı? */
export async function googleIptalMi(jeton: string): Promise<boolean> {
  const bas = Date.now() - 30 * 86_400_000;
  const r = await fetch(
    `${GOOGLE_URL}/androidpublisher/v3/applications/${encodeURIComponent(GOOGLE_PACKAGE_NAME)}/purchases/voidedpurchases?startTime=${bas}`,
    { headers: { Authorization: `Bearer ${await googleErisim()}` } },
  );
  if (!r.ok) throw new MagazaHatasi('Google Play iade listesi okunamadı.', 502);
  const j = (await r.json()) as { voidedPurchases?: { purchaseToken: string }[] };
  return (j.voidedPurchases ?? []).some((v) => v.purchaseToken === jeton);
}
