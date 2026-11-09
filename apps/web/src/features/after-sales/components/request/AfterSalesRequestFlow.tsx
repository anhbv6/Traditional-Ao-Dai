"use client";

import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Search, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { ChoiceGroup, type ChoiceOption } from "@/components/shared/ChoiceGroup";
import { MediaUploader } from "@/components/shared/MediaUploader";
import { StepPanel } from "@/components/shared/StepPanel";
import { TextAreaField } from "@/components/shared/TextAreaField";
import { TextField } from "@/components/shared/TextField";
import { lookupSchema, type LookupFormData, type LookupFormInput } from "@/features/orders";
import { extractErrorMessage } from "@/lib/messages";
import {
  AFTER_SALES_DESCRIPTION_MAX,
  AFTER_SALES_MAX_PHOTOS,
  AFTER_SALES_REASONS,
  AFTER_SALES_SERVICES,
  HANDOVER_METHODS,
  type AfterSalesService,
  type HandoverMethod,
} from "../../constants/afterSalesOptions";
import { useAfterSalesRequest } from "../../hooks/useAfterSalesRequest";
import { allowedServicesFor, isOrderEligible } from "../../utils/eligibility";
import { AfterSalesSuccess } from "./AfterSalesSuccess";

/**
 * Luồng gửi yêu cầu sửa đồ / đổi trả:
 * 01 Xác minh đơn (mã đơn + SĐT/email) → 02 Chọn món & loại yêu cầu → 03 Mô tả, ảnh, cách gửi áo.
 * Áo may đo chỉ được chỉnh sửa / bảo hành (đổi, trả bị khoá). Đơn chưa giao xong thì chưa mở bước 02.
 */
export function AfterSalesRequestFlow() {
  const t = useTranslations("AfterSalesPage.request");
  const tReasons = useTranslations("AfterSalesPage.reasons");
  const tServices = useTranslations("AfterSalesPage.policy.services");
  const tStatus = useTranslations("OrdersPage.status");
  const tErrors = useTranslations("Errors");
  const flow = useAfterSalesRequest();
  const { form, order } = flow;

  const lookupForm = useForm<LookupFormInput, unknown, LookupFormData>({
    resolver: zodResolver(lookupSchema),
    mode: "onTouched",
    defaultValues: { orderCode: "", contact: "" },
  });

  const [itemIndex, service] = useWatch({ control: form.control, name: ["itemIndex", "service"] });
  const selectedItem = order && itemIndex !== "" ? order.items[Number(itemIndex)] : undefined;
  const allowed = selectedItem ? allowedServicesFor(selectedItem) : AFTER_SALES_SERVICES;

  const errorText = (key?: string) => (key ? (tErrors.has(key) ? tErrors(key) : tErrors("DEFAULT_ERROR")) : undefined);
  const apiErrorText = (error: unknown) => {
    const key = extractErrorMessage(error);
    return tErrors.has(key) ? tErrors(key) : tErrors("DEFAULT_ERROR");
  };

  if (order && flow.result) {
    return (
      <AfterSalesSuccess
        requestCode={flow.result.requestCode}
        orderCode={order.orderCode}
        productName={selectedItem?.productName ?? ""}
        service={service}
        onStartOver={flow.startOver}
      />
    );
  }

  const itemOptions: ChoiceOption<string>[] =
    order?.items.map((item, index) => ({
      value: String(index),
      label: item.productName,
      description: [item.variantName, item.isCustomFit ? t("customFit") : null].filter(Boolean).join(" · ") || undefined,
      meta: `× ${item.quantity}`,
    })) ?? [];

  const serviceOptions: ChoiceOption<AfterSalesService>[] = AFTER_SALES_SERVICES.map((value) => ({
    value,
    label: tServices(`${value}.title`),
    description: allowed.includes(value) ? tServices(`${value}.short`) : t("notForCustomFit"),
    disabled: !allowed.includes(value),
  }));

  const reasonOptions: ChoiceOption<string>[] = AFTER_SALES_REASONS[service].map((value) => ({
    value,
    label: tReasons(`${service}.${value}`),
  }));

  const handoverOptions: ChoiceOption<HandoverMethod>[] = HANDOVER_METHODS.map((value) => ({
    value,
    label: t(`handover.${value}.title`),
    description: t(`handover.${value}.description`),
  }));

  const eligible = order ? isOrderEligible(order.orderStatus) : false;
  const { errors } = form.formState;

  return (
    <div className="grid gap-6">
      <StepPanel
        index={1}
        title={t("lookup.title")}
        description={t("lookup.description")}
        aside={order ? <span className="font-mono text-sm tracking-wider text-(--primary-ink)">{order.orderCode}</span> : null}
      >
        <form onSubmit={lookupForm.handleSubmit(flow.findOrder)} noValidate className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <TextField
            label={t("lookup.orderCode")}
            placeholder={t("lookup.orderCodePlaceholder")}
            autoComplete="off"
            inputClassName="uppercase"
            {...lookupForm.register("orderCode")}
            error={errorText(lookupForm.formState.errors.orderCode?.message)}
          />
          <TextField
            label={t("lookup.contact")}
            placeholder={t("lookup.contactPlaceholder")}
            autoComplete="tel"
            {...lookupForm.register("contact")}
            error={errorText(lookupForm.formState.errors.contact?.message)}
          />
          <ActionButton
            type="submit"
            variant={order ? "dialog" : "confirm"}
            size="lg"
            icon={<Search />}
            loading={flow.isLookingUp}
            className="w-full sm:mt-6 sm:w-auto"
          >
            {order ? t("lookup.again") : t("lookup.submit")}
          </ActionButton>
        </form>

        {flow.lookupError ? (
          <p role="alert" className="mt-5 border-l-2 border-(--danger) bg-(--danger)/5 px-4 py-3 text-xs leading-5 text-(--danger)">
            {apiErrorText(flow.lookupError)}
          </p>
        ) : null}

        {order && !eligible ? (
          <p role="status" className="mt-5 flex gap-3 border-l-2 border-(--primary-color) bg-(--bg-secondary) px-4 py-3.5 text-sm leading-6 text-(--text-main)">
            <AlertCircle aria-hidden="true" className="mt-1 size-4 shrink-0 text-(--primary-ink)" />
            <span>{t("notEligible", { status: tStatus(order.orderStatus) })}</span>
          </p>
        ) : null}

        {!order ? (
          <p className="mt-5 flex gap-2 text-xs leading-5 text-(--text-light)">
            <ShieldCheck size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-(--primary-ink)" aria-hidden="true" />
            {t("lookup.privacyNote")}
          </p>
        ) : null}
      </StepPanel>

      {order && eligible ? (
        <form onSubmit={flow.submit} noValidate className="grid gap-6">
          <StepPanel index={2} title={t("choose.title")} description={t("choose.description")}>
            <Controller
              control={form.control}
              name="itemIndex"
              render={({ field }) => (
                <ChoiceGroup
                  label={t("choose.item")}
                  hideLabel={false}
                  options={itemOptions}
                  value={field.value}
                  columns={2}
                  onChange={(value) => {
                    field.onChange(value);
                    // Đổi sang áo may đo mà đang chọn đổi / trả → quay về sửa đồ
                    const next = order.items[Number(value)];
                    if (next && !allowedServicesFor(next).includes(form.getValues("service"))) {
                      form.setValue("service", "ALTERATION");
                      form.setValue("reason", "");
                    }
                  }}
                />
              )}
            />
            {errors.itemIndex ? <p className="mt-2 text-xs text-(--danger)">{errorText(errors.itemIndex.message)}</p> : null}

            <Controller
              control={form.control}
              name="service"
              render={({ field }) => (
                <ChoiceGroup
                  className="mt-8"
                  label={t("choose.service")}
                  hideLabel={false}
                  options={serviceOptions}
                  value={field.value}
                  columns={2}
                  onChange={(value) => {
                    field.onChange(value);
                    form.setValue("reason", "");
                  }}
                />
              )}
            />
          </StepPanel>

          <StepPanel
            index={3}
            title={t("detail.title")}
            description={t("detail.description")}
            actions={
              <>
                <p className="max-w-sm text-xs leading-5 text-(--text-light)">{t("detail.responseNote")}</p>
                <ActionButton
                  type="submit"
                  variant="confirm"
                  size="lg"
                  loading={flow.isSubmitting}
                  icon={<ArrowRight />}
                  iconPosition="end"
                  className="w-full sm:w-auto"
                >
                  {flow.isSubmitting ? t("detail.submitting") : t("detail.submit")}
                </ActionButton>
              </>
            }
          >
            <Controller
              control={form.control}
              name="reason"
              render={({ field }) => (
                <ChoiceGroup
                  label={t("detail.reason")}
                  hideLabel={false}
                  variant="chip"
                  options={reasonOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.reason ? <p className="mt-2 text-xs text-(--danger)">{errorText(errors.reason.message)}</p> : null}

            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <TextAreaField
                  required
                  className="mt-8"
                  label={t("detail.descriptionLabel")}
                  placeholder={t(`detail.placeholder.${service}`)}
                  rows={3}
                  autoResize
                  showCount
                  maxLength={AFTER_SALES_DESCRIPTION_MAX}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errorText(errors.description?.message)}
                />
              )}
            />

            <MediaUploader
              className="mt-8"
              label={t("detail.photos")}
              items={flow.photos}
              onItemsChange={flow.setPhotos}
              maxFiles={AFTER_SALES_MAX_PHOTOS}
              maxVideoMB={0}
            />

            <Controller
              control={form.control}
              name="handover"
              render={({ field }) => (
                <ChoiceGroup
                  className="mt-8"
                  label={t("detail.handoverLabel")}
                  hideLabel={false}
                  options={handoverOptions}
                  value={field.value}
                  columns={2}
                  onChange={field.onChange}
                />
              )}
            />

            {flow.submitError ? (
              <p role="alert" className="mt-6 border-l-2 border-(--danger) bg-(--danger)/5 px-4 py-3 text-xs leading-5 text-(--danger)">
                {apiErrorText(flow.submitError)}
              </p>
            ) : null}
          </StepPanel>
        </form>
      ) : null}
    </div>
  );
}
