"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { deleteVoucherAction, duplicateVoucherAction, toggleVoucherActiveAction } from "../actions/vouchers.actions";

/** Bật-tắt / nhân bản / xóa coupon từ danh sách — xong thì báo và tải lại dữ liệu server */
export function useVoucherActions(onDone?: () => void) {
  const t = useTranslations("AdminPage.vouchers");
  const notify = useNotify();
  const router = useRouter();
  const finish = (message: string) => {
    notify.success(message);
    onDone?.();
    router.refresh();
  };

  const toggle = useMutation({
    mutationFn: (input: { voucherId: string; isActive: boolean }) => toggleVoucherActiveAction(input),
    onSuccess: (res) => (res.success ? finish(res.data.isActive ? t("toast.enabled") : t("toast.disabled")) : notify.error(res.error, "VOUCHER_UPDATE_FAILED")),
    onError: () => notify.error("VOUCHER_UPDATE_FAILED"),
  });

  const duplicate = useMutation({
    mutationFn: (voucherId: string) => duplicateVoucherAction({ voucherId }),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "VOUCHER_CREATE_FAILED");
      finish(t("toast.duplicated", { code: res.data.code }));
      router.push(`/admin/vouchers/${res.data.id}`);
    },
    onError: () => notify.error("VOUCHER_CREATE_FAILED"),
  });

  const remove = useMutation({
    mutationFn: (voucherId: string) => deleteVoucherAction({ voucherId }),
    onSuccess: (res) => (res.success ? finish(t("toast.deleted")) : notify.error(res.error, "VOUCHER_DELETE_FAILED")),
    onError: () => notify.error("VOUCHER_DELETE_FAILED"),
  });

  return { toggle, duplicate, remove };
}
