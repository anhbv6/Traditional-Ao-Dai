"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Bell, LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuthStore, useCustomerLogout } from "@/features/auth";
import { useNotifications } from "@/features/notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActionButton } from "@/components/shared/ActionButton";
import { BackButton } from "@/components/shared/BackButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
 * - Desktop: menu trái (thẻ người dùng · các mục · Thông báo · Đăng xuất), bám khi cuộn; nội dung bên phải.
 * - Mobile: menu thành hàng chip cuộn ngang phía trên nội dung.
 * Mỗi mục là một route riêng → link từ header ("Đơn hàng") mở đúng mục, tải lại trang không mất vị trí.
 */
export function ProfileShell({ children }: { children: ReactNode }) {
  const t = useTranslations("ProfilePage");
  const tCommon = useTranslations("Common");
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { unreadCount } = useNotifications();
  const [openLogout, setOpenLogout] = useState(false);
  const { logout, isLoggingOut } = useCustomerLogout();

  const active = getActiveSection(pathname);
  const displayName = user?.name || user?.email || user?.phone || "";

  const navItems = [
    ...PROFILE_SECTIONS.map((section) => ({
      key: section.id,
      href: section.href,
      icon: section.icon,
      label: t(`tabs.${section.id}`),
      active: section.id === active.id,
      count: 0,
    })),
    { key: "notifications", href: "/notifications", icon: Bell, label: tCommon("notifications"), active: false, count: unreadCount },
  ];

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
                {user?.avatar ? <AvatarImage src={user.avatar} alt={displayName} className="object-cover" /> : null}
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
                {navItems.map(({ key, href, icon: Icon, label, active: isActive, count }) => (
                  <li key={key} className={cn("shrink-0", key === "notifications" && "lg:mt-3 lg:border-t lg:border-[var(--border)] lg:pt-3")}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 whitespace-nowrap border text-[11px] font-semibold uppercase tracking-[1.5px] transition-colors",
                        "px-3 py-1.5",
                        isActive
                          ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                          : "border-transparent text-[var(--text-light)] hover:border-[var(--border)] hover:text-[var(--primary-ink)]",
                        "lg:-ml-px lg:w-full lg:border-0 lg:border-l-2 lg:bg-transparent lg:px-4 lg:py-3 lg:text-[13px] lg:normal-case lg:tracking-normal",
                        isActive
                          ? "lg:border-[var(--primary-color)] lg:bg-[color-mix(in_oklab,var(--primary-color)_6%,transparent)] lg:text-[var(--primary-ink)]"
                          : "lg:border-transparent lg:text-[var(--text-main)] lg:hover:bg-[var(--bg-card)]",
                      )}
                    >
                      <Icon aria-hidden="true" className="hidden size-4 shrink-0 text-[var(--primary-ink)] lg:block" strokeWidth={1.6} />
                      <span className="lg:flex-1">{label}</span>
                      {count > 0 ? (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary-color)] px-1.5 text-[10px] font-bold text-white tabular-nums lg:ml-auto">
                          {count > 99 ? "99+" : count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <ActionButton
              variant="cancel"
              size="sm"
              fullWidth
              icon={<LogOut />}
              onClick={() => setOpenLogout(true)}
              className="mt-5 hidden lg:inline-flex"
            >
              {tCommon("logout")}
            </ActionButton>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {children}

          {/* Đăng xuất trên mobile: đặt cuối trang để không lẫn với các mục */}
          <ActionButton
            variant="cancel"
            size="md"
            fullWidth
            icon={<LogOut />}
            onClick={() => setOpenLogout(true)}
            className="lg:hidden"
          >
            {tCommon("logout")}
          </ActionButton>
        </div>
      </div>

      <ConfirmDialog
        open={openLogout}
        onOpenChange={setOpenLogout}
        confirmVariant="destructive"
        title={t("logoutDialog.title")}
        description={t("logoutDialog.message")}
        confirmText={t("logoutDialog.confirmBtn")}
        cancelText={t("logoutDialog.cancelBtn")}
        isLoading={isLoggingOut}
        customTitle="text-lg sm:text-2xl"
        onConfirm={logout}
      />
    </div>
  );
}
