import { type LucideIcon } from "lucide-react";
import { type AdminSessionUser } from "../../server/adminAuth.server";
import { type AdminModule } from "../../session/permissions";

export interface AdminNavItem {
  key: AdminModule;
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
}

export interface AdminHeaderProps {
  user: AdminSessionUser | null;
  isSuperAdmin: boolean;
  navLinks: AdminNavItem[];
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
  /** `header`: nút gọn trên thanh mobile · `sidebar`: nút rộng ở đáy menu trái, menu mở lên trên · `drawer`: thao tác trực tiếp trong ngăn kéo */
  variant?: "header" | "sidebar" | "drawer";
}

export interface AdminNavListProps {
  items: AdminNavItem[];
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
  navLinks: AdminNavItem[];
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  handleLogout: () => Promise<void>;
}
