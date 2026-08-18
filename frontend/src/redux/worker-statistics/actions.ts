import { createAsyncThunk } from "@reduxjs/toolkit";
import { workerStatisticsService } from "../../services/workerStatisticsService";
import type {
  StatisticsSummary,
  StatisticsSummaryQuery,
  ShiftsStatistics,
  ShiftsStatisticsQuery,
} from "./types";
import type { ApiError } from "../types";
import { toApiError } from "../utils";

export const fetchStatisticsSummary = createAsyncThunk<
  StatisticsSummary,
  StatisticsSummaryQuery | undefined,
  { rejectValue: ApiError }
>(
  "worker-statistics/fetchSummary",
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await workerStatisticsService.getSummary(query ?? {});
      return data.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const fetchShiftsStatistics = createAsyncThunk<
  ShiftsStatistics,
  ShiftsStatisticsQuery | undefined,
  { rejectValue: ApiError }
>(
  "worker-statistics/fetchShiftsStatistics",
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await workerStatisticsService.getShiftsStatistics(
        query ?? {},
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);