import { createSlice } from "@reduxjs/toolkit";
import { fetchBusinessStatistics } from "./actions";
import type { BusinessStatisticsState } from "./types";
import type { ApiError } from "../types";

const initialState: BusinessStatisticsState = {
  summary: null,
  shiftsStatistics: null,
  workers: null,

  isLoading: false,
  error: null,

  lastQuery: null,
};

const getErrorMessage = (payload: unknown) =>
  typeof payload === "object" && payload !== null && "message" in payload
    ? (payload as ApiError).message
    : "Сталася помилка. Спробуйте ще раз.";

// Порівнює аргументи запиту за значенням, а не за посиланням: всі поля
// BusinessStatisticsQuery тут примітивні, тож JSON.stringify достатньо для
// рівності.
const isSameQuery = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

const businessStatisticsSlice = createSlice({
  name: "business-statistics",
  initialState,
  reducers: {
    clearBusinessStatistics: () => initialState,
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchBusinessStatistics.pending, (state, { meta }) => {
        state.isLoading = true;
        state.error = null;
        state.lastQuery = meta.arg ?? null;
      })
      .addCase(fetchBusinessStatistics.fulfilled, (state, { payload, meta }) => {
        if (!isSameQuery(meta.arg, state.lastQuery)) return;
        state.isLoading = false;
        state.summary = payload.summary;
        state.shiftsStatistics = payload.shifts;
        state.workers = payload.workers;
      })
      .addCase(fetchBusinessStatistics.rejected, (state, { payload, meta }) => {
        if (!isSameQuery(meta.arg, state.lastQuery)) return;
        state.isLoading = false;
        state.error = getErrorMessage(payload);
      }),
});

export const { clearBusinessStatistics } = businessStatisticsSlice.actions;
export const businessStatisticsReducer = businessStatisticsSlice.reducer;
