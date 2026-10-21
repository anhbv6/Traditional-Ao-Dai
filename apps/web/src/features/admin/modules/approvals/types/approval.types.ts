import { type ApprovalStatus } from "@repo/db";

export interface ApprovalRequestItem {
  id: string;
  actionType: string;
  description: string;
  payload: Record<string, unknown> | null;
  status: ApprovalStatus;
  requestedById: string;
  reviewedById: string | null;
  rejectReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  requestedBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
  reviewedBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}
