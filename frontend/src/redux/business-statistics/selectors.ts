import type { RootState } from "../store";

export const selectBusinessStatisticsSummary = (state: RootState) =>
  state.businessStatistics.summary;

export const selectBusinessShiftsStatistics = (state: RootState) =>
  state.businessStatistics.shiftsStatistics;

export const selectBusinessWorkersStatistics = (state: RootState) =>
  state.businessStatistics.workers;

export const selectIsBusinessStatisticsLoading = (state: RootState) =>
  state.businessStatistics.isLoading;

export const selectBusinessStatisticsError = (state: RootState) =>
  state.businessStatistics.error;
