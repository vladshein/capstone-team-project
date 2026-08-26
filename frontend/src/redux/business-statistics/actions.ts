import { createAsyncThunk } from "@reduxjs/toolkit";
import { businessStatisticsService } from "../../services/businessStatisticsService";
import { businessStatisticsActions } from "./constants";
import type { BusinessStatisticsBundle, BusinessStatisticsQuery } from "./types";
import type { ApiError } from "../types";
import { toApiError } from "../utils";

export const fetchBusinessStatistics = createAsyncThunk<
  BusinessStatisticsBundle,
  BusinessStatisticsQuery | undefined,
  { rejectValue: ApiError }
>(
  businessStatisticsActions.FETCH_STATISTICS,
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await businessStatisticsService.getStatistics(query ?? {});
      return data.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);
