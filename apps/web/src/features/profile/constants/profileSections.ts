import { CreditCard, Settings, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";

export type ProfileSectionId = "personal" | "payment" | "security" | "setting";

export interface ProfileSectionConfig {
  id: ProfileSectionId;
  /** Route riêng cho từng mục → link từ header / email đi thẳng tới đúng mục, F5 không mất vị trí */
  href: string;
  icon: LucideIcon;
}

/**
 * Thứ tự mục trong menu tài khoản. Nhãn: ProfilePage.tabs.<id>, mô tả: ProfilePage.<id>.subtitle.
 * Đơn hàng + Sổ địa chỉ đã tách sang màn riêng /my-orders (ProfileShell chỉ đặt một liên kết sang đó).
 */
export const PROFILE_SECTIONS: readonly ProfileSectionConfig[] = [
  { id: "personal", href: "/profile", icon: UserRound },
  { id: "payment", href: "/profile/payment", icon: CreditCard },
  { id: "security", href: "/profile/security", icon: ShieldCheck },
  { id: "setting", href: "/profile/settings", icon: Settings },
];

/** Mục đang mở theo đường dẫn (không có locale) — mặc định Thông tin cá nhân */
export function getActiveSection(pathname: string): ProfileSectionConfig {
  return (
    PROFILE_SECTIONS.find((section) => section.href !== "/profile" && pathname.startsWith(section.href)) ??
    PROFILE_SECTIONS[0]
  );
}
