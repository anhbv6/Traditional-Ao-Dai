"use client";

import { Link2Off, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { useOrderEdit } from "../../hooks/useOrderEdit";
import { useOrderTimeline } from "../../hooks/useOrderTimeline";
import { OrderTimelineView } from "../timeline/OrderTimelineView";

export function TimelineSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-16 bg-(--bg-secondary)" />
      <div className="h-40 bg-(--bg-secondary)" />
      <div className="h-72 bg-(--bg-secondary)" />
    </div>
  );
}

/**
 * Cơ chế B — mở từ magic link (`/orders/track?token=…`): token READ cho đúng một đơn.
 * Sửa số đo / địa chỉ mở hộp thoại OTP gửi tới SĐT của đơn.
 */
export function MagicLinkTracking({ token }: { token: string }) {
  const t = useTranslations("OrdersPage.track");
  const query = useOrderTimeline(token);
  const edit = useOrderEdit(token);

  if (!token || query.isError) {
    return (
      <EmptyState
        icon={token ? Link2Off : Search}
        title={token ? t("invalid.title") : t("missing.title")}
        description={token ? t("invalid.description") : t("missing.description")}
        action={t("invalid.action")}
        href="/track-order"
      />
    );
  }

  if (!query.data) return <TimelineSkeleton />;

  return <OrderTimelineView order={query.data} edit={edit} />;
}
