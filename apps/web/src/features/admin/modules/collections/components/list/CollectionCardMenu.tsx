"use client";

import { MoreHorizontal, Pencil, Star, StarOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { cn } from "@/lib/utils";
import { type AdminCollectionItem, type CollectionStatus } from "../../types/collections.types";
import { COLLECTION_TRANSITIONS } from "../../utils/collectionLifecycle";
import { COLLECTION_STATUS_META } from "../../utils/collectionStatusMeta";

interface CollectionCardMenuProps {
  collection: AdminCollectionItem;
  onChangeStatus: (collection: AdminCollectionItem, target: CollectionStatus) => void;
  onToggleHomepage: (collection: AdminCollectionItem) => void;
  onDelete: (collection: AdminCollectionItem) => void;
  className?: string;
}

/** Thao tác nhanh trên thẻ: mở trình soạn, chuyển trạng thái hợp lệ, trang chủ, xóa (chỉ khi chưa công bố) */
export function CollectionCardMenu({
  collection,
  onChangeStatus,
  onToggleHomepage,
  onDelete,
  className,
}: CollectionCardMenuProps) {
  const t = useTranslations("AdminPage.collections");

  const items: AppMenuEntry[] = [
    { key: "edit", label: t("menu.edit"), icon: Pencil, href: `/admin/catalog/collections/${collection.id}` },
    { type: "separator", key: "sep-status" },
    ...COLLECTION_TRANSITIONS[collection.status].map((target) => ({
      key: `status-${target}`,
      label: t(`menu.moveTo.${target}`),
      icon: COLLECTION_STATUS_META[target].icon,
      onSelect: () => onChangeStatus(collection, target),
    })),
  ];

  if (collection.status !== "ARCHIVED") {
    items.push({
      key: "homepage",
      label: collection.showOnHomepage ? t("menu.removeHomepage") : t("menu.addHomepage"),
      icon: collection.showOnHomepage ? StarOff : Star,
      onSelect: () => onToggleHomepage(collection),
    });
  }
  if (!collection.publishedAt) {
    items.push(
      { type: "separator", key: "sep-delete" },
      { key: "delete", label: t("menu.delete"), icon: Trash2, tone: "danger", onSelect: () => onDelete(collection) }
    );
  }

  return (
    <AppMenu
      tone="admin"
      width={220}
      align="end"
      sideOffset={4}
      items={items}
      trigger={
        <button
          type="button"
          aria-label={t("menu.label", { name: collection.name })}
          className={cn(
            "grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-[#71717A] outline-none transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 data-popup-open:bg-[#F4F4F5]",
            className
          )}
        >
          <MoreHorizontal size={16} />
        </button>
      }
    />
  );
}
