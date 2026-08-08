import { Link } from "react-router-dom";

import type { Shift } from "../../api/shifts";
import { formatPriceLabel, formatTimeRange } from "./formatters";

export function TaskCard({ shift }: { shift: Shift }) {
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-bg-muted font-heading text-sm font-semibold text-ink">
            {logoInitial}
          </span>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {formatTimeRange(shift.startTime, shift.endTime)}
        </p>
        <p className="mt-3 text-sm font-medium">{companyName}</p>
        <p className="text-sm text-text-muted">{shift.Location?.address}</p>
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
