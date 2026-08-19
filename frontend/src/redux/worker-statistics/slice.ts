import { createSlice } from "@reduxjs/toolkit";
import { fetchStatisticsSummary, fetchShiftsStatistics } from "./actions";
import type { WorkerStatisticsState } from "./types";
import type { ApiError } from "../types";

const initialState: WorkerStatisticsState = {
  summary: null,
  isSummaryLoading: false,
  summaryError: null,

  shiftsStatistics: null,
  isShiftsStatisticsLoading: false,
  shiftsStatisticsError: null,

  lastShiftsQuery: null,
};

const getErrorMessage = (payload: unknown) =>
  typeof payload === "object" && payload !== null && "message" in payload
    ? (payload as ApiError).message
    : "Сталася помилка. Спробуйте ще раз.";

const workerStatisticsSlice = createSlice({
  name: "worker-statistics",
  initialState,
  reducers: {
    clearWorkerStatistics: () => initialState,
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchStatisticsSummary.pending, (state) => {
        state.isSummaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchStatisticsSummary.fulfilled, (state, { payload }) => {
        state.isSummaryLoading = false;
        state.summary = payload;
      })
      .addCase(fetchStatisticsSummary.rejected, (state, { payload }) => {
        state.isSummaryLoading = false;
        state.summaryError = getErrorMessage(payload);
      })

      .addCase(fetchShiftsStatistics.pending, (state, { meta }) => {
        state.isShiftsStatisticsLoading = true;
        state.shiftsStatisticsError = null;
        state.lastShiftsQuery = meta.arg ?? null;
      })
      .addCase(fetchShiftsStatistics.fulfilled, (state, { payload }) => {
        state.isShiftsStatisticsLoading = false;
        state.shiftsStatistics = payload;
      })
      .addCase(fetchShiftsStatistics.rejected, (state, { payload }) => {
        state.isShiftsStatisticsLoading = false;
        state.shiftsStatisticsError = getErrorMessage(payload);
      }),
});

export const { clearWorkerStatistics } = workerStatisticsSlice.actions;
export const workerStatisticsReducer = workerStatisticsSlice.reducer;