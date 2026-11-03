import {
  FolderTree,
  LayoutDashboard,
  Settings,
  Shirt,
  ShoppingBag,
  Ticket,
  UserCheck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { type AdminNavEntry, type AdminNavLink } from "../types/header.types";
import { ADMIN_MODULE_ACCESS, canAccess, type AdminAccessSubject, type AdminModule } from "../../session/permissions";

interface NavLeafConfig {
  key: AdminModule;
  href: string;
}

type NavConfig =
  | (NavLeafConfig & { icon: LucideIcon })
  | { group: string; icon: LucideIcon; children: NavLeafConfig[] };

/** Cấu hình menu — nhãn dịch theo `AdminPage.nav.<key>`, nhóm theo `AdminPage.nav.groups.<group>` */
export const ADMIN_NAV_CONFIG: NavConfig[] = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    group: "catalog",
    icon: FolderTree,
    children: [
      { key: "collections", href: "/admin/catalog/collections" },
      { key: "categories", href: "/admin/catalog/categories" },
      { key: "materials", href: "/admin/catalog/materials" },
      { key: "attributes", href: "/admin/catalog/attributes" },
      { key: "sizeCharts", href: "/admin/catalog/size-charts" },
    ],
  },
  { key: "products", href: "/admin/products", icon: Shirt },
  {
    group: "warehouse",
    icon: Warehouse,
    children: [
      { key: "fabrics", href: "/admin/inventory/fabrics" },
      { key: "inventory", href: "/admin/inventory/skus" },
      { key: "inventoryHistory", href: "/admin/inventory/history" },
    ],
  },
  {
    group: "sales",
    icon: ShoppingBag,
    children: [
      { key: "tailoring", href: "/admin/tailoring" },
      { key: "orders", href: "/admin/orders" },
      { key: "returns", href: "/admin/returns" },
    ],
  },
  {
    group: "people",
    icon: Users,
    children: [
      { key: "customers", href: "/admin/customers" },
      { key: "staff", href: "/admin/staff" },
    ],
  },
  {
    group: "promotions",
    icon: Ticket,
    children: [
      { key: "vouchers", href: "/admin/vouchers" },
      { key: "saleEvents", href: "/admin/sale-events" },
    ],
  },
  {
    group: "approval",
    icon: UserCheck,
    children: [
      { key: "approvals", href: "/admin/approvals" },
      { key: "approvalHistory", href: "/admin/approvals/history" },
      { key: "approvalMine", href: "/admin/approvals/mine" },
    ],
  },
  {
    group: "settings",
    icon: Settings,
    children: [
      { key: "shippingPayment", href: "/admin/settings/shipping-payment" },
      { key: "rolePermissions", href: "/admin/settings/permissions" },
      { key: "cms", href: "/admin/cms" },
    ],
  },
];

const NAV_LEAVES: NavLeafConfig[] = ADMIN_NAV_CONFIG.flatMap((entry) => ("group" in entry ? entry.children : [entry]));

/** URL (đã kèm locale) có nằm dưới `href` hay không — so theo ranh giới đoạn để /orders không khớp /orders-x */
const isUnder = (pathname: string, href: string) => pathname.endsWith(href) || pathname.includes(`${href}/`);

/**
 * Module ứng với URL hiện tại: chọn mục menu có `href` dài nhất khớp URL,
 * để /admin/approvals/history thuộc "Lịch sử" chứ không phải "Danh sách" (/admin/approvals)
 */
export function findAdminModuleByPath(pathname: string | null): AdminModule | undefined {
  if (!pathname) return undefined;
  return NAV_LEAVES.filter((leaf) => isUnder(pathname, leaf.href)).sort((a, b) => b.href.length - a.href.length)[0]
    ?.key;
}

/**
 * Menu quản trị: lọc theo ma trận quyền (ADMIN_MODULE_ACCESS), gán active và dịch nhãn.
 * Nhóm không còn mục con nào người dùng vào được thì ẩn luôn — trùng khớp với requireAdminPage ở server.
 */
export function getAdminNavEntries(
  pathname: string | null,
  user: AdminAccessSubject | null,
  tNav: (key: string) => string
): AdminNavEntry[] {
  const activeKey = findAdminModuleByPath(pathname);

  const toLink = (leaf: NavLeafConfig, icon?: LucideIcon): AdminNavLink => ({
    type: "link",
    key: leaf.key,
    href: leaf.href,
    icon,
    label: tNav(leaf.key),
    active: leaf.key === activeKey,
  });
  const allowed = (leaf: NavLeafConfig) => canAccess(user, ADMIN_MODULE_ACCESS[leaf.key]);

  return ADMIN_NAV_CONFIG.flatMap<AdminNavEntry>((entry) => {
    if (!("group" in entry)) return allowed(entry) ? [toLink(entry, entry.icon)] : [];

    const children = entry.children.filter(allowed).map((leaf) => toLink(leaf));
    if (children.length === 0) return [];

    return [
      {
        type: "group",
        key: entry.group,
        icon: entry.icon,
        label: tNav(`groups.${entry.group}`),
        active: children.some((child) => child.active),
        children,
      },
    ];
  });
}
