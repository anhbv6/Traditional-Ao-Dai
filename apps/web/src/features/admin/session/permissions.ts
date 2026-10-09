/**
 * Ma trận phân quyền khu vực quản trị — NGUỒN DUY NHẤT cho menu, page (requireAdminPage),
 * Server Action (authorizeAdminAction) và ẩn/hiện nút trên UI. File thuần, dùng được cả server lẫn client.
 *
 * Nguyên tắc:
 * - ADMIN (Super Admin) có toàn quyền.
 * - STAFF chỉ vào được module khi được cấp quyền tương ứng trong StaffPermission (quyền tối thiểu).
 * - Module `role: "ADMIN"` chỉ dành cho Super Admin (nhân sự, voucher).
 */

export type StaffPermissionField =
  | "canManageOrders"
  | "canUpdateTailoring"
  | "canManageInventory"
  | "canViewReports"
  | "canManageContent";

export type StaffPermissions = Record<StaffPermissionField, boolean>;

/** Thứ tự hiển thị các quyền chi tiết (bảng phân quyền, form tạo nhân viên) */
export const STAFF_PERMISSION_FIELDS: readonly StaffPermissionField[] = [
  "canManageOrders",
  "canUpdateTailoring",
  "canManageInventory",
  "canViewReports",
  "canManageContent",
];

export interface AdminAccessRule {
  /** Chỉ Super Admin */
  role?: "ADMIN";
  /** Quyền chi tiết STAFF cần có (ADMIN luôn qua) */
  permission?: StaffPermissionField;
  /** STAFF chỉ cần có MỘT trong các quyền này */
  anyOf?: readonly StaffPermissionField[];
}

/** Người dùng tối thiểu cần để kiểm tra quyền */
export interface AdminAccessSubject {
  role: string;
  staffPermission?: StaffPermissions | null;
}

export type AdminModule =
  | "dashboard"
  | "orders"
  | "tailoring"
  | "products"
  | "inventory"
  | "customers"
  | "approvals"
  | "staff"
  | "vouchers"
  | "cms";

/**
 * Quyền truy cập (xem trang) theo module
 */
export const ADMIN_MODULE_ACCESS: Record<AdminModule, AdminAccessRule> = {
  dashboard: {},
  orders: { permission: "canManageOrders" },
  tailoring: { permission: "canUpdateTailoring" },
  products: { permission: "canManageInventory" },
  inventory: { permission: "canManageInventory" },
  // Nhân viên xử lý đơn cần tra cứu khách hàng & số đo; khóa/mở tài khoản chỉ ADMIN (xem ADMIN_ACTION_ACCESS)
  customers: { permission: "canManageOrders" },
  // STAFF xem được hàng đợi của chính mình; duyệt/từ chối chỉ ADMIN
  approvals: {},
  staff: { role: "ADMIN" },
  vouchers: { role: "ADMIN" },
  cms: { permission: "canManageContent" },
};

/**
 * Quyền cho các thao tác nhạy cảm bên trong module
 */
export const ADMIN_ACTION_ACCESS = {
  reviewApproval: { role: "ADMIN" },
  toggleCustomerActive: { role: "ADMIN" },
  viewReports: { permission: "canViewReports" },
  /** Danh sách đơn trên dashboard: phục vụ cả xử lý đơn lẫn theo dõi may đo */
  viewDashboardOrders: { anyOf: ["canManageOrders", "canUpdateTailoring"] },
  manageOrders: { permission: "canManageOrders" },
  updateTailoring: { permission: "canUpdateTailoring" },
  manageInventory: { permission: "canManageInventory" },
} as const satisfies Record<string, AdminAccessRule>;

/**
 * Kiểm tra người dùng có thỏa quy tắc truy cập hay không
 */
export function canAccess(user: AdminAccessSubject | null | undefined, rule: AdminAccessRule = {}): boolean {
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) return false;
  if (user.role === "ADMIN") return true;
  if (rule.role === "ADMIN") return false;
  if (rule.permission && !user.staffPermission?.[rule.permission]) return false;
  if (rule.anyOf && !rule.anyOf.some((field) => user.staffPermission?.[field])) return false;
  return true;
}
