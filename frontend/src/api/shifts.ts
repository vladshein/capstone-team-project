import api from "./axiosInstance";

export type ShiftStatus =
  | "open"
  | "booked"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ShiftCompany {
  id: number;
  name: string;
}

export interface ShiftLocation {
  id: number;
  title: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  Company: ShiftCompany;
}

export interface ShiftCategory {
  id: number;
  name: string;
}

export interface ShiftJobPosition {
  id: number;
  title: string;
}

export interface Shift {
  id: number;
  startTime: string;
  endTime: string;
  // Sequelize може серіалізувати DECIMAL як рядок, тому API допускає обидва формати.
  hourlyRate: number | string;
  bonusRate: number | string;
  description: string | null;
  status: ShiftStatus;
  createdAt: string;

  Category: ShiftCategory;
  JobPosition: ShiftJobPosition;
  Location: ShiftLocation;
}

export interface GetShiftsParams {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
}

export interface PaginatedShiftsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: Shift[];
}

export interface CreateShiftPayload {
  locationId: number;
  positionId: number;
  categoryId: number;
  startTime: string; // ISO
  endTime: string; // ISO
  hourlyRate: number;
  bonusRate?: number;
  description?: string;
}

export interface ShiftApplication {
  id: number;
  shiftId: number;
  workerId: number;
  status: "pending" | "approved" | "rejected" | "completed" | "no_show";
  appliedAt: string;
}

/**
 * Отримати список відкритих змін з опційною фільтрацією та пагінацією.
 * Відповідає GET /api/shifts
 */
export async function getAllShifts(
  params: GetShiftsParams = {},
): Promise<PaginatedShiftsResponse> {
  const { data } = await api.get<PaginatedShiftsResponse>("/shifts", {
    params,
  });
  return data;
}

/**
 * Отримати деталі однієї зміни за id.
 * Відповідає GET /api/shifts/:id
 */
export async function getShiftById(id: number): Promise<Shift> {
  const { data } = await api.get<Shift>(`/shifts/${id}`);
  return data;
}

/**
 * Створити нову зміну (для бізнесу/клієнтів). Токен береться автоматично
 * з interceptor'а в axiosInstance — окремо передавати не треба.
 * Відповідає POST /api/shifts
 */
export async function createShift(
  payload: CreateShiftPayload,
): Promise<Shift> {
  const { data } = await api.post<Shift>("/shifts", payload);
  return data;
}

/** Відгукнутися на відкриту зміну. */
export async function applyToShift(shiftId: number): Promise<ShiftApplication> {
  const { data } = await api.post<{ data: ShiftApplication }>(
    `/shifts/${shiftId}/applications`,
  );
  return data.data;
}
