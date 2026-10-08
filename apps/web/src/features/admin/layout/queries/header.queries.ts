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

export const ADMIN_NAV_CONFIG: Omit<AdminNavItem, "active">[] = [
  {
    key: "dashboard",
    label: "Tổng quan",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    key: "orders",
    label: "Đơn hàng",
    href: "/admin/orders",
    icon: ShoppingBag,
    adminOnly: false,
  },
  {
    key: "tailoring",
    label: "Xưởng may đo",
    href: "/admin/tailoring",
    icon: Scissors,
    adminOnly: false,
  },
  {
    key: "products",
    label: "Sản phẩm",
    href: "/admin/products",
    icon: Shirt,
    adminOnly: false,
  },
  {
    key: "inventory",
    label: "Tồn kho",
    href: "/admin/inventory",
    icon: Boxes,
    adminOnly: false,
  },
  {
    key: "customers",
    label: "Khách hàng",
    href: "/admin/customers",
    icon: Users,
    adminOnly: false,
  },
  {
    key: "approvals",
    label: "Phê duyệt",
    href: "/admin/approvals",
    icon: UserCheck,
    adminOnly: false,
  },
  {
    key: "staff",
    label: "Nhân sự",
    href: "/admin/staff",
    icon: Users,
    adminOnly: true,
  },
  {
    key: "vouchers",
    label: "Voucher",
    href: "/admin/vouchers",
    icon: Ticket,
    adminOnly: true,
  },
  {
    key: "cms",
    label: "Nội dung & FAQ",
    href: "/admin/cms",
    icon: FileText,
    adminOnly: false,
  },
];

/**
 * Lấy danh sách menu quản trị viên, tự động lọc theo quyền Super Admin,
 * gán trạng thái active và dịch nhãn qua i18n nếu có hàm tNav.
 */
export function getAdminNavLinks(
  pathname: string | null,
  isSuperAdmin: boolean,
  tNav?: (key: string) => string
): AdminNavItem[] {
  return ADMIN_NAV_CONFIG.filter((item) => {
    if (item.adminOnly && !isSuperAdmin) {
      return false;
    }
    return true;
  }).map((item) => ({
    ...item,
    label: tNav ? tNav(item.key) : item.label,
    active: pathname ? pathname.includes(item.href) : false,
  }));
}
