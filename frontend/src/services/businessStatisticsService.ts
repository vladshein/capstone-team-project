import api from "../api/client";
import type {
  BusinessStatisticsSummary,
  BusinessStatisticsSummaryQuery,
  BusinessShiftsStatistics,
  BusinessShiftsStatisticsQuery,
  BusinessWorkersStatistics,
  BusinessWorkersStatisticsQuery,
} from "../redux/business-statistics/types";

export const businessStatisticsService = {
  getSummary: (params: BusinessStatisticsSummaryQuery) =>
    api.get<{ data: BusinessStatisticsSummary }>("/companies/me/statistics/summary", {
      params,
    }),

  getShiftsStatistics: (params: BusinessShiftsStatisticsQuery) =>
    api.get<{ data: BusinessShiftsStatistics }>("/companies/me/statistics/shifts", {
      params,
    }),

  getWorkersStatistics: (params: BusinessWorkersStatisticsQuery) =>
    api.get<{ data: BusinessWorkersStatistics }>("/companies/me/statistics/workers", {
      params,
    }),
};
