import { useMemo, useState } from "react";
import type { ShiftsStatistics, ShiftsStatisticsPeriod, GroupBy } from "../../redux/worker-statistics/types";

interface WorkerShiftsDynamicsProps {
  data: ShiftsStatistics | null;
  isLoading: boolean;
  error: string | null;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  onRetry: () => void;
}

type Metric = "count" | "hours" | "earnings";

type ChartPlaceholder = { period: string; isPlaceholder: true };
type ChartPoint = ShiftsStatisticsPeriod | ChartPlaceholder;

const CHART_HEIGHT = 220;
const Y_TICKS = 4;

const METRIC_LABELS: Record<Metric, string> = {
  count: "Кількість змін",
  hours: "Відпрацьовані години",
  earnings: "Орієнтовний заробіток, ₴",
};

function formatPeriod(period: string, groupBy: GroupBy): string {
  if (groupBy === "week") {
    const match = period.match(/(\d{4})-W(\d{2})/);

    if (match) return `Т${match[2]}`;

    const weekOnly = period.match(/W(\d{2})/);
    return weekOnly ? `Т${weekOnly[1]}` : period;
  }
  const match = period.match(/(\d{4})-(\d{2})/);

  if (!match) return period;
  const months = [
    "Січ", "Лют", "Бер", "Кві", "Тра", "Чер",
    "Лип", "Сер", "Вер", "Жов", "Лис", "Гру",
  ];

  return `${months[Number(match[2]) - 1]} ${match[1].slice(2)}`;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let niceNormalized = 1;

  if (normalized > 5) niceNormalized = 10;
  else if (normalized > 2) niceNormalized = 5;
  else if (normalized > 1) niceNormalized = 2;

  return niceNormalized * magnitude;
}

function getISOWeekDate(year: number, week: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay();

  if (dayOfWeek <= 4) {
    simple.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
  } else {
    simple.setUTCDate(simple.getUTCDate() + 8 - dayOfWeek);
  }

  return simple;
}

function getISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getPreviousPeriod(period: string, groupBy: GroupBy): string {
  if (groupBy === "week") {
    const match = period.match(/(\d{4})-W(\d{2})/);

    if (!match) return period;
    const monday = getISOWeekDate(Number(match[1]), Number(match[2]));
    monday.setUTCDate(monday.getUTCDate() - 7);

    return getISOWeekString(monday);
  }

  const match = period.match(/(\d{4})-(\d{2})/);

  if (!match) return period;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function WorkerShiftsDynamics({
  data,
  isLoading,
  error,
  groupBy,
  onGroupByChange,
  onRetry,
}: WorkerShiftsDynamicsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [metric, setMetric] = useState<Metric>("count");

  const MIN_SLOTS = groupBy === "week" ? 6 : 6;

  const chartData = useMemo(() => {
    if (!data || data.series.length === 0) return null;

    const rawMax =
      metric === "count"
        ? Math.max(...data.series.map((p) => p.completedShifts + p.noShows))
        : metric === "hours"
          ? Math.max(...data.series.map((p) => p.scheduledHours))
          : Math.max(...data.series.map((p) => p.estimatedEarnings));

    const maxValue = niceMax(rawMax);

    const MIN_SLOTS = 6;
    const missing = Math.max(0, MIN_SLOTS - data.series.length);

    const placeholders: ChartPlaceholder[] = [];
    let cursor = data.series[0].period;

    for (let i = 0; i < missing; i++) {
      cursor = getPreviousPeriod(cursor, groupBy);
      placeholders.unshift({ period: cursor, isPlaceholder: true });
    }

    const points: ChartPoint[] = [...placeholders, ...data.series];

    return { points, maxValue };
  }, [data, metric, groupBy]);

  const yTickValues = useMemo(() => {
    if (!chartData) return [];
    
    return Array.from({ length: Y_TICKS + 1 }, (_, i) =>
      Math.round((chartData.maxValue / Y_TICKS) * i),
    ).reverse();
  }, [chartData]);

  const formatYTick = (value: number) =>
    metric === "earnings"
      ? new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(value)
      : String(value);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(["week", "month"] as GroupBy[]).map((g) => (
            <button
              key={g}
              onClick={() => onGroupByChange(g)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                groupBy === g ? "bg-accent text-white" : "text-text-muted hover:bg-bg-muted"
              }`}
            >
              {g === "week" ? "Тижні" : "Місяці"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-md border border-border p-1">
          {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                metric === m ? "bg-accent text-white" : "text-text-muted hover:bg-bg-muted"
              }`}
            >
              {m === "count" ? "Зміни" : m === "hours" ? "Години" : "Гроші"}
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
              onClick={onRetry}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg-muted"
            >
              Спробувати ще раз
            </button>
          </div>
        )}

        {!error && chartData && (
          <div className="mt-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {METRIC_LABELS[metric]}
            </p>

            <div className="flex">
              {/* Y axis */}
              <div className="flex h-40 sm:h-52 md:h-56 flex-col justify-between pr-2 text-right text-[9px] sm:text-[10px] text-text-subtle">
                {yTickValues.map((v, i) => (
                  <span key={i}>{formatYTick(v)}</span>
                ))}
              </div>

              {/* Plot area */}
              <div className="relative flex-1 overflow-x-auto overflow-y-visible pt-8">
                <div className="relative h-40 sm:h-52 md:h-56 min-w-full">
                  {/* grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {yTickValues.map((_, i) => (
                      <div key={i} className="border-t border-border/50" />
                    ))}
                  </div>

                  <div className="relative flex h-full items-end gap-1.5 sm:gap-2">
                    {chartData.points.map((p, i) => {
                      if ("isPlaceholder" in p) {
                        return (
                          <div
                            key={p.period}
                            className="relative flex flex-1 min-w-[28px] sm:min-w-[36px] flex-col items-center justify-end h-full"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            {hovered === i && (
                              <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-md border border-border bg-bg px-2 py-1 text-xs text-text-muted shadow-sm md:block">
                                {formatPeriod(p.period, groupBy)}: немає даних
                              </div>
                            )}
                            <span className="mt-2 text-[9px] sm:text-[10px] text-text-subtle/60">
                              {formatPeriod(p.period, groupBy)}
                            </span>
                          </div>
                        );
                      }

                      const value =
                        metric === "count"
                          ? p.completedShifts + p.noShows
                          : metric === "hours"
                            ? p.scheduledHours
                            : p.estimatedEarnings;

                      const completedPct =
                        metric === "count"
                          ? (p.completedShifts / chartData.maxValue) * 100
                          : (value / chartData.maxValue) * 100;
                      const noShowPct =
                        metric === "count" ? (p.noShows / chartData.maxValue) * 100 : 0;

                      return (
                        <div
                          key={p.period}
                          className="relative flex flex-1 min-w-[28px] sm:min-w-[36px] flex-col items-center justify-end h-full"
                          onMouseEnter={() => setHovered(i)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {hovered === i && (
                            <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-md border border-border bg-bg px-2 py-1 text-xs shadow-sm md:block">
                              {metric === "count"
                                ? `${p.period}: ${p.completedShifts} завершено, ${p.noShows} no-show`
                                : metric === "hours"
                                  ? `${p.period}: ${p.scheduledHours.toFixed(1)} год`
                                  : `${p.period}: ${new Intl.NumberFormat("uk-UA").format(p.estimatedEarnings)} ₴`}
                            </div>
                          )}
                          {metric === "count" && (
                            <div
                              className="w-full rounded-t-sm bg-danger"
                              style={{ height: `${noShowPct}%`, marginBottom: 2, minHeight: p.noShows > 0 ? 2 : 0 }}
                            />
                          )}
                          <div
                            className="w-full rounded-t-sm bg-accent"
                            style={{ height: `${completedPct}%`, minHeight: value > 0 ? 2 : 0 }}
                          />
                          <span className="mt-2 text-[9px] sm:text-[10px] text-text-subtle">
                            {formatPeriod(p.period, groupBy)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {metric === "count" && (
              <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
                  Завершено змін
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-danger" />
                  No-show
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}