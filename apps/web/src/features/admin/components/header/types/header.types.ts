import { type LucideIcon } from "lucide-react";
import { type AuthUser } from "@/features/auth/types/auth.types";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  active?: boolean;
}

export interface AdminHeaderProps {
  user: AuthUser | null;
  isSuperAdmin: boolean;
  navLinks: AdminNavItem[];
  isLoggingOut?: boolean;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export interface AdminUserMenuProps {
  user: AuthUser | null;
  isSuperAdmin: boolean;
  isLoggingOut?: boolean;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export interface AdminSubNavProps {
  items: AdminNavItem[];
}

export interface AdminLayoutState {
  user: AuthUser | null;
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
