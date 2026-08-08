import type {
  CreateShiftPayload,
  GetShiftsParams,
  PaginatedShiftsResponse,
  Shift,
  ShiftApplication,
} from "../../api/shifts";

export type { CreateShiftPayload, GetShiftsParams, Shift, ShiftApplication };

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
}
