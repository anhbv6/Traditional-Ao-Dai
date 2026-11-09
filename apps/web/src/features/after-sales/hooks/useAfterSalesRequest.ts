"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type MediaItem } from "@/components/shared/MediaUploader";
import { lookupOrderApi } from "@/features/orders";
import { submitAfterSalesRequestApi } from "../api/afterSales.api";
import {
  afterSalesRequestSchema,
  type AfterSalesRequestData,
  type AfterSalesRequestInput,
} from "../validations/afterSales.validation";

const DEFAULT_VALUES: AfterSalesRequestInput = {
  itemIndex: "",
  service: "ALTERATION",
  reason: "",
  description: "",
  handover: "STORE",
};

/**
 * Luồng yêu cầu hậu mãi: (1) xác minh đơn bằng mã đơn + SĐT/email (dùng lại API tra cứu đơn),
 * (2) chọn món, loại yêu cầu, lý do, mô tả + ảnh, (3) gửi.
 */
export function useAfterSalesRequest() {
  const [contact, setContact] = useState("");
  const [photos, setPhotos] = useState<MediaItem[]>([]);

  const lookup = useMutation({ mutationFn: lookupOrderApi });
  const submitMutation = useMutation({ mutationFn: submitAfterSalesRequestApi });

  const form = useForm<AfterSalesRequestInput, unknown, AfterSalesRequestData>({
    resolver: zodResolver(afterSalesRequestSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  /** Tra đơn — đổi đơn thì xoá lựa chọn cũ của form */
  const findOrder = (values: { orderCode: string; contact: string }) => {
    const normalizedContact = values.contact.replace(/\s+/g, "");
    setContact(normalizedContact);
    form.reset(DEFAULT_VALUES);
    submitMutation.reset();
    lookup.mutate({ orderCode: values.orderCode, contact: normalizedContact });
  };

  const order = lookup.data ?? null;

  const submit = form.handleSubmit((values) => {
    if (!order) return;
    const item = order.items[Number(values.itemIndex)];
    if (!item) return;
    submitMutation.mutate({
      orderCode: order.orderCode,
      contact,
      productName: item.productName,
      service: values.service,
      reason: values.reason,
      description: values.description,
      handover: values.handover,
      photoCount: photos.length,
    });
  });

  /** Gửi thêm yêu cầu khác cho cùng đơn */
  const startOver = () => {
    form.reset(DEFAULT_VALUES);
    setPhotos([]);
    submitMutation.reset();
  };

  return {
    form,
    order,
    findOrder,
    lookupError: lookup.error,
    isLookingUp: lookup.isPending,
    photos,
    setPhotos,
    submit,
    isSubmitting: submitMutation.isPending,
    result: submitMutation.data ?? null,
    submitError: submitMutation.error,
    startOver,
  };
}
