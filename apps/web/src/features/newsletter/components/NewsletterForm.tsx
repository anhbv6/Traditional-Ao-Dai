"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Mail, Send } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ActionButton, ON_PRIMARY_COLORS } from "@/components/shared/ActionButton";
import { TextField } from "@/components/shared/TextField";
import { useNotify } from "@/hooks/useNotify";
import { subscribeNewsletterApi } from "../api/newsletter.api";
import {
  newsletterSchema,
  type NewsletterFormInput,
  type NewsletterPayload,
} from "../validations/newsletter.validation";

/* Ô Newsletter cao bằng nút "Đăng ký" (min-h-12), lề trong rộng hơn mặc định */
const NEWSLETTER_FIELD_CLASS = "min-h-12 px-4";

/**
 * Form Newsletter / VIP Club (nền đỏ đô ở Footer trang chủ).
 * - Bấm "Đăng ký" → validate → gọi API (đang mock) → toast thành công + xoá form. Không điều hướng.
 * - Dưới ô email: bình thường hiện ví dụ đúng; nhập sai thì ví dụ được thay bằng lỗi, sửa đúng thì ví dụ hiện lại.
 * - Ghi chú pháp lý: nêu mục đích nhận email + quyền huỷ đăng ký (Nghị định 13/2023 về bảo vệ dữ liệu cá nhân).
 */
export function NewsletterForm() {
  const t = useTranslations("Footer.newsletter");
  const notify = useNotify();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<NewsletterFormInput, unknown, NewsletterPayload>({
    resolver: zodResolver(newsletterSchema),
    /* Kiểm tra khi rời ô lần đầu, sau đó kiểm tra lại theo từng lần gõ */
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  const onSubmit = async (payload: NewsletterPayload) => {
    try {
      await subscribeNewsletterApi(payload);
      notify.success(t("success"));
      reset();
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <form className="grid gap-3 mt-3 sm:grid-cols-[1fr_auto] sm:items-start" onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        id="footer-email"
        type="email"
        autoComplete="email"
        aria-label={t("emailLabel")}
        placeholder={t("emailPlaceholder")}
        tone="onPrimary"
        appearance="outline"
        prefix={<Mail strokeWidth={1.6} />}
        fieldClassName={NEWSLETTER_FIELD_CLASS}
        error={errors.email && notify.translateError(errors.email.message)}
        helperText={errors.email ? undefined : t("emailHint")}
        shakeKey={submitCount}
        {...register("email")}
      />
      <ActionButton
        type="submit"
        variant="custom"
        size="lg"
        colors={ON_PRIMARY_COLORS.solid}
        icon={<Send strokeWidth={1.6} />}
        iconPosition="end"
        loading={isSubmitting}
      >
        {t("submit")}
      </ActionButton>

      <p className="text-xs leading-5 text-white/60 sm:col-span-2">
        {t.rich("legal", {
          link: (chunks) => (
            <Link href="/faqs#privacy" className="underline underline-offset-2 hover:text-white">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
