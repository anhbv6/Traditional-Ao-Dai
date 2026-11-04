"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminDialogFooter,
} from "@/features/admin/core/ui";
import { deleteCollectionAction } from "../../actions/collections.actions";

/** Xác nhận xóa bộ sưu tập chưa công bố (đã công bố thì menu không hiện mục xóa, server cũng chặn) */
export function ConfirmDeleteCollectionDialog({
  collection,
  onOpenChange,
  onDeleted,
}: {
  collection: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("AdminPage.collections");
  const notify = useNotify();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!collection) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteCollectionAction(collection.id);
      if (!res.success) {
        notify.error(res.error, "COLLECTION_DELETE_FAILED");
        return;
      }
      notify.success(t("deleteDialog.success"));
      onDeleted(collection.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      tone="danger"
      icon={Trash2}
      title={t("deleteDialog.title")}
      description={t("deleteDialog.description", { name: collection.name })}
      size="sm"
      bare
    >
      <AdminDialogFooter>
        <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
          {t("cancel")}
        </button>
        <button type="button" disabled={isDeleting} onClick={handleDelete} className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}>
          {isDeleting ? t("processing") : t("deleteDialog.confirm")}
        </button>
      </AdminDialogFooter>
    </AdminDialog>
  );
}
