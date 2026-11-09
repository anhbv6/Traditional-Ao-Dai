"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { MapPin, Package, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { BackButton } from "@/components/shared/BackButton";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const TABS = [
  { id: "orders", href: "/my-orders", icon: Package },
  { id: "addresses", href: "/my-orders/addresses", icon: MapPin },
] as const;

/**
 * Khung màn "Đơn hàng của tôi" (/my-orders/*) — tách khỏi trang tài khoản:
 * tiêu đề (quay lại · eyebrow · H1 · mô tả theo tab) + liên kết về Tài khoản, rồi thanh tab Đơn hàng | Sổ địa chỉ
 * (gạch chân đỏ đô trượt theo tab). Chi tiết một đơn (/my-orders/<mã>) vẫn thuộc tab Đơn hàng.
 */
export function MyOrdersShell({ children }: { children: ReactNode }) {
  const t = useTranslations("OrdersPage.myOrders");
  const pathname = usePathname();
  const activeId = pathname.startsWith("/my-orders/addresses") ? "addresses" : "orders";

  return (
    <div className="font-[family-name:var(--font-lora)] text-[var(--text-main)]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center gap-2"
          >
            <BackButton variant="inline" />
            <p className="text-[10px] uppercase tracking-[3px] text-[var(--text-light)] sm:text-[11px]">{t("eyebrow")}</p>
          </motion.div>
          <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-[var(--text-light)]">{t(`tabs.${activeId}.subtitle`)}</p>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 border border-[var(--border)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
        >
          <UserRound size={14} strokeWidth={1.6} aria-hidden="true" />
          {t("accountLink")}
        </Link>
      </header>

      <nav aria-label={t("navLabel")} className="mb-6 border-b border-[var(--border)] sm:mb-8">
        <ul className="flex gap-7">
          {TABS.map(({ id, href, icon: Icon }) => {
            const isActive = id === activeId;
            return (
              <li key={id}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 pb-3 text-sm transition-colors",
                    isActive ? "font-semibold text-[var(--primary-ink)]" : "text-[var(--text-light)] hover:text-[var(--text-main)]",
                  )}
                >
                  <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
                  {t(`tabs.${id}.label`)}
                  {isActive ? (
                    <motion.span
                      layoutId="my-orders-tab-underline"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--primary-color)]"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
