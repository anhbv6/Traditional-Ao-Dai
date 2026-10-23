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
