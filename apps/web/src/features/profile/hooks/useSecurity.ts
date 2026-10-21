"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { newPasswordSchema } from "@repo/shared/validation";
import { useAuthStore, type AuthUser } from "@/features/auth";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage, translateMessage } from "@/lib/messages";
import { showToast as toast } from "@/components/ui/toast";

export type DeviceKind = "desktop" | "laptop" | "phone" | "tablet";

interface RawSession {
  id: string;
  device: string;
  ip: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface SessionView {
  id: string;
  /** Tên thiết bị đã nhận diện (Windows PC, iPhone…) — null nếu không nhận ra */
  device: string | null;
  /** Trình duyệt + hệ điều hành (Chrome (Windows)…) — null nếu không nhận ra */
  browser: string | null;
  kind: DeviceKind;
  ip: string;
  createdAt: string;
  isCurrent: boolean;
}

/** Nhận diện thiết bị / trình duyệt từ User-Agent lưu ở phiên đăng nhập */
function parseUserAgent(ua: string): Pick<SessionView, "device" | "browser" | "kind"> {
  if (!ua) return { device: null, browser: null, kind: "desktop" };

  const platforms: [RegExp, string, string, DeviceKind][] = [
    [/iPhone/, "iOS", "iPhone", "phone"],
    [/iPad/, "iPadOS", "iPad", "tablet"],
    [/Android/, "Android", "Android", "phone"],
    [/Windows/, "Windows", "Windows PC", "desktop"],
    [/Macintosh|Mac OS X/, "macOS", "Mac", "laptop"],
    [/Linux/, "Linux", "Linux PC", "desktop"],
  ];
  const platform = platforms.find(([pattern]) => pattern.test(ua));
  const os = platform?.[1] ?? null;

  const browsers: [RegExp, string][] = [
    [/Edg\//, "Edge"],
    [/OPR\/|Opera\//, "Opera"],
    [/Chrome\/|CriOS\//, "Chrome"],
    [/Firefox\/|FxiOS\//, "Firefox"],
    [/Version\/.*Safari\//, "Safari"],
  ];
  const browser = browsers.find(([pattern]) => pattern.test(ua))?.[1] ?? null;

  return {
    device: platform?.[2] ?? null,
    browser: browser ? (os ? `${browser} (${os})` : browser) : null,
    kind: platform?.[3] ?? "desktop",
  };
}

type PasswordField = "current" | "new" | "confirm";

/**
 * Bảo mật tài khoản: đổi mật khẩu (kiểm tra ngay dưới ô, cùng schema với backend),
 * liên kết / huỷ liên kết Google, xem & đăng xuất từng phiên đăng nhập.
 * Hành động huỷ liên kết / đăng xuất phiên trả Promise để hộp thoại xác nhận hiện loading và đóng khi xong.
 */
export function useSecurity() {
  const t = useTranslations("ProfilePage");
  const { user, setUser } = useAuthStore();

  /* ---------- Đổi mật khẩu ---------- */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [passwordSubmitCount, setPasswordSubmitCount] = useState(0);

  const clearPasswordError = (field: PasswordField) => {
    if (passwordErrors[field]) setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const showApiError = (error: unknown, fallbackKey: string) => {
    const fallback = t(fallbackKey);
    toast.error(translateMessage(getErrorMessage(error, fallback), fallback, t));
  };

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { currentPassword?: string; newPassword: string }) =>
      apiClient.post("/api/user/change-password", payload),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
      toast.success(t("security.toasts.passwordChangeSuccess"));
    },
    onError: (error: unknown) => showApiError(error, "security.toasts.passwordChangeError"),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (changePasswordMutation.isPending) return;
    setPasswordSubmitCount((count) => count + 1);

    const parsed = newPasswordSchema.safeParse(newPassword);
    const errors: Partial<Record<PasswordField, string>> = {
      new: !newPassword
        ? t("security.password.newRequired")
        : parsed.success
          ? undefined
          : t(`responses.${parsed.error.issues[0]?.message ?? "PASSWORD_MIN_LENGTH"}`),
      confirm: !confirmPassword
        ? t("security.password.confirmRequired")
        : confirmPassword !== newPassword
          ? t("security.toasts.passwordMismatch")
          : undefined,
    };
    setPasswordErrors(errors);
    if (errors.new || errors.confirm) return;

    changePasswordMutation.mutate({ currentPassword: currentPassword || undefined, newPassword });
  };

  /* ---------- Phiên đăng nhập ---------- */
  const sessionsQuery = useQuery({
    queryKey: ["userSessions"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawSession[] }>("/api/user/sessions");
      return response.data || [];
    },
  });

  const sessions: SessionView[] = (sessionsQuery.data ?? [])
    .map((session) => ({ ...parseUserAgent(session.device), id: session.id, ip: session.ip, createdAt: session.createdAt, isCurrent: session.isCurrent }))
    // Thiết bị hiện tại luôn đứng đầu
    .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/api/user/session/${sessionId}`),
    onSuccess: () => {
      void sessionsQuery.refetch();
      toast.success(t("security.toasts.revokeSuccess"));
    },
    onError: (error: unknown) => showApiError(error, "security.toasts.revokeError"),
  });

  /* ---------- Liên kết Google ---------- */
  const googleAccount = user?.socialAccounts?.find((account) => account.provider === "GOOGLE");

  const refreshUser = async () => {
    const response = await apiClient.get<{ data: AuthUser }>("/api/auth/me");
    if (response.data) setUser(response.data);
  };

  const linkGoogleMutation = useMutation({
    mutationFn: (credential: string) => apiClient.post("/api/user/link", { credential }),
    onSuccess: async () => {
      await refreshUser();
      toast.success(t("security.toasts.linkGoogleSuccess"));
    },
    onError: (error: unknown) => showApiError(error, "security.toasts.linkGoogleError"),
  });

  const unlinkGoogleMutation = useMutation({
    mutationFn: (providerId: string) => apiClient.delete(`/api/user/unlink/${providerId}`),
    onSuccess: async () => {
      await refreshUser();
      toast.success(t("security.toasts.unlinkGoogleSuccess"));
    },
    onError: (error: unknown) => showApiError(error, "security.toasts.unlinkGoogleError"),
  });

  return {
    // Đổi mật khẩu
    currentPassword,
    setCurrentPassword: (value: string) => {
      setCurrentPassword(value);
      clearPasswordError("current");
    },
    newPassword,
    setNewPassword: (value: string) => {
      setNewPassword(value);
      clearPasswordError("new");
    },
    confirmPassword,
    setConfirmPassword: (value: string) => {
      setConfirmPassword(value);
      clearPasswordError("confirm");
    },
    passwordErrors,
    passwordSubmitCount,
    handlePasswordSubmit,
    isChangingPassword: changePasswordMutation.isPending,

    // Phiên đăng nhập
    sessions,
    isLoadingSessions: sessionsQuery.isLoading,
    revokeSession: (id: string) => revokeSessionMutation.mutateAsync(id),
    isRevoking: revokeSessionMutation.isPending,

    // Google
    isGoogleLinked: Boolean(googleAccount),
    linkGoogle: (credential: string) => linkGoogleMutation.mutate(credential),
    unlinkGoogle: () => (googleAccount ? unlinkGoogleMutation.mutateAsync(googleAccount.providerId) : Promise.resolve()),
    isLinking: linkGoogleMutation.isPending,
    isUnlinking: unlinkGoogleMutation.isPending,
  };
}
