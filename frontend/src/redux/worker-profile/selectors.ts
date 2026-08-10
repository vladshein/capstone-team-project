import type { RootState } from "../store";

export const selectWorkerProfile = (state: RootState) => state.workerProfile.data;
export const selectWorkerProfileStatus = (state: RootState) => state.workerProfile.status;
export const selectWorkerProfileError = (state: RootState) => state.workerProfile.error;
export const selectHasWorkerProfile = (state: RootState) => state.workerProfile.data !== null;