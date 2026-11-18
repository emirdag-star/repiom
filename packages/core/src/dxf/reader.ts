/**
 * DXF okuyucu: dosyayı parça parça (akış halinde) okur; yalnız ENTITIES bölümünü ve HEADER değişkenlerini tutar.
 * 100 MB'ı aşan dosyalar belleğe tümüyle alınmadan işlenir. Prototip kaynak/dxf.js "oku" ile aynı kurallar.
 */

/** Yazı (TEXT/MTEXT). */
export interface DxfText {
  m: string;
  x: number;
  y: number;
  h: number;
  /** Katman */
  k: string;
  tip: 'TEXT' | 'MTEXT';
}
/** Blok yerleşimi (INSERT). */
export interface DxfInsert {
  ad: string;
  x: number;
  y: number;
  k: string;
}
/** Çizgi: [katman, x1, y1, x2, y2] */
export type DxfLine = [string, number, number, number, number];
/** Hafif çoklu çizgi (LWPOLYLINE). */
export interface DxfPolyline {
  k: string;
  P: [number, number][];
}

export interface DxfData {
  T: DxfText[];
  I: DxfInsert[];
  L: DxfLine[];
  P: DxfPolyline[];
  header: Record<string, string>;
}

/** AutoCAD metin kodlarını temizler: \U+XXXX, biçim kodları, %%c (Ø), %%d (°), %%p (±). */
export function cleanText(s: string): string {
  s = s.replace(/\\U\+([0-9A-Fa-f]{4})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
  s = s
    .replace(/\\[ACFHQTWfpi][^;]*;/g, '')
    .split('\\P')
    .join(' ')
    .split('\\~')
    .join(' ')
    .replace(/[{}]/g, '');
  s = s
    .replace(/\\[LlOoKk]/g, '')
    .split('%%c')
    .join('Ø')
    .split('%%d')
    .join('°')
    .split('%%p')
    .join('±');
  return s.trim();
}

const U8 = new TextDecoder('utf-8', { fatal: true });
const W1254 = new TextDecoder('windows-1254');

/** Satırı çözer: ASCII hızlı yol; değilse UTF-8, olmazsa Türkçe Windows (1254). */
function decodeLine(b: Uint8Array, i: number, j: number): string {
  let ascii = true;
  for (let k = i; k < j; k++) {
    if (b[k]! > 127) {
      ascii = false;
      break;
    }
  }
  if (ascii) {
    let s = '';
    for (let k = i; k < j; k += 4096)
      s += String.fromCharCode.apply(null, b.subarray(k, Math.min(j, k + 4096)) as unknown as number[]);
    return s;
  }
  const p = b.subarray(i, j);
  try {
    return U8.decode(p);
  } catch {
    return W1254.decode(p);
  }
}

interface Pending {
  t: string;
  a: Record<number, string>;
  pts: [number, number][] | null;
  c3: string;
}

/**
 * chunks: Uint8Array parçaları veren (async) yineleyici. onProgress: okunan bayt sayısıyla çağrılır.
 */
export async function readDxf(
  chunks: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
  onProgress?: (bytesRead: number) => void,
): Promise<DxfData> {
  const T: DxfText[] = [];
  const I: DxfInsert[] = [];
  const L: DxfLine[] = [];
  const P: DxfPolyline[] = [];
  const header: Record<string, string> = {};
  let section: string | null = null;
  let awaitName = false;
  let hdrName: string | null = null;
  let v: Pending | null = null;
  let code: number | null = null;
  let valueTurn = false;
  let read = 0;
  let rest: Uint8Array | null = null;

  const close = () => {
    if (!v) return;
    const { t, a } = v;
    if (t === 'TEXT' || t === 'MTEXT') {
      T.push({
        m: cleanText((a[1] || '') + (v.c3 || '')),
        x: +a[10]! || 0,
        y: +a[20]! || 0,
        h: +a[40]! || 0,
        k: a[8] || '',
        tip: t,
      });
    } else if (t === 'INSERT') I.push({ ad: a[2] || '', x: +a[10]! || 0, y: +a[20]! || 0, k: a[8] || '' });
    else if (t === 'LINE') L.push([a[8] || '', +a[10]! || 0, +a[20]! || 0, +a[11]! || 0, +a[21]! || 0]);
    else if (t === 'LWPOLYLINE') P.push({ k: a[8] || '', P: v.pts! });
    v = null;
  };

  const pair = (k: number, s: string) => {
    if (k === 0) {
      if (section === 'ENTITIES') close();
      if (s === 'SECTION') {
        awaitName = true;
        section = null;
        return;
      }
      if (s === 'ENDSEC') {
        section = null;
        return;
      }
      if (section === 'ENTITIES') v = { t: s, a: {}, pts: s === 'LWPOLYLINE' ? [] : null, c3: '' };
      return;
    }
    if (awaitName && k === 2) {
      section = s;
      awaitName = false;
      return;
    }
    if (section === 'HEADER') {
      if (k === 9) hdrName = s;
      else if (hdrName && !(hdrName in header)) header[hdrName] = s;
      return;
    }
    if (!v) return;
    if (v.pts && k === 10) {
      v.pts.push([+s, 0]);
      if (!(10 in v.a)) v.a[10] = s;
      return;
    }
    if (v.pts && k === 20) {
      if (v.pts.length) v.pts[v.pts.length - 1]![1] = +s;
      if (!(20 in v.a)) v.a[20] = s;
      return;
    }
    if (k === 3 && v.t === 'MTEXT') {
      v.c3 += s;
      return;
    }
    if (!(k in v.a)) v.a[k] = s;
  };

  for await (let b of chunks as AsyncIterable<Uint8Array>) {
    if (rest) {
      const bb = new Uint8Array(rest.length + b.length);
      bb.set(rest);
      bb.set(b, rest.length);
      b = bb;
      rest = null;
    }
    let start = 0;
    for (let i = 0; i < b.length; i++) {
      if (b[i] !== 10) continue;
      let end = i;
      if (end > start && b[end - 1] === 13) end--;
      const s = decodeLine(b, start, end);
      start = i + 1;
      if (!valueTurn) {
        const st = s.trim();
        code = /^-?\d+$/.test(st) ? parseInt(st, 10) : null;
        valueTurn = true;
      } else {
        if (code !== null) pair(code, s);
        valueTurn = false;
      }
    }
    if (start < b.length) rest = b.slice(start);
    read += b.length;
    onProgress?.(read);
  }
  close();
  return { T, I, L, P, header };
}

/** Metin ya da bayt dizisinden okur (testler ve örnek çizim için). */
export function readDxfBytes(data: Uint8Array | string, chunkSize = 1 << 20): Promise<DxfData> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  function* parts() {
    for (let i = 0; i < bytes.length; i += chunkSize) yield bytes.subarray(i, i + chunkSize);
  }
  return readDxf(parts());
}
