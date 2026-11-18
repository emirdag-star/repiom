/**
 * Formül üretici: prototipin `reference/veri.js` dosyasındaki metin formülleri TypeScript fonksiyonlarına çevirir.
 *
 *   pnpm gen:formulas          → src/generated/formulas.ts dosyasını yazar
 *   pnpm gen:formulas --check  → dosya güncel değilse hata verir (CI ve testlerde)
 *
 * Formüller elle kopyalanmaz. Her ifade TypeScript sözdizimi ağacıyla ayrıştırılır ve yalnız izin verilen
 * yapılar (sayı, metin, v.X, t.X, Q(n), SP(t => …), IF, RND, RUP, Math.max/min/sqrt/abs, + - * /, karşılaştırma)
 * kabul edilir; bilinmeyen bir yapı görülürse üretim durur.
 *
 * Anlam korunur: prototip ifadeleri `new Function` ile JavaScript olarak çalıştırır. JavaScript'te karşılaştırma
 * sonucu (true/false) çarpımda 1/0 sayılır; üretilen kod bunu açıkça B(...) ile yapar. `==` yalnız aynı tipteki
 * iki değer arasında kullanıldığından `===` ile aynı sonucu verir; tip uyuşmazsa üretim durur.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'reference', 'veri.js');
const TARGET = join(ROOT, 'src', 'generated', 'formulas.ts');

interface RawItem {
  i: number;
  baslik?: boolean;
  grup: number;
  ad: string;
  birim?: string;
  metraj?: string;
  aciklama?: string;
  piyasa?: string;
  fiyatAciklama?: string;
  opsiyonel?: boolean;
}
interface RawInput {
  ad: string;
  etiket: string;
  deger: number | string | null;
  formul: string | null;
  not_: string;
}
interface RawCoefficient {
  ad: string;
  etiket: string;
  deger: number;
  not_: string;
}
interface RawData {
  girdi: RawInput[];
  katsayi: RawCoefficient[];
  kalem: RawItem[];
  il: { ad: string; k: number }[];
  blokSon: number;
}

export function loadReference(): RawData {
  const sandbox: { REPIOM_VERI?: RawData } = {};
  runInNewContext(readFileSync(SOURCE, 'utf8'), sandbox, { filename: 'veri.js' });
  if (!sandbox.REPIOM_VERI) throw new Error('veri.js içinden REPIOM_VERI okunamadı.');
  return sandbox.REPIOM_VERI;
}

type Kind = 'number' | 'string';

class FormulaError extends Error {}

/** Bir metin formülü TypeScript ifadesine çevirir. */
class Translator {
  /** Metinle karşılaştırılan değişkenler (ör. v.CEPHE_TIP == "EPS") ve daire tipi alanları. */
  private readonly stringVars: Set<string>;
  private readonly stringTypeFields: Set<string>;

  constructor(stringVars: Set<string>, stringTypeFields: Set<string>) {
    this.stringVars = stringVars;
    this.stringTypeFields = stringTypeFields;
  }

  /** İlk geçiş: metinle karşılaştırılan v.X / t.X adlarını toplar. */
  static collectStringVars(expr: string, vars: Set<string>, fields: Set<string>): void {
    const visit = (node: ts.Node): void => {
      if (ts.isBinaryExpression(node) && isComparison(node.operatorToken.kind)) {
        const sides = [node.left, node.right].map(unwrap);
        if (sides.some((s) => ts.isStringLiteral(s))) {
          for (const s of sides) {
            if (ts.isPropertyAccessExpression(s) && ts.isIdentifier(s.expression)) {
              if (s.expression.text === 'v') vars.add(s.name.text);
              if (s.expression.text === 't') fields.add(s.name.text);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(parse(expr));
  }

  translate(expr: string): string {
    return this.emit(parse(expr), false).code;
  }

  private emit(node: ts.Node, inLambda: boolean): { code: string; kind: Kind } {
    if (ts.isParenthesizedExpression(node)) {
      const inner = this.emit(node.expression, inLambda);
      return { code: `(${inner.code})`, kind: inner.kind };
    }
    if (ts.isNumericLiteral(node)) return { code: node.text, kind: 'number' };
    if (ts.isStringLiteral(node)) return { code: JSON.stringify(node.text), kind: 'string' };
    if (ts.isPrefixUnaryExpression(node)) {
      if (node.operator !== ts.SyntaxKind.MinusToken && node.operator !== ts.SyntaxKind.PlusToken) {
        throw new FormulaError(`Desteklenmeyen tekli işleç: ${node.getText()}`);
      }
      const operand = this.expectNumber(node.operand, inLambda);
      return { code: `${node.operator === ts.SyntaxKind.MinusToken ? '-' : '+'}${operand}`, kind: 'number' };
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const owner = node.expression.text;
      const name = node.name.text;
      if (owner === 'v') return { code: `v.${name}`, kind: this.stringVars.has(name) ? 'string' : 'number' };
      if (owner === 't') {
        if (!inLambda) throw new FormulaError(`t.${name} yalnız SP(t => …) içinde kullanılabilir.`);
        return { code: `t.${name}`, kind: this.stringTypeFields.has(name) ? 'string' : 'number' };
      }
      throw new FormulaError(`Bilinmeyen nesne: ${node.getText()}`);
    }
    if (ts.isBinaryExpression(node)) return this.emitBinary(node, inLambda);
    if (ts.isCallExpression(node)) return this.emitCall(node, inLambda);
    throw new FormulaError(`Desteklenmeyen ifade: ${node.getText()} (${ts.SyntaxKind[node.kind]})`);
  }

  private emitBinary(node: ts.BinaryExpression, inLambda: boolean): { code: string; kind: Kind } {
    const op = node.operatorToken.kind;
    const arithmetic: Partial<Record<ts.SyntaxKind, string>> = {
      [ts.SyntaxKind.PlusToken]: '+',
      [ts.SyntaxKind.MinusToken]: '-',
      [ts.SyntaxKind.AsteriskToken]: '*',
      [ts.SyntaxKind.SlashToken]: '/',
    };
    const a = arithmetic[op];
    if (a) {
      return {
        code: `${this.expectNumber(node.left, inLambda)} ${a} ${this.expectNumber(node.right, inLambda)}`,
        kind: 'number',
      };
    }
    if (isComparison(op)) {
      const l = this.emit(node.left, inLambda);
      const r = this.emit(node.right, inLambda);
      if (l.kind !== r.kind) {
        throw new FormulaError(`Farklı tipler karşılaştırılıyor: ${node.getText()}`);
      }
      const map: Partial<Record<ts.SyntaxKind, string>> = {
        [ts.SyntaxKind.EqualsEqualsToken]: '===',
        [ts.SyntaxKind.EqualsEqualsEqualsToken]: '===',
        [ts.SyntaxKind.ExclamationEqualsToken]: '!==',
        [ts.SyntaxKind.ExclamationEqualsEqualsToken]: '!==',
        [ts.SyntaxKind.GreaterThanToken]: '>',
        [ts.SyntaxKind.GreaterThanEqualsToken]: '>=',
        [ts.SyntaxKind.LessThanToken]: '<',
        [ts.SyntaxKind.LessThanEqualsToken]: '<=',
      };
      if (l.kind === 'string' && !['===', '!=='].includes(map[op]!)) {
        throw new FormulaError(`Metinde büyüklük karşılaştırması desteklenmez: ${node.getText()}`);
      }
      return { code: `B(${l.code} ${map[op]} ${r.code})`, kind: 'number' };
    }
    throw new FormulaError(`Desteklenmeyen işleç: ${node.operatorToken.getText()} (${node.getText()})`);
  }

  private emitCall(node: ts.CallExpression, inLambda: boolean): { code: string; kind: Kind } {
    const callee = node.expression;
    const args = node.arguments;
    const nums = () => args.map((x) => this.expectNumber(x, inLambda)).join(', ');
    if (ts.isIdentifier(callee)) {
      switch (callee.text) {
        case 'Q': {
          const arg = args[0];
          if (args.length !== 1 || !arg || !ts.isNumericLiteral(arg)) {
            throw new FormulaError(`Q(...) tek bir kalem numarası almalı: ${node.getText()}`);
          }
          if (inLambda) throw new FormulaError(`SP içinde Q(...) kullanılamaz: ${node.getText()}`);
          return { code: `Q(${arg.text})`, kind: 'number' };
        }
        case 'SP': {
          const fn = args[0];
          if (args.length !== 1 || !fn || !ts.isArrowFunction(fn) || inLambda) {
            throw new FormulaError(`SP(t => …) biçimi bekleniyordu: ${node.getText()}`);
          }
          const param = fn.parameters[0];
          if (
            fn.parameters.length !== 1 ||
            !param ||
            param.name.getText() !== 't' ||
            !ts.isExpression(fn.body)
          ) {
            throw new FormulaError(`SP içindeki fonksiyon t => ifade biçiminde olmalı: ${node.getText()}`);
          }
          const body = this.emit(fn.body, true);
          return { code: `SP((t) => ${body.code})`, kind: 'number' };
        }
        case 'IF': {
          if (args.length !== 3) throw new FormulaError(`IF üç değer almalı: ${node.getText()}`);
          const [c, x, y] = args.map((z) => this.emit(z, inLambda));
          if (x!.kind !== 'number' || y!.kind !== 'number') {
            throw new FormulaError(`IF sonucu sayı olmalı: ${node.getText()}`);
          }
          return { code: `IF(${c!.code}, ${x!.code}, ${y!.code})`, kind: 'number' };
        }
        case 'RND':
        case 'RUP':
          if (args.length < 1 || args.length > 2) throw new FormulaError(`${callee.text} 1–2 değer almalı.`);
          return { code: `${callee.text}(${nums()})`, kind: 'number' };
      }
    }
    if (
      ts.isPropertyAccessExpression(callee) &&
      ts.isIdentifier(callee.expression) &&
      callee.expression.text === 'Math' &&
      ['max', 'min', 'sqrt', 'abs'].includes(callee.name.text)
    ) {
      return { code: `Math.${callee.name.text}(${nums()})`, kind: 'number' };
    }
    throw new FormulaError(`Desteklenmeyen fonksiyon: ${node.getText()}`);
  }

  private expectNumber(node: ts.Node, inLambda: boolean): string {
    const r = this.emit(node, inLambda);
    if (r.kind !== 'number') throw new FormulaError(`Sayı beklenirken metin kullanılmış: ${node.getText()}`);
    return r.code;
  }
}

function isComparison(kind: ts.SyntaxKind): boolean {
  return (
    kind === ts.SyntaxKind.EqualsEqualsToken ||
    kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
    kind === ts.SyntaxKind.ExclamationEqualsToken ||
    kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
    kind === ts.SyntaxKind.GreaterThanToken ||
    kind === ts.SyntaxKind.GreaterThanEqualsToken ||
    kind === ts.SyntaxKind.LessThanToken ||
    kind === ts.SyntaxKind.LessThanEqualsToken
  );
}

function unwrap(node: ts.Expression): ts.Expression {
  return ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;
}

function parse(expr: string): ts.Expression {
  const file = ts.createSourceFile('f.ts', `(${expr});`, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const diag = (file as unknown as { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics ?? [];
  if (diag.length) throw new FormulaError(`Formül okunamadı: ${expr}`);
  const stmt = file.statements[0];
  if (file.statements.length !== 1 || !stmt || !ts.isExpressionStatement(stmt)) {
    throw new FormulaError(`Tek bir ifade bekleniyordu: ${expr}`);
  }
  return unwrap(stmt.expression);
}

const q = (s: string | undefined | null) => JSON.stringify(s ?? '');

export function generate(): string {
  const data = loadReference();
  const exprs: string[] = [];
  for (const k of data.kalem) {
    if (k.metraj) exprs.push(k.metraj);
    if (k.piyasa) exprs.push(k.piyasa);
  }
  for (const g of data.girdi) if (g.formul) exprs.push(g.formul);

  const stringVars = new Set<string>();
  const stringFields = new Set<string>();
  for (const e of exprs) Translator.collectStringVars(e, stringVars, stringFields);
  // Varsayılan değeri metin olan girdiler de metin değişkenidir.
  for (const g of data.girdi) if (typeof g.deger === 'string') stringVars.add(g.ad);

  const tr = new Translator(stringVars, stringFields);
  const fail = (where: string, e: unknown): never => {
    throw new Error(`${where}: ${e instanceof Error ? e.message : String(e)}`);
  };
  const fn = (expr: string, where: string): string => {
    try {
      return `(v, Q, SP) => ${tr.translate(expr)}`;
    } catch (e) {
      return fail(where, e);
    }
  };

  const allVars = new Set<string>();
  const allFields = new Set<string>();
  for (const e of exprs) {
    for (const m of e.matchAll(/\bv\.([A-Za-z_][A-Za-z0-9_]*)/g)) allVars.add(m[1]!);
    for (const m of e.matchAll(/\bt\.([A-Za-z_][A-Za-z0-9_]*)/g)) allFields.add(m[1]!);
  }
  for (const g of data.girdi) allVars.add(g.ad);
  for (const c of data.katsayi) allVars.add(c.ad);

  const out: string[] = [];
  out.push(
    '/* eslint-disable */',
    '// OTOMATİK ÜRETİLDİ: packages/core/scripts/gen-formulas.ts — elle düzenleme.',
    "// Kaynak: packages/core/reference/veri.js (prototip, REPIOM_Hesap_Mantigi_v4.xlsx'ten üretilmiş).",
    "import { B, IF, RND, RUP } from '../engine/runtime';",
    "import type { FormulaFn, InputFormulaFn } from '../engine/types';",
    '',
    '/** Formüllerin okuduğu değişkenler. Metin olanlar karşılaştırmada kullanılanlardır. */',
    'export interface FormulaVars {',
    ...[...allVars].sort().map((n) => `  ${n}: ${stringVars.has(n) ? 'string' : 'number'};`),
    '}',
    '',
    '/** SP(t => …) içindeki daire tipi alanları. */',
    'export interface FormulaApartmentType {',
    ...[...allFields]
      .sort()
      .map((n) => `  ${n}${n === 'TIP' ? '?' : ''}: ${stringFields.has(n) ? 'string' : 'number'};`),
    '}',
    '',
    `export const BLOCK_LAST_INDEX = ${data.blokSon};`,
    '',
    'export interface ItemDef {',
    '  i: number;',
    '  grup: number;',
    '  ad: string;',
    '  baslik: boolean;',
    '  birim: string;',
    '  aciklama: string;',
    '  fiyatAciklama: string;',
    '  opsiyonel: boolean;',
    '  /** Kaynak formül metni (Excel raporunda canlı formül kurmak için). */',
    '  metrajKaynak: string;',
    '  piyasaKaynak: string;',
    '  metraj: FormulaFn | null;',
    '  piyasa: FormulaFn | null;',
    '}',
    '',
    'export const ITEMS: readonly ItemDef[] = [',
  );
  data.kalem.forEach((k, idx) => {
    if (k.i !== idx) throw new Error(`Kalem sırası bozuk: ${idx} yerine ${k.i}`);
    if (k.baslik) {
      out.push(
        `  { i: ${k.i}, grup: ${k.grup}, ad: ${q(k.ad)}, baslik: true, birim: '', aciklama: '', fiyatAciklama: '', opsiyonel: false, metrajKaynak: '', piyasaKaynak: '', metraj: null, piyasa: null },`,
      );
      return;
    }
    out.push(
      '  {',
      `    i: ${k.i}, grup: ${k.grup}, ad: ${q(k.ad)}, baslik: false, birim: ${q(k.birim)},`,
      `    aciklama: ${q(k.aciklama)}, fiyatAciklama: ${q(k.fiyatAciklama)}, opsiyonel: ${k.opsiyonel ? 'true' : 'false'},`,
      `    metrajKaynak: ${q(k.metraj)}, piyasaKaynak: ${q(k.piyasa)},`,
      `    metraj: ${k.metraj ? fn(k.metraj, `Kalem ${k.i} metraj`) : 'null'},`,
      `    piyasa: ${k.piyasa ? fn(k.piyasa, `Kalem ${k.i} fiyat`) : 'null'},`,
      '  },',
    );
  });
  out.push('];', '');

  out.push(
    'export interface InputDef {',
    '  ad: keyof FormulaVars;',
    '  etiket: string;',
    '  deger: number | string | null;',
    '  not: string;',
    '  formulKaynak: string;',
    '  formul: InputFormulaFn | null;',
    '}',
    '',
    '/** v4 "Girdiler" sayfası: sırası önemlidir, formüllü girdiler bu sırayla hesaplanır. */',
    'export const INPUTS: readonly InputDef[] = [',
  );
  for (const g of data.girdi) {
    const f = g.formul
      ? (() => {
          try {
            return `(v, SP) => ${tr.translate(g.formul)}`;
          } catch (e) {
            return fail(`Girdi ${g.ad}`, e);
          }
        })()
      : 'null';
    out.push(
      `  { ad: ${q(g.ad)}, etiket: ${q(g.etiket)}, deger: ${JSON.stringify(g.deger)}, not: ${q(g.not_)}, formulKaynak: ${q(g.formul)}, formul: ${f} },`,
    );
  }
  out.push('];', '');

  out.push(
    'export interface CoefficientDef {',
    '  ad: keyof FormulaVars;',
    '  etiket: string;',
    '  deger: number;',
    '  not: string;',
    '}',
    '',
    'export const COEFFICIENTS: readonly CoefficientDef[] = [',
    ...data.katsayi.map(
      (c) =>
        `  { ad: ${q(c.ad)}, etiket: ${q(c.etiket)}, deger: ${JSON.stringify(c.deger)}, not: ${q(c.not_)} },`,
    ),
    '];',
    '',
    '/** İl katsayıları (İstanbul = 1). Yalnız piyasa fiyatlarına uygulanır. */',
    'export const PROVINCES: readonly { ad: string; k: number }[] = [',
    ...data.il.map((p) => `  { ad: ${q(p.ad)}, k: ${JSON.stringify(p.k)} },`),
    '];',
    '',
  );
  return out.join('\n');
}

function main(): void {
  const code = generate();
  const check = process.argv.includes('--check');
  if (check) {
    let current = '';
    try {
      current = readFileSync(TARGET, 'utf8');
    } catch {
      /* dosya yok */
    }
    if (current !== code) {
      console.error(
        'src/generated/formulas.ts güncel değil. "pnpm gen:formulas" komutunu çalıştırıp commit et.',
      );
      process.exit(1);
    }
    console.log('Formül dosyası güncel.');
    return;
  }
  writeFileSync(TARGET, code, 'utf8');
  console.log(`Yazıldı: src/generated/formulas.ts (${code.split('\n').length} satır)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
