"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type CollectionStatus } from "../../types/collections.types";
import { COLLECTION_STATUS_META } from "../../utils/collectionStatusMeta";

export function CollectionStatusBadge({ status, className }: { status: CollectionStatus; className?: string }) {
  const t = useTranslations("AdminPage.collections");
  const { icon: Icon, badgeClass } = COLLECTION_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-medium",
        badgeClass,
        className
      )}
    >
      <Icon size={12} aria-hidden />
      {t(`status.${status}`)}
    </span>
  );
}
