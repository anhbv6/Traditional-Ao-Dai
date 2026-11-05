"use client";

import { ChevronDown } from "lucide-react";
import { AppMenu } from "@/components/shared/AppMenu";
import { cn } from "@/lib/utils";

export interface AdminFilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface AdminFilterSelectProps<T extends string> {
  /** Tên bộ lọc hiển thị cố định bên trái nút, VD "Danh mục" */
  label: string;
  value: T;
  options: AdminFilterOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Bộ lọc chọn một dùng chung cho các màn admin: nút "Nhãn | Giá trị", mở danh sách có dấu ✓ ở mục đang chọn.
 * Dựng trên AppMenu nên có sẵn điều hướng bằng phím, tự lật khi sát mép màn hình và không bị khung `overflow-hidden` cắt.
 */
export function AdminFilterSelect<T extends string>({ label, value, options, onChange, className }: AdminFilterSelectProps<T>) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

  return (
    <AppMenu
      tone="admin"
      width="trigger"
      align="start"
      sideOffset={6}
      // Danh sách dài tự cuộn; mục đang chọn luôn có nền xám để dễ nhận ra khi vừa mở
      className="max-h-72 max-w-80 overflow-y-auto [&_[role=menuitemradio]]:text-sm [&_[role=menuitemradio][data-checked]]:bg-[#F4F4F5]"
      selection={{ value, onValueChange: (next) => onChange(next as T) }}
      items={options.map((option) => ({ key: option.value, label: option.label }))}
      trigger={
        <button
          type="button"
          aria-label={`${label}: ${selectedLabel}`}
          className={cn(
            "group flex h-9 min-w-0 cursor-pointer items-center rounded-xl border border-[#E4E4E7] bg-white text-sm shadow-2xs outline-none transition-colors hover:bg-[#FAFAFA] focus-visible:border-[#18181B] data-popup-open:border-[#18181B]",
            className
          )}
        >
          <span className="shrink-0 border-r border-[#E4E4E7] px-3 text-[#71717A]">{label}</span>
          <span className="min-w-0 flex-1 truncate px-3 text-left font-medium text-[#09090B]">{selectedLabel}</span>
          <ChevronDown
            size={15}
            aria-hidden
            className="mr-2.5 shrink-0 text-[#71717A] transition-transform duration-200 group-data-popup-open:rotate-180"
          />
        </button>
      }
    />
  );
}
