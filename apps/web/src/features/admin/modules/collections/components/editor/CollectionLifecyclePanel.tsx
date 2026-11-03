"use client";

import { Check, CircleAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { type AdminCollectionItem, type CollectionStatus } from "../../types/collections.types";
import { COLLECTION_STATUSES, COLLECTION_TRANSITIONS, getTransitionBlockers } from "../../utils/collectionLifecycle";
import { COLLECTION_STATUS_META } from "../../utils/collectionStatusMeta";

/** Bước tiến theo vòng đời — các bước còn lại (lùi về nháp, mở bán lại) là thao tác phụ */
const FORWARD: Partial<Record<CollectionStatus, CollectionStatus>> = {
  DRAFT: "COMING_SOON",
  COMING_SOON: "ACTIVE",
  ACTIVE: "ARCHIVED",
  ARCHIVED: "ACTIVE",
};

interface CollectionLifecyclePanelProps {
  collection: AdminCollectionItem;
  isDirty: boolean;
  onChangeStatus: (target: CollectionStatus) => void;
}

/** Thanh vòng đời: vị trí hiện tại, mốc thời gian, và nút chuyển kèm điều kiện còn thiếu */
export function CollectionLifecyclePanel({ collection, isDirty, onChangeStatus }: CollectionLifecyclePanelProps) {
  const t = useTranslations("AdminPage.collections");
  const notify = useNotify();
  const format = useFormatter();
  const currentIndex = COLLECTION_STATUSES.indexOf(collection.status);
  const date = (value: string | null) =>
    value ? format.dateTime(new Date(value), { day: "2-digit", month: "2-digit", year: "numeric" }) : null;

  const stepDate: Record<CollectionStatus, string | null> = {
    DRAFT: null,
    COMING_SOON: collection.launchAt ? t("lifecycle.launchOn", { date: date(collection.launchAt) ?? "" }) : null,
    // Ngày công bố chỉ có nghĩa ở bước mở bán khi đã tới/qua bước này (sắp ra mắt cũng ghi publishedAt)
    ACTIVE:
      collection.publishedAt && currentIndex >= COLLECTION_STATUSES.indexOf("ACTIVE")
        ? t("lifecycle.publishedOn", { date: date(collection.publishedAt) ?? "" })
        : null,
    ARCHIVED: collection.archivedAt ? t("lifecycle.archivedOn", { date: date(collection.archivedAt) ?? "" }) : null,
  };

  const forward = FORWARD[collection.status];
  const transitions = COLLECTION_TRANSITIONS[collection.status];
  const forwardBlockers = forward ? getTransitionBlockers(collection, forward) : [];

  return (
    <div>
      <ol className="relative">
        {COLLECTION_STATUSES.map((status, index) => {
          const { icon: Icon } = COLLECTION_STATUS_META[status];
          const isCurrent = status === collection.status;
          const isPast = index < currentIndex;
          return (
            <li key={status} className="relative flex gap-3 pb-4 last:pb-0">
              {index < COLLECTION_STATUSES.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[13px] top-7 h-[calc(100%-24px)] w-px",
                    isPast ? "bg-[#18181B]" : "bg-[#E4E4E7]"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border",
                  isCurrent
                    ? "border-[#18181B] bg-[#18181B] text-white"
                    : isPast
                      ? "border-[#18181B] bg-white text-[#18181B]"
                      : "border-[#E4E4E7] bg-white text-[#A1A1AA]"
                )}
              >
                {isPast ? <Check size={13} /> : <Icon size={13} />}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn("text-sm font-medium", isCurrent ? "text-[#09090B]" : "text-[#71717A]")}>
                  {t(`status.${status}`)}
                </p>
                <p className="text-xs text-[#A1A1AA]">{stepDate[status] ?? t(`statusHint.${status}`)}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 space-y-2 border-t border-[#F4F4F5] pt-4">
        {isDirty && <p className="text-xs text-amber-700">{t("lifecycle.saveFirst")}</p>}

        {forward && (
          <>
            <button
              type="button"
              disabled={isDirty}
              onClick={() => onChangeStatus(forward)}
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#18181B] text-sm font-medium text-white transition-colors hover:bg-[#09090B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t(`menu.moveTo.${forward}`)}
            </button>
            {forwardBlockers.length > 0 && (
              <ul className="space-y-1">
                {forwardBlockers.map((key) => (
                  <li key={key} className="flex items-start gap-1.5 text-xs text-[#71717A]">
                    <CircleAlert size={13} className="mt-px shrink-0 text-amber-600" aria-hidden />
                    {notify.translateError(key)}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {transitions
          .filter((target) => target !== forward)
          .map((target) => (
            <button
              key={target}
              type="button"
              disabled={isDirty}
              onClick={() => onChangeStatus(target)}
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-[#E4E4E7] bg-white text-sm font-medium text-[#3F3F46] transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t(`menu.moveTo.${target}`)}
            </button>
          ))}
      </div>
    </div>
  );
}
