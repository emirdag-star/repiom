// Sunucu fonksiyonlarının ortak yardımcıları (Supabase Edge Runtime / Deno). Ek paket gerekmez.
export const URL_ = Deno.env.get('SUPABASE_URL') ?? 'http://kong:8000';
export const SERVIS = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
export const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

/** İzin verilen uygulama adresleri (dönüş yönlendirmesi ve CORS). Virgülle ayrılmış. */
export const IZINLI = (Deno.env.get('IZINLI_KAYNAKLAR') ?? 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function cors(req: Request): Record<string, string> {
  const o = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': IZINLI.includes(o) ? o : (IZINLI[0] ?? ''),
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}
export const yanit = (req: Request, kod: number, govde: unknown) =>
  new Response(JSON.stringify(govde), {
    status: kod,
    headers: { ...cors(req), 'Content-Type': 'application/json' },
  });
export const hata = (req: Request, kod: number, mesaj: string) => yanit(req, kod, { message: mesaj });

/** İstekteki kullanıcı belirteci (Bearer). */
export const belirtec = (req: Request) => (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

/** Belirteçten kullanıcıyı doğrular. */
export async function kullanici(req: Request): Promise<{ id: string; email: string } | null> {
  const t = belirtec(req);
  if (!t || t === ANON) return null;
  const r = await fetch(URL_ + '/auth/v1/user', { headers: { apikey: ANON, authorization: 'Bearer ' + t } });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.id ? { id: u.id, email: u.email } : null;
}

/** PostgREST çağrısı: anahtar verilmezse hizmet rolüyle (RLS dışı; yalnız sunucuda). */
export async function db(
  yol: string,
  sec: { method?: string; govde?: unknown; prefer?: string; jwt?: string } = {},
) {
  const jwt = sec.jwt ?? SERVIS;
  const r = await fetch(URL_ + '/rest/v1/' + yol, {
    method: sec.method ?? 'GET',
    headers: {
      apikey: sec.jwt ? ANON : SERVIS,
      authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json',
      ...(sec.prefer ? { Prefer: sec.prefer } : {}),
    },
    body: sec.govde === undefined ? undefined : JSON.stringify(sec.govde),
  });
  const m = await r.text();
  if (!r.ok) {
    let mesaj = m;
    try {
      mesaj = JSON.parse(m).message ?? m;
    } catch {
      /* düz metin */
    }
    throw Object.assign(new Error(mesaj), { durum: r.status });
  }
  return m ? JSON.parse(m) : null;
}
