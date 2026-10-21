"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { notifyError, notifySuccess } from "@/lib/messages";
import { useAdminSessionCache } from "@/features/admin/core/session";
import { adminLoginApi } from "../api/adminLogin.api";
import { adminLoginSchema, type AdminLoginFormValues } from "../validations/adminLogin.validation";

const DEFAULT_VALUES: AdminLoginFormValues = { email: "", password: "", rememberMe: false };

export function useAdminLogin() {
  const t = useTranslations("AdminPage.login");
  const router = useRouter();
  const sessionCache = useAdminSessionCache();
  // Giữ trạng thái loading tới khi trang dashboard render xong (router.replace không chờ điều hướng)
  const [isNavigating, startNavigation] = useTransition();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const loginMutation = useMutation({
    mutationFn: adminLoginApi,
    onSuccess: (res) => {
      // Backend đã đặt cookie httpOnly `admin_token` + `admin_session`; nạp sẵn phiên để layout admin không phải hỏi lại
      sessionCache.set(res.data.user);
      notifySuccess(res.message || "ADMIN_LOGIN_SUCCESS", t("loginSuccess"), t);
      // replace: bấm Back từ dashboard không quay lại màn đăng nhập
      startNavigation(() => router.replace("/admin/dashboard"));
    },
    onError: (err) => {
      notifyError(err, t("loginError"), t);
      form.setValue("password", "");
      form.setFocus("password");
    },
  });

  const isLoading = loginMutation.isPending || isNavigating;

  // Lỗi đã hiện ngay dưới từng ô nên không bắn thêm toast
  const handleSubmit = form.handleSubmit((values) => {
    if (isLoading) return;
    loginMutation.mutate(values);
  });

  // Schema trả mã KEY (emailRequired, invalidEmail...) → dịch tại đây
  const translateError = (key?: string) => {
    if (!key) return undefined;
    return t.has(key as Parameters<typeof t.has>[0]) ? t(key as Parameters<typeof t>[0]) : key;
  };

  const { errors } = form.formState;

  return {
    form,
    errors: {
      email: translateError(errors.email?.message),
      password: translateError(errors.password?.message),
    },
    isLoading,
    t,
    handleSubmit,
  };
}
