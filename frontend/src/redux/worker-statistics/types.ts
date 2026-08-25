export type GroupBy = "week" | "month";

export interface StatisticsSummaryQuery {
  dateFrom?: string;
  dateTo?: string;
  companyId?: number;
}

export interface ShiftsStatisticsQuery {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: GroupBy;
  companyId?: number;
  city?: string;
  positionId?: number;
  categoryId?: number;
}

// Відповідь GET /me/statistics/summary
export interface StatisticsSummary {
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    noShow: number;
  };
  shifts: {
    completed: number;
    upcoming: number;
    scheduledCompletedHours: number;
    estimatedCompletedEarnings: number;
  };
  companiesWorkedFor: number;
  attendance: {
    completed: number;
    noShow: number;
    rate: number;
  };
  wallet: { balance: number; frozenBalance: number } | null;
}

// Відповідь GET /me/statistics/shifts
export interface ShiftsStatisticsPeriod {
  period: string; // "2026-08" або "2026-W31"
  completedShifts: number;
  noShows: number;
  scheduledHours: number;
  estimatedEarnings: number;
}

export interface ShiftsStatistics {
  totals: {
    completedShifts: number;
    noShows: number;
    scheduledCompletedHours: number;
    estimatedCompletedEarnings: number;
  };
  series: ShiftsStatisticsPeriod[];
}

export interface WorkerStatisticsState {
  summary: StatisticsSummary | null;
  isSummaryLoading: boolean;
  summaryError: string | null;

  shiftsStatistics: ShiftsStatistics | null;
  isShiftsStatisticsLoading: boolean;
  shiftsStatisticsError: string | null;

  // останні застосовані фільтри — потрібні, щоб компонент міг звірити,
  // чи дані в сторі відповідають поточним фільтрам UI
  lastShiftsQuery: ShiftsStatisticsQuery | null;
}