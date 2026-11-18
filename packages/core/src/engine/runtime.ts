/**
 * Üretilen formüllerin kullandığı yardımcılar. Prototipteki (kaynak/hesap.js) tanımlarla birebir aynıdır;
 * değiştirmek sonuçları değiştirir.
 */

/** Excel EĞER: iki dal da önceden hesaplanır (prototipte de öyle). */
export const IF = (c: unknown, a: number, b: number): number => (c ? a : b);

/** Excel YUVARLA. */
export const RND = (x: number, n?: number): number => {
  const p = Math.pow(10, n || 0);
  return Math.round(x * p) / p;
};

/** Excel YUKARIYUVARLA (kayan nokta payıyla). */
export const RUP = (x: number, n?: number): number => {
  const p = Math.pow(10, n || 0);
  return Math.ceil(x * p - 1e-9) / p;
};

/** Karşılaştırma sonucunu sayıya çevirir (JavaScript'te true × 5 = 5 olduğu gibi). */
export const B = (x: boolean): number => (x ? 1 : 0);
