import { createSlice } from "@reduxjs/toolkit";
import {
  fetchBusinessStatisticsSummary,
  fetchBusinessShiftsStatistics,
  fetchBusinessWorkersStatistics,
} from "./actions";
import type { BusinessStatisticsState } from "./types";
import type { ApiError } from "../types";

const initialState: BusinessStatisticsState = {
  summary: null,
  isSummaryLoading: false,
  summaryError: null,

  shiftsStatistics: null,
  isShiftsStatisticsLoading: false,
  shiftsStatisticsError: null,

  workers: null,
  isWorkersLoading: false,
  workersError: null,

  lastShiftsQuery: null,
  lastWorkersQuery: null,
};

const getErrorMessage = (payload: unknown) =>
  typeof payload === "object" && payload !== null && "message" in payload
    ? (payload as ApiError).message
    : "Сталася помилка. Спробуйте ще раз.";

const businessStatisticsSlice = createSlice({
  name: "business-statistics",
  initialState,
  reducers: {
    clearBusinessStatistics: () => initialState,
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchBusinessStatisticsSummary.pending, (state) => {
        state.isSummaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchBusinessStatisticsSummary.fulfilled, (state, { payload }) => {
        state.isSummaryLoading = false;
        state.summary = payload;
      })
      .addCase(fetchBusinessStatisticsSummary.rejected, (state, { payload }) => {
        state.isSummaryLoading = false;
        state.summaryError = getErrorMessage(payload);
      })

      .addCase(fetchBusinessShiftsStatistics.pending, (state, { meta }) => {
        state.isShiftsStatisticsLoading = true;
        state.shiftsStatisticsError = null;
        state.lastShiftsQuery = meta.arg ?? null;
      })
      .addCase(fetchBusinessShiftsStatistics.fulfilled, (state, { payload }) => {
        state.isShiftsStatisticsLoading = false;
        state.shiftsStatistics = payload;
      })
      .addCase(fetchBusinessShiftsStatistics.rejected, (state, { payload }) => {
        state.isShiftsStatisticsLoading = false;
        state.shiftsStatisticsError = getErrorMessage(payload);
      })

      .addCase(fetchBusinessWorkersStatistics.pending, (state, { meta }) => {
        state.isWorkersLoading = true;
        state.workersError = null;
        state.lastWorkersQuery = meta.arg ?? null;
      })
      .addCase(fetchBusinessWorkersStatistics.fulfilled, (state, { payload }) => {
        state.isWorkersLoading = false;
        state.workers = payload;
      })
      .addCase(fetchBusinessWorkersStatistics.rejected, (state, { payload }) => {
        state.isWorkersLoading = false;
        state.workersError = getErrorMessage(payload);
      }),
});

export const { clearBusinessStatistics } = businessStatisticsSlice.actions;
export const businessStatisticsReducer = businessStatisticsSlice.reducer;
