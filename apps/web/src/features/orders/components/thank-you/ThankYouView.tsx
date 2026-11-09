"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CircleCheck, Link2Off, PackageSearch } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { ActionLink } from "@/components/shared/ActionLink";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuthStore } from "@/features/auth";
import { useOrderTimeline } from "../../hooks/useOrderTimeline";
import { TimelineSkeleton } from "../track/MagicLinkTracking";
import { OrderAmounts } from "../timeline/OrderAmounts";
import { PaymentQrCard } from "../timeline/PaymentQrCard";
import { TrackingStepper } from "../timeline/TrackingStepper";
import { TimelineCard } from "../timeline/OrderTimelineView";
import { ClaimAccountBox } from "./ClaimAccountBox";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Trang cảm ơn sau khi đặt hàng (đọc lại đơn bằng token trong URL → F5 không mất):
 * mã đơn · QR VietQR cho số tiền phải chuyển trước (cọc / toàn bộ) · tiến độ · tiền ·
 * hộp tạo tài khoản cho khách vãng lai (ẩn khi đã đăng nhập hoặc đơn đã gắn tài khoản).
 */
export function ThankYouView({ token }: { token: string }) {
  const t = useTranslations("OrdersPage.thankYou");
  const locale = useLocale() as Locale;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useOrderTimeline(token);
  // Vừa tạo tài khoản xong thì đơn hết là "đơn vãng lai" + đã đăng nhập → vẫn giữ hộp để hiện lời xác nhận
  const [claimed, setClaimed] = useState(false);

  if (!token || query.isError) {
    return (
      <EmptyState
        icon={Link2Off}
        title={t("invalidTitle")}
        description={t("invalidDescription")}
        action={t("lookupAction")}
        href="/track-order"
      />
    );
  }
  if (!query.data) return <TimelineSkeleton />;

  const order = query.data;
  const trackHref = { pathname: "/orders/track", query: { token } } as const;

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="border-b border-(--border) pb-6 text-center"
      >
        <CircleCheck size={40} strokeWidth={1.2} className="mx-auto text-(--success)" aria-hidden="true" />
        <p className="mt-3 text-[11px] uppercase tracking-[3px] text-(--text-light)">{t("eyebrow")}</p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-(--primary-ink) sm:text-3xl">{t("title")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-(--text-light)">{t("description")}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[2.5px] text-(--text-light)">{t("orderCode")}</p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-(--primary-ink)">{order.orderCode}</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-(--text-light)">{t("keepCode")}</p>
      </motion.header>

      {order.payment ? (
        <PaymentQrCard
          payment={order.payment}
          title={order.paymentMethod === "DEPOSIT" ? t("depositTitle", { amount: formatVnd(order.payment.amount, locale) }) : undefined}
        />
      ) : order.paymentMethod === "COD" ? (
        <p className="border-l-2 border-(--accent-color) bg-(--bg-secondary)/70 px-4 py-3 text-sm leading-6">{t("codNote")}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {order.isTailored ? (
            <TimelineCard title={t("progressTitle")}>
              <TrackingStepper progress={order.progress} stepDates={order.stepDates} />
            </TimelineCard>
          ) : null}
          {(order.isGuestOrder && !isAuthenticated) || claimed ? <ClaimAccountBox token={token} onCreated={() => setClaimed(true)} /> : null}
        </div>
        <div className="space-y-6">
          <TimelineCard title={t("amountsTitle")}>
            <OrderAmounts amounts={order.amounts} paymentMethod={order.paymentMethod} />
          </TimelineCard>
          <div className="flex flex-col gap-3">
            <ActionLink href={trackHref} variant="confirm" size="md" fullWidth icon={<PackageSearch />}>
              {t("trackAction")}
            </ActionLink>
            <ActionLink href="/products" variant="cancel" size="md" fullWidth>
              {t("continue")}
            </ActionLink>
          </div>
          <p className="text-xs leading-5 text-(--text-light)">{t("emailNote")}</p>
        </div>
      </div>
    </div>
  );
}
