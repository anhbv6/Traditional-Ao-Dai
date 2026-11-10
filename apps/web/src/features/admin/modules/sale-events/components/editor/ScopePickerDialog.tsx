"use client";

import { useState, type ReactNode } from "react";
import { ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminCheckbox,
  AdminDialog,
  AdminSearchInput,
} from "@/features/admin/core/ui";

export interface PickerOption {
  id: string;
  name: string;
  /** Dòng phụ: mã · loại · giá, hoặc số sản phẩm */
  meta?: string;
  /** Phần tử đầu dòng (ảnh nhỏ) */
  leading?: ReactNode;
  /** Không chọn được (VD sản phẩm ngừng bán) */
  disabledReason?: string;
}

/**
 * Chọn nhiều bộ sưu tập / loại sản phẩm / sản phẩm cho phạm vi sale. Chọn trong dialog rồi mới áp
 * (bấm Hủy thì không đổi gì) — tránh vừa tick vừa làm bảng sản phẩm bên dưới nhảy liên tục.
 */
export function ScopePickerDialog({
  open,
  onOpenChange,
  title,
  options,
  selected,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: PickerOption[];
  selected: string[];
  onConfirm: (ids: string[]) => void;
}) {
  const t = useTranslations("AdminPage.saleEvents");
  const [picked, setPicked] = useState(() => new Set(selected));
  const [search, setSearch] = useState("");

  const keyword = search.trim().toLowerCase();
  const visible = options.filter((option) => !keyword || `${option.name} ${option.meta ?? ""}`.toLowerCase().includes(keyword));
  const selectable = visible.filter((option) => !option.disabledReason);
  const allVisiblePicked = selectable.length > 0 && selectable.every((option) => picked.has(option.id));

  const toggle = (id: string, checked: boolean) =>
    setPicked((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleVisible = (checked: boolean) =>
    setPicked((current) => {
      const next = new Set(current);
      for (const option of selectable) {
        if (checked) next.add(option.id);
        else next.delete(option.id);
      }
      return next;
    });

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={ListChecks}
      title={title}
      description={t("picker.description")}
      size="lg"
      toolbar={
        <div className="flex items-center gap-3">
          <AdminSearchInput value={search} onChange={setSearch} placeholder={t("picker.search")} className="flex-1" />
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-[#3F3F46]">
            <AdminCheckbox checked={allVisiblePicked} indeterminate={!allVisiblePicked && selectable.some((option) => picked.has(option.id))} onChange={toggleVisible} label={t("picker.selectVisible")} />
            <span className="hidden sm:inline">{t("picker.selectVisible")}</span>
          </label>
        </div>
      }
      footer={
        <>
          <span className="mr-auto text-sm text-[#71717A]">{t("picker.selected", { count: picked.size })}</span>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              // Giữ thứ tự theo danh sách gốc để bảng sản phẩm ổn định
              onConfirm(options.filter((option) => picked.has(option.id)).map((option) => option.id));
              onOpenChange(false);
            }}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {t("picker.apply")}
          </button>
        </>
      }
      bodyClassName="px-3 py-2"
    >
      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#71717A]">{t("picker.empty")}</p>
      ) : (
        <ul className="divide-y divide-dashed divide-[#E4E4E7]">
          {visible.map((option) => {
            const checked = picked.has(option.id);
            return (
              <li key={option.id}>
                <label
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2.5",
                    option.disabledReason ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[#FAFAFA]"
                  )}
                >
                  <AdminCheckbox checked={checked} onChange={(next) => toggle(option.id, next)} label={option.name} disabled={Boolean(option.disabledReason)} />
                  {option.leading}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body text-[#09090B]">{option.name}</span>
                    {(option.meta || option.disabledReason) && (
                      <span className="mt-0.5 block truncate text-xs text-[#71717A]">{option.disabledReason ?? option.meta}</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </AdminDialog>
  );
}
