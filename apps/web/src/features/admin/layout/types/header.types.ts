import { type LucideIcon } from "lucide-react";
import { type AdminSessionUser } from "../../server/adminAuth.server";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
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

export interface AdminUserMenuProps {
  user: AdminSessionUser | null;
  isSuperAdmin: boolean;
  isLoggingOut?: boolean;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export interface AdminSubNavProps {
  items: AdminNavItem[];
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
