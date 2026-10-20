"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { showToast } from "@/components/ui/toast";
import { TextField, type TextFieldProps } from "@/components/shared/TextField";
import { Checkbox } from "@/components/ui/checkbox";
import { type AdminLoginFormValues } from "../validations/adminLogin.validation";

// Ô nhập dùng chung theo tông admin: viền hộp, nhãn thường (không in hoa kiểu storefront)
const FIELD_PROPS = {
  appearance: "outline",
  tone: "admin",
  size: "md",
  fieldClassName: "rounded-xl",
  labelClassName: "text-xs font-medium normal-case tracking-normal",
} satisfies Partial<TextFieldProps>;

interface AdminLoginFormFieldsProps {
  form: UseFormReturn<AdminLoginFormValues>;
  /** Lỗi đã dịch theo từng ô */
  errors: {
    email?: string;
    password?: string;
  };
  disabled?: boolean;
  t: (key: string) => string;
}

export function AdminLoginFormFields({ form, errors, disabled, t }: AdminLoginFormFieldsProps) {
  const submitCount = form.formState.submitCount;

  return (
    <div className="space-y-4">
      <TextField
        id="admin-email"
        type="email"
        {...FIELD_PROPS}
        {...form.register("email")}
        label={t("emailLabel")}
        placeholder={t("emailPlaceholder")}
        error={errors.email}
        shakeKey={submitCount}
        readOnly={disabled}
        required
        autoComplete="email"
      />

      <TextField
        id="admin-password"
        type="password"
        {...FIELD_PROPS}
        {...form.register("password")}
        label={t("passwordLabel")}
        placeholder={t("passwordPlaceholder")}
        error={errors.password}
        shakeKey={submitCount}
        readOnly={disabled}
        passwordToggle
        required
        autoComplete="current-password"
      />

      {/* Ghi nhớ đăng nhập & Quên mật khẩu */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <Controller
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <Checkbox
                id="admin-remember"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                disabled={disabled}
                className="size-4.5 rounded-[5px] border-[#D4D4D8] data-checked:border-[#18181B] data-checked:bg-[#18181B] data-checked:text-white"
              />
            )}
          />
          <label
            htmlFor="admin-remember"
            className="cursor-pointer select-none text-xs font-medium text-[#71717A] transition-colors hover:text-[#09090B]"
          >
            {t("rememberMe")}
          </label>
        </div>

        <button
          type="button"
          onClick={() => showToast(t("forgotPasswordNotice"))}
          className="cursor-pointer text-xs font-medium text-[#71717A] transition-colors hover:text-[#09090B] hover:underline"
        >
          {t("forgotPassword")}
        </button>
      </div>
    </div>
  );
}
