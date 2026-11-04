"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CircleAlert, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
} from "@/features/admin/core/ui";
import { changeCollectionStatusAction, getCollectionStatusImpactAction } from "../../actions/collections.actions";
import { type AdminCollectionItem, type CollectionStatus } from "../../types/collections.types";
import { getTransitionBlockers, getTransitionOptions } from "../../utils/collectionLifecycle";
import { COLLECTION_STATUS_META } from "../../utils/collectionStatusMeta";
import { CollectionStatusBadge } from "./CollectionStatusBadge";

interface ChangeCollectionStatusDialogProps {
  collection: Pick<
    AdminCollectionItem,
    "id" | "name" | "status" | "coverImage" | "launchAt" | "productCount" | "showInLookbook"
  >;
  target: CollectionStatus | null;
  onOpenChange: (open: boolean) => void;
  onChanged: (collection: AdminCollectionItem) => void;
}

function OptionRow({
  checked,
  onChange,
  label,
  note,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  note?: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg border border-[#E4E4E7] p-3 transition-colors hover:bg-[#FAFAFA]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#18181B]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[#09090B]">{label}</span>
        {note && <span className="mt-0.5 block text-xs text-[#71717A]">{note}</span>}
      </span>
    </label>
  );
}

/**
 * Xác nhận chuyển trạng thái: hiện điều kiện còn thiếu và ảnh hưởng tới sản phẩm (kể cả sản phẩm thuộc nhiều bộ sưu tập)
 * trước khi thực hiện. Server kiểm tra lại toàn bộ.
 */
export function ChangeCollectionStatusDialog({
  collection,
  target,
  onOpenChange,
  onChanged,
}: ChangeCollectionStatusDialogProps) {
  const t = useTranslations("AdminPage.collections");
  const notify = useNotify();
  const queryClient = useQueryClient();
  const defaults = target ? getTransitionOptions(target) : getTransitionOptions("DRAFT");
  const [activateReady, setActivateReady] = useState(defaults.activateReadyProducts);
  const [hideExclusive, setHideExclusive] = useState(defaults.hideExclusiveProducts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const impact = useQuery({
    queryKey: ["admin-collection-impact", collection.id],
    enabled: Boolean(target),
    queryFn: async () => {
      const res = await getCollectionStatusImpactAction(collection.id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  if (!target) return null;

  const blockers = getTransitionBlockers(collection, target);
  const data = impact.data;
  const notReady = data ? data.hiddenProducts - data.readyHiddenProducts : 0;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await changeCollectionStatusAction({
        collectionId: collection.id,
        status: target,
        activateReadyProducts: target === "ACTIVE" && activateReady,
        hideExclusiveProducts: (target === "COMING_SOON" || target === "ARCHIVED") && hideExclusive,
      });
      if (!res.success) {
        notify.error(res.error, "COLLECTION_UPDATE_FAILED");
        return;
      }

      const { activated, hidden, skipped } = res.data;
      notify.success(
        [
          t("statusDialog.success", { status: t(`status.${target}`) }),
          activated > 0 ? t("statusDialog.activatedCount", { count: activated }) : "",
          hidden > 0 ? t("statusDialog.hiddenCount", { count: hidden }) : "",
          skipped > 0 ? t("statusDialog.skippedCount", { count: skipped }) : "",
        ]
          .filter(Boolean)
          .join(" ")
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-collection-impact", collection.id] });
      if (res.data.collection) onChanged(res.data.collection);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={COLLECTION_STATUS_META[target].icon}
      title={t(`statusDialog.title.${target}`)}
      description={collection.name}
      size="lg"
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={isSubmitting || blockers.length > 0 || impact.isPending}
            onClick={handleConfirm}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {isSubmitting ? t("processing") : t(`statusDialog.confirm.${target}`)}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CollectionStatusBadge status={collection.status} />
          <ArrowRight size={14} className="text-[#A1A1AA]" aria-hidden />
          <CollectionStatusBadge status={target} />
        </div>

        <p className="text-sm leading-relaxed text-[#3F3F46]">{t(`statusDialog.explain.${target}`)}</p>

        {blockers.length > 0 ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-medium text-rose-800">{t("statusDialog.blocked")}</p>
            <ul className="mt-1.5 space-y-1">
              {blockers.map((key) => (
                <li key={key} className="flex items-start gap-1.5 text-xs text-rose-700">
                  <CircleAlert size={13} className="mt-px shrink-0" aria-hidden />
                  {notify.translateError(key)}
                </li>
              ))}
            </ul>
          </div>
        ) : impact.isPending ? (
          <div className="flex items-center gap-2 text-xs text-[#71717A]">
            <Loader2 size={14} className="animate-spin" aria-hidden /> {t("statusDialog.loadingImpact")}
          </div>
        ) : data ? (
          <div className="space-y-2">
            {target === "ACTIVE" && data.readyHiddenProducts > 0 && (
              <OptionRow
                checked={activateReady}
                onChange={setActivateReady}
                label={t("statusDialog.activateReady", { count: data.readyHiddenProducts })}
                note={notReady > 0 ? t("statusDialog.notReadyNote", { count: notReady }) : undefined}
              />
            )}
            {/* Không có sản phẩm nào bật được thì chỉ báo, không đưa lựa chọn "mở bán 0 sản phẩm" */}
            {target === "ACTIVE" && data.readyHiddenProducts === 0 && notReady > 0 && (
              <p className="text-xs text-[#71717A]">{t("statusDialog.notReadyNote", { count: notReady })}</p>
            )}
            {(target === "COMING_SOON" || target === "ARCHIVED") && data.exclusiveActiveProducts > 0 && (
              <OptionRow
                checked={hideExclusive}
                onChange={setHideExclusive}
                label={t("statusDialog.hideExclusive", { count: data.exclusiveActiveProducts })}
                note={
                  data.sharedActiveProducts > 0
                    ? t("statusDialog.sharedNote", { count: data.sharedActiveProducts })
                    : undefined
                }
              />
            )}
            {(target === "COMING_SOON" || target === "ARCHIVED") &&
              data.exclusiveActiveProducts === 0 &&
              data.sharedActiveProducts > 0 && (
                <p className="text-xs text-[#71717A]">
                  {t("statusDialog.sharedNote", { count: data.sharedActiveProducts })}
                </p>
              )}
            {target === "ARCHIVED" && (
              <p className="text-xs text-[#71717A]">
                {collection.showInLookbook ? t("statusDialog.lookbookOn") : t("statusDialog.lookbookOff")}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </AdminDialog>
  );
}
