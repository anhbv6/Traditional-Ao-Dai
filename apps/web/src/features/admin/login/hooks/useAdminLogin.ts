"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { notifyError, notifySuccess } from "@/lib/messages";
import { useAuthStore } from "@/features/auth/store/authStore";
import { type AuthUser } from "@/features/auth/types/auth.types";
import { HttpError } from "@/lib/api-client";
import { adminLoginApi } from "../api/adminLogin.api";
import { adminLoginSchema, type AdminLoginFormValues } from "../validations/adminLogin.validation";

export function useAdminLogin() {
  const t = useTranslations("AdminPage.login");
  const router = useRouter();
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

      const responseData = res?.data || (res as any);
      const token = responseData?.token || responseData?.accessToken;
      const rawUser = responseData?.user;

      if (!token || !rawUser) {
        throw new Error("Không nhận được token hoặc thông tin người dùng từ máy chủ.");
      }

      const adminUser: AuthUser = {
        id: rawUser.id,
        email: rawUser.email,
        name: rawUser.name || "Quản trị viên",
        phone: rawUser.phone || "",
        avatar: rawUser.avatar || null,
        role: rawUser.role || "ADMIN",
        isActive: rawUser.isActive ?? true,
      };

      // Zustand v5 State Management update
      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(token);
      setAuthenticated(token, adminUser);
      setLoading(false);

      // Lưu trữ user vào localStorage để header/layout admin không bị mất thông tin khi reload (do admin không có api /me)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("admin_user", JSON.stringify(adminUser));
        } catch (storageErr) {
          console.warn("Không thể lưu admin_user vào localStorage:", storageErr);
        }
      }

      // Lưu cookie cho Next.js Server Middleware (Proxy) nhận diện bảo vệ route
      if (formData.rememberMe) {
        const maxAge = 7 * 86400;
        document.cookie = `admin_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `auth_role=${adminUser.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
      } else {
        // Session Cookie: Tự động hết hạn khi đóng trình duyệt
        document.cookie = `admin_token=${token}; path=/; SameSite=Lax`;
        document.cookie = `auth_role=${adminUser.role}; path=/; SameSite=Lax`;
      }

      notifySuccess(t("loginSuccess"));

      setTimeout(() => {
        router.push("/admin/dashboard");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      console.error("Admin login error:", err);
      notifyError(err, "loginError", t);
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
