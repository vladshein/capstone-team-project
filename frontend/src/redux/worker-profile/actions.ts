import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { workerProfileService } from "../../services/workerProfileService";
import { toApiError } from "../utils";
import { workerProfileActions } from "./constants";
import type { ApiError } from "../types";
import type {
  WorkerProfile,
  CreateWorkerProfilePayload,
  UpdateWorkerProfilePayload,
} from "./types";

export const fetchMyWorkerProfile = createAsyncThunk<
  WorkerProfile | null,
  void,
  { rejectValue: ApiError }
>(workerProfileActions.FETCH_MY_PROFILE, async (_, { rejectWithValue }) => {
  try {
    const { data } = await workerProfileService.getMyProfile();
    return data.data; // response.data.data — сам профіль
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    return rejectWithValue(toApiError(error));
  }
});

export const createWorkerProfile = createAsyncThunk<
  WorkerProfile,
  CreateWorkerProfilePayload,
  { rejectValue: ApiError }
>(workerProfileActions.CREATE_PROFILE, async (payload, { rejectWithValue }) => {
  try {
    const { data } = await workerProfileService.createProfile(payload);
    return data.data;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const updateWorkerProfile = createAsyncThunk<
  WorkerProfile,
  UpdateWorkerProfilePayload,
  { rejectValue: ApiError }
>(workerProfileActions.UPDATE_PROFILE, async (payload, { rejectWithValue }) => {
  try {
    const { data } = await workerProfileService.updateProfile(payload);
    return data.data;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});