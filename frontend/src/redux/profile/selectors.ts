import type { RootState } from "../store";

export const selectWorkerProfile = (state: RootState) => state.workerProfile.data;
export const selectWorkerProfileLoading = (state: RootState) =>
  state.workerProfile.isLoading;
export const selectWorkerProfileError = (state: RootState) => state.workerProfile.error;

export const selectBusinessProfile = (state: RootState) => state.businessProfile.data;
export const selectBusinessProfileLoading = (state: RootState) =>
  state.businessProfile.isLoading;
export const selectBusinessProfileError = (state: RootState) =>
  state.businessProfile.error;