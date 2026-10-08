"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/features/auth";
import { getErrorMessage, translateMessage } from "@/lib/messages";
import { showToast as toast } from "@/components/ui/toast";
import { usePersonalInfoStore } from "../store/personalInfoStore";
import {
  confirmEmailVerificationApi,
  confirmPhoneVerificationApi,
  requestEmailVerificationApi,
  requestPhoneVerificationApi,
} from "../api/profile.api";

export type ContactType = "email" | "phone";
type Step = "input" | "code";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Luồng xác minh / đổi Email & SĐT bằng mã 6 số:
 * 1. Nhập email/SĐT (mặc định là giá trị hiện tại) -> gửi mã
 * 2. Nhập mã -> xác nhận -> cập nhật thông tin người dùng
 */
export function useContactVerification() {
  const t = useTranslations("ProfilePage.personal");
  const tProfile = useTranslations("ProfilePage");
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const loadUserIntoForm = usePersonalInfoStore((state) => state.loadUserIntoForm);

  const [contactType, setContactType] = useState<ContactType | null>(null);
  const [step, setStep] = useState<Step>("input");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const showError = (error: unknown) => {
    const message = getErrorMessage(error, t("verifyError"));
    toast.error(translateMessage(message, t("verifyError"), tProfile));
  };

  const sendCodeMutation = useMutation({
    mutationFn: () =>
      contactType === "email"
        ? requestEmailVerificationApi(value.trim())
        : requestPhoneVerificationApi(value.trim()),
    onSuccess: (response) => {
      setStep("code");
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(translateMessage(response.message, t("codeSent"), tProfile));
    },
    onError: showError,
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      contactType === "email"
        ? confirmEmailVerificationApi(value.trim(), code)
        : confirmPhoneVerificationApi(value.trim(), code),
    onSuccess: (response) => {
      const updatedUser = response.data;
      setUser(updatedUser);
      queryClient.setQueryData(["me"], updatedUser);
      loadUserIntoForm(updatedUser);
      toast.success(translateMessage(response.message, t("verifySuccess"), tProfile));
      close();
    },
    onError: showError,
  });

  const open = (type: ContactType) => {
    setContactType(type);
    setStep("input");
    setCode("");
    setValue((type === "email" ? user?.email : user?.phone) || "");
  };

  function close() {
    setContactType(null);
    setStep("input");
    setCode("");
    setValue("");
  }

  return {
    contactType,
    isOpen: contactType !== null,
    step,
    value,
    setValue,
    code,
    setCode,
    cooldown,
    open,
    close,
    backToInput: () => setStep("input"),
    sendCode: () => sendCodeMutation.mutate(),
    confirm: () => confirmMutation.mutate(),
    isSending: sendCodeMutation.isPending,
    isConfirming: confirmMutation.isPending,
  };
}
