import type { ReactNode } from "react";
import { Heart, ArrowUpRight, CalendarDays, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavoriteShifts } from "../../hooks/useFavoriteShifts";

interface Shift {
  id: string | number;
  category: ReactNode;
  categoryLabel?: string;
  role: string;
  company: string;
  address?: string;
  city?: string;
  date?: string;
  rate: number | string;
  budget: number | string;
  distance: number | string;
  rating?: number | string;
}

interface ShiftCardProps {
  shift: Shift;
}

export function ShiftCard({ shift }: ShiftCardProps) {
  const { isFavorite, toggleFavorite } = useFavoriteShifts();
  const favorite = isFavorite(shift.id);
  const companyInitial = shift.company.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="group relative flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-bg p-4 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(18,19,26,0.25)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-sm">
            {shift.category}
          </div>
          {shift.categoryLabel && (
            <span className="max-w-36 truncate rounded-[var(--radius-pill)] bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-text">
              {shift.categoryLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(shift.id)}
          aria-pressed={favorite}
          aria-label={favorite ? "Прибрати з обраного" : "Додати в обране"}
          className="-m-2 cursor-pointer p-2 text-text-subtle transition-colors hover:text-accent"
        >
          <Heart
            className={`h-5 w-5 ${favorite ? "fill-current text-accent" : "fill-none text-current"}`}
          />
        </button>
      </div>

      <div className="group/title relative mt-4 min-h-12">
        <h3 className="line-clamp-2 font-heading text-base font-semibold leading-6 text-ink">
          {shift.role}
        </h3>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-max max-w-52 rounded-md border border-border bg-bg px-2 py-1 text-left text-xs font-normal leading-4 text-text shadow-md opacity-0 transition-opacity group-hover/title:opacity-100"
        >
          {shift.role}
        </span>
      </div>
      <div className="flex min-h-6 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-muted text-[11px] font-semibold text-text-muted">
          {companyInitial}
        </span>
        <p className="truncate text-sm text-text-muted">{shift.company}</p>
      </div>
      <p className="mt-1 min-h-5 truncate text-xs text-text-muted">
        {[shift.address, shift.city].filter(Boolean).join(", ") || "Адреса уточнюється"}
      </p>
      {shift.date && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-text-muted">
          <p className="flex min-w-0 items-center gap-1.5 rounded-[var(--radius-pill)] bg-bg-muted px-2.5 py-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="truncate">{shift.date}</span>
          </p>
          <span className="flex shrink-0 items-center gap-1 text-text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {typeof shift.distance === "number" ? `${shift.distance} км` : shift.distance}
          </span>
        </div>
      )}

      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-mono text-lg font-medium text-accent">
          {shift.rate}₴
        </span>
        <span className="text-xs text-text-muted">
          /год · {shift.budget}₴ за зміну
        </span>
      </div>

      <div className="mt-3 flex items-center justify-end text-xs text-text-muted">
        {shift.rating !== undefined && (
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-highlight text-highlight" /> {shift.rating}
          </span>
        )}
      </div>

      <Link
        to={`/shifts/${shift.id}`}
        className="mt-4 flex min-h-[44px] items-center justify-between rounded-[var(--radius-card)] border border-ink px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:bg-accent hover:text-white"
      >
        Детальніше
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
