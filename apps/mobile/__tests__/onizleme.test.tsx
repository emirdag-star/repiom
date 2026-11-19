/** Plan önizlemesi: core'daki çizim, SVG uyarlayıcısıyla yollara dönüşür; yazısız kipte yazı yoktur. */
import { dxf } from '@repiom/core';
import { render } from '@testing-library/react-native';
import { PlanOnizleme } from '../src/cizim/Onizleme';

test('örnek çizimin zemin katı SVG olarak çizilir; yazısız kipte metin yok', async () => {
  const o = dxf.exampleDrawings();
  const a = dxf.analyzeDrawings(await dxf.readDxfBytes(o.mimari), await dxf.readDxfBytes(o.statik));
  if (a.hata !== undefined) throw new Error(a.hata);
  const k = a.mimari.katlar.find((x) => /ZEMİN/.test(x.baslik))!;
  const yazili = await render(
    <PlanOnizleme veri={a.veri.mimari} bolge={k.bolge} genislik={300} etiket="plan" />,
  );
  const metinler = yazili.toJSON() ? JSON.stringify(yazili.toJSON()) : '';
  expect(metinler).toContain('SALON');
  const yazisiz = await render(
    <PlanOnizleme veri={a.veri.mimari} bolge={k.bolge} yazi={false} genislik={300} etiket="plan" />,
  );
  const j = JSON.stringify(yazisiz.toJSON());
  expect(j).not.toContain('SALON');
  expect(j).not.toContain('PLANI');
  expect(j).toMatch(/M\d+\.\d L\d|M\d+(\.\d)? ?\d/);
});
