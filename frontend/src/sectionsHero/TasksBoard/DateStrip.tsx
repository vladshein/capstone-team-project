import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  SELECTED_LABEL_FORMATTER,
  WEEKDAY_FORMATTER,
  buildWeekStrip,
} from "./formatters";

export type CalendarPeriod = "day" | "week" | "month";

interface DateStripProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  period: CalendarPeriod;
  onPeriodChange: (period: CalendarPeriod) => void;
}

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function DateStrip({ selectedDate, onSelectDate, period, onPeriodChange }: DateStripProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = startOfDay(new Date());
  const days = useMemo(() => buildWeekStrip(weekOffset), [weekOffset]);
  const selectToday = () => {
    setWeekOffset(0);
    onPeriodChange("day");
    onSelectDate(today);
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg p-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold capitalize">
          {selectedDate ? SELECTED_LABEL_FORMATTER.format(selectedDate) : "Найближчий період"}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Попередній тиждень"
            onClick={() => setWeekOffset((w) => Math.max(w - 7, 0))}
            disabled={weekOffset === 0}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] text-text-muted hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
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

      <div className="mt-3 grid grid-cols-2 rounded-[var(--radius-pill)] bg-bg-muted p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => onPeriodChange("week")}
          className={`rounded-[var(--radius-pill)] px-3 py-1.5 transition-colors ${period === "week" ? "bg-bg text-ink shadow-sm" : "text-text-muted"}`}
        >
          Тиждень
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange("month")}
          className={`rounded-[var(--radius-pill)] px-3 py-1.5 transition-colors ${period === "month" ? "bg-bg text-ink shadow-sm" : "text-text-muted"}`}
        >
          Місяць
        </button>
      </div>

      <button
        type="button"
        onClick={selectToday}
        className={`mt-3 min-h-[36px] w-full rounded-[var(--radius-pill)] border px-3 text-xs font-medium transition-colors ${period === "day" ? "border-accent bg-accent/10 text-accent-text" : "border-border text-text-muted hover:border-accent hover:text-accent-text"}`}
      >
        Сьогодні
      </button>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
          const isPast = startOfDay(d) < today;
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => {
                if (!isPast) onSelectDate(d);
              }}
              disabled={isPast}
              className={`flex flex-col items-center rounded-[var(--radius-card)] py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                isSelected ? "bg-accent text-white" : "text-text-muted hover:bg-bg-muted"
              }`}
            >
              <span className="capitalize">{WEEKDAY_FORMATTER.format(d)}</span>
              <span className="mt-1 font-mono text-sm">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-text-subtle">
        {period === "day"
          ? "Показуємо зміни лише на обрану дату"
          : period === "week"
            ? "Показуємо зміни на 7 днів від обраної дати"
            : "Показуємо зміни на 30 днів від обраної дати"}
      </p>
    </div>
  );
}
