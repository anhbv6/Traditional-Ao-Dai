import { type LucideIcon } from "lucide-react";
import { type AdminSessionUser } from "../../server/adminAuth.server";
import { type AdminModule } from "../../session/permissions";

/** Một trang trong menu; mục con của nhóm không có icon */
export interface AdminNavLink {
  type: "link";
  key: AdminModule;
  label: string;
  href: string;
  icon?: LucideIcon;
  active: boolean;
}

/** Nhóm menu thu gọn được; `active` khi một mục con đang mở */
export interface AdminNavGroup {
  type: "group";
  key: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  children: AdminNavLink[];
}

export type AdminNavEntry = AdminNavLink | AdminNavGroup;

export interface AdminHeaderProps {
  user: AdminSessionUser | null;
  isSuperAdmin: boolean;
  navLinks: AdminNavEntry[];
  isLoggingOut?: boolean;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export interface AdminNavPanelProps extends AdminHeaderProps {
  /** Gọi khi chọn một liên kết (ngăn kéo mobile dùng để tự đóng) */
  onNavigate?: () => void;
  /** Kiểu khối tài khoản ở đáy thẻ */
  accountVariant?: "sidebar" | "drawer";
}

export interface AdminUserMenuProps {
  user: AdminSessionUser | null;
  isSuperAdmin: boolean;
  isLoggingOut?: boolean;
  onOpenProfile: () => void;
  onLogout: () => void;
  /**
   * `header`: nút gọn trên thanh mobile · `sidebar`: nút rộng ở đáy menu trái, menu mở lên trên ·
   * `corner`: nút rộng ở góc trên phải (cột phải), menu mở xuống · `drawer`: thao tác trực tiếp trong ngăn kéo
   */
  variant?: "header" | "sidebar" | "corner" | "drawer";
}

export interface AdminNavListProps {
  items: AdminNavEntry[];
  /** Gọi khi chọn một mục (ngăn kéo mobile dùng để tự đóng) */
  onNavigate?: () => void;
  className?: string;
}

export interface AdminLayoutState {
  user: AdminSessionUser | null;
  currentRole: string | undefined;
  isSuperAdmin: boolean;
  isLoginPage: boolean;
  isAccessDenied: boolean;
  isHydrated: boolean;
  isLoggingOut: boolean;
  navLinks: AdminNavEntry[];
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  handleLogout: () => Promise<void>;
}
