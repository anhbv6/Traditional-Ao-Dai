"use client";

import { type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { TextField, type TextFieldProps } from "@/components/shared/TextField";
import { TextAreaField, type TextAreaFieldProps } from "@/components/shared/TextAreaField";
import { cn } from "@/lib/utils";
import { AdminInfoTip } from "./AdminInfoTip";

/*
 * Ô nhập khu quản trị = TextField / TextAreaField của storefront + preset admin.
 * Không viết lại logic (mask, nút xóa, ẩn/hiện mật khẩu, lỗi, aria) — chỉ khóa tone đơn sắc, viền hộp bo tròn,
 * nhãn thường 14px (storefront in hoa 11px trái thang chữ admin §8) và gắn hướng dẫn vào AdminInfoTip cạnh nhãn.
 */

/** Nhãn form admin — 14px, đậm vừa, không in hoa */
export const ADMIN_LABEL_CLASS = "flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]";

/* Ghi đè nhãn in hoa giãn chữ của storefront (màu đã đến từ tone admin) */
const LABEL_OVERRIDE_CLASS = "flex items-center text-sm font-medium normal-case tracking-normal";

/** Bo góc ô nhập admin — dùng cả cho ô tự dựng (lưới, ô tìm kiếm) để đồng bộ */
export const ADMIN_FIELD_RADIUS_CLASS = "rounded-xl";

/**
 * Class ô nhập thô cùng kiểu AdminTextField — CHỈ cho chỗ không đặt được component (ô trong dòng lặp / lưới,
 * component con nhận `inputClassName`). Form thường dùng AdminTextField / AdminTextArea.
 */
export const ADMIN_INPUT_CLASS =
  "h-10 w-full rounded-xl border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-[#A1A1AA] hover:not-focus:border-[#D4D4D8] focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8 aria-invalid:border-rose-500 disabled:cursor-not-allowed disabled:bg-[#FAFAFA] disabled:text-[#71717A]";

function FieldLabel({ label, hint }: { label: ReactNode; hint?: ReactNode }) {
  return (
    <>
      {label}
      {hint ? <AdminInfoTip content={hint} /> : null}
    </>
  );
}

export interface AdminTextFieldProps
  extends Omit<TextFieldProps, "tone" | "appearance" | "layout" | "labelWidth" | "helperText"> {
  /** Hướng dẫn hiện trong ⓘ cạnh nhãn (admin không đặt gợi ý dưới ô) */
  hint?: ReactNode;
}

/**
 * Ô nhập một dòng của khu quản trị — viền hộp bo tròn, cao 40px (`size="md"`) mặc định.
 *
 * @example
 * <AdminTextField label={t("code")} hint={t("codeHint")} placeholder={t("codePlaceholder")} error={error} {...register("code")} />
 */
export function AdminTextField({ label, hint, size = "md", fieldClassName, labelClassName, ...props }: AdminTextFieldProps) {
  return (
    <TextField
      {...props}
      tone="admin"
      appearance="outline"
      size={size}
      label={label ? <FieldLabel label={label} hint={hint} /> : undefined}
      fieldClassName={cn(ADMIN_FIELD_RADIUS_CLASS, "text-sm", fieldClassName)}
      labelClassName={cn(LABEL_OVERRIDE_CLASS, labelClassName)}
    />
  );
}

export interface AdminTextAreaProps extends Omit<TextAreaFieldProps, "tone" | "appearance" | "helperText"> {
  /** Hướng dẫn hiện trong ⓘ cạnh nhãn */
  hint?: ReactNode;
}

/** Ô nhập nhiều dòng của khu quản trị — cùng kiểu với AdminTextField */
export function AdminTextArea({ label, hint, rows = 3, textareaClassName, labelClassName, ...props }: AdminTextAreaProps) {
  return (
    <TextAreaField
      {...props}
      tone="admin"
      appearance="outline"
      rows={rows}
      label={label ? <FieldLabel label={label} hint={hint} /> : undefined}
      textareaClassName={cn(ADMIN_FIELD_RADIUS_CLASS, "py-2 text-sm leading-relaxed", textareaClassName)}
      labelClassName={cn(LABEL_OVERRIDE_CLASS, labelClassName)}
    />
  );
}

export interface AdminFieldProps {
  label: ReactNode;
  /** Hướng dẫn hiện trong ⓘ cạnh nhãn */
  hint?: ReactNode;
  /** Lỗi đã dịch, hiện dưới ô */
  error?: ReactNode;
  /** Hiện dấu * sau nhãn (chỉ hiển thị — kiểm tra thật ở schema) */
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Khung nhãn + lỗi cho điều khiển KHÔNG phải ô chữ (AdminFilterSelect, AdminDatePicker, nhóm nút...).
 * Ô chữ dùng thẳng AdminTextField / AdminTextArea.
 */
export function AdminField({ label, hint, error, required, className, children }: AdminFieldProps) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      {/* Không dùng <label>: điều khiển bên trong có thể là nút / popup, bọc label sẽ chuyển click sai chỗ */}
      <div className={ADMIN_LABEL_CLASS}>
        <FieldLabel
          label={
            <>
              {label}
              {required ? (
                <span aria-hidden className="-ml-1 text-rose-600">
                  *
                </span>
              ) : null}
            </>
          }
          hint={hint}
        />
      </div>
      {children}
      {error ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-rose-600">
          <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
