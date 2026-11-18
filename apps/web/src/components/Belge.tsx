/** Sözleşme / aydınlatma metni gösterimi: bağlantı düğmesi ve erişilebilir pencere. */
import { BELGELER, belgeMetni, type BelgeId } from '@repiom/core';
import { useRef, type ReactNode } from 'react';

function satirIci(t: string): ReactNode[] {
  return t
    .split(/(\*\*[^*]+\*\*)/g)
    .map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p));
}

/** Basit Markdown (#, ##, -, **) → JSX. */
function Metin({ md }: { md: string }) {
  const out: ReactNode[] = [];
  let liste: ReactNode[] = [];
  const bitir = () => {
    if (liste.length) out.push(<ul key={`l${out.length}`}>{liste}</ul>);
    liste = [];
  };
  md.split('\n').forEach((s, i) => {
    const t = s.trim();
    if (t.startsWith('- ')) return void liste.push(<li key={i}>{satirIci(t.slice(2))}</li>);
    bitir();
    if (!t) return;
    const h = /^(#{1,3}) (.*)$/.exec(t);
    if (h) out.push(h[1]!.length === 1 ? <h3 key={i}>{h[2]}</h3> : <h4 key={i}>{h[2]}</h4>);
    else out.push(<p key={i}>{satirIci(t)}</p>);
  });
  bitir();
  return <>{out}</>;
}

export function BelgeBaglantisi({ id, children }: { id: BelgeId; children?: ReactNode }) {
  const pencere = useRef<HTMLDialogElement>(null);
  const b = BELGELER[id];
  return (
    <>
      <button type="button" className="baglanti" onClick={() => pencere.current?.showModal()}>
        {children ?? b.ad}
      </button>
      <dialog ref={pencere} className="belge-penceresi" aria-labelledby={`belge-${id}`}>
        <div className="altbaslik">
          <h2 id={`belge-${id}`}>{b.ad}</h2>
          <button type="button" onClick={() => pencere.current?.close()}>
            Kapat
          </button>
        </div>
        <p className="not">Sürüm {b.surum} · TASLAK — avukat incelemesinden geçmeden yayınlanmamalıdır.</p>
        <div className="belge-metin">
          <Metin md={belgeMetni(id)} />
        </div>
      </dialog>
    </>
  );
}
