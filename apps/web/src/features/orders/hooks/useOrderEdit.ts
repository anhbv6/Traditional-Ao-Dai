"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type OrderMeasurements, type OrderTimelineDto, type ShippingDetail } from "@repo/shared/orders";
import { useNotify } from "@/hooks/useNotify";
import { extractErrorMessage, notifyDevCode } from "@/lib/messages";
import { sendOrderOtpApi, updateOrderAddressApi, updateOrderMeasurementsApi, verifyOrderEditApi } from "../api/orders.api";
import { ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";

export type EditTarget = { kind: "address" } | { kind: "measurements"; itemId: string };

/**
 * Sửa đơn từ magic link: link chỉ READ → phải nhập OTP gửi tới SĐT của đơn để mở phiên sửa 15 phút
 * (editToken chỉ giữ trong bộ nhớ). Lưu thành công thì cập nhật thẳng cache timeline.
 */
export function useOrderEdit(token: string) {
  const t = useTranslations("OrdersPage");
  const tResponses = useTranslations("OrdersPage.responses");
  const notify = useNotify();
  const queryClient = useQueryClient();

  const [target, setTarget] = useState<EditTarget | null>(null);
  const [editToken, setEditToken] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");

  const sendOtp = useMutation({
    mutationFn: () => sendOrderOtpApi({ token, purpose: "EDIT" }),
    onSuccess: (data) => {
      setOtpSent(true);
      setMaskedPhone(data.maskedPhone);
      notifyDevCode(data, tResponses);
    },
    onError: (error) => notify.error(error, "DEFAULT_ERROR"),
  });

  const verify = useMutation({
    mutationFn: () => verifyOrderEditApi({ token, code }),
    onSuccess: (data) => {
      setEditToken(data.editToken);
      setCode("");
      notify.success(t("responses.ORDER_EDIT_VERIFIED"));
    },
    onError: (error) => notify.error(error, "OTP_INCORRECT"),
  });

  const applyTimeline = (timeline: OrderTimelineDto) => {
    queryClient.setQueryData(ORDER_QUERY_KEYS.track(token), timeline);
    setTarget(null);
  };

  /** Phiên sửa hết hạn → quay lại bước OTP */
  const handleEditError = (error: unknown) => {
    notify.error(error, "DEFAULT_ERROR");
    if (extractErrorMessage(error) === "ORDER_EDIT_SESSION_EXPIRED") {
      setEditToken(null);
      setOtpSent(false);
    }
  };

  const saveAddress = useMutation({
    mutationFn: (shipping: ShippingDetail) => updateOrderAddressApi({ token, editToken: editToken ?? "", shipping }),
    onSuccess: (timeline) => {
      applyTimeline(timeline);
      notify.success(t("responses.ORDER_ADDRESS_UPDATED"));
    },
    onError: handleEditError,
  });

  const saveMeasurements = useMutation({
    mutationFn: (payload: { itemId: string; measurements: OrderMeasurements }) =>
      updateOrderMeasurementsApi({ token, editToken: editToken ?? "", ...payload }),
    onSuccess: (timeline) => {
      applyTimeline(timeline);
      notify.success(t("responses.ORDER_MEASUREMENTS_UPDATED"));
    },
    onError: handleEditError,
  });

  return {
    target,
    open: (next: EditTarget) => setTarget(next),
    close: () => setTarget(null),
    isVerified: editToken !== null,
    otpSent,
    maskedPhone,
    code,
    setCode,
    sendOtp: () => sendOtp.mutate(),
    isSending: sendOtp.isPending,
    verify: () => verify.mutate(),
    isVerifying: verify.isPending,
    saveAddress: (shipping: ShippingDetail) => saveAddress.mutate(shipping),
    saveMeasurements: (itemId: string, measurements: OrderMeasurements) => saveMeasurements.mutate({ itemId, measurements }),
    isSaving: saveAddress.isPending || saveMeasurements.isPending,
  };
}

export type OrderEditState = ReturnType<typeof useOrderEdit>;
