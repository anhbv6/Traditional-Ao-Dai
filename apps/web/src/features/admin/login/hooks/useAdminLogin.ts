"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { notifyError, notifySuccess } from "@/lib/messages";
import { useAdminSessionCache } from "../../session";
import { adminLoginApi } from "../api/adminLogin.api";
import { adminLoginSchema, type AdminLoginFormValues } from "../validations/adminLogin.validation";

export function useAdminLogin() {
  const t = useTranslations("AdminPage.login");
  const router = useRouter();
  const sessionCache = useAdminSessionCache();
  const [formData, setFormData] = useState<AdminLoginFormValues>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AdminLoginFormValues, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const setEmail = (email: string) => {
    setFormData((prev) => ({ ...prev, email }));
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const setPassword = (password: string) => {
    setFormData((prev) => ({ ...prev, password }));
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const setRememberMe = (rememberMe: boolean) => {
    setFormData((prev) => ({ ...prev, rememberMe }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = adminLoginSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Partial<Record<keyof AdminLoginFormValues, string>> = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof AdminLoginFormValues;
        if (!fieldErrors[fieldName]) {
          const errorKey = issue.message;
          fieldErrors[fieldName] = t.has(errorKey as Parameters<typeof t.has>[0])
            ? t(errorKey as Parameters<typeof t>[0])
            : errorKey;
        }
      });
      setErrors(fieldErrors);

      const firstError = Object.values(fieldErrors)[0];
      if (firstError) {
        notifyError(firstError);
      }
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await adminLoginApi({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Backend đã đặt cookie httpOnly `admin_token` + `admin_session`; client chỉ nạp lại phiên từ server
      sessionCache.set(res.data.user);

      notifySuccess(res.message || "ADMIN_LOGIN_SUCCESS", t("loginSuccess"), t);
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: unknown) {
      console.error("Admin login error:", err);
      notifyError(err, t("loginError"), t);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email: formData.email,
    setEmail,
    password: formData.password,
    setPassword,
    rememberMe: formData.rememberMe,
    setRememberMe,
    errors,
    isLoading,
    t,
    handleSubmit,
  };
}
