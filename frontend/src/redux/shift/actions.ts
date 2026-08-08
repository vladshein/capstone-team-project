import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  createShift,
  getAllShifts,
  getShiftById,
  applyToShift as applyToShiftRequest,
  type CreateShiftPayload,
  type GetShiftsParams,
  type PaginatedShiftsResponse,
  type Shift,
  type ShiftApplication,
} from "../../api/shifts";
import { shiftActions } from "./constants";

type ApiError = { message: string };

const toApiError = (error: unknown): ApiError => ({
  message: error instanceof Error ? error.message : "Сталася помилка. Спробуйте ще раз.",
});

export const fetchShifts = createAsyncThunk<
  PaginatedShiftsResponse,
  GetShiftsParams | undefined,
  { rejectValue: ApiError }
>(shiftActions.FETCH_ALL, async (params, { rejectWithValue }) => {
  try {
    return await getAllShifts(params);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchShiftById = createAsyncThunk<
  Shift,
  number,
  { rejectValue: ApiError }
>(shiftActions.FETCH_BY_ID, async (id, { rejectWithValue }) => {
  try {
    return await getShiftById(id);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const createNewShift = createAsyncThunk<
  Shift,
  CreateShiftPayload,
  { rejectValue: ApiError }
>(shiftActions.CREATE, async (payload, { rejectWithValue }) => {
  try {
    return await createShift(payload);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const applyToShift = createAsyncThunk<
  ShiftApplication,
  number,
  { rejectValue: ApiError }
>(shiftActions.APPLY, async (shiftId, { rejectWithValue }) => {
  try {
    return await applyToShiftRequest(shiftId);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
