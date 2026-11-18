/** Prototipteki "C - Blok R" logosu: turuncu kare içinde antrasit R, sağ altta antrasit blok. */
export function Logo({ boyut = 36 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="88" height="88" rx="14" fill="#F0692B" />
      <path
        d="M28 74 V24 H50 a15 15 0 0 1 0 30 H28 M46 54 L62 74"
        stroke="#1F2937"
        strokeWidth="10"
        fill="none"
      />
      <rect x="68" y="68" width="16" height="16" fill="#1F2937" />
    </svg>
  );
}
