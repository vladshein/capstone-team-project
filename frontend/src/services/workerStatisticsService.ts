import api from "../api/client";
import type {
  StatisticsSummary,
  StatisticsSummaryQuery,
  ShiftsStatistics,
  ShiftsStatisticsQuery,
} from "../redux/worker-statistics/types";

export const workerStatisticsService = {
  getSummary: (params: StatisticsSummaryQuery) =>
    api.get<{ data: StatisticsSummary }>("/worker-profiles/me/statistics/summary", {
      params,
    }),

  getShiftsStatistics: (params: ShiftsStatisticsQuery) =>
    api.get<{ data: ShiftsStatistics }>("/worker-profiles/me/statistics/shifts", {
      params,
    }),
};