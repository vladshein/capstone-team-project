import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import type { SignInPayload } from "../../components/auth/SignInModal";
import type { SignUpPayload } from "../../components/auth/SignUpModal";
import type { RootState } from "../store";
import { authActions } from "./constants";
import type { AuthResponse } from "./types"
import type { ApiError } from "../types"
import { toApiError } from "../utils"
import type { MyProfileData } from "./types";

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

export const fetchMyProfile = createAsyncThunk<
  MyProfileData,
  void,
  { rejectValue: ApiError }
>("auth/fetchMyProfile", async (_, { rejectWithValue }) => {
  try {
    const { data } = await authService.getMyProfile(); // GET /users/me/profile
    return data;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});