import type { ShiftsStatistics, ShiftsStatisticsPeriod, GroupBy } from "../../redux/worker-statistics/types";
import { PeriodChartKit, type PeriodMetric } from "../../lib/charts/PeriodChartKit";

interface WorkerShiftsDynamicsProps {
  data: ShiftsStatistics | null;
  isLoading: boolean;
  error: string | null;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  onRetry: () => void;
}

const currencyFormatter = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });

const METRICS: PeriodMetric<ShiftsStatisticsPeriod>[] = [
  {
    key: "count",
    label: "Кількість змін",
    buttonLabel: "Зміни",
    getPrimary: (p) => p.completedShifts,
    getSecondary: (p) => p.noShows,
    formatTooltip: (p) => `${p.period}: ${p.completedShifts} завершено, ${p.noShows} no-show`,
    legend: { primaryLabel: "Завершено змін", secondaryLabel: "No-show" },
  },
  {
    key: "hours",
    label: "Відпрацьовані години",
    buttonLabel: "Години",
    getPrimary: (p) => p.scheduledHours,
    formatTooltip: (p) => `${p.period}: ${p.scheduledHours.toFixed(1)} год`,
  },
  {
    key: "earnings",
    label: "Орієнтовний заробіток, ₴",
    buttonLabel: "Гроші",
    getPrimary: (p) => p.estimatedEarnings,
    formatTooltip: (p) => `${p.period}: ${currencyFormatter.format(p.estimatedEarnings)} ₴`,
    formatYTick: (value) => currencyFormatter.format(value),
  },
];

export function WorkerShiftsDynamics({
  data,
  isLoading,
  error,
  groupBy,
  onGroupByChange,
  onRetry,
}: WorkerShiftsDynamicsProps) {
  return (
    <PeriodChartKit
      series={data?.series ?? null}
      isLoading={isLoading}
      error={error}
      groupBy={groupBy}
      onGroupByChange={onGroupByChange}
      onRetry={onRetry}
      metrics={METRICS}
    />
  );
}

export default WorkerShiftsDynamics;
