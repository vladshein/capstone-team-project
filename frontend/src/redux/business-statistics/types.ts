import type { GroupBy } from "../worker-statistics/types";

export type { GroupBy };

export interface BusinessStatisticsSummaryQuery {
  companyId?: number;
}

export interface BusinessShiftsStatisticsQuery {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: GroupBy;
  companyId?: number;
}

export interface BusinessWorkersStatisticsQuery {
  companyId?: number;
  page?: number;
  limit?: number;
}

// Відповідь GET /companies/me/statistics/summary
export interface BusinessStatisticsSummary {
  companies: { total: number };
  shifts: {
    total: number;
    open: number;
    booked: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    noShow: number;
  };
  workers: { applied: number; worked: number };
  money: {
    totalPaidOut: number;
    wallet: { balance: number; frozenBalance: number } | null;
  };
}

// Відповідь GET /companies/me/statistics/shifts
export interface BusinessShiftsStatisticsPeriod {
  period: string; // "2026-08" або "2026-W31"
  completedShifts: number;
  noShows: number;
  scheduledHours: number;
  spend: number;
}

export interface BusinessShiftsStatistics {
  totals: {
    completedShifts: number;
    noShows: number;
    scheduledCompletedHours: number;
    estimatedSpend: number;
  };
  series: BusinessShiftsStatisticsPeriod[];
}

// Відповідь GET /companies/me/statistics/workers
export interface BusinessWorkerStatistic {
  workerId: number;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  rating: number;
  totalApplications: number;
  completedShifts: number;
  noShow: number;
  lastActivityAt: string | null;
}

export interface BusinessWorkersStatistics {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: BusinessWorkerStatistic[];
}

export interface BusinessStatisticsState {
  summary: BusinessStatisticsSummary | null;
  isSummaryLoading: boolean;
  summaryError: string | null;

  shiftsStatistics: BusinessShiftsStatistics | null;
  isShiftsStatisticsLoading: boolean;
  shiftsStatisticsError: string | null;

  workers: BusinessWorkersStatistics | null;
  isWorkersLoading: boolean;
  workersError: string | null;

  // останні застосовані фільтри — потрібні, щоб компонент міг звірити,
  // чи дані в сторі відповідають поточним фільтрам UI
  lastShiftsQuery: BusinessShiftsStatisticsQuery | null;
  lastWorkersQuery: BusinessWorkersStatisticsQuery | null;
}
