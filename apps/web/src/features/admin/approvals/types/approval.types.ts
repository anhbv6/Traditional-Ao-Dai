import { type ApprovalStatus } from "@repo/db";

export type ApprovalActionType =
  | "CANCEL_ORDER"
  | "SPECIAL_DISCOUNT"
  | "PRICE_OVERRIDE"
  | "REFUND";

export interface CreateApprovalInput {
  actionType: ApprovalActionType;
  description: string;
  payload: Record<string, unknown>;
  requestedById: string;
}

export interface ReviewApprovalInput {
  requestId: string;
  status: "APPROVED" | "REJECTED";
  reviewedById: string;
  rejectReason?: string;
}

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
