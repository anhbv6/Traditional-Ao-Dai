"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, PackageX, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuthStore } from "@/features/auth";
import { useNotify } from "@/hooks/useNotify";
import { Link, useRouter } from "@/i18n/routing";
import { createMyOrderLinkApi } from "../../api/orders.api";
import { useMyOrder } from "../../hooks/useOrderTimeline";
import { TimelineSkeleton } from "../track/MagicLinkTracking";
import { OrderTimelineView } from "../timeline/OrderTimelineView";

/**
 * Chi tiết một đơn của khách đã đăng nhập: cùng timeline với magic link (chỉ xem).
 * Muốn sửa số đo / địa chỉ → tạo link tra cứu mới rồi chuyển sang trang link (vẫn phải nhập OTP SĐT của đơn).
 */
export function CustomerOrderDetail({ orderCode }: { orderCode: string }) {
  const t = useTranslations("OrdersPage.account");
  const notify = useNotify();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useMyOrder(orderCode, isAuthenticated);

  const openEditLink = useMutation({
    mutationFn: () => createMyOrderLinkApi(orderCode),
    onSuccess: ({ accessToken }) => router.push({ pathname: "/orders/track", query: { token: accessToken } }),
    onError: (error) => notify.error(error, "DEFAULT_ERROR"),
  });

  const back = (
    <Link
      href="/my-orders"
      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[1.5px] text-(--text-light) hover:text-(--primary-ink)"
    >
      <ArrowLeft size={13} aria-hidden="true" />
      {t("backToList")}
    </Link>
  );

  if (query.isError) {
    return (
      <div className="space-y-4">
        {back}
        <EmptyState icon={PackageX} title={t("notFoundTitle")} description={t("notFoundDescription")} action={t("backToList")} href="/my-orders" />
      </div>
    );
  }
  if (!query.data) return <TimelineSkeleton />;

  const order = query.data;
  const canEdit = order.canEditAddress || order.items.some((item) => item.canEditMeasurements);

  return (
    <div className="space-y-5">
      {back}
      <OrderTimelineView
        order={order}
        readOnlyAction={
          canEdit ? (
            <div className="border border-dashed border-(--border) p-4">
              <p className="text-xs leading-5 text-(--text-light)">{t("editHint")}</p>
              <ActionButton variant="dialog" size="sm" icon={<PenLine />} className="mt-3" loading={openEditLink.isPending} onClick={() => openEditLink.mutate()}>
                {t("editViaLink")}
              </ActionButton>
            </div>
          ) : null
        }
      />
    </div>
  );
}
