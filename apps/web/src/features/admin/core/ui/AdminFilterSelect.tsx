"use client";

import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AppMenu } from "@/components/shared/AppMenu";
import { cn } from "@/lib/utils";

export interface AdminFilterOption<T extends string = string> {
  value: T;
  label: ReactNode;
  /** Text đại diện khi label là ReactNode — dùng cho aria-label và title */
  text?: string;
}

interface AdminFilterSelectProps<T extends string> {
  /** Tên bộ lọc hiển thị cố định bên trái nút, VD "Danh mục". Bỏ trống nếu trường đã có nhãn ngoài (AdminField / label). */
  label?: string;
  value: T;
  options: AdminFilterOption<T>[];
  onChange: (value: T) => void;
  /** Chữ mờ hiện khi `value` chưa khớp lựa chọn nào (trường bắt buộc chưa chọn), VD "Vui lòng chọn nhóm" */
  placeholder?: string;
  /** Nội dung thông báo hiển thị trong menu xổ xuống khi không có lựa chọn nào */
  emptyText?: ReactNode;
  /** Viền đỏ khi trường bắt buộc chưa chọn — thông báo lỗi đặt ở AdminField */
  invalid?: boolean;
  /** Vô hiệu hóa bộ lọc */
  disabled?: boolean;
  className?: string;
}

/**
 * Bộ lọc chọn một dùng chung cho các màn admin: nút "Nhãn | Giá trị" (hoặc chỉ "Giá trị" nếu không có nhãn),
 * mở danh sách có dấu ✓ ở mục đang chọn.
 * Dựng trên AppMenu nên có sẵn điều hướng bằng phím, tự lật khi sát mép màn hình và không bị khung `overflow-hidden` cắt.
 */
export function AdminFilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  emptyText,
  invalid,
  disabled = false,
  className,
}: AdminFilterSelectProps<T>) {
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label;
  const ariaText = selectedOption?.text ?? (typeof selectedLabel === "string" ? selectedLabel : "");
  const effectiveEmptyText = emptyText ?? placeholder ?? "Không có lựa chọn nào";
  const displayTitle = ariaText || placeholder || undefined;

  return (
    /*
     * Khung bọc riêng: khi mở danh sách, Base UI chèn các thẻ chặn focus ẩn ngay cạnh nút. Nếu nút nằm thẳng trong
     * khung cha (space-y / gap) thì các thẻ đó ăn thêm khoảng cách → nội dung bên dưới nhảy xuống. Bọc flex không gap
     * giữ chúng ở đây với kích thước 0. `className` (bề rộng, chiều cao) đặt trên khung, nút lấp đầy.
     */
    <div className={cn("flex h-9 min-w-0", className)}>
      <AppMenu
        tone="admin"
        width="trigger"
        align="start"
        sideOffset={6}
        emptyText={effectiveEmptyText}
        // Danh sách dài tự cuộn; mục đang chọn luôn có nền xám để dễ nhận ra khi vừa mở
        className="max-h-72 max-w-80 overflow-y-auto [&_[role=menuitemradio]]:text-sm [&_[role=menuitemradio][data-checked]]:bg-[#F4F4F5]"
        selection={options.length > 0 ? { value, onValueChange: (next) => onChange(next as T) } : undefined}
        items={options.map((option) => ({ key: option.value, label: option.label }))}
        trigger={
          <button
            type="button"
            disabled={disabled}
            title={displayTitle}
            aria-label={label ? `${label}: ${ariaText || placeholder || ""}` : (ariaText || placeholder || "")}
            className={cn(
              "group flex h-full w-full min-w-0 cursor-pointer items-center rounded-xl border bg-white text-sm shadow-2xs outline-none transition-colors hover:bg-[#FAFAFA] focus-visible:border-[#18181B] data-popup-open:border-[#18181B] disabled:cursor-not-allowed disabled:bg-[#FAFAFA] disabled:opacity-70 disabled:hover:bg-[#FAFAFA]",
              invalid ? "border-rose-400" : "border-[#E4E4E7]"
            )}
          >
            {label ? (
              <span className="shrink-0 border-r border-[#E4E4E7] px-3 text-[#71717A]">{label}</span>
            ) : null}
            <span
              className={cn(
                "min-w-0 flex-1 truncate px-3 text-left",
                selectedLabel === undefined ? "text-[#A1A1AA]" : "font-medium text-[#09090B]"
              )}
            >
              {selectedLabel ?? placeholder}
            </span>
            <ChevronDown
              size={15}
              aria-hidden
              className="mr-2.5 shrink-0 text-[#71717A] transition-transform duration-200 group-data-popup-open:rotate-180"
            />
          </button>
        }
      />
    </div>
  );
}
