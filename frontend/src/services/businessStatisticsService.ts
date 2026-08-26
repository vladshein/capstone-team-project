import api from "../api/client";
import type {
  BusinessStatisticsBundle,
  BusinessStatisticsQuery,
} from "../redux/business-statistics/types";

export const businessStatisticsService = {
  getStatistics: (params: BusinessStatisticsQuery) =>
    api.get<{ data: BusinessStatisticsBundle }>("/companies/me/statistics", {
      params,
    }),
};
