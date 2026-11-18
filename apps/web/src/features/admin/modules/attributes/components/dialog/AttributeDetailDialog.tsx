"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminStatusText,
} from "@/features/admin/core/ui";
import { type AdminAttributeGroup, type AdminAttributeValue } from "../../types/attributes.types";
import { localizedGroup, localizedValue } from "../../utils/attributeMeta";

interface AttributeDetailDialogProps {
  value: AdminAttributeValue;
  group: AdminAttributeGroup;
  onClose: () => void;
  onEdit: (value: AdminAttributeValue) => void;
}

/**
 * Dialog xem chi tiết đặc tính thiết kế (chỉ đọc):
 * - Hiển thị tự nhiên, mộc mạc như một tờ note ghi chép thủ công.
 * - Tuyệt đối không dùng khung viền (border) hay nền hộp xám (background) rườm rà.
 * - Cỡ chữ và màu sắc phân cấp tinh tế, thoáng mắt, dễ đọc.
 * - Thuần 1 ngôn ngữ theo trang web (tiếng Việt nếu 'vi', tiếng Anh nếu 'en' hoặc khác).
 */
export function AttributeDetailDialog({ value, group, onClose, onEdit }: AttributeDetailDialogProps) {
  const t = useTranslations("AdminPage.attributes");
  const locale = useLocale();
  const currentGroup = localizedGroup(group, locale);
  const { name, description } = localizedValue(value, locale);

  return (
    <AdminDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={name || value.code}
      description={t("detailDialog.groupLabel", { name: currentGroup.name })}
      size="md"
      headerAside={
        <div className="-mt-0.5 shrink-0">
          <AdminStatusText tone={value.isActive ? "success" : "neutral"}>
            {value.isActive ? t("detailDialog.statusActive") : t("detailDialog.statusHidden")}
          </AdminStatusText>
        </div>
      }
      footer={
        <>
          <button type="button" onClick={onClose} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("detailDialog.close")}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(value);
            }}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {t("detailDialog.edit")}
          </button>
        </>
      }
    >
      <div className="space-y-6 py-1">
        {/* Các thông số ghi chú nhanh — không bg, không border, căn chỉnh tự nhiên */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <span className="block text-xs font-medium text-[#71717A]">{t("detailDialog.code")}</span>
            <span className="mt-1 block font-mono text-sm font-medium text-[#09090B]">{value.code}</span>
          </div>

          <div>
            <span className="block text-xs font-medium text-[#71717A]">{t("detailDialog.position")}</span>
            <span className="mt-1 block text-sm font-medium text-[#09090B]">
              {t("detailDialog.positionValue", { position: value.position + 1 })}
            </span>
          </div>

          {value.skuCount !== null && (
            <div>
              <span className="block text-xs font-medium text-[#71717A]">{t("detailDialog.skuUsage")}</span>
              <span className="mt-1 block text-sm font-medium text-[#09090B]">
                {t("skuCount", { count: value.skuCount })}
              </span>
            </div>
          )}
        </div>

        {/* Nội dung mô tả / ghi chú của đặc tính */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[#71717A]">{t("field.description")}</span>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#27272A]">
            {description || <span className="italic text-[#A1A1AA]">{t("detailDialog.noDescription")}</span>}
          </p>
        </div>
      </div>
    </AdminDialog>
  );
}
