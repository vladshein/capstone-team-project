import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import type { Shift } from "../../api/shifts";
import { useFavoriteShifts } from "../../hooks/useFavoriteShifts";
import { formatPriceLabel, formatShiftDate, formatTimeRange } from "./formatters";

export function TaskCard({ shift }: { shift: Shift }) {
  const { isFavorite, toggleFavorite } = useFavoriteShifts();
  const favorite = isFavorite(shift.id);
  const companyName = shift.Location?.Company?.name ?? "";
  const logoInitial = companyName ? companyName[0].toUpperCase() : "?";
  const title =
    shift.description ||
    shift.JobPosition?.title ||
    shift.Category?.name ||
    "Завдання";

  return (
    <div className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-bg p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base font-semibold leading-snug">
            {title}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] bg-bg-muted font-heading text-sm font-semibold text-ink">
              {logoInitial}
            </span>
            <button
              type="button"
              onClick={() => toggleFavorite(shift.id)}
              aria-pressed={favorite}
              aria-label={favorite ? "Прибрати з обраного" : "Додати в обране"}
              className="-mr-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-pill)] text-text-subtle transition-colors hover:text-accent"
            >
              <Heart className={`h-5 w-5 ${favorite ? "fill-current text-accent" : "fill-none"}`} />
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {formatShiftDate(shift.startTime)} · {formatTimeRange(shift.startTime, shift.endTime)}
        </p>
        <p className="mt-3 text-sm font-medium">{companyName}</p>
        <p className="text-sm text-text-muted">
          {[shift.Location?.address, shift.Location?.city]
            .filter(Boolean)
            .join(", ") || "Адреса уточнюється"}
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="font-mono text-base font-semibold text-accent">
            {formatPriceLabel(shift)}
          </p>
          <p className="text-xs text-text-subtle">ви отримаєте за завдання</p>
        </div>
        <Link
          to={`/shifts/${shift.id}`}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Детальніше
        </Link>
      </div>
    </div>
  );
}
