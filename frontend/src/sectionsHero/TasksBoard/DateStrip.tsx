import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  SELECTED_LABEL_FORMATTER,
  TODAY_LABEL_FORMATTER,
  WEEKDAY_FORMATTER,
  buildWeekStrip,
} from "./formatters";

export function DateStrip() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(0);
  const today = new Date();
  const days = useMemo(() => buildWeekStrip(weekOffset), [weekOffset]);
  const selectedDate = days[selected] ?? today;

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg p-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold capitalize">
          {SELECTED_LABEL_FORMATTER.format(selectedDate)}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Попередній тиждень"
            onClick={() => setWeekOffset((w) => w - 7)}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] text-text-muted hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Наступний тиждень"
            onClick={() => setWeekOffset((w) => w + 7)}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] text-text-muted hover:text-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const isSelected = i === selected;
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => setSelected(i)}
              className={`flex flex-col items-center rounded-[var(--radius-card)] py-2 text-xs font-medium transition-colors ${
                isSelected ? "bg-accent text-white" : "text-text-muted hover:bg-bg-muted"
              }`}
            >
              <span className="capitalize">{WEEKDAY_FORMATTER.format(d)}</span>
              <span className="mt-1 font-mono text-sm">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-text-subtle">Сьогодні {TODAY_LABEL_FORMATTER.format(today)}</p>
    </div>
  );
}