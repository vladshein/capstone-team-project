import { createAsyncThunk } from "@reduxjs/toolkit";
import { profileService } from "../../services/profileService";
import { profileActions } from "./constants";
import type { ApiError, MyProfileResponse } from "./types";

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

export const fetchMyProfile = createAsyncThunk<
  MyProfileResponse,
  void,
  { rejectValue: ApiError }
>(profileActions.FETCH_MY_PROFILE, async (_, { rejectWithValue }) => {
  try {
    const { data } = await profileService.getMyProfile();
    return data;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});