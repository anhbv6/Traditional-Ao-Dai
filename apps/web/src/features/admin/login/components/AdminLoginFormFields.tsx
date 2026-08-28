"use client";

import React from "react";
import { Mail, Lock } from "lucide-react";
import { showToast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/FormInput";
import { Checkbox } from "@/components/ui/checkbox";

interface AdminLoginFormFieldsProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  errors?: {
    email?: string;
    password?: string;
  };
  t: (key: string) => string;
}

export function AdminLoginFormFields({
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  errors,
  t,
}: AdminLoginFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Email address field with FormInput */}
      <FormInput
        id="admin-email"
        type="email"
        label={t("emailLabel")}
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors?.email}
        startIcon={<Mail size={16} />}
        required
        autoComplete="email"
        containerClassName="space-y-1.5"
        labelClassName="text-xs font-semibold text-zinc-700 tracking-normal font-sans"
        className="w-full bg-white/80 hover:bg-white focus:bg-white border-zinc-200/80 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 shadow-2xs font-normal"
      />

      {/* Password field with FormInput */}
      <FormInput
        id="admin-password"
        type="password"
        label={t("passwordLabel")}
        placeholder={t("passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors?.password}
        startIcon={<Lock size={16} />}
        passwordToggle={true}
        passwordToggleLabels={{
          show: t("showPassword"),
          hide: t("hidePassword"),
        }}
        required
        autoComplete="current-password"
        containerClassName="space-y-1.5"
        labelClassName="text-xs font-semibold text-zinc-700 tracking-normal font-sans"
        className="w-full bg-white/80 hover:bg-white focus:bg-white border-zinc-200/80 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 shadow-2xs font-normal"
      />

      {/* Remember me option & Forgot password */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="admin-remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(!!checked)}
            className="size-4.5 rounded-[5px] border-zinc-300 data-checked:border-zinc-900 data-checked:bg-zinc-900 data-checked:text-white"
          />
          <label
            htmlFor="admin-remember"
            className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-900 transition-colors select-none font-medium"
          >
            {t("rememberMe")}
          </label>
        </div>

        <button
          type="button"
          onClick={() => showToast(t("forgotPasswordNotice"))}
          className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900 hover:underline transition-colors cursor-pointer font-medium"
        >
          {t("forgotPassword")}
        </button>
      </div>
    </div>
  );
}
