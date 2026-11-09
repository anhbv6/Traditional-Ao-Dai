"use client";

import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { ActionLink } from "@/components/shared/ActionLink";
import { TextField } from "@/components/shared/TextField";
import { TextAreaField } from "@/components/shared/TextAreaField";
import { useNotify } from "@/hooks/useNotify";
import { ORDER_NOTES_MAX_LENGTH } from "../validations/checkout.validation";
import { type ShippingData, type ShippingFormInput } from "../types/checkout.types";
import { CheckoutStepCard } from "./CheckoutStepCard";

/** Nhãn nhóm ô nhập: chữ nhỏ đỏ đô + vạch mảnh kéo hết hàng để tách nhóm rõ ràng */
const LEGEND_CLASS =
  "mb-4 flex w-full items-center gap-3 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-ink)] after:h-px after:flex-1 after:bg-[var(--border)] after:content-['']";

interface CheckoutShippingFormProps {
  form: UseFormReturn<ShippingFormInput, unknown, ShippingData>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
}

/**
 * Bước 1 — thông tin giao hàng (React Hook Form + TextField dùng chung, kiểu gạch chân như trang Liên hệ):
 * nhóm "Người nhận" (tên, SĐT có mask, email) → nhóm "Địa chỉ" (tỉnh / quận / phường, địa chỉ chi tiết) → ghi chú.
 * Lỗi là mã KEY, dịch qua `useNotify().translateError`; bấm tiếp tục khi còn lỗi thì ô lỗi rung nhẹ.
 */
export function CheckoutShippingForm({ form, onSubmit }: CheckoutShippingFormProps) {
  const t = useTranslations("CheckoutPage");
  const notify = useNotify();
  const {
    register,
    formState: { errors, submitCount },
  } = form;

  const errorOf = (key: keyof ShippingFormInput) => (errors[key] ? notify.translateError(errors[key]?.message) : undefined);

  return (
    <form onSubmit={onSubmit} noValidate>
      <CheckoutStepCard
        title={t("shipping.title")}
        description={t("shipping.description")}
        actions={
          <>
            <ActionLink href="/cart" variant="cancel" size="md" icon={<ArrowLeft />}>
              {t("backToCart")}
            </ActionLink>
            <ActionButton type="submit" variant="confirm" size="md" icon={<ArrowRight />} iconPosition="end">
              {t("actions.toPayment")}
            </ActionButton>
          </>
        }
      >
        <fieldset>
          <legend className={LEGEND_CLASS}>{t("shipping.receiverGroup")}</legend>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-x-6">
            <TextField
              required
              label={t("shipping.fullName")}
              placeholder={t("shipping.fullNamePlaceholder")}
              autoComplete="name"
              error={errorOf("fullName")}
              shakeKey={submitCount}
              {...register("fullName")}
            />
            <TextField
              required
              type="tel"
              mask="phone"
              label={t("shipping.phone")}
              placeholder={t("shipping.phonePlaceholder")}
              autoComplete="tel"
              inputMode="numeric"
              error={errorOf("phone")}
              shakeKey={submitCount}
              {...register("phone")}
            />
            <TextField
              required
              type="email"
              label={t("shipping.email")}
              placeholder={t("shipping.emailPlaceholder")}
              autoComplete="email"
              helperText={errors.email ? undefined : t("shipping.emailHint")}
              error={errorOf("email")}
              shakeKey={submitCount}
              className="sm:col-span-2"
              {...register("email")}
            />
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className={LEGEND_CLASS}>{t("shipping.addressGroup")}</legend>
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-x-6">
            <TextField
              required
              label={t("shipping.province")}
              placeholder={t("shipping.provincePlaceholder")}
              autoComplete="address-level1"
              error={errorOf("province")}
              shakeKey={submitCount}
              {...register("province")}
            />
            <TextField
              required
              label={t("shipping.district")}
              placeholder={t("shipping.districtPlaceholder")}
              autoComplete="address-level2"
              error={errorOf("district")}
              shakeKey={submitCount}
              {...register("district")}
            />
            <TextField
              required
              label={t("shipping.ward")}
              placeholder={t("shipping.wardPlaceholder")}
              autoComplete="address-level3"
              error={errorOf("ward")}
              shakeKey={submitCount}
              {...register("ward")}
            />
            <TextField
              required
              label={t("shipping.address")}
              placeholder={t("shipping.addressPlaceholder")}
              autoComplete="street-address"
              error={errorOf("address")}
              shakeKey={submitCount}
              className="sm:col-span-3"
              {...register("address")}
            />
          </div>
        </fieldset>

        <TextAreaField
          className="mt-8"
          label={t("shipping.notes")}
          placeholder={t("shipping.notesPlaceholder")}
          rows={2}
          autoResize
          maxLength={ORDER_NOTES_MAX_LENGTH}
          showCount
          {...register("notes")}
        />
      </CheckoutStepCard>
    </form>
  );
}
export default CheckoutShippingForm;
