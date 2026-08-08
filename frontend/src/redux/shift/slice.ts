import { createSlice } from "@reduxjs/toolkit";

import {
  applyToShift,
  createNewShift,
  fetchShiftById,
  fetchShifts,
} from "./actions";
import type { ShiftState } from "./types";

const initialState: ShiftState = {
  items: [],
  selectedShift: null,
  pagination: null,
  isLoadingList: false,
  isLoadingDetails: false,
  isCreating: false,
  isApplying: false,
  error: null,
  applicationError: null,
  application: null,
};

const getErrorMessage = (payload: unknown) =>
  typeof payload === "object" && payload !== null && "message" in payload
    ? String(payload.message)
    : "Сталася помилка. Спробуйте ще раз.";

const shiftSlice = createSlice({
  name: "shift",
  initialState,
  reducers: {
    clearSelectedShift: (state) => {
      state.selectedShift = null;
    },
    clearShiftError: (state) => {
      state.error = null;
    },
    clearApplication: (state) => {
      state.application = null;
      state.applicationError = null;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchShifts.pending, (state) => {
        state.isLoadingList = true;
        state.error = null;
      })
      .addCase(fetchShifts.fulfilled, (state, { payload }) => {
        state.isLoadingList = false;
        state.items = payload.data;
        state.pagination = {
          totalItems: payload.totalItems,
          totalPages: payload.totalPages,
          currentPage: payload.currentPage,
        };
      })
      .addCase(fetchShifts.rejected, (state, { payload }) => {
        state.isLoadingList = false;
        state.error = getErrorMessage(payload);
      })
      .addCase(fetchShiftById.pending, (state) => {
        state.isLoadingDetails = true;
        state.error = null;
        state.selectedShift = null;
        state.application = null;
        state.applicationError = null;
      })
      .addCase(fetchShiftById.fulfilled, (state, { payload }) => {
        state.isLoadingDetails = false;
        state.selectedShift = payload;
      })
      .addCase(fetchShiftById.rejected, (state, { payload }) => {
        state.isLoadingDetails = false;
        state.error = getErrorMessage(payload);
      })
      .addCase(createNewShift.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createNewShift.fulfilled, (state, { payload }) => {
        state.isCreating = false;
        state.items.unshift(payload);
      })
      .addCase(createNewShift.rejected, (state, { payload }) => {
        state.isCreating = false;
        state.error = getErrorMessage(payload);
      })
      .addCase(applyToShift.pending, (state) => {
        state.isApplying = true;
        state.applicationError = null;
      })
      .addCase(applyToShift.fulfilled, (state, { payload }) => {
        state.isApplying = false;
        state.application = payload;
      })
      .addCase(applyToShift.rejected, (state, { payload }) => {
        state.isApplying = false;
        state.applicationError = getErrorMessage(payload);
      }),
});

export const { clearApplication, clearSelectedShift, clearShiftError } = shiftSlice.actions;
export const shiftReducer = shiftSlice.reducer;
