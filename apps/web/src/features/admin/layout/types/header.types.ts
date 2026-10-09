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
