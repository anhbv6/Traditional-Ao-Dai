"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { type OrderPatch } from "../types/orders.types";
import { type AdvanceStatus } from "../utils/orderFlow";
import { advanceOrderAction, recordOrderPaymentAction, requestOrderApprovalAction } from "../actions/orders.actions";

/**
 * Ba thao tác trên đơn qua Server Action + React Query: chuyển bước kế, ghi nhận tiền, gửi yêu cầu hủy.
 * Thành công thì báo, gọi `onPatch` để cập nhật giao diện ngay, rồi tải lại dữ liệu server.
 */
export function useOrderActions(onPatch: (patch: OrderPatch) => void) {
  const t = useTranslations("AdminPage.orders");
  const notify = useNotify();
  const router = useRouter();

  const advance = useMutation({
    mutationFn: (input: { orderId: string; status: AdvanceStatus }) =>
      advanceOrderAction(input).then((res) => ({ input, res })),
    onSuccess: ({ input, res }) => {
      if (!res.success) return notify.error(res.error, "ORDER_STATUS_UPDATE_FAILED");
      notify.success(t("toast.advanced", { status: t(`status.${input.status}`) }));
      onPatch({ orderId: input.orderId, orderStatus: input.status });
      router.refresh();
    },
    onError: () => notify.error("ORDER_STATUS_UPDATE_FAILED"),
  });

  const recordPayment = useMutation({
    mutationFn: (input: { orderId: string; amount: number; note?: string }) =>
      recordOrderPaymentAction(input).then((res) => ({ input, res })),
    onSuccess: ({ input, res }) => {
      if (!res.success) return notify.error(res.error, "PAYMENT_STATUS_UPDATE_FAILED");
      notify.success(t("toast.paid"));
      onPatch({ orderId: input.orderId, ...res.data });
      router.refresh();
    },
    onError: () => notify.error("PAYMENT_STATUS_UPDATE_FAILED"),
  });

  const requestCancel = useMutation({
    mutationFn: (input: { orderId: string; reason: string }) =>
      requestOrderApprovalAction({ orderId: input.orderId, actionType: "CANCEL_ORDER", description: input.reason }).then((res) => ({
        input,
        res,
      })),
    onSuccess: ({ input, res }) => {
      if (!res.success) return notify.error(res.error, "APPROVAL_CREATE_FAILED");
      notify.success(t("toast.cancelRequested"));
      onPatch({ orderId: input.orderId, pendingApproval: "CANCEL_ORDER" });
      router.refresh();
    },
    onError: () => notify.error("APPROVAL_CREATE_FAILED"),
  });

  return { advance, recordPayment, requestCancel };
}
