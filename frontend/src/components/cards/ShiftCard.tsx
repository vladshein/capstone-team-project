import { useState } from "react";
import { Heart, ArrowUpRight, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface Shift {
  id: string | number;
  category: string;
  role: string;
  company: string;
  rate: number | string;
  budget: number | string;
  distance: number | string;
  rating: number | string;
}

interface ShiftCardProps {
  shift: Shift;
}

export function ShiftCard({ shift }: ShiftCardProps) {
  const [favorite, setFavorite] = useState(false);

  return (
    <article className="group relative flex flex-col rounded-[var(--radius-card)] border border-border bg-bg p-4 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(18,19,26,0.25)] sm:p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-card)] bg-bg-muted text-lg sm:h-11 sm:w-11 sm:text-xl">
          {shift.category}
        </div>
        <button
          type="button"
          onClick={() => setFavorite((v) => !v)}
          aria-pressed={favorite}
          aria-label="Додати до обраного"
          className="-m-2 p-2 text-text-subtle transition-colors hover:text-highlight"
        >
          <Heart
            className={`h-5 w-5 ${favorite ? "fill-highlight text-highlight" : "fill-none text-current"}`}
          />
        </button>
      </div>

      <h3 className="mt-3 font-heading text-[15px] font-semibold text-ink sm:mt-4 sm:text-base">
        {shift.role}
      </h3>
      <p className="text-sm text-text-muted">{shift.company}</p>

      <div className="mt-3 flex items-baseline gap-1 sm:mt-4">
        <span className="font-mono text-lg font-medium text-accent">
          {shift.rate}₴
        </span>
        <span className="text-xs text-text-muted">
          /год · {shift.budget}₴ за зміну
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {shift.distance} км
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-highlight text-highlight" />{" "}
          {shift.rating}
        </span>
      </div>

      <Link
        to={`/shifts/${shift.id}`}
        className="mt-4 flex min-h-[44px] items-center justify-between rounded-[var(--radius-card)] bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-accent"
      >
        Детальніше
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
