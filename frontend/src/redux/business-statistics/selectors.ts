import type { RootState } from "../store";

export const selectBusinessStatisticsSummary = (state: RootState) =>
  state.businessStatistics.summary;

export const selectIsBusinessSummaryLoading = (state: RootState) =>
  state.businessStatistics.isSummaryLoading;

export const selectBusinessSummaryError = (state: RootState) =>
  state.businessStatistics.summaryError;

export const selectBusinessShiftsStatistics = (state: RootState) =>
  state.businessStatistics.shiftsStatistics;

export const selectIsBusinessShiftsStatisticsLoading = (state: RootState) =>
  state.businessStatistics.isShiftsStatisticsLoading;

export const selectBusinessShiftsStatisticsError = (state: RootState) =>
  state.businessStatistics.shiftsStatisticsError;

export const selectBusinessWorkersStatistics = (state: RootState) =>
  state.businessStatistics.workers;

export const selectIsBusinessWorkersLoading = (state: RootState) =>
  state.businessStatistics.isWorkersLoading;

export const selectBusinessWorkersError = (state: RootState) =>
  state.businessStatistics.workersError;
