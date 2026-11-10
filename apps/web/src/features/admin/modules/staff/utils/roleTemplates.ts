import { STAFF_PERMISSIONS, type Permission } from "../../../core/session/permissions";

/**
 * Vai trò mẫu — chỉ là bộ quyền gợi ý để cấp nhanh theo công việc thực tế của tiệm, KHÔNG lưu thành vai trò riêng
 * (DB chỉ có `User.permissions`). Đổi quyền lẻ sau khi áp mẫu vẫn được; dòng nhân viên ghi "khớp mẫu" khi trùng hẳn.
 */
export const ROLE_TEMPLATES = [
  { key: "SALES", permissions: ["MANAGE_ORDERS"] },
  { key: "WORKSHOP", permissions: ["UPDATE_TAILORING"] },
  { key: "STOCK", permissions: ["MANAGE_INVENTORY"] },
  { key: "CONTENT", permissions: ["MANAGE_CONTENT"] },
  { key: "STORE_MANAGER", permissions: ["MANAGE_ORDERS", "UPDATE_TAILORING", "MANAGE_INVENTORY", "VIEW_REPORTS"] },
] as const satisfies readonly { key: string; permissions: readonly Permission[] }[];

export type RoleTemplateKey = (typeof ROLE_TEMPLATES)[number]["key"];

/** Sắp theo thứ tự chuẩn, bỏ trùng — để so sánh hai bộ quyền */
export const normalizePermissions = (permissions: readonly Permission[]): Permission[] =>
  STAFF_PERMISSIONS.filter((permission) => permissions.includes(permission));

export const samePermissions = (a: readonly Permission[], b: readonly Permission[]) =>
  normalizePermissions(a).join("|") === normalizePermissions(b).join("|");

/** Vai trò mẫu trùng khớp bộ quyền (null nếu là bộ quyền tùy chỉnh) */
export const matchTemplate = (permissions: readonly Permission[]): RoleTemplateKey | null =>
  ROLE_TEMPLATES.find((template) => samePermissions(template.permissions, permissions))?.key ?? null;
