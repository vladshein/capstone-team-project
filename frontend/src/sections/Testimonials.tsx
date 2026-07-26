import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TESTIMONIALS } from "../constants/mockData";

export function TestimonialsSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // BUGFIX: раніше `index` був у deps, тому таймер перестворювався на
    // кожен тик (clearInterval + новий setInterval кожні 6с). setIndex вже
    // використовує функціональний апдейт, тому deps можна лишити порожніми.
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const go = (dir: number) => {
    setIndex((i) => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const t = TESTIMONIALS[index];

  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-heading text-lg leading-relaxed text-ink sm:text-xl md:text-2xl">
        «{t.text}»
      </p>
      <p className="mt-5 text-sm font-medium text-ink sm:mt-6">{t.name}</p>
      <p className="text-sm text-text-muted">{t.role}</p>

      <div className="mt-6 flex items-center justify-center gap-3 sm:mt-8 sm:gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Попередній відгук"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-pill)] border border-border text-ink hover:border-accent hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Відгук ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-[var(--radius-pill)] transition-all ${
                i === index ? "w-6 bg-accent" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Наступний відгук"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-pill)] border border-border text-ink hover:border-accent hover:text-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
