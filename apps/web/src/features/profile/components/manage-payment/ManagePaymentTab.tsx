"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, CreditCard, LockKeyhole, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/shared/ActionButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { useManagePayment } from "../../hooks/useProfile";
import { type PaymentCard } from "../../types/profile.types";
import { ProfileSection } from "../ProfileSection";

const BRAND_LABEL: Record<PaymentCard["type"], string> = { visa: "Visa", mastercard: "Mastercard" };

/**
 * Phương thức thanh toán: chỉ quản lý thẻ đã lưu (đặt mặc định / gỡ thẻ có xác nhận).
 * Vì an toàn (PCI-DSS) trang tài khoản không nhận số thẻ đầy đủ hay CVV — thẻ mới lưu qua cổng thanh toán khi thanh toán.
 */
export function ManagePaymentTab() {
  const t = useTranslations("ProfilePage.payment");
  const tProfile = useTranslations("ProfilePage");
  const { cards, handleDelete, handleSetDefault } = useManagePayment();
  const [removingId, setRemovingId] = useState<string | null>(null);

  return (
    <>
      {/* Ghi chú bảo mật */}
      <div className="flex gap-4 border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:px-6">
        <span className="relative grid size-10 shrink-0 place-items-center text-[var(--primary-ink)]">
          <span aria-hidden="true" className="absolute inset-1.5 rotate-45 border border-[var(--primary-color)]/35" />
          <LockKeyhole size={16} strokeWidth={1.5} className="relative" aria-hidden="true" />
        </span>
        <div>
          <p className="font-[family-name:var(--font-playfair)] text-[16px] font-semibold text-[var(--text-main)]">{t("secureTitle")}</p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--text-light)]">{t("secureNote")}</p>
        </div>
      </div>

      <ProfileSection>
        {cards.length === 0 ? (
          <EmptyState icon={CreditCard} title={t("empty")} description={t("emptyDesc")} action={tProfile("orders.shopNow")} href="/products" className="py-10" />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className={cn(
                  "flex flex-col border p-5",
                  card.isDefault
                    ? "border-[var(--primary-color)] bg-[color-mix(in_oklab,var(--primary-color)_4%,var(--bg-card))]"
                    : "border-[var(--border)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-14 place-items-center border border-[var(--border)] bg-[var(--bg-main)] font-[family-name:var(--font-playfair)] text-[13px] font-semibold italic text-[var(--primary-ink)]">
                      {BRAND_LABEL[card.type]}
                    </span>
                    <p className="font-semibold tracking-[2px] text-[var(--text-main)] tabular-nums">{card.number.slice(-9)}</p>
                  </div>
                  {card.isDefault ? (
                    <span className="inline-flex items-center gap-1 bg-[var(--primary-color)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[1px] text-white">
                      <Check size={11} strokeWidth={2.5} aria-hidden="true" />
                      {t("default")}
                    </span>
                  ) : null}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[1.5px] text-[var(--text-light)]">{t("cardholder")}</dt>
                    <dd className="mt-0.5 truncate font-medium text-[var(--text-main)]">{card.holder}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[1.5px] text-[var(--text-light)]">{t("expires")}</dt>
                    <dd className="mt-0.5 font-medium text-[var(--text-main)] tabular-nums">{card.expiry}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
                  {!card.isDefault ? (
                    <ActionButton variant="dialog" size="sm" onClick={() => handleSetDefault(card.id)}>
                      {t("setAsDefault")}
                    </ActionButton>
                  ) : null}
                  <ActionButton
                    variant="cancel"
                    size="sm"
                    icon={<Trash2 />}
                    colors={{ text: "var(--destructive)" }}
                    onClick={() => setRemovingId(card.id)}
                    className="ml-auto"
                  >
                    {t("remove")}
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>

      <ConfirmDialog
        open={removingId !== null}
        onOpenChange={(open) => !open && setRemovingId(null)}
        confirmVariant="destructive"
        title={t("removeDialog.title")}
        description={t("removeDialog.message")}
        confirmText={t("removeDialog.confirmBtn")}
        cancelText={tProfile("logoutDialog.cancelBtn")}
        customTitle="text-lg sm:text-2xl"
        onConfirm={() => {
          if (removingId) handleDelete(removingId);
          setRemovingId(null);
        }}
      />
    </>
  );
}
