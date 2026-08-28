import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { login, logout, refreshUser, register, fetchMyProfile } from "./actions";
import {
  createWorkerProfile,
  updateWorkerProfile,
} from "../worker-profile/actions";
import type { AuthState } from "./types";
import type { ApiError } from "../types";

const initialState: AuthState = {
  user: null,
  token: null,
  isLoggedIn: false,
  isRefreshing: false,
  isLoading: false,
  error: null,
  hasWorkerProfile: null,
  companiesCount: 0,
  isProfileLoading: false,
  profileError: null,
};

const getErrorMessage = (payload: unknown) =>
  typeof payload === "object" && payload !== null && "message" in payload
    ? (payload as ApiError).message
    : "Сталася помилка. Спробуйте ще раз.";

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth: () => initialState,
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isLoggedIn = true;
    },
    incrementCompaniesCount: (state) => { state.companiesCount += 1; },
    decrementCompaniesCount: (state) => { state.companiesCount = Math.max(0, state.companiesCount - 1); },
    markEmailAsVerified: (state) => {
      if (state.user) state.user.isVerified = true;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.token = payload.accessToken;
        state.isLoggedIn = true;
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = getErrorMessage(payload);
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.token = payload.accessToken;
        state.isLoggedIn = true;
        state.isLoading = false;
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = getErrorMessage(payload);
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = getErrorMessage(payload);
      })
      .addCase(refreshUser.pending, (state) => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(refreshUser.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.token = payload.accessToken;
        state.isLoggedIn = true;
        state.isRefreshing = false;
      })
      .addCase(refreshUser.rejected, () => initialState)
      .addCase(createWorkerProfile.fulfilled, (state, { payload }) => {
        if (state.user) {
          state.user.displayName = `${payload.firstName} ${payload.lastName}`.trim();
        }
      })
      .addCase(updateWorkerProfile.fulfilled, (state, { payload }) => {
        if (state.user) {
          state.user.displayName = `${payload.firstName} ${payload.lastName}`.trim();
        }
      })

      .addCase(fetchMyProfile.pending, (state) => {
        state.isProfileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, { payload }) => {
        state.isProfileLoading = false;
        state.hasWorkerProfile = payload.hasWorkerProfile ?? null;
        state.companiesCount = payload.companiesCount ?? 0;
      })
      .addCase(fetchMyProfile.rejected, (state, { payload }) => {
        state.isProfileLoading = false;
        state.profileError = getErrorMessage(payload);
      }),
});

export const {
  clearAuth,
  setAccessToken,
  incrementCompaniesCount,
  decrementCompaniesCount,
  markEmailAsVerified,
} =
  authSlice.actions;
export const authReducer = authSlice.reducer;
