import api from "./client";

export type DisputeStatus =
  | "open"
  | "awaiting_response"
  | "under_review"
  | "resolved"
  | "closed"
  | "appealed";
export type DisputeDecision =
  | "pay_worker_full"
  | "pay_worker_partial"
  | "refund_company"
  | "no_action"
  | "cancel_shift_no_fault";
export type DisputeParticipant = {
  id: number;
  email: string;
  role: "worker" | "business_client" | "admin";
  WorkerProfile?: { firstName: string; lastName: string };
};

export interface Dispute {
  id: number;
  reason:
    "payment" | "no_show" | "late_cancellation" | "work_quality" | "other";
  description: string;
  disputedAmount: string | null;
  status: DisputeStatus;
  decision: DisputeDecision | null;
  resolvedAmount: string | null;
  adminComment: string | null;
  resolvedAt?: string | null;
  created_at: string;
  Initiator: DisputeParticipant;
  Respondent: DisputeParticipant;
  Shift: {
    id: number;
    startTime: string;
    JobPosition?: { title: string };
    Location?: { Company?: { id: number; name: string } };
  };
  Messages?: Array<{
    id: number;
    message: string;
    created_at: string;
    Author?: DisputeParticipant;
  }>;
  AssignedAdmin?: DisputeParticipant;
  Events?: Array<{
    id: number;
    type: string;
    payload: Record<string, unknown> | null;
    created_at: string;
    Actor?: DisputeParticipant;
  }>;
}
export interface DisputePage {
  data: Dispute[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export const getAdminDisputes = async (params?: {
  page?: number;
  limit?: number;
  status?: DisputeStatus;
  search?: string;
}): Promise<DisputePage> =>
  (
    await api.get<DisputePage>("/admin/disputes", {
      params: { limit: 20, ...params },
    })
  ).data;
export const getAdminDisputeStatusCounts = async (): Promise<
  Record<DisputeStatus, number>
> =>
  (
    await api.get<Record<DisputeStatus, number>>(
      "/admin/disputes/status-counts",
    )
  ).data;
export const getMyDisputes = async (params?: {
  shiftId?: number;
  page?: number;
  limit?: number;
}): Promise<DisputePage> =>
  (
    await api.get<DisputePage>("/disputes/my", {
      params: { limit: 20, ...params },
    })
  ).data;
export const getDispute = async (id: number) =>
  (await api.get<{ data: Dispute }>(`/disputes/${id}`)).data.data;
export const addDisputeMessage = async (id: number, message: string) =>
  (await api.post(`/disputes/${id}/messages`, { message })).data;
export const settleDispute = async (id: number) =>
  (await api.post<{ data: Dispute }>(`/disputes/${id}/settle`)).data.data;
export const escalateDispute = async (id: number) =>
  (await api.post<{ data: Dispute }>(`/disputes/${id}/escalate`)).data.data;
export const appealDispute = async (id: number, message: string) =>
  (await api.post<{ data: Dispute }>(`/disputes/${id}/appeal`, { message }))
    .data.data;
export const updateAdminDisputeStatus = async (
  id: number,
  status: "awaiting_response" | "under_review",
) =>
  (
    await api.patch<{ data: Dispute }>(`/admin/disputes/${id}/status`, {
      status,
    })
  ).data.data;
export const resolveDispute = async (
  id: number,
  payload: {
    decision: DisputeDecision;
    resolvedAmount?: number;
    adminComment: string;
  },
) =>
  (await api.post<{ data: Dispute }>(`/admin/disputes/${id}/resolve`, payload))
    .data.data;

export const createDispute = async (payload: {
  shiftId: number;
  reason: Dispute["reason"];
  description: string;
  disputedAmount?: number;
}) => (await api.post<{ data: Dispute }>("/disputes", payload)).data.data;
