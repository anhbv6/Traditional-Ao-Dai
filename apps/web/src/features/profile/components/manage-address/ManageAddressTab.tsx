"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, MapPin, PencilLine, Phone, Plus, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/shared/ActionButton";
import { AppLoadingSpinner } from "@/components/shared/AppLoading";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { useManageAddress } from "../../hooks/useProfile";
import { ProfileSection } from "../ProfileSection";
import { ActionForm, DeleteForm } from "./components";

/** Backend giới hạn mỗi tài khoản 10 địa chỉ (MAX_ADDRESS_LIMIT_REACHED) */
const MAX_ADDRESSES = 10;

/**
 * Sổ địa chỉ: danh sách thẻ địa chỉ (mặc định đứng đầu, viền đỏ đô), thêm / sửa trong hộp thoại, xoá có xác nhận.
 * Đủ 10 địa chỉ thì khoá nút thêm thay vì để người dùng điền form rồi mới báo lỗi.
 */
export function ManageAddressTab() {
  const t = useTranslations("ProfilePage.address");
  const { addresses, isLoading, handleStartAdd, handleStartEdit, handleSetDefault, isSettingDefault } = useManageAddress();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const isFull = addresses.length >= MAX_ADDRESSES;

  return (
    <ProfileSection
      description={isLoading ? undefined : t("count", { count: addresses.length })}
      action={
        <ActionButton variant={isFull ? "disabled" : "confirm"} size="sm" icon={<Plus />} onClick={handleStartAdd}>
          {t("addBtn")}
        </ActionButton>
      }
    >
      {isLoading ? (
        <div className="grid place-items-center gap-3 py-14 text-center">
          <AppLoadingSpinner size={36} />
          <p className="text-[13px] text-[var(--text-light)]">{t("loading")}</p>
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t("empty")}
          description={t("emptyDesc")}
          action={t("addBtn")}
          onAction={handleStartAdd}
          className="py-10"
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sorted.map((addr) => (
            <li
              key={addr.id}
              className={cn(
                "flex flex-col border p-5 transition-colors",
                addr.isDefault
                  ? "border-[var(--primary-color)] bg-[color-mix(in_oklab,var(--primary-color)_4%,var(--bg-card))]"
                  : "border-[var(--border)] hover:border-[color-mix(in_oklab,var(--primary-color)_40%,var(--border))]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate font-[family-name:var(--font-playfair)] text-[16px] font-semibold text-[var(--text-main)]">
                  {addr.receiverName}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  {addr.label ? (
                    <span className="border border-[var(--border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-light)]">
                      {addr.label}
                    </span>
                  ) : null}
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 bg-[var(--primary-color)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[1px] text-white">
                      <Check size={11} strokeWidth={2.5} aria-hidden="true" />
                      {t("default")}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex-1 space-y-1.5 text-[13px] leading-6 text-[var(--text-light)]">
                <p className="flex items-center gap-2">
                  <Phone size={13} aria-hidden="true" className="shrink-0 text-[var(--primary-ink)]" />
                  {addr.receiverPhone}
                </p>
                <p className="flex items-start gap-2">
                  <MapPin size={13} aria-hidden="true" className="mt-1.5 shrink-0 text-[var(--primary-ink)]" />
                  <span>{[addr.addressLine, addr.wardName, addr.districtName, addr.provinceName].filter(Boolean).join(", ")}</span>
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
                {!addr.isDefault ? (
                  <ActionButton variant="dialog" size="sm" disabled={isSettingDefault} onClick={() => handleSetDefault(addr.id)}>
                    {t("setAsDefault")}
                  </ActionButton>
                ) : null}
                <div className="ml-auto flex gap-2">
                  <ActionButton variant="cancel" size="sm" icon={<PencilLine />} onClick={() => handleStartEdit(addr)}>
                    {t("edit")}
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    size="sm"
                    icon={<Trash2 />}
                    onClick={() => setDeletingId(addr.id)}
                  >
                    {t("delete")}
                  </ActionButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ActionForm />
      <DeleteForm deletingId={deletingId} setDeletingId={setDeletingId} />
    </ProfileSection>
  );
}
