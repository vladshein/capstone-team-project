import type { Shift } from "../../api/shifts";

export const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("uk-UA", { weekday: "short" });
export const TODAY_LABEL_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
});
export const SELECTED_LABEL_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  weekday: "long",
});
const TIME_FORMATTER = new Intl.DateTimeFormat("uk-UA", { hour: "2-digit", minute: "2-digit" });
const SHIFT_DATE_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  weekday: "short",
  day: "numeric",
  month: "long",
});
const PRICE_FORMATTER = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });

export function buildWeekStrip(startOffset: number) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + startOffset);
    return d;
  });
}

export function formatTimeRange(startTime: string, endTime: string) {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const endsNextDay =
      end.getFullYear() !== start.getFullYear() ||
      end.getMonth() !== start.getMonth() ||
      end.getDate() !== start.getDate();

    return `${TIME_FORMATTER.format(start)}–${TIME_FORMATTER.format(end)}${endsNextDay ? " (+1 день)" : ""}`;
  } catch {
    return "";
  }
}

export function formatShiftDate(startTime: string) {
  const date = new Date(startTime);
  return Number.isNaN(date.getTime()) ? "" : SHIFT_DATE_FORMATTER.format(date);
}

export function formatPriceLabel(shift: Shift) {
  const start = new Date(shift.startTime).getTime();
  const end = new Date(shift.endTime).getTime();
  const hours =
    Number.isFinite(start) && Number.isFinite(end) ? Math.max((end - start) / 3_600_000, 0) : 0;
  const hourlyRate = Number(shift.hourlyRate) || 0;
  const bonusRate = Number(shift.bonusRate) || 0;
  const total = hours * hourlyRate + bonusRate;
  
  return total > 0
    ? `~${PRICE_FORMATTER.format(total)}₴`
    : `${PRICE_FORMATTER.format(hourlyRate)}₴/год`;
}
