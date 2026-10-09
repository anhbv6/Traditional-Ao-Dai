import { type StaffPermissions } from "../../session/permissions";

/** Bộ 5 quyền chi tiết của nhân viên (khớp model StaffPermission) */
export type StaffPermissionInput = StaffPermissions;

export interface StaffMemberItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  /** null = chưa từng được cấp quyền -> không có quyền chi tiết nào */
  staffPermission: (StaffPermissions & { id: string }) | null;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  permissions: StaffPermissionInput;
}
