/**
 * Plan önizlemesi: bir bölgedeki çizgi, poligon ve yazıları 2B tuvale çizer (kontrol ekranı ve yapay zekâ görseli).
 * Tarayıcıya bağımlı olmamak için tuval yalnız gereken yöntemleriyle tanımlanır (OffscreenCanvas ile çalışır).
 */
import type { DxfData } from './reader';

export interface Canvas2D {
  fillStyle: string | unknown;
  strokeStyle: string | unknown;
  lineWidth: number;
  font: string;
  textBaseline: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fill(): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  fillText(t: string, x: number, y: number): void;
}

export interface PreviewOptions {
  zemin?: string;
  cizgi?: string;
  /** false: yazısız (yapay zekâya gönderilecek görsel — isim, antet yok). */
  yazi?: boolean;
  yaziRenk?: string;
  isaret?: { x: number; y: number; renk?: string }[];
}

export function renderPlan(
  c: Canvas2D,
  W: number,
  H: number,
  d: DxfData,
  bolge: [number, number, number, number],
  sec: PreviewOptions = {},
): void {
  let [x0, y0, x1, y1] = bolge;
  /* Bölge pafta satırı kadar geniş olabilir: çizilmiş içeriğin sınırına yakınlaş. */
  let ax = Infinity;
  let bx = -Infinity;
  let ay = Infinity;
  let by = -Infinity;
  const grow = (x: number, y: number) => {
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
      if (x < ax) ax = x;
      if (x > bx) bx = x;
      if (y < ay) ay = y;
      if (y > by) by = y;
    }
  };
  d.L.forEach((l) => {
    grow(l[1], l[2]);
    grow(l[3], l[4]);
  });
  d.P.forEach((p) => p.P.forEach((q) => grow(q[0], q[1])));
  if (bx > ax && by > ay) {
    const pad = Math.max(bx - ax, by - ay) * 0.03;
    x0 = ax - pad;
    x1 = bx + pad;
    y0 = ay - pad;
    y1 = by + pad;
  }
  const k = Math.min(W / (x1 - x0), H / (y1 - y0)) * 0.96;
  const ox = (W - (x1 - x0) * k) / 2;
  const oy = (H - (y1 - y0) * k) / 2;
  const X = (x: number) => ox + (x - x0) * k;
  const Y = (y: number) => H - oy - (y - y0) * k;
  const inside = (x: number, y: number) =>
    x >= x0 &&
    x <= x1 &&
    y >= y0 &&
    y <= y1 &&
    x >= bolge[0] &&
    x <= bolge[2] &&
    y >= bolge[1] &&
    y <= bolge[3];
  c.fillStyle = sec.zemin || '#fff';
  c.fillRect(0, 0, W, H);
  c.lineWidth = 1;
  c.strokeStyle = sec.cizgi || '#334155';
  c.beginPath();
  d.L.forEach((l) => {
    if (inside(l[1], l[2]) || inside(l[3], l[4])) {
      c.moveTo(X(l[1]), Y(l[2]));
      c.lineTo(X(l[3]), Y(l[4]));
    }
  });
  d.P.forEach((p) => {
    const q = p.P;
    if (!q.length || !inside(q[0]![0], q[0]![1])) return;
    c.moveTo(X(q[0]![0]), Y(q[0]![1]));
    for (let i = 1; i < q.length; i++) c.lineTo(X(q[i]![0]), Y(q[i]![1]));
  });
  c.stroke();
  if (sec.yazi !== false) {
    c.fillStyle = sec.yaziRenk || '#b45309';
    c.textBaseline = 'bottom';
    d.T.forEach((t) => {
      if (!inside(t.x, t.y) || !t.m) return;
      const fs = Math.max(7, Math.min(16, (t.h || 15) * k * 1.2));
      c.font = fs + 'px sans-serif';
      c.fillText(t.m.slice(0, 40), X(t.x), Y(t.y));
    });
  }
  (sec.isaret || []).forEach((m) => {
    c.fillStyle = m.renk || 'rgba(240,105,43,.85)';
    c.beginPath();
    c.arc(X(m.x), Y(m.y), 5, 0, 7);
    c.fill();
  });
}
