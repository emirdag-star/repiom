import type { FormulaApartmentType, FormulaVars } from '../generated/formulas';

/** Q(i): i numaralı kalemin metrajı (aynı blok içinde, önbellekli). */
export type QFn = (i: number) => number;
/** SP(f): bloktaki daire tiplerinde f'nin toplamı (Excel TOPLAMÇARPIM). */
export type SPFn = (f: (t: FormulaApartmentType) => number) => number;

export type FormulaFn = (v: FormulaVars, Q: QFn, SP: SPFn) => number;
export type InputFormulaFn = (v: FormulaVars, SP: SPFn) => number;
