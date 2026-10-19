import { CreditCard, MapPin, Package, Settings, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";

export type ProfileSectionId = "personal" | "orders" | "address" | "payment" | "security" | "setting";

export interface ProfileSectionConfig {
  id: ProfileSectionId;
  /** Route riêng cho từng mục → link từ header / email đi thẳng tới đúng mục, F5 không mất vị trí */
  href: string;
  icon: LucideIcon;
}

/** Thứ tự mục trong menu tài khoản. Nhãn: ProfilePage.tabs.<id>, mô tả: ProfilePage.<id>.subtitle */
export const PROFILE_SECTIONS: readonly ProfileSectionConfig[] = [
  { id: "personal", href: "/profile", icon: UserRound },
  { id: "orders", href: "/profile/orders", icon: Package },
  { id: "address", href: "/profile/addresses", icon: MapPin },
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
