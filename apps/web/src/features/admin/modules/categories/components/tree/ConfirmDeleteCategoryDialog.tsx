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
import { deleteCategoryAction } from "../../actions/categories.actions";
import { type AdminCategoryNode } from "../../types/categories.types";

/** Xác nhận xóa loại sản phẩm trống (menu chỉ bật mục xóa khi không còn sản phẩm/loại con, server cũng chặn) */
export function ConfirmDeleteCategoryDialog({
  category,
  onOpenChange,
  onDeleted,
}: {
  category: AdminCategoryNode;
  onOpenChange: (open: boolean) => void;
  onDeleted: (tree: AdminCategoryNode[]) => void;
}) {
  const t = useTranslations("AdminPage.categories");
  const notify = useNotify();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteCategoryAction(category.id);
      if (!res.success) {
        notify.error(res.error, "CATEGORY_DELETE_FAILED");
        return;
      }
      notify.success(t("deleteDialog.success"));
      onDeleted(res.data.tree);
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
      description={t("deleteDialog.description", { name: category.name })}
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
