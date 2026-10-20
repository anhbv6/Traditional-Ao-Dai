"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, CreditCard, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/shared/ActionButton";
import { AppDialog } from "@/components/shared/AppDialog";
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
      {/* Ghi chú bảo mật nằm ở đầu khối — không tách thành khung riêng */}
      <ProfileSection title={t("secureTitle")} description={t("secureNote")}>
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
                    variant="danger"
                    size="sm"
                    icon={<Trash2 />}
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

      <AppDialog
        open={removingId !== null}
        onOpenChange={(open) => !open && setRemovingId(null)}
        tone="danger"
        size="sm"
        title={t("removeDialog.title")}
        description={t("removeDialog.message")}
        confirm={{
          label: t("removeDialog.confirmBtn"),
          icon: <Trash2 />,
          onClick: () => {
            if (removingId) handleDelete(removingId);
          },
        }}
        cancel={{ label: tProfile("logoutDialog.cancelBtn") }}
      />
    </>
  );
}
