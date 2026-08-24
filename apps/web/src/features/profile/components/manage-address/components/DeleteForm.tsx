"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useDeleteAddress } from "@/features/profile/hooks/useManageAddress";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export interface DeleteFormProps {
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
}

export function DeleteForm({ deletingId, setDeletingId }: DeleteFormProps) {
  const t = useTranslations("ProfilePage.address");
  const { handleDelete, isDeleting } = useDeleteAddress();

  return (
    <ConfirmDialog
      open={!!deletingId}
      onOpenChange={(open) => !open && setDeletingId(null)}
      confirmVariant="destructive"
      title={t("deleteDialog.title")}
      description={t("deleteDialog.message")}
      confirmText={t("deleteDialog.confirmBtn")}
      cancelText={t("form.cancelBtn")}
      isLoading={isDeleting}
      customTitle={"text-lg sm:text-2xl"}
      onConfirm={() => {
        if (deletingId) {
          handleDelete(deletingId);
          setDeletingId(null);
        }
      }}
    />
  );
}

export default DeleteForm;
