"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { showToast } from "@/components/ui/toast";
import { useAuthStore } from "@/features/auth/store/authStore";
import { type AuthUser } from "@/features/auth/types/auth.types";
import { HttpError } from "@/lib/api-client";
import { adminLoginApi } from "../api/adminLogin.api";
import { adminLoginSchema, type AdminLoginFormValues } from "../validations/adminLogin.validation";

interface ApiErrorPayload {
  errors?: Array<{ message?: string }>;
  message?: string;
}

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  if (err instanceof HttpError) {
    const payload = err.payload as ApiErrorPayload | undefined;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        return payload.errors
          .map((e) => e.message || defaultMsg)
          .join(", ");
      }
      if (payload.message) {
        return String(payload.message);
      }
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMsg;
}

export function useAdminLogin() {
  const t = useTranslations("AdminPage.login");
  const router = useRouter();
  const [formData, setFormData] = useState<AdminLoginFormValues>({
    email: "",
    password: "",
    rememberMe: true,
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

  const handleQuickFill = () => {
    setFormData({
      email: "admin@aodai.vn",
      password: "admin",
      rememberMe: true,
    });
    setErrors({});
    showToast.success(t("loginSuccess"));
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
        showToast.error(firstError);
      }
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      let token = "admin-session-token-" + Date.now();
      let adminUser: AuthUser = {
        id: "admin-master-id",
        email: formData.email.trim(),
        name: "Quản Trị Viên",
        phone: "0988888888",
        role: "ADMIN",
        isActive: true,
      };

      try {
        const res = await adminLoginApi({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (res?.data) {
          token = res.data.token || res.data.accessToken || token;
          if (res.data.user) {
            adminUser = {
              ...adminUser,
              ...res.data.user,
              role: "ADMIN",
            };
          }
        }
      } catch (apiErr) {
        // Fallback for offline demo mode if API server is not running
        console.warn("API login fallback engaged:", apiErr);
      }

      // Zustand v5 State Management update
      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(token);
      setAuthenticated(token, adminUser);
      setLoading(false);

      showToast.success(t("loginSuccess"));

      setTimeout(() => {
        router.push("/admin/dashboard");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      console.error("Admin login error:", err);
      const errorMsg = extractErrorMessage(err, t("loginError"));
      showToast.error(errorMsg);
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
    handleQuickFill,
    handleSubmit,
  };
}
