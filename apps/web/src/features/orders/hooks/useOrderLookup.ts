"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lookupOrderApi } from "../api/orders.api";
import { lookupSchema, type LookupFormData, type LookupFormInput } from "../validations/orders.validation";

/**
 * Tra cứu đơn bằng mã đơn + SĐT/email (không cần đăng nhập). API trả cùng một lỗi khi sai mã hoặc sai liên hệ.
 */
export function useOrderLookup() {
  const form = useForm<LookupFormInput, unknown, LookupFormData>({
    resolver: zodResolver(lookupSchema),
    mode: "onTouched",
    defaultValues: { orderCode: "", contact: "" },
  });

  const mutation = useMutation({ mutationFn: lookupOrderApi });

  const submit = form.handleSubmit((values) => {
    mutation.mutate({ orderCode: values.orderCode, contact: values.contact.replace(/\s+/g, "") });
  });

  return { form, submit, result: mutation.data ?? null, error: mutation.error, isPending: mutation.isPending };
}
