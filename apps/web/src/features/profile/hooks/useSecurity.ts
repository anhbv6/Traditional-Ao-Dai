"use client";

import React, { useState } from "react";
import { useAuthStore, type AuthUser } from "@/features/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage, translateMessage } from "@/lib/messages";
import { showToast as toast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";

// Helper to parse User-Agent
function parseUserAgent(ua: string) {
  if (!ua) return { device: 'Thiết bị không rõ', browser: 'Trình duyệt không rõ' };
  
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let device = 'Máy tính';

  if (ua.includes('Windows')) {
    os = 'Windows';
    device = 'Windows PC';
  } else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
    os = 'macOS';
    device = 'MacBook';
  } else if (ua.includes('iPhone')) {
    os = 'iOS';
    device = 'iPhone';
  } else if (ua.includes('iPad')) {
    os = 'iOS';
    device = 'iPad';
  } else if (ua.includes('Android')) {
    os = 'Android';
    device = 'Android Phone';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
    device = 'Linux PC';
  }

  if (ua.includes('Edg/')) {
    browser = `Edge (${os})`;
  } else if (ua.includes('Chrome/') || ua.includes('CriOS/')) {
    browser = `Chrome (${os})`;
  } else if (ua.includes('Firefox/') || ua.includes('FxiOS/')) {
    browser = `Firefox (${os})`;
  } else if (ua.includes('Safari/') && ua.includes('Version/')) {
    browser = `Safari (${os})`;
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = `Opera (${os})`;
  } else {
    browser = `Trình duyệt (${os})`;
  }

  return { device, browser };
}

// Helper to format relative time
function formatRelativeTime(dateStr: string, isCurrent: boolean) {
  if (isCurrent) return 'Đang hoạt động';
  const date = new Date(dateStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes}, ${day}/${month}/${year}`;
}

interface RawSession {
  id: string;
  device: string;
  ip: string;
  createdAt: string;
  isCurrent: boolean;
}

export function useSecurity() {
  const t = useTranslations("ProfilePage");
  const { user, setUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showSuccessPass, setShowSuccessPass] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showSuccess2fa, setShowSuccess2fa] = useState(false);

  // Fetch active login sessions
  const { data: rawSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["userSessions"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawSession[] }>("/api/user/sessions");
      return response.data || [];
    },
  });

  // Map backend session data to frontend structure
  const sessions = rawSessions.map((sess: RawSession) => {
    const { device, browser } = parseUserAgent(sess.device);
    return {
      id: sess.id,
      device: device,
      browser: browser,
      ip: sess.ip,
      location: "Việt Nam",
      time: formatRelativeTime(sess.createdAt, sess.isCurrent),
      isCurrent: sess.isCurrent,
    };
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword?: string; newPassword: string }) => {
      return apiClient.post("/api/user/change-password", payload);
    },
    onSuccess: () => {
      setShowSuccessPass(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("security.toasts.passwordChangeSuccess"));
      setTimeout(() => setShowSuccessPass(false), 3000);
    },
    onError: (error: unknown) => {
      const fallback = t("security.toasts.passwordChangeError");
      const message = getErrorMessage(error, fallback);
      toast.error(translateMessage(message, fallback, t));
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("security.toasts.passwordMismatch"));
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: currentPassword || undefined,
      newPassword,
    });
  };

  const handle2faToggle = () => {
    if (twoFactorEnabled) {
      setTwoFactorEnabled(false);
    } else {
      setShow2faSetup(true);
    }
  };

  const handle2faVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      setTwoFactorEnabled(true);
      setShow2faSetup(false);
      setOtpCode("");
      setShowSuccess2fa(true);
      toast.success(t("security.twoFactor.success"));
      setTimeout(() => setShowSuccess2fa(false), 3000);
    } else {
      toast.error(t("security.toasts.otpInvalid"));
    }
  };

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiClient.delete(`/api/user/session/${sessionId}`);
    },
    onSuccess: () => {
      refetchSessions();
      toast.success(t("security.toasts.revokeSuccess"));
    },
    onError: (error: unknown) => {
      const fallback = t("security.toasts.revokeError");
      const message = getErrorMessage(error, fallback);
      toast.error(translateMessage(message, fallback, t));
    },
  });

  const handleRevokeSession = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này không?")) {
      revokeSessionMutation.mutate(id);
    }
  };

  const isGoogleLinked = !!user?.socialAccounts?.some(
    (sa) => sa.provider === "GOOGLE"
  );
  
  const googleProviderId = user?.socialAccounts?.find(
    (sa) => sa.provider === "GOOGLE"
  )?.providerId || null;

  // Link Google Account mutation
  const linkGoogleMutation = useMutation({
    mutationFn: async (credential: string) => {
      return apiClient.post("/api/user/link", { credential });
    },
    onSuccess: async () => {
      const response = await apiClient.get<{ data: AuthUser }>("/api/auth/me");
      if (response.data) {
        setUser(response.data);
      }
      toast.success(t("security.toasts.linkGoogleSuccess"));
    },
    onError: (error: unknown) => {
      const fallback = t("security.toasts.linkGoogleError");
      const message = getErrorMessage(error, fallback);
      toast.error(translateMessage(message, fallback, t));
    },
  });

  // Unlink Google Account mutation
  const unlinkGoogleMutation = useMutation({
    mutationFn: async (providerId: string) => {
      return apiClient.delete(`/api/user/unlink/${providerId}`);
    },
    onSuccess: async () => {
      const response = await apiClient.get<{ data: AuthUser }>("/api/auth/me");
      if (response.data) {
        setUser(response.data);
      }
      toast.success(t("security.toasts.unlinkGoogleSuccess"));
    },
    onError: (error: unknown) => {
      const fallback = t("security.toasts.unlinkGoogleError");
      const message = getErrorMessage(error, fallback);
      toast.error(translateMessage(message, fallback, t));
    },
  });

  const handleLinkGoogle = (credential: string) => {
    linkGoogleMutation.mutate(credential);
  };

  const handleUnlinkGoogle = () => {
    if (googleProviderId) {
      if (confirm("Bạn có chắc chắn muốn hủy liên kết với tài khoản Google này không?")) {
        unlinkGoogleMutation.mutate(googleProviderId);
      }
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    showSuccessPass,
    handlePasswordSubmit,
    twoFactorEnabled,
    handle2faToggle,
    show2faSetup,
    setShow2faSetup,
    otpCode,
    setOtpCode,
    handle2faVerify,
    showSuccess2fa,
    sessions,
    handleRevokeSession,
    isGoogleLinked,
    handleLinkGoogle,
    handleUnlinkGoogle,
    isLinking: linkGoogleMutation.isPending || unlinkGoogleMutation.isPending,
  };
}
