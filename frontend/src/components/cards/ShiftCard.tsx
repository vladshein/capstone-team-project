import type { ReactNode } from "react";
import { Heart, ArrowUpRight, CalendarDays, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavoriteShifts } from "../../hooks/useFavoriteShifts";

interface Shift {
  id: string | number;
  category: ReactNode;
  role: string;
  company: string;
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

  return (
    <article className="group relative flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-bg p-5 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(18,19,26,0.25)]">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-card)] bg-bg-muted text-lg sm:h-11 sm:w-11 sm:text-xl">
          {shift.category}
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(shift.id)}
          aria-pressed={favorite}
          aria-label={favorite ? "Прибрати з обраного" : "Додати в обране"}
          className="-m-2 p-2 text-text-subtle transition-colors hover:text-accent"
        >
          <Heart
            className={`h-5 w-5 ${favorite ? "fill-current text-accent" : "fill-none text-current"}`}
          />
        </button>
      </div>

      <h3 className="mt-5 min-h-[4.5rem] font-heading text-base font-semibold leading-6 text-ink">
        {shift.role}
      </h3>
      <p className="min-h-5 text-sm text-text-muted">{shift.company}</p>
      {shift.date && (
        <p className="mt-3 flex min-h-5 items-center gap-1.5 text-xs text-text-muted">
          <CalendarDays className="h-3.5 w-3.5 text-text-subtle" /> {shift.date}
        </p>
      )}

      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-mono text-lg font-medium text-accent">
          {shift.rate}₴
        </span>
        <span className="text-xs text-text-muted">
          /год · {shift.budget}₴ за зміну
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {typeof shift.distance === "number" ? `${shift.distance} км` : shift.distance}
        </span>
        {shift.rating !== undefined && (
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-highlight text-highlight" /> {shift.rating}
          </span>
        )}
      </div>

      <Link
        to={`/shifts/${shift.id}`}
        className="mt-5 flex min-h-[44px] items-center justify-between rounded-[var(--radius-card)] bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-accent"
      >
        Детальніше
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
