"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { showToast } from "@/components/ui/toast";
import { AdminTextField } from "@/features/admin/core/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { type AdminLoginFormValues } from "../validations/adminLogin.validation";

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
      <AdminTextField
        id="admin-email"
        type="email"
        {...form.register("email")}
        label={t("emailLabel")}
        placeholder={t("emailPlaceholder")}
        error={errors.email}
        shakeKey={submitCount}
        readOnly={disabled}
        required
        autoComplete="email"
      />

      <AdminTextField
        id="admin-password"
        type="password"
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

      {/* Ghi nhớ đăng nhập & Quên mật khẩu - Cùng cấp điều khiển 14px (text-sm) */}
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
                className="size-4 rounded-[5px] border-[#D4D4D8] data-checked:border-[#18181B] data-checked:bg-[#18181B] data-checked:text-white"
              />
            )}
          />
          <label
            htmlFor="admin-remember"
            className="cursor-pointer select-none text-sm text-[#3F3F46] transition-colors hover:text-[#09090B]"
          >
            {t("rememberMe")}
          </label>
        </div>

        <button
          type="button"
          onClick={() => showToast(t("forgotPasswordNotice"))}
          className="cursor-pointer text-sm font-medium text-[#71717A] transition-colors hover:text-[#09090B] hover:underline"
        >
          {t("forgotPassword")}
        </button>
      </div>
    </div>
  );
}
