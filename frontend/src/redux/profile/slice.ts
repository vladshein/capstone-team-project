import { createSlice } from "@reduxjs/toolkit";
import { fetchMyProfile } from "./actions";
import type {
  ApiError,
  BusinessProfileState,
  WorkerProfileState,
} from "./types";

const getErrorMessage = (payload: unknown) =>
  typeof payload === "object" && payload !== null && "message" in payload
    ? (payload as ApiError).message
    : "Сталася помилка. Спробуйте ще раз.";

const workerInitialState: WorkerProfileState = {
  data: null,
  isLoading: false,
  error: null,
};

const workerProfileSlice = createSlice({
  name: "workerProfile",
  initialState: workerInitialState,
  reducers: {
    clearWorkerProfile: () => workerInitialState,
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchMyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        if (payload.role === "worker") {
          state.data = payload;
        }
      })
      .addCase(fetchMyProfile.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = getErrorMessage(payload);
      }),
});

const businessInitialState: BusinessProfileState = {
  data: null,
  isLoading: false,
  error: null,
};

const businessProfileSlice = createSlice({
  name: "businessProfile",
  initialState: businessInitialState,
  reducers: {
    clearBusinessProfile: () => businessInitialState,
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchMyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        if (payload.role === "business_client") {
          state.data = payload;
        }
      })
      .addCase(fetchMyProfile.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = getErrorMessage(payload);
      }),
});

export const { clearWorkerProfile } = workerProfileSlice.actions;
export const { clearBusinessProfile } = businessProfileSlice.actions;

export const workerProfileReducer = workerProfileSlice.reducer;
export const businessProfileReducer = businessProfileSlice.reducer;