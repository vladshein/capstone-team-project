import type { RootState } from "../store";

export const selectShifts = (state: RootState) => state.shift.items;
export const selectSelectedShift = (state: RootState) => state.shift.selectedShift;
export const selectShiftPagination = (state: RootState) => state.shift.pagination;
export const selectIsLoadingShifts = (state: RootState) => state.shift.isLoadingList;
export const selectIsLoadingShiftDetails = (state: RootState) => state.shift.isLoadingDetails;
export const selectIsCreatingShift = (state: RootState) => state.shift.isCreating;
export const selectShiftError = (state: RootState) => state.shift.error;
export const selectIsApplyingToShift = (state: RootState) => state.shift.isApplying;
export const selectShiftApplication = (state: RootState) => state.shift.application;
export const selectShiftApplicationError = (state: RootState) => state.shift.applicationError;
export const selectShiftSort = (state: RootState) => state.shift.sort;
export const selectSelectedPartners = (state: RootState) => state.shift.selectedPartners;
export const selectPartnerSelectionMode = (state: RootState) => state.shift.partnerSelectionMode;
export const selectSelectedCategories = (state: RootState) => state.shift.selectedCategories;
export const selectSelectedDurationFilters = (state: RootState) => state.shift.selectedDurationFilters;
