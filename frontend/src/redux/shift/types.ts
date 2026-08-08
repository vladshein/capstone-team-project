import type {
  CreateShiftPayload,
  GetShiftsParams,
  PaginatedShiftsResponse,
  Shift,
  ShiftApplication,
} from "../../api/shifts";

export type { CreateShiftPayload, GetShiftsParams, Shift, ShiftApplication };

export type ShiftSort = "relevance" | "price_desc" | "date_asc" | "date_desc" | "nearest";
export type ShiftDurationFilter = "До 4 год" | "4–8 год" | "Понад 8 год";

export interface ShiftState {
  items: Shift[];
  selectedShift: Shift | null;
  pagination: Omit<PaginatedShiftsResponse, "data"> | null;
  isLoadingList: boolean;
  isLoadingDetails: boolean;
  isCreating: boolean;
  isApplying: boolean;
  error: string | null;
  applicationError: string | null;
  application: ShiftApplication | null;
  sort: ShiftSort;
  selectedPartners: string[];
  selectedDurationFilters: ShiftDurationFilter[];
}
