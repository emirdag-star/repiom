/**
 * @repiom/core — hesap motoru, veri modeli ve (Faz 5'te) DXF analizi.
 * Saf TypeScript: tarayıcıya ya da sunucuya bağımlı değildir; web, mobil ve sunucu aynı paketi kullanır.
 */
export const APP_NAME = 'REPİO(M)';
export const REPORT_TITLE = 'REPİO Akıllı İnşaat Maliyeti Hesaplayıcısı';

export * from './engine/model';
export {
  calculate,
  coefficients,
  itemCode,
  provinceCoefficient,
  ITEM_ALL_RISK,
  ITEM_UNFORESEEN,
  TYPE_ROWS,
  TYPE_ROWS_SKIP,
  type BlockResult,
  type BlockType,
  type CalculationResult,
  type HeaderRow,
  type ItemRow,
  type ResultRow,
  type Totals,
  type Vars,
} from './engine/calculate';
export {
  completeProject,
  completeType,
  floorArea,
  FLOOR_KINDS,
  EMPTY_PROJECT_ERROR,
  type ApartmentType,
  type FloorRow,
} from './engine/complete';
export {
  emptyBlock,
  emptyFloor,
  emptyProject,
  emptySystem,
  emptyType,
  exampleProject,
  siteBlockTemplate,
} from './engine/templates';
export { BLOCK_LAST_INDEX, COEFFICIENTS, INPUTS, ITEMS, PROVINCES, type ItemDef } from './generated/formulas';
export {
  diffPrices,
  effectivePrice,
  extractNewPrices,
  MAX_UNIT_PRICE,
  mergePrices,
  parseLocaleNumber,
  PRICE_TABLE_ERROR,
  priceItemByCode,
  priceItems,
  type PriceDiff,
  type PriceItem,
  type PriceItemHeader,
  type PriceList,
  type SheetRows,
} from './prices';
export * as dxf from './dxf';
