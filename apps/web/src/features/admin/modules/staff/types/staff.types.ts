import { type UserStatus } from "@repo/db";
import { type Permission } from "../../../core/session/permissions";

export interface StaffMemberItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  /** Rỗng = chưa được cấp quyền chi tiết nào */
  permissions: Permission[];
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  permissions: Permission[];
}

/** Một dòng màn Nhân sự (ngày giờ dạng ISO để truyền qua Server Component) */
export interface StaffRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "LOCKED";
  permissions: Permission[];
  lastLoginAt: string | null;
  createdAt: string;
  /** Số thao tác ghi nhật ký (AuditLog + cập nhật xưởng) trong 30 ngày */
  activity30d: number;
  lastActivityAt: string | null;
}

export interface StaffBoardData {
  staff: StaffRow[];
  /** Super Admin đang xem — không tự khóa chính mình */
  currentUserId: string;
  now: string;
}

/** Một dòng hoạt động gần đây của nhân viên */
export interface StaffActivity {
  id: string;
  /** "AUDIT" = thao tác quản trị (mã action), "TAILORING" = cập nhật công đoạn xưởng */
  source: "AUDIT" | "TAILORING";
  action: string;
  /** Mã đơn / mã đối tượng để dễ nhận ra */
  reference: string | null;
  createdAt: string;
}

export interface StaffDetailData extends StaffRow {
  activeSessions: number;
  activities: StaffActivity[];
  now: string;
}
