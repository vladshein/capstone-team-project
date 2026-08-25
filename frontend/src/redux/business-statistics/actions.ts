import { createAsyncThunk } from "@reduxjs/toolkit";
import { businessStatisticsService } from "../../services/businessStatisticsService";
import { businessStatisticsActions } from "./constants";
import type {
  BusinessStatisticsSummary,
  BusinessStatisticsSummaryQuery,
  BusinessShiftsStatistics,
  BusinessShiftsStatisticsQuery,
  BusinessWorkersStatistics,
  BusinessWorkersStatisticsQuery,
} from "./types";
import type { ApiError } from "../types";
import { toApiError } from "../utils";

export const fetchBusinessStatisticsSummary = createAsyncThunk<
  BusinessStatisticsSummary,
  BusinessStatisticsSummaryQuery | undefined,
  { rejectValue: ApiError }
>(
  businessStatisticsActions.FETCH_SUMMARY,
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await businessStatisticsService.getSummary(query ?? {});
      return data.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const fetchBusinessShiftsStatistics = createAsyncThunk<
  BusinessShiftsStatistics,
  BusinessShiftsStatisticsQuery | undefined,
  { rejectValue: ApiError }
>(
  businessStatisticsActions.FETCH_SHIFTS_STATISTICS,
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await businessStatisticsService.getShiftsStatistics(
        query ?? {},
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const fetchBusinessWorkersStatistics = createAsyncThunk<
  BusinessWorkersStatistics,
  BusinessWorkersStatisticsQuery | undefined,
  { rejectValue: ApiError }
>(
  businessStatisticsActions.FETCH_WORKERS_STATISTICS,
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await businessStatisticsService.getWorkersStatistics(
        query ?? {},
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);
