import { useMemo } from "react";
import type {
  ShiftsStatistics,
  GroupBy,
} from "../../redux/worker-statistics/types";

interface WorkerShiftsDynamicsProps {
  data: ShiftsStatistics | null;
  isLoading: boolean;
  error: string | null;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  onRetry: () => void;
}

const groupByOptions: { value: GroupBy; label: string }[] = [
  { value: "week", label: "Тижні" },
  { value: "month", label: "Місяці" },
];

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

export function WorkerShiftsDynamics({
  data,
  isLoading,
  error,
  groupBy,
  onGroupByChange,
  onRetry,
}: WorkerShiftsDynamicsProps) {
  const maxShifts = useMemo(
    () => Math.max(1, ...(data?.series.map((p) => p.completedShifts) ?? [0])),
    [data],
  );

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">Динаміка змін</h2>
        <div className="inline-flex rounded-[var(--radius-card)] border border-border p-0.5">
          {groupByOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onGroupByChange(option.value)}
              className={`rounded-[calc(var(--radius-card)-2px)] px-3 py-1 text-xs font-medium transition-colors ${
                groupBy === option.value
                  ? "bg-accent text-white"
                  : "text-text-muted hover:bg-bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-sm">
        {isLoading && !data && (
          <p className="text-sm text-text-muted">Завантаження…</p>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-danger">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg-muted"
            >
              Спробувати ще раз
            </button>
          </div>
        )}

        {!isLoading && !error && data && data.series.length === 0 && (
          <p className="text-sm text-text-subtle">
            Ще немає завершених змін за цей період.
          </p>
        )}

        {!error && data && data.series.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Завершено змін
                </p>
                <p className="mt-1 font-heading text-xl font-bold text-ink">
                  {data.totals.completedShifts}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Відпрацьовано годин
                </p>
                <p className="mt-1 font-heading text-xl font-bold text-ink">
                  {data.totals.scheduledCompletedHours.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Заробіток
                </p>
                <p className="mt-1 font-heading text-xl font-bold text-ink">
                  {currencyFormatter.format(
                    data.totals.estimatedCompletedEarnings,
                  )}{" "}
                  ₴
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {data.series.map((point) => (
                <div key={point.period} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-text-muted">
                    {point.period}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${(point.completedShifts / maxShifts) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-medium text-ink">
                    {point.completedShifts}
                  </span>
                  {point.noShows > 0 && (
                    <span className="shrink-0 text-xs text-danger">
                      −{point.noShows}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
