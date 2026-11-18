// SAHTE Claude API — YALNIZ TEST VE YEREL GELİŞTİRME İÇİN. SAHTE_CLAUDE=1 değilse kapalı; üretime yayınlanmaz.
// POST …/v1/messages: başlıkları ve isteği denetler, yapılandırılmış JSON yanıtı ve token kullanımı döner.
// GET …/son-istek: son isteğin görselsiz kopyası (uçtan uca testte gizlilik denetimi için).
// "verify_jwt = false" (supabase/config.toml).
const ACIK = Deno.env.get('SAHTE_CLAUDE') === '1';
let sonIstek: unknown = null;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (!ACIK) return new Response('Kapalı', { status: 404 });
  const yol = new URL(req.url).pathname;
  if (req.method === 'GET' && yol.endsWith('/son-istek')) return json(sonIstek);
  if (req.method !== 'POST' || !yol.endsWith('/v1/messages'))
    return json({ type: 'error', error: { type: 'not_found_error' } }, 404);
  // Anahtar x-api-key ya da Authorization ile gelir (SDK/ağ geçidine göre).
  if (
    !(req.headers.get('x-api-key') || req.headers.get('authorization')) ||
    !req.headers.get('anthropic-version')
  ) {
    return json({ type: 'error', error: { type: 'authentication_error', message: 'eksik başlık' } }, 401);
  }
  const g = await req.json();
  const icerik = (g.messages?.[0]?.content ?? []) as { type: string; text?: string }[];
  const gorsel = icerik.filter((b) => b.type === 'image').length;
  const metin = icerik
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  sonIstek = {
    model: g.model,
    betas: req.headers.get('anthropic-beta'),
    fallbacks: g.fallbacks,
    output_config: g.output_config,
    gorsel,
    metin,
    system: g.system,
  };
  const yeni = JSON.parse(
    metin.slice(metin.indexOf('yeni_kalemler (JSON):') + 'yeni_kalemler (JSON):'.length).trim() || '[]',
  ) as { ad: string }[];
  const yanit = {
    // Sınır denetimi için 10 not (sunucu 8'e indirmeli) ve listede olmayan bir kalem fiyatı (sunucu atmalı).
    notlar: Array.from(
      { length: 10 },
      (_, i) => `Sahte kontrol notu ${i + 1}: ${gorsel} plan görseli incelendi.`,
    ),
    fiyatlar: [
      ...yeni.map((k) => ({ ad: k.ad, fiyat: 2345, gerekce: 'Sahte tahmin.' })),
      { ad: 'Listede olmayan kalem', fiyat: 999999, gerekce: 'Atılmalı.' },
    ],
  };
  return json({
    id: 'msg_sahte',
    type: 'message',
    role: 'assistant',
    model: g.model,
    content: [{ type: 'text', text: JSON.stringify(yanit) }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 1000 + gorsel * 500,
      output_tokens: 321,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
  });
});
