import api from "./client";

export type ShiftStatus =
  | "open"
  | "booked"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ShiftCompany {
  id: number;
  name: string;
  ownerId?: number;
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
  categoryId?: number;
  positionId?: number;
  startTime: string;
  endTime: string;
  // Sequelize може серіалізувати DECIMAL як рядок, тому API допускає обидва формати.
  hourlyRate: number | string;
  bonusRate: number | string;
  description: string | null;
  status: ShiftStatus;
  createdAt: string;

  // Назва залежить від alias Sequelize: в окремих відповідях бекенд повертає
  // `category`, тому підтримуємо обидва варіанти під час поступової міграції.
  Category: ShiftCategory;
  category?: ShiftCategory;
  JobPosition: ShiftJobPosition;
  Location: ShiftLocation;
}

export interface GetShiftsParams {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  categoryIds?: string;
  partners?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  durationFilters?: string;
  sort?: "relevance" | "price_desc" | "date_asc" | "date_desc" | "nearest";
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface PaginatedShiftsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: Shift[];
  partnerOptions?: { label: string; count: number }[];
}

/** Легкий формат для карти: лише дані, потрібні для marker і popup. */
export interface ShiftMapMarker {
  id: number;
  startTime: string;
  endTime: string;
  hourlyRate: number | string;
  bonusRate: number | string;
  JobPosition?: ShiftJobPosition;
  Location: ShiftLocation;
}

export interface ShiftMapMarkersResponse {
  data: ShiftMapMarker[];
  isTruncated: boolean;
  partnerOptions?: { label: string; count: number }[];
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

export interface BusinessShift extends Omit<Shift, "Location"> {
  Location: Pick<ShiftLocation, "id" | "title" | "city" | "address">;
  /** Є лише в архіві: фінальна заявка виконавця та власний відгук компанії. */
  ShiftApplications?: Array<{
    id: number;
    status: "completed" | "no_show";
    User: { WorkerProfile: { firstName: string; lastName: string } | null };
  }>;
  Reviews?: { id: string; rating: number; comment: string | null }[];
}

export interface BusinessShiftApplication extends ShiftApplication {
  Shift: Pick<Shift, "id" | "startTime" | "endTime" | "status"> & {
    JobPosition: ShiftJobPosition;
    Location: Pick<ShiftLocation, "id" | "title" | "city" | "address">;
    /** Відгук цієї компанії про виконавця на конкретній зміні. */
    Reviews?: { id: string; rating: number; comment: string | null }[];
  };
  User: {
    id: number;
    phone: string;
    avatar: string | null;
    WorkerProfile: {
      firstName: string;
      lastName: string;
      rating: number | string;
      avatarUrl: string | null;
    } | null;
  };
}

export interface BusinessShiftsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: BusinessShift[];
}

export interface BusinessShiftApplicationsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: BusinessShiftApplication[];
}

export interface BusinessShiftWorkerSummary {
  application: { status: "completed" | "no_show"; User: { id: number; avatar: string | null; WorkerProfile: { firstName: string; lastName: string; rating: number | string; avatarUrl: string | null } | null } };
  review: { id: string; rating: number; comment: string | null } | null;
}

export interface WorkerShiftApplication {
  id: number;
  shiftId: number;
  workerId: number;
  status: "pending" | "approved" | "rejected" | "completed" | "no_show";
  appliedAt: string;
  Shift: {
    id: number;
    startTime: string;
    endTime: string;
    hourlyRate: number | string;
    bonusRate: number | string;
    description: string | null;
    status: ShiftStatus;
    JobPosition?: ShiftJobPosition;
    Location?: ShiftLocation;
    /** Власний відгук виконавця про компанію для цієї зміни. */
    Reviews?: { id: string; rating: number; comment: string | null }[];
  };
}

export interface WorkerShiftApplicationsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: WorkerShiftApplication[];
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

/** Отримати всі маркери за поточними фільтрами; пагінація списку не застосовується. */
export async function getShiftMapMarkers(
  params: Omit<GetShiftsParams, "page" | "limit"> = {},
): Promise<ShiftMapMarkersResponse> {
  const { data } = await api.get<ShiftMapMarkersResponse>("/shifts/map", {
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
 * зі спільного API-клієнта — окремо передавати не треба.
 * Відповідає POST /api/shifts
 */
export async function createShift(
  payload: CreateShiftPayload,
): Promise<Shift> {
  const { data } = await api.post<{ data: Shift }>("/shifts", payload);
  return data.data;
}

/** Оновлює відкриту зміну її власником. */
export async function updateShift(
  shiftId: number,
  payload: CreateShiftPayload,
): Promise<Shift> {
  const { data } = await api.patch<{ data: Shift }>(`/shifts/${shiftId}`, payload);
  return data.data;
}

/** Скасовує зміну її власником. */
export async function cancelBusinessShift(shiftId: number): Promise<void> {
  await api.patch(`/shifts/${shiftId}/cancel`);
}

/** Відгукнутися на відкриту зміну. */
export async function applyToShift(shiftId: number): Promise<ShiftApplication> {
  const { data } = await api.post<{ data: ShiftApplication }>(
    `/shifts/${shiftId}/applications`,
  );
  return data.data;
}

export async function getMyShiftApplications(
  page = 1,
  limit = 8,
  shiftId?: number,
  scope: "active" | "completed" | "archive" = "active",
): Promise<WorkerShiftApplicationsResponse> {
  const { data } = await api.get<WorkerShiftApplicationsResponse>("/shifts/worker/my-jobs", {
    params: { page, limit, shiftId, scope },
  });
  return data;
}

export async function cancelShiftApplication(applicationId: number): Promise<void> {
  await api.delete(`/shifts/applications/${applicationId}`);
}

export async function decideBusinessShiftApplication(
  applicationId: number,
  status: "approved" | "rejected",
): Promise<void> {
  await api.patch(`/shifts/applications/${applicationId}/status`, { status });
}

export async function completeBusinessShiftApplication(applicationId: number): Promise<void> {
  await api.patch(`/shifts/applications/${applicationId}/complete`);
}

export async function markBusinessShiftApplicationNoShow(applicationId: number): Promise<void> {
  await api.patch(`/shifts/applications/${applicationId}/no-show`);
}

export async function getBusinessShifts(
  companyId: number,
  scope: "active" | "archive" = "active",
  page = 1,
  limit = 8,
): Promise<BusinessShiftsResponse> {
  const { data } = await api.get<BusinessShiftsResponse>("/shifts/business/my-shifts", {
    params: { companyId, scope, page, limit },
  });
  return data;
}

export async function getBusinessShiftApplications(
  companyId: number,
  page = 1,
  limit = 8,
): Promise<BusinessShiftApplicationsResponse> {
  const { data } = await api.get<BusinessShiftApplicationsResponse>(
    "/shifts/business/applications",
    { params: { companyId, page, limit } },
  );
  return data;
}

export async function getBusinessShiftWorkerSummary(shiftId: number): Promise<BusinessShiftWorkerSummary> {
  const { data } = await api.get<{ data: BusinessShiftWorkerSummary }>(`/shifts/business/shifts/${shiftId}/worker`);
  return data.data;
}

/** Кількість лише нових заявок для бейджа в кабінеті бізнесу. */
export async function getPendingBusinessShiftApplicationsCount(companyId: number): Promise<number> {
  const { data } = await api.get<{ pendingCount: number }>("/shifts/business/applications", {
    params: { companyId, summary: true },
  });
  return data.pendingCount;
}
