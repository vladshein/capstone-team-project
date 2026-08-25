import type {
  BusinessShiftsStatistics,
  BusinessShiftsStatisticsPeriod,
  GroupBy,
} from "../../redux/business-statistics/types";
import { PeriodBarChart, type PeriodMetric } from "../../components/charts/PeriodBarChart";

interface BusinessShiftsDynamicsProps {
  data: BusinessShiftsStatistics | null;
  isLoading: boolean;
  error: string | null;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  onRetry: () => void;
}

const currencyFormatter = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });

const METRICS: PeriodMetric<BusinessShiftsStatisticsPeriod>[] = [
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
    key: "spend",
    label: "Орієнтовні виплати, ₴",
    buttonLabel: "Гроші",
    getPrimary: (p) => p.spend,
    formatTooltip: (p) => `${p.period}: ${currencyFormatter.format(p.spend)} ₴`,
    formatYTick: (value) => currencyFormatter.format(value),
  },
];

export function BusinessShiftsDynamics({
  data,
  isLoading,
  error,
  groupBy,
  onGroupByChange,
  onRetry,
}: BusinessShiftsDynamicsProps) {
  return (
    <PeriodBarChart
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

export default BusinessShiftsDynamics;
