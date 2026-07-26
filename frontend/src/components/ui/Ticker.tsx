import { TICKER_SHIFTS } from "../../constants/mockData";

export function Ticker() {
  const items = [...TICKER_SHIFTS, ...TICKER_SHIFTS];
  return (
    <div className="relative overflow-hidden border-y border-border bg-ink py-2.5 sm:py-3">
      <style>{`
        @keyframes ludi-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ludi-ticker-track { animation: ludi-ticker 32s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ludi-ticker-track { animation: none; }
        }
      `}</style>
      <div className="ludi-ticker-track flex w-max gap-4 whitespace-nowrap sm:gap-6">
        {items.map((s, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-xs text-text-on-dark sm:text-sm"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {s.role} · {s.company} ·{" "}
            <span className="font-mono text-highlight">{s.rate}₴/год</span> ·{" "}
            {s.distance} км
            <span className="mx-3 text-divider-on-dark sm:mx-4">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
