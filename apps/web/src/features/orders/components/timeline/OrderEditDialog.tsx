"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Ruler, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { ORDER_MEASUREMENT_KEYS, type OrderMeasurements, type OrderTimelineDto } from "@repo/shared/orders";
import { AppDialog } from "@/components/shared/AppDialog";
import { OtpInput } from "@/components/shared/OtpInput";
import { TextField } from "@/components/shared/TextField";
import { type OrderEditState } from "../../hooks/useOrderEdit";
import { addressSchema, type AddressFormData } from "../../validations/orders.validation";

const ADDRESS_FORM_ID = "order-address-form";
const MEASUREMENTS_FORM_ID = "order-measurements-form";

/** Ô số đo: để trống được; có giá trị thì phải là số trong khoảng hợp lý */
const measurementField = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    const number = Number(value.replace(",", "."));
    return Number.isFinite(number) && number >= 1 && number <= 300;
  }, "MEASUREMENT_OUT_OF_RANGE");

const measurementsFormSchema = z.object(
  Object.fromEntries(ORDER_MEASUREMENT_KEYS.map((key) => [key, measurementField])) as Record<
    (typeof ORDER_MEASUREMENT_KEYS)[number],
    typeof measurementField
  >
);
type MeasurementsFormData = z.infer<typeof measurementsFormSchema>;

/** Bước 1 của mọi thao tác sửa: gửi + nhập OTP tới SĐT của đơn */
function OtpStep({ edit, maskedPhone }: { edit: OrderEditState; maskedPhone: string }) {
  const t = useTranslations("OrdersPage.edit");
  return (
    <div className="space-y-5">
      <p className="flex gap-2.5 border-l-2 border-(--accent-color) bg-(--bg-secondary)/70 px-4 py-3 text-xs leading-5 text-(--text-light)">
        <ShieldCheck size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-(--primary-ink)" aria-hidden="true" />
        {t("otpDescription", { phone: edit.maskedPhone || maskedPhone })}
      </p>
      {edit.otpSent ? (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-(--text-light)">{t("codeLabel")}</p>
          <OtpInput value={edit.code} onChange={edit.setCode} autoFocus />
          <button
            type="button"
            onClick={edit.sendOtp}
            disabled={edit.isSending}
            className="cursor-pointer text-xs text-(--text-light) underline-offset-4 hover:text-(--primary-ink) hover:underline disabled:opacity-50"
          >
            {t("resend")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AddressForm({ order, onSubmit }: { order: OrderTimelineDto; onSubmit: (data: AddressFormData) => void }) {
  const t = useTranslations("OrdersPage.edit");
  const tErrors = useTranslations("Errors");
  const detail = order.shippingDetail;
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: "onTouched",
    defaultValues: {
      province: detail?.province ?? "",
      district: detail?.district ?? "",
      ward: detail?.ward ?? "",
      addressLine: detail?.addressLine ?? order.shippingAddress,
    },
  });
  const { errors } = form.formState;
  const err = (key?: string) => (key ? tErrors(key) : undefined);

  return (
    <form id={ADDRESS_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2" noValidate>
      <TextField label={t("province")} {...form.register("province")} error={err(errors.province?.message)} />
      <TextField label={t("district")} {...form.register("district")} error={err(errors.district?.message)} />
      <TextField label={t("ward")} {...form.register("ward")} error={err(errors.ward?.message)} />
      <TextField label={t("addressLine")} {...form.register("addressLine")} error={err(errors.addressLine?.message)} />
    </form>
  );
}

function MeasurementsForm({ initial, onSubmit }: { initial: OrderMeasurements; onSubmit: (data: OrderMeasurements) => void }) {
  const t = useTranslations("OrdersPage");
  const tErrors = useTranslations("Errors");
  const form = useForm<MeasurementsFormData>({
    resolver: zodResolver(measurementsFormSchema),
    mode: "onTouched",
    defaultValues: Object.fromEntries(ORDER_MEASUREMENT_KEYS.map((key) => [key, initial[key]?.toString() ?? ""])) as MeasurementsFormData,
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((values) => {
    const result: OrderMeasurements = {};
    for (const key of ORDER_MEASUREMENT_KEYS) {
      const raw = values[key].trim();
      if (raw) result[key] = Number(raw.replace(",", "."));
    }
    onSubmit(result);
  });

  return (
    <form id={MEASUREMENTS_FORM_ID} onSubmit={submit} className="grid grid-cols-2 gap-4 sm:grid-cols-3" noValidate>
      {ORDER_MEASUREMENT_KEYS.map((key) => (
        <TextField
          key={key}
          inputMode="decimal"
          label={t(`measurement.${key}`)}
          suffix={key === "weight" ? "kg" : "cm"}
          {...form.register(key)}
          error={errors[key]?.message ? tErrors(errors[key].message) : undefined}
        />
      ))}
    </form>
  );
}

/**
 * Hộp thoại sửa đơn từ magic link: chưa xác minh → bước OTP; đã xác minh (15 phút) → form địa chỉ hoặc số đo.
 */
export function OrderEditDialog({ order, edit }: { order: OrderTimelineDto; edit: OrderEditState }) {
  const t = useTranslations("OrdersPage.edit");
  const target = edit.target;
  const item = target?.kind === "measurements" ? order.items.find((entry) => entry.id === target.itemId) : undefined;
  const isAddress = target?.kind === "address";

  // onClick trả `false` để AppDialog GIỮ hộp thoại mở (bước kế tiếp hiện ngay trong hộp)
  const confirm = !edit.isVerified
    ? edit.otpSent
      ? { label: t("verify"), onClick: () => (edit.verify(), false), loading: edit.isVerifying, disabled: edit.code.length !== 6 }
      : { label: t("sendCode"), onClick: () => (edit.sendOtp(), false), loading: edit.isSending }
    : { label: t("save"), form: isAddress ? ADDRESS_FORM_ID : MEASUREMENTS_FORM_ID, loading: edit.isSaving };

  return (
    <AppDialog
      open={target !== null}
      onOpenChange={(open) => (open ? undefined : edit.close())}
      icon={isAddress ? MapPin : Ruler}
      eyebrow={order.orderCode}
      title={isAddress ? t("addressTitle") : t("measurementsTitle", { item: item?.productName ?? "" })}
      description={edit.isVerified ? t("verifiedDescription") : t("otpTitle")}
      size="lg"
      confirm={confirm}
      cancel={{ label: t("cancel") }}
    >
      {!edit.isVerified ? (
        <OtpStep edit={edit} maskedPhone={order.maskedPhone} />
      ) : isAddress ? (
        <AddressForm order={order} onSubmit={(data) => edit.saveAddress(data)} />
      ) : item ? (
        <MeasurementsForm initial={item.measurements} onSubmit={(data) => edit.saveMeasurements(item.id, data)} />
      ) : null}
    </AppDialog>
  );
}

