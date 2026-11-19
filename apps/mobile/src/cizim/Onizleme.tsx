/**
 * Plan önizlemesi: core'daki renderPlan, tuval yerine SVG yolları üreten bir uyarlayıcıya çizer (react-native-svg).
 * Yazısız görsel (yapay zekâ için) PNG'ye dönüştürülebilir (toDataURL, yalnız iOS/Android).
 */
import { dxf } from '@repiom/core';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

interface Cizim {
  zemin: string;
  yollar: { d: string; renk: string; kalinlik: number }[];
  noktalar: { x: number; y: number; r: number; renk: string }[];
  yazilar: { t: string; x: number; y: number; boyut: number; renk: string }[];
}

/** Canvas2D arayüzünü SVG komutlarına çeviren kaydedici. */
function kaydet(
  W: number,
  H: number,
  veri: dxf.DxfData,
  bolge: [number, number, number, number],
  sec: dxf.PreviewOptions,
): Cizim {
  const c: Cizim = { zemin: '#ffffff', yollar: [], noktalar: [], yazilar: [] };
  let d = '';
  let arc: { x: number; y: number; r: number } | null = null;
  const tuval: dxf.Canvas2D = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '10px sans-serif',
    textBaseline: 'bottom',
    fillRect() {
      c.zemin = String(tuval.fillStyle);
    },
    beginPath() {
      d = '';
      arc = null;
    },
    moveTo(x, y) {
      d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
    },
    lineTo(x, y) {
      d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
    },
    stroke() {
      if (d) c.yollar.push({ d, renk: String(tuval.strokeStyle), kalinlik: tuval.lineWidth });
      d = '';
    },
    arc(x, y, r) {
      arc = { x, y, r };
    },
    fill() {
      if (arc) c.noktalar.push({ ...arc, renk: String(tuval.fillStyle) });
      arc = null;
    },
    fillText(t, x, y) {
      const boyut = Number(/(\d+(?:\.\d+)?)px/.exec(tuval.font)?.[1] ?? 10);
      c.yazilar.push({ t, x, y, boyut, renk: String(tuval.fillStyle) });
    },
  } as dxf.Canvas2D;
  dxf.renderPlan(tuval, W, H, veri, bolge, sec);
  return c;
}

export interface OnizlemeRef {
  /** PNG (base64, ön eki olmadan). */
  png(): Promise<string | null>;
}

export const PlanOnizleme = forwardRef<
  OnizlemeRef,
  {
    veri: dxf.DxfData;
    bolge: [number, number, number, number];
    isaret?: { x: number; y: number }[];
    yazi?: boolean;
    genislik: number;
    etiket: string;
  }
>(function PlanOnizleme({ veri, bolge, isaret, yazi = true, genislik, etiket }, ref) {
  const W = 1100;
  const H = 700;
  const cizim = useMemo(() => kaydet(W, H, veri, bolge, { isaret, yazi }), [veri, bolge, isaret, yazi]);
  const svg = useRef<Svg>(null);
  useImperativeHandle(ref, () => ({
    png: () =>
      new Promise((coz) => {
        const s = svg.current as unknown as {
          toDataURL?: (cb: (b: string) => void, o?: object) => void;
        } | null;
        if (!s?.toDataURL) return coz(null);
        s.toDataURL((b) => coz(b.replace(/^data:image\/png;base64,/, '')), { width: W, height: H });
      }),
  }));
  return (
    <Svg
      ref={svg}
      width={genislik}
      height={(genislik * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={etiket}
    >
      <Rect x={0} y={0} width={W} height={H} fill={cizim.zemin} />
      {cizim.yollar.map((y, i) => (
        <Path key={i} d={y.d} stroke={y.renk} strokeWidth={y.kalinlik} fill="none" />
      ))}
      {cizim.yazilar.map((y, i) => (
        <SvgText key={`t${i}`} x={y.x} y={y.y} fontSize={y.boyut} fill={y.renk}>
          {y.t}
        </SvgText>
      ))}
      {cizim.noktalar.map((n, i) => (
        <Circle key={`n${i}`} cx={n.x} cy={n.y} r={n.r} fill={n.renk} />
      ))}
    </Svg>
  );
});
