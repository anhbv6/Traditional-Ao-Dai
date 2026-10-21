import {
  LayoutDashboard,
  ShoppingBag,
  Scissors,
  Shirt,
  Boxes,
  Users,
  UserCheck,
  Ticket,
  FileText,
} from "lucide-react";
import { type AdminNavItem } from "../types/header.types";
import { ADMIN_MODULE_ACCESS, canAccess, type AdminAccessSubject } from "../../session/permissions";

/** Cấu hình menu — nhãn dịch theo `AdminPage.nav.<key>` */
export const ADMIN_NAV_CONFIG: Omit<AdminNavItem, "active" | "label">[] = [
  {
    key: "dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    key: "tailoring",
    href: "/admin/tailoring",
    icon: Scissors,
  },
  {
    key: "products",
    href: "/admin/products",
    icon: Shirt,
  },
  {
    key: "inventory",
    href: "/admin/inventory",
    icon: Boxes,
  },
  {
    key: "customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    key: "approvals",
    href: "/admin/approvals",
    icon: UserCheck,
  },
  {
    key: "staff",
    href: "/admin/staff",
    icon: Users,
  },
  {
    key: "vouchers",
    href: "/admin/vouchers",
    icon: Ticket,
  },
  {
    key: "cms",
    href: "/admin/cms",
    icon: FileText,
  },
];

/**
 * Lấy danh sách menu quản trị: lọc theo ma trận quyền (ADMIN_MODULE_ACCESS), gán active và dịch nhãn.
 * Menu chỉ hiển thị module mà người dùng thực sự vào được — trùng khớp với requireAdminPage ở server.
 */
export function getAdminNavLinks(
  pathname: string | null,
  user: AdminAccessSubject | null,
  tNav: (key: string) => string
): AdminNavItem[] {
  return ADMIN_NAV_CONFIG.filter((item) => canAccess(user, ADMIN_MODULE_ACCESS[item.key])).map((item) => ({
    ...item,
    label: tNav(item.key),
    active: pathname ? pathname.includes(item.href) : false,
  }));
}
