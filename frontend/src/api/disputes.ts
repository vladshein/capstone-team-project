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
type Participant = {
  id: number;
  email: string;
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
  created_at: string;
  Initiator: Participant;
  Respondent: Participant;
  Shift: {
    id: number;
    startTime: string;
    JobPosition?: { title: string };
    Location?: { Company?: { name: string } };
  };
  Evidence?: Array<{ id: number; fileUrl: string; originalName: string }>;
  Messages?: Array<{ id: number; message: string; created_at: string }>;
}
export interface DisputePage {
  data: Dispute[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export const getAdminDisputes = async (): Promise<DisputePage> =>
  (await api.get<DisputePage>("/admin/disputes")).data;
export const getDispute = async (id: number) =>
  (await api.get<{ data: Dispute }>(`/disputes/${id}`)).data.data;
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

export const uploadDisputeEvidence = async (id: number, files: File[]) => {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  await api.post(`/disputes/${id}/evidence`, form);
};
