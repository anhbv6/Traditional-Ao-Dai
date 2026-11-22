"use client";

import { useId, useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnchorPositionMethod } from "@/hooks/useAnchorPositionMethod";
import { ADMIN_FIELD_RADIUS_CLASS } from "./AdminTextField";

export interface AdminMultiSelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Mã màu hex hiển thị swatch tròn cạnh tên (VD: màu sắc sản phẩm) */
  colorHex?: string | null;
  /** Mô tả phụ nhỏ */
  description?: string;
  disabled?: boolean;
}

export interface AdminMultiSelectProps<T extends string = string> {
  value: T[];
  options: AdminMultiSelectOption<T>[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
  selectAllText?: string;
  deselectAllText?: string;
  /** Tùy biến text tóm tắt khi chọn nhiều, VD: "{count} màu đã chọn" */
  summaryFormatter?: (count: number) => string;
}

/**
 * Ô chọn nhiều (Multi-select) dùng chung cho Admin:
 * - Giao diện kích thước và style đồng bộ chuẩn với AdminTextField / AdminFilterSelect (chiều cao 40px, bo góc rounded-xl).
 * - Trigger hiển thị swatch màu + tên hoặc số lượng đã chọn.
 * - Danh sách mở qua Popover có checkbox, hỗ trợ Chọn tất cả / Bỏ chọn nhanh.
 */
export function AdminMultiSelect<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = "Chọn...",
  disabled = false,
  invalid = false,
  className,
  id,
  selectAllText = "Chọn tất cả",
  deselectAllText = "Bỏ chọn",
  summaryFormatter,
}: AdminMultiSelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const { positionMethod, captureAnchor } = useAnchorPositionMethod();

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => options.filter((opt) => selectedSet.has(opt.value)),
    [options, selectedSet]
  );
  const hasColorSwatches = options.some((opt) => Boolean(opt.colorHex));

  const toggle = (val: T) => {
    if (selectedSet.has(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const selectAll = () => {
    const all = options.filter((opt) => !opt.disabled).map((opt) => opt.value);
    onChange(all);
  };

  const deselectAll = () => {
    onChange([]);
  };

  const handleOpenChange = (next: boolean, details: { event: Event }) => {
    if (next) captureAnchor(details.event);
    setOpen(next);
  };

  return (
    <div className={cn("flex min-w-0 w-full", className)}>
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <span className="flex w-full shrink-0">
          <Popover.Trigger
            id={selectId}
            disabled={disabled}
            aria-expanded={open}
            className={cn(
              "group flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 border bg-white px-3 text-sm shadow-2xs outline-none transition-colors hover:bg-[#FAFAFA] focus-visible:border-[#18181B] data-popup-open:border-[#18181B]",
              ADMIN_FIELD_RADIUS_CLASS,
              invalid ? "border-rose-400" : "border-[#E4E4E7]",
              disabled && "cursor-not-allowed bg-[#FAFAFA] opacity-60"
            )}
          >
            {value.length === 0 ? (
              <span className="truncate text-xs text-[#A1A1AA]">{placeholder}</span>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                {hasColorSwatches && (
                  <div className="flex shrink-0 items-center -space-x-1">
                    {selectedOptions.slice(0, 4).map((opt) => (
                      <span
                        key={opt.value}
                        aria-hidden
                        className="size-3.5 rounded-full border border-black/15 shadow-2xs"
                        style={{ background: opt.colorHex ?? "#F4F4F5" }}
                      />
                    ))}
                  </div>
                )}
                <span className="truncate text-xs font-medium text-[#09090B]">
                  {selectedOptions.length <= 2
                    ? selectedOptions.map((opt) => opt.label).join(", ")
                    : summaryFormatter
                      ? summaryFormatter(selectedOptions.length)
                      : `${selectedOptions.length} đã chọn`}
                </span>
                <span className="ml-auto mr-1 inline-flex min-w-5 h-5 px-1 shrink-0 items-center justify-center rounded-full bg-[#18181B] text-2xs font-semibold text-white tabular-nums leading-none">
                  {selectedOptions.length}
                </span>
              </div>
            )}
            <ChevronDown
              size={15}
              aria-hidden
              className="shrink-0 text-[#71717A] transition-transform duration-200 group-data-popup-open:rotate-180"
            />
          </Popover.Trigger>
        </span>

        <Popover.Portal>
          <Popover.Positioner
            positionMethod={positionMethod}
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className="z-50 outline-none"
            style={{ width: "var(--anchor-width)" }}
          >
            <Popover.Popup className="admin-shell w-full min-w-full origin-[var(--transform-origin)] rounded-xl border border-[#E4E4E7] bg-white p-2 shadow-[0_16px_40px_-16px_rgba(9,9,11,0.25)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
              {/* Thanh thao tác nhanh */}
              <div className="flex items-center justify-between px-2 py-1 text-xs">
                <span className="text-2xs text-[#71717A]">
                  {selectedOptions.length > 0
                    ? `${selectedOptions.length}/${options.length} đã chọn`
                    : `${options.length} lựa chọn`}
                </span>
                <div className="flex items-center gap-2 text-2xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="cursor-pointer font-medium text-[#18181B] hover:underline"
                  >
                    {selectAllText}
                  </button>
                  <span className="text-[#D4D4D8]">·</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="cursor-pointer text-[#71717A] hover:text-[#09090B] hover:underline"
                  >
                    {deselectAllText}
                  </button>
                </div>
              </div>

              <div className="my-1 border-t border-[#F4F4F5]" />

              {/* Danh sách lựa chọn */}
              <div className="max-h-60 overflow-y-auto space-y-0.5 p-0.5">
                {options.map((option) => {
                  const isSelected = selectedSet.has(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => toggle(option.value)}
                      className={cn(
                        "flex w-full cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors outline-none",
                        isSelected
                          ? "bg-[#F4F4F5]/80 font-medium text-[#09090B]"
                          : "text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#09090B]",
                        option.disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                          isSelected
                            ? "border-[#18181B] bg-[#18181B] text-white"
                            : "border-[#D4D4D8] bg-white"
                        )}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </span>

                      {option.colorHex !== undefined && (
                        <span
                          aria-hidden
                          className="size-3.5 shrink-0 rounded-full border border-black/15 shadow-2xs"
                          style={{ background: option.colorHex ?? "#F4F4F5" }}
                        />
                      )}

                      <span className="truncate flex-1 text-left">{option.label}</span>

                      {option.description && (
                        <span className="text-2xs text-[#A1A1AA]">{option.description}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
