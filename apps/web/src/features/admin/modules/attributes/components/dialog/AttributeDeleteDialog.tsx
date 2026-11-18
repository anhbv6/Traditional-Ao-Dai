"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
} from "@/features/admin/core/ui";
import { type AdminAttributeGroup, type AdminAttributeValue } from "../../types/attributes.types";
import { localizedGroup } from "../../utils/attributeMeta";

export type AttributeDeleteTarget =
  | { type: "group"; group: AdminAttributeGroup }
  | { type: "value"; value: AdminAttributeValue };

interface AttributeDeleteDialogProps {
  target: AttributeDeleteTarget;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Dialog xác nhận xóa: hỗ trợ xóa nhóm thuộc tính (nhóm tự thêm và trống) hoặc xóa giá trị thuộc tính.
 */
export function AttributeDeleteDialog({
  target,
  isDeleting,
  onClose,
  onConfirm,
}: AttributeDeleteDialogProps) {
  const t = useTranslations("AdminPage.attributes");
  const locale = useLocale();

  const isGroup = target.type === "group";
  const title = isGroup ? t("groupDialog.deleteTitle") : t("deleteDialog.title");
  const description = isGroup
    ? t("deleteDialog.description", { name: localizedGroup(target.group, locale).name })
    : t("deleteDialog.description", { name: target.value.name });
  const bodyText = isGroup ? t("groupDialog.deleteBody") : t("deleteDialog.body");

  return (
    <AdminDialog
      open
      onOpenChange={(open) => !open && onClose()}
      tone="danger"
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <button type="button" onClick={onClose} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}
          >
            {isDeleting ? t("processing") : t("deleteDialog.confirm")}
          </button>
        </>
      }
    >
      <p className="text-sm text-[#52525B]">{bodyText}</p>
    </AdminDialog>
  );
}
