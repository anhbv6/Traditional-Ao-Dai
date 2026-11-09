"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { newPasswordSchema } from "@repo/shared/validation";
import { establishCustomerSession } from "@/features/auth";
import { useNotify } from "@/hooks/useNotify";
import { extractErrorMessage, notifyDevCode } from "@/lib/messages";
import { registerFromOrderApi, sendOrderOtpApi } from "../api/orders.api";
import { ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";

/**
 * Hộp "Tạo tài khoản" ở trang cảm ơn: gửi OTP tới SĐT của đơn → nhập mã + mật khẩu (hoặc Google).
 * Thông tin đã thuộc tài khoản khác → API trả ORDER_ACCOUNT_EXISTS (chỉ sau khi OTP đúng) → hộp chuyển sang mời đăng nhập.
 */
export function useClaimAccount(token: string, onCreated?: () => void) {
  const t = useTranslations("OrdersPage");
  const tResponses = useTranslations("OrdersPage.responses");
  const notify = useNotify();
  const queryClient = useQueryClient();

  const [otpSent, setOtpSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"created" | "exists" | null>(null);

  const sendOtp = useMutation({
    mutationFn: () => sendOrderOtpApi({ token, purpose: "CLAIM" }),
    onSuccess: (data) => {
      setOtpSent(true);
      setMaskedPhone(data.maskedPhone);
      notifyDevCode(data, tResponses);
    },
    onError: (error) => notify.error(error, "DEFAULT_ERROR"),
  });

  const register = useMutation({
    mutationFn: (payload: { method: "password"; password: string } | { method: "google"; credential: string }) =>
      registerFromOrderApi({ ...payload, token, code }),
    onSuccess: async (data) => {
      onCreated?.();
      await establishCustomerSession(data.accessToken);
      setOutcome("created");
      notify.success(t("responses.REGISTER_FROM_ORDER_SUCCESS"));
      await queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
    },
    onError: (error) => {
      if (extractErrorMessage(error) === "ORDER_ACCOUNT_EXISTS") {
        setOutcome("exists");
        return;
      }
      notify.error(error, "DEFAULT_ERROR");
    },
  });

  const submitPassword = () => {
    const parsed = newPasswordSchema.safeParse(password);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "PASSWORD_MIN_LENGTH");
      return;
    }
    setPasswordError(null);
    register.mutate({ method: "password", password });
  };

  return {
    otpSent,
    maskedPhone,
    code,
    setCode,
    password,
    setPassword,
    passwordError,
    outcome,
    canSubmit: otpSent && code.length === 6,
    sendOtp: () => sendOtp.mutate(),
    isSending: sendOtp.isPending,
    submitPassword,
    submitGoogle: (credential: string) => register.mutate({ method: "google", credential }),
    isSubmitting: register.isPending,
  };
}
