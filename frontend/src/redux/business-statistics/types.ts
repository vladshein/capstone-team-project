import type { GroupBy } from "../worker-statistics/types";

export type { GroupBy };

// Один запит для GET /companies/me/statistics: summary/shifts/workers
// завжди довантажуються разом одним запитом (див. слайс) — companyId і
// dateFrom/dateTo/groupBy стосуються shifts-секції, page/limit — workers.
export interface BusinessStatisticsQuery {
  companyId?: number;
  dateFrom?: string;
  dateTo?: string;
  groupBy?: GroupBy;
  page?: number;
  limit?: number;
}

// Відповідь GET /companies/me/statistics
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
  };
}

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

export interface BusinessStatisticsBundle {
  summary: BusinessStatisticsSummary;
  shifts: BusinessShiftsStatistics;
  workers: BusinessWorkersStatistics;
}

export interface BusinessStatisticsState {
  summary: BusinessStatisticsSummary | null;
  shiftsStatistics: BusinessShiftsStatistics | null;
  workers: BusinessWorkersStatistics | null;

  isLoading: boolean;
  error: string | null;

  // Аргументи останнього запущеного запиту. Reducer звіряє їх з `meta.arg`
  // відповіді у fulfilled/rejected: якщо вони розійшлися, отже за час
  // запиту стартував новіший (наприклад, користувач встиг перемкнути
  // компанію) і цю застарілу відповідь потрібно проігнорувати, а не
  // застосовувати поверх свіжіших даних.
  lastQuery: BusinessStatisticsQuery | null;
}
