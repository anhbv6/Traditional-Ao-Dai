"use client";

import React, { useId } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { TextField } from "@/components/shared/TextField";
import { type ActiveDiscount } from "../types/cart.types";

interface CartPromoSectionProps {
  promoCode: string;
  setPromoCode: (code: string) => void;
  handleApplyPromo: (e: React.FormEvent) => void;
  handleRemovePromo: () => void;
  promoError: string | null;
  activeDiscount: ActiveDiscount | null;
  promoDescription: string | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Mã giảm giá: chưa áp dụng -> ô nhập (TextField viền hộp) + nút; đã áp dụng -> thẻ mã viền đứt (gỡ được). Mỗi đơn chỉ một mã.
 */
export function CartPromoSection({
  promoCode,
  setPromoCode,
  handleApplyPromo,
  handleRemovePromo,
  promoError,
  activeDiscount,
  promoDescription,
}: CartPromoSectionProps) {
  const t = useTranslations("CartPage");
  // id riêng mỗi lần dùng: khối tóm tắt có thể hiện 2 nơi (dưới danh sách trên mobile, cột phải trên desktop)
  const inputId = useId();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {activeDiscount ? (
        <motion.div
          key="applied"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">{t("promo.title")}</p>
          <div className="mt-2 flex items-center justify-between gap-3 border border-dashed border-[var(--sale-gold)]/60 bg-[var(--bg-secondary)]/60 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Tag size={14} strokeWidth={1.6} className="shrink-0 text-[var(--sale-gold)]" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold tracking-[1.5px] text-[var(--text-main)]">{activeDiscount.code}</p>
                <p className="truncate text-[11px] text-[var(--text-light)]">{promoDescription}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              aria-label={t("promo.remove")}
              title={t("promo.remove")}
              className="grid size-7 shrink-0 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--destructive)]"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleApplyPromo}
          noValidate
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <label htmlFor={inputId} className="block text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">
            {t("promo.title")}
          </label>
          <div className="mt-2 flex items-start gap-2">
            <TextField
              id={inputId}
              className="min-w-0 flex-1"
              appearance="outline"
              size="md"
              placeholder={t("promo.placeholder")}
              prefix={<Tag size={14} strokeWidth={1.6} />}
              inputClassName="uppercase tracking-[1px] placeholder:normal-case placeholder:tracking-normal"
              value={promoCode}
              onValueChange={(value) => setPromoCode(value)}
              error={promoError ?? undefined}
            />
            <ActionButton type="submit" variant="dialog" size="md" className="shrink-0">
              {t("promo.apply")}
            </ActionButton>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
