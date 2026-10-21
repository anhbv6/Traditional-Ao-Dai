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

export const ADMIN_NAV_CONFIG: Omit<AdminNavItem, "active">[] = [
  {
    key: "dashboard",
    label: "Tổng quan",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "orders",
    label: "Đơn hàng",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    key: "tailoring",
    label: "Xưởng may đo",
    href: "/admin/tailoring",
    icon: Scissors,
  },
  {
    key: "products",
    label: "Sản phẩm",
    href: "/admin/products",
    icon: Shirt,
  },
  {
    key: "inventory",
    label: "Tồn kho",
    href: "/admin/inventory",
    icon: Boxes,
  },
  {
    key: "customers",
    label: "Khách hàng",
    href: "/admin/customers",
    icon: Users,
  },
  {
    key: "approvals",
    label: "Phê duyệt",
    href: "/admin/approvals",
    icon: UserCheck,
  },
  {
    key: "staff",
    label: "Nhân sự",
    href: "/admin/staff",
    icon: Users,
  },
  {
    key: "vouchers",
    label: "Voucher",
    href: "/admin/vouchers",
    icon: Ticket,
  },
  {
    key: "cms",
    label: "Nội dung & FAQ",
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
  tNav?: (key: string) => string
): AdminNavItem[] {
  return ADMIN_NAV_CONFIG.filter((item) => canAccess(user, ADMIN_MODULE_ACCESS[item.key])).map((item) => ({
    ...item,
    label: tNav ? tNav(item.key) : item.label,
    active: pathname ? pathname.includes(item.href) : false,
  }));
}
