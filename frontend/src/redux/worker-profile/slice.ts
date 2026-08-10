import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMyWorkerProfile,
  createWorkerProfile,
  updateWorkerProfile,
} from "./actions";
import type { WorkerProfileState } from "./types";

const initialState: WorkerProfileState = {
  data: null,
  status: "idle",
  error: null,
};

const workerProfileSlice = createSlice({
  name: "workerProfile",
  initialState,
  reducers: {
    resetWorkerProfileError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- отримати свій профіль ---
      .addCase(fetchMyWorkerProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyWorkerProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchMyWorkerProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? null;
      })
      // --- create ---
      .addCase(createWorkerProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createWorkerProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(createWorkerProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? null;
      })
      // --- update ---
      .addCase(updateWorkerProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateWorkerProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(updateWorkerProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? null;
      });
  },
});

export const { resetWorkerProfileError } = workerProfileSlice.actions;
export default workerProfileSlice.reducer;