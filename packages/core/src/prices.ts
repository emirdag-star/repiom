/**
 * Fiyat listesi mantığı (yönetici): güncellenebilir kalemler, yüklenen tablodan yeni fiyatları ayıklama,
 * mevcut listeyle fark çıkarma. Prototip kaynak/fiyat.js ile aynı kurallar. Excel okuma/yazma @repiom/report'ta.
 *
 * Fiyat listesi: {"K001": 320, …} — K + 3 haneli kalem sırası; TL, KDV hariç, İstanbul bazı (il katsayısı ayrıca uygulanır).
 */
import { ITEM_ALL_RISK, ITEM_UNFORESEEN, itemCode, TYPE_ROWS, TYPE_ROWS_SKIP } from './engine/calculate';
import { ITEMS } from './generated/formulas';

export type PriceList = Record<string, number>;

export interface PriceItemHeader {
  baslik: true;
  sira: string;
  ad: string;
}
export interface PriceItem {
  baslik?: undefined;
  kod: string;
  sira: string;
  ad: string;
  birim: string;
  /** Uygulamada sabit fiyatlı mı (değilse fiyat proje büyüklüğüne göre formülle hesaplanır). */
  sabit: boolean;
  /** Uygulamanın varsayılan fiyatı (formüllü kalemlerde null). */
  varsayilan: number | null;
  /** Formüllü kalemlerde açıklama. */
  formul: string;
}

/** All risk ve öngörülemeyen: toplamın yüzdesi; fiyat listesinde yer almaz. */
const RATE_ITEMS: Record<number, 1> = { [ITEM_ALL_RISK]: 1, [ITEM_UNFORESEEN]: 1 };

let cache: (PriceItem | PriceItemHeader)[] | null = null;

/** Fiyat listesinde yer alabilen kalemler, ana başlıklarıyla. */
export function priceItems(): (PriceItem | PriceItemHeader)[] {
  if (cache) return cache;
  const out: (PriceItem | PriceItemHeader)[] = [];
  let grup = 0;
  let n = 0;
  for (const k of ITEMS) {
    if (k.baslik) {
      grup = k.grup;
      n = 0;
      out.push({ baslik: true, sira: String(grup), ad: k.ad });
      continue;
    }
    if (TYPE_ROWS_SKIP[k.i] || RATE_ITEMS[k.i]) continue;
    n++;
    // Tipe bağlı satırlar oda/m² formülüyle fiyatlanır.
    const sabit = /^-?[\d.]+$/.test(k.piyasaKaynak) && !TYPE_ROWS[k.i];
    out.push({
      kod: itemCode(k.i),
      sira: `${grup}.${n}`,
      ad: k.ad,
      birim: k.birim,
      sabit,
      varsayilan: sabit ? +k.piyasaKaynak : null,
      formul: sabit ? '' : k.fiyatAciklama || TYPE_ROWS[k.i]?.aciklama || 'Proje büyüklüğüne göre hesaplanır',
    });
  }
  cache = out;
  return out;
}

export function priceItemByCode(): Record<string, PriceItem> {
  const m: Record<string, PriceItem> = {};
  for (const k of priceItems()) if (!k.baslik) m[k.kod] = k;
  return m;
}

/** Kalemin geçerli fiyatı: listede varsa o, yoksa uygulamanın varsayılanı (formüllü kalemlerde null). */
export function effectivePrice(k: PriceItem, list: PriceList | null | undefined): number | null {
  const f = list?.[k.kod];
  return typeof f === 'number' ? f : k.varsayilan;
}

/** Türkçe ya da İngilizce yazılmış sayıyı çevirir: 1.250,50 / 1250.5 / "1250" / "1.250 TL". */
export function parseLocaleNumber(x: unknown): number | null {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  if (x === null || x === undefined) return null;
  let s = String(x).replace(/\s|TL|₺/gi, '');
  if (!s) return null;
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  else if (
    /,\d{1,2}$/.test(s) ||
    (s.includes(',') && s.includes('.') && s.lastIndexOf(',') > s.lastIndexOf('.'))
  ) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else s = s.replace(/,/g, '');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = +s;
  return Number.isFinite(n) ? n : null;
}

/** En yüksek kabul edilen birim fiyat (yazım hatalarını yakalamak için; veritabanında da aynı sınır var). */
export const MAX_UNIT_PRICE = 1e10;

export type SheetRows = Record<string, unknown[][]>;

export const PRICE_TABLE_ERROR =
  'Dosyada "Kod" ve "YENİ Birim Fiyat" sütunları bulunamadı. Yönetici sayfasından indirdiğin güncelleme tablosunu kullan.';

/** Güncelleme tablosundan yeni fiyatları ayıklar. Eski tablolardaki "YENİ Piyasa Birim Fiyat" başlığını da tanır. */
export function extractNewPrices(sheets: SheetRows): { fiyatlar: PriceList; hatalar: string[] } {
  let found: { rows: unknown[][]; start: number; kod: number; yeni: number } | null = null;
  for (const name of Object.keys(sheets)) {
    const rows = sheets[name] ?? [];
    for (let r = 0; r < Math.min(rows.length, 15) && !found; r++) {
      const row = rows[r] ?? [];
      let kod = -1;
      let yeni = -1;
      row.forEach((h, j) => {
        const t = String(h ?? '')
          .toLocaleUpperCase('tr')
          .replace(/\s+/g, ' ')
          .trim();
        if (t === 'KOD') kod = j;
        if (/^YENİ( PİYASA)? BİRİM FİYAT/.test(t)) yeni = j;
      });
      if (kod >= 0 && yeni >= 0) found = { rows, start: r, kod, yeni };
    }
    if (found) break;
  }
  if (!found) throw new Error(PRICE_TABLE_ERROR);
  const valid = priceItemByCode();
  const fiyatlar: PriceList = {};
  const hatalar: string[] = [];
  for (let r = found.start + 1; r < found.rows.length; r++) {
    const row = found.rows[r] ?? [];
    const kod = String(row[found.kod] ?? '')
      .trim()
      .toUpperCase();
    const raw = row[found.yeni];
    if (!kod || raw === null || raw === undefined || raw === '') continue;
    if (!valid[kod]) {
      hatalar.push(`${kod}: bilinmeyen kod`);
      continue;
    }
    const n = parseLocaleNumber(raw);
    if (n === null || n < 0 || n > MAX_UNIT_PRICE) {
      hatalar.push(`${kod}: "${String(raw)}" geçerli bir fiyat değil`);
      continue;
    }
    fiyatlar[kod] = n;
  }
  return { fiyatlar, hatalar };
}

export interface PriceDiff {
  kod: string;
  sira: string;
  ad: string;
  birim: string;
  eski: number | null;
  yeni: number;
  /** Değişim oranı (eski yoksa null). */
  oran: number | null;
  /** Formüllü kalem ilk kez sabit fiyata geçiyor. */
  formulDegisir: boolean;
}

/** Mevcut listeyle karşılaştırma: yalnız değişen kalemler, tablo sırasıyla. */
export function diffPrices(yeni: PriceList, mevcut: PriceList | null | undefined): PriceDiff[] {
  const out: PriceDiff[] = [];
  for (const k of priceItems()) {
    if (k.baslik || yeni[k.kod] === undefined) continue;
    const eski = effectivePrice(k, mevcut);
    const y = yeni[k.kod]!;
    if (eski !== null && Math.abs(y - eski) <= 1e-9) continue;
    out.push({
      kod: k.kod,
      sira: k.sira,
      ad: k.ad,
      birim: k.birim,
      eski,
      yeni: y,
      oran: eski ? (y - eski) / eski : null,
      formulDegisir: !k.sabit && !(mevcut && typeof mevcut[k.kod] === 'number'),
    });
  }
  return out;
}

/** Yayınlanacak liste: mevcut liste + yeni fiyatlar. */
export function mergePrices(mevcut: PriceList | null | undefined, yeni: PriceList): PriceList {
  return { ...(mevcut ?? {}), ...yeni };
}
