"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LogoutDialog, useAuthStore } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackButton } from "@/components/shared/BackButton";
import { cn } from "@/lib/utils";
import { PROFILE_SECTIONS, getActiveSection } from "../constants/profileSections";

const EASE = [0.22, 1, 0.36, 1] as const;

function getInitials(name?: string | null) {
  if (!name?.trim()) return null;
  const [first, second] = name.trim().split(/\s+/);
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}

/**
 * Khung chung của mọi trang tài khoản (/profile/*):
 * - Tiêu đề cùng khuôn Yêu thích / Giỏ hàng / Thông báo: mũi tên quay lại + eyebrow → tên mục + mô tả mục.
 * - Desktop: menu trái (thẻ người dùng · các mục · Đăng xuất), bám khi cuộn; nội dung bên phải.
 * - Mobile: menu thành hàng chip cuộn ngang phía trên nội dung.
 * - Đăng xuất là MỘT mục cuối menu (cùng kiểu với các mục khác), xác nhận qua LogoutDialog chung.
 * Mỗi mục là một route riêng → link từ header ("Đơn hàng") mở đúng mục, tải lại trang không mất vị trí.
 */
/** Kiểu chung cho mọi mục menu (link mục + nút Đăng xuất) → các mục luôn đồng đều */
const NAV_ITEM_CLASS = cn(
  "flex cursor-pointer items-center gap-2 whitespace-nowrap border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1.5px] outline-none transition-colors",
  "focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
  "lg:-ml-px lg:w-full lg:border-0 lg:border-l-2 lg:px-4 lg:py-3 lg:text-[13px] lg:normal-case lg:tracking-normal",
);
const NAV_ITEM_ACTIVE =
  "border-[var(--primary-color)] bg-[var(--primary-color)] text-white lg:border-[var(--primary-color)] lg:bg-[color-mix(in_oklab,var(--primary-color)_6%,transparent)] lg:text-[var(--primary-ink)]";
const NAV_ITEM_IDLE =
  "border-transparent text-[var(--text-light)] hover:border-[var(--border)] hover:text-[var(--primary-ink)] lg:border-transparent lg:bg-transparent lg:text-[var(--text-main)] lg:hover:bg-[var(--bg-card)]";

export function ProfileShell({ children }: { children: ReactNode }) {
  const t = useTranslations("ProfilePage");
  const tCommon = useTranslations("Common");
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [openLogout, setOpenLogout] = useState(false);

  const active = getActiveSection(pathname);
  const displayName = user?.name || user?.email || user?.phone || "";

  return (
    <div className="font-[family-name:var(--font-lora)] text-[var(--text-main)]">
      {/* Tiêu đề trang theo mục đang mở */}
      <header className="mb-8 sm:mb-10">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex items-center gap-2"
        >
          <BackButton variant="inline" />
          <p className="text-[10px] uppercase tracking-[3px] text-[var(--text-light)] sm:text-[11px]">{t("eyebrow")}</p>
        </motion.div>
        <motion.h1
          key={active.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl"
        >
          {t(`tabs.${active.id}`)}
        </motion.h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-[var(--text-light)]">{t(`${active.id}.subtitle`)}</p>
      </header>

      <div className="lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[270px_minmax(0,1fr)] xl:gap-14">
        <aside className="mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-28">
            {/* Thẻ người dùng (desktop) */}
            <div className="mb-5 hidden items-center gap-3 border-b border-[var(--border)] pb-5 lg:flex">
              <Avatar size="lg" className="shrink-0 border border-[var(--border)]">
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={displayName} className="object-cover" /> : null}
                <AvatarFallback className="bg-[var(--bg-main)] text-xs font-bold uppercase text-[var(--primary-ink)]">
                  {getInitials(displayName) || <UserRound size={18} strokeWidth={1.6} aria-hidden="true" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-playfair)] text-[15px] font-semibold text-[var(--primary-ink)]">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-[var(--text-light)]">{t("memberSince")}</p>
              </div>
            </div>

            {/* Menu mục: dọc trên desktop, chip cuộn ngang trên mobile */}
            <nav aria-label={t("navLabel")}>
              <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-[var(--border)] lg:px-0 [&::-webkit-scrollbar]:hidden">
                {PROFILE_SECTIONS.map(({ id, href, icon: Icon }) => {
                  const isActive = id === active.id;
                  return (
                    <li key={id} className="shrink-0">
                      <Link
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(NAV_ITEM_CLASS, isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE)}
                      >
                        <Icon aria-hidden="true" className="hidden size-4 shrink-0 text-[var(--primary-ink)] lg:block" strokeWidth={1.6} />
                        <span className="lg:flex-1">{t(`tabs.${id}`)}</span>
                      </Link>
                    </li>
                  );
                })}

                {/* Đăng xuất: cùng kiểu mục menu, tách bằng vạch mảnh trên desktop */}
                <li className="shrink-0 lg:mt-3 lg:border-t lg:border-[var(--border)] lg:pt-3">
                  <button
                    type="button"
                    onClick={() => setOpenLogout(true)}
                    className={cn(
                      NAV_ITEM_CLASS,
                      "border-transparent text-[var(--destructive)] hover:border-[color-mix(in_oklab,var(--destructive)_40%,transparent)]",
                      "lg:border-transparent lg:text-[var(--destructive)] lg:hover:bg-[color-mix(in_oklab,var(--destructive)_6%,transparent)]",
                    )}
                  >
                    <LogOut aria-hidden="true" className="hidden size-4 shrink-0 lg:block" strokeWidth={1.6} />
                    <span className="lg:flex-1 lg:text-left">{tCommon("logout")}</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">{children}</div>
      </div>

      <LogoutDialog open={openLogout} onOpenChange={setOpenLogout} />
    </div>
  );
}
