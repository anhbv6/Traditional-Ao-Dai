"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { toggleCustomerActiveAction } from "../actions/customers.actions";

export interface CustomerLockPatch {
  id: string;
  status: "ACTIVE" | "LOCKED";
  lockedAt: string | null;
  lockedReason: string | null;
}

/** Khóa / mở khóa khách qua Server Action; thành công thì báo, cập nhật tại chỗ rồi tải lại dữ liệu server */
export function useToggleCustomer(onDone: (patch: CustomerLockPatch) => void) {
  const t = useTranslations("AdminPage.customers");
  const notify = useNotify();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: { userId: string; isActive: boolean; reason?: string }) => toggleCustomerActiveAction(input),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "CUSTOMER_UPDATE_FAILED");
      notify.success(res.data.status === "LOCKED" ? t("toast.locked") : t("toast.unlocked"));
      onDone(res.data);
      router.refresh();
    },
    onError: () => notify.error("CUSTOMER_UPDATE_FAILED"),
  });
}
