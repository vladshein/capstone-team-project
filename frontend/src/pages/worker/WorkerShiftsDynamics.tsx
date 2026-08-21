import { useMemo, useState } from "react";
import type { ShiftsStatistics, GroupBy } from "../../redux/worker-statistics/types";

interface WorkerShiftsDynamicsProps {
  data: ShiftsStatistics | null;
  isLoading: boolean;
  error: string | null;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  onRetry: () => void;
}

const CHART_HEIGHT = 220;
const BAR_GAP = 8;

export function WorkerShiftsDynamics({
  data,
  isLoading,
  error,
  groupBy,
  onGroupByChange,
  onRetry,
}: WorkerShiftsDynamicsProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!data || data.series.length === 0) return null;
    const maxValue = Math.max(
      1,
      ...data.series.map((p) => p.completedShifts + p.noShows),
    );
    return { points: data.series, maxValue };
  }, [data]);

  return (
    <section>
      {/* header/tabs без змін */}
      <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-sm">
        {isLoading && !data && (
          <p className="text-sm text-text-muted">Завантаження…</p>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-danger">{error}</p>
            <button
              onClick={onRetry}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg-muted"
            >
              Спробувати ще раз
            </button>
          </div>
        )}

        {!error && chartData && (
          <div className="mt-6">
            <div
              className="flex items-end gap-2"
              style={{ height: CHART_HEIGHT }}
            >
              {chartData.points.map((p, i) => {
                const completedH =
                  (p.completedShifts / chartData.maxValue) * CHART_HEIGHT;
                const noShowH =
                  (p.noShows / chartData.maxValue) * CHART_HEIGHT;
                return (
                  <div
                    key={p.period}
                    className="relative flex flex-1 flex-col items-center justify-end"
                    style={{ height: CHART_HEIGHT }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {hovered === i && (
                      <div className="absolute -top-2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-bg px-2 py-1 text-xs shadow-sm">
                        {p.period}: {p.completedShifts} завершено,{" "}
                        {p.noShows} no-show
                      </div>
                    )}
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: noShowH,
                        background: "rgb(var(--color-danger))",
                        marginBottom: 2,
                      }}
                    />
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: completedH,
                        background: "rgb(var(--color-accent))",
                      }}
                    />
                    <span className="mt-2 text-[10px] text-text-subtle">
                      {p.period}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: "rgb(var(--color-accent))" }}
                />
                Завершено змін
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: "rgb(var(--color-danger))" }}
                />
                No-show
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}