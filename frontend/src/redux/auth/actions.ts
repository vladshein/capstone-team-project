import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import type { SignInPayload } from "../../components/auth/SignInModal";
import type { SignUpPayload } from "../../components/auth/SignUpModal";
import type { RootState } from "../store";
import { authActions } from "./constants";
import type { ApiError, AuthResponse } from "./types";

const toApiError = (error: unknown): ApiError => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as {
      response?: { status?: number; data?: { message?: string } };
    }).response;

    return {
      status: response?.status,
      message: response?.data?.message ?? "Сталася помилка. Спробуйте ще раз.",
    };
  }

  return {
    message: error instanceof Error ? error.message : "Сталася помилка.",
  };
};

export const register = createAsyncThunk<
  AuthResponse,
  SignUpPayload,
  { rejectValue: ApiError }
>(authActions.SIGN_UP, async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authService.register(userData);
    return data as AuthResponse;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const login = createAsyncThunk<
  AuthResponse,
  SignInPayload,
  { rejectValue: ApiError }
>(authActions.SIGN_IN, async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authService.login(credentials);
    return data as AuthResponse;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const logout = createAsyncThunk<void, void, { rejectValue: ApiError }>(
  authActions.LOG_OUT,
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const refreshUser = createAsyncThunk<
  AuthResponse,
  void,
  { state: RootState; rejectValue: ApiError }
>(
  authActions.REFRESH_USER,
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authService.refreshUser();
      return data as AuthResponse;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { token, isRefreshing } = getState().auth;
      return token !== null && !isRefreshing;
    },
  },
);
