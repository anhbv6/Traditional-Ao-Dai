"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeleteAddress } from "@/features/profile/hooks/useManageAddress";
import { AppDialog } from "@/components/shared/AppDialog";

export interface DeleteFormProps {
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
}

/** Xác nhận xoá địa chỉ — AppDialog chung; lỗi đã báo bằng toast trong mutation nên hộp thoại giữ mở để thử lại */
export function DeleteForm({ deletingId, setDeletingId }: DeleteFormProps) {
  const t = useTranslations("ProfilePage.address");
  const { handleDelete } = useDeleteAddress();

  return (
    <AppDialog
      open={!!deletingId}
      onOpenChange={(open) => !open && setDeletingId(null)}
      tone="danger"
      size="sm"
      title={t("deleteDialog.title")}
      description={t("deleteDialog.message")}
      confirm={{
        label: t("deleteDialog.confirmBtn"),
        icon: <Trash2 />,
        onClick: async () => {
          if (deletingId) await handleDelete(deletingId);
        },
      }}
      cancel={{ label: t("form.cancelBtn") }}
    />
  );
}

export default DeleteForm;
