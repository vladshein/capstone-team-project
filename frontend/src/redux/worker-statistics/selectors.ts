import type { RootState } from "../store";

export const selectStatisticsSummary = (state: RootState) =>
  state.workerStatistics.summary;

export const selectIsSummaryLoading = (state: RootState) =>
  state.workerStatistics.isSummaryLoading;

export const selectSummaryError = (state: RootState) =>
  state.workerStatistics.summaryError;

export const selectShiftsStatistics = (state: RootState) =>
  state.workerStatistics.shiftsStatistics;

export const selectIsShiftsStatisticsLoading = (state: RootState) =>
  state.workerStatistics.isShiftsStatisticsLoading;

export const selectShiftsStatisticsError = (state: RootState) =>
  state.workerStatistics.shiftsStatisticsError;