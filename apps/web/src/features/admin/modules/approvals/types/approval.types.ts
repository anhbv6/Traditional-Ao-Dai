import { type ApprovalAction, type ApprovalStatus } from "@repo/db";

export interface ApprovalRequestItem {
  id: string;
  actionType: ApprovalAction;
  /** Id đối tượng bị tác động (vd. đơn hàng) */
  targetId: string | null;
  description: string;
  payload: Record<string, unknown> | null;
  status: ApprovalStatus;
  requestedById: string;
  reviewedById: string | null;
  rejectReason: string | null;
  reviewedAt: Date | null;
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
