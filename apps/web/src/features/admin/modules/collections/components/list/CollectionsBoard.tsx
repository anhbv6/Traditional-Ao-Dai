"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GalleryVerticalEnd, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import { setCollectionHomepageAction } from "../../actions/collections.actions";
import { type AdminCollectionItem, type CollectionStatus } from "../../types/collections.types";
import { COLLECTION_STATUSES } from "../../utils/collectionLifecycle";
import { CollectionCard } from "./CollectionCard";

// Hộp thoại chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const CreateCollectionDialog = dynamic(() => import("./CreateCollectionDialog").then((m) => m.CreateCollectionDialog));
const ChangeCollectionStatusDialog = dynamic(() =>
  import("../shared/ChangeCollectionStatusDialog").then((m) => m.ChangeCollectionStatusDialog)
);
const ConfirmDeleteCollectionDialog = dynamic(() =>
  import("../shared/ConfirmDeleteCollectionDialog").then((m) => m.ConfirmDeleteCollectionDialog)
);

type StatusFilter = "ALL" | CollectionStatus;
type HomepageFilter = "ALL" | "SHOWN" | "HIDDEN";

const HOMEPAGE_FILTERS: HomepageFilter[] = ["ALL", "SHOWN", "HIDDEN"];

// Bộ sưu tập đã lưu trữ không còn chiếm vị trí trang chủ dù cờ vẫn bật
const isOnHomepage = (c: AdminCollectionItem) => c.showOnHomepage && c.status !== "ARCHIVED";

/** Màn danh sách bộ sưu tập: lưới thẻ theo ảnh bìa */
export function CollectionsBoard({ initialCollections }: { initialCollections: AdminCollectionItem[] }) {
  const t = useTranslations("AdminPage.collections");
  const tPage = useTranslations("AdminPage.pages.collections");
  const notify = useNotify();
  const [collections, setCollections] = useState(initialCollections);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [homepageFilter, setHomepageFilter] = useState<HomepageFilter>("ALL");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [statusChange, setStatusChange] = useState<{
    collection: AdminCollectionItem;
    target: CollectionStatus;
  } | null>(null);
  const [deleting, setDeleting] = useState<AdminCollectionItem | null>(null);

  const keyword = search.trim().toLowerCase();
  const matchesSearch = (c: AdminCollectionItem) =>
    !keyword ||
    [c.name, c.code, c.season ?? "", c.tagline ?? ""].some((value) => value.toLowerCase().includes(keyword));
  const matchesHomepage = (c: AdminCollectionItem) =>
    homepageFilter === "ALL" || isOnHomepage(c) === (homepageFilter === "SHOWN");
  const searched = collections.filter((c) => matchesSearch(c) && matchesHomepage(c));
  const visible = statusFilter === "ALL" ? searched : searched.filter((c) => c.status === statusFilter);

  const replaceCollection = (updated: AdminCollectionItem) =>
    setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const handleToggleHomepage = async (collection: AdminCollectionItem) => {
    const showOnHomepage = !collection.showOnHomepage;
    const res = await setCollectionHomepageAction({ collectionId: collection.id, showOnHomepage });
    if (!res.success) {
      notify.error(res.error, "COLLECTION_UPDATE_FAILED");
      return;
    }
    replaceCollection({ ...collection, showOnHomepage });
    notify.success(showOnHomepage ? t("homepageAdded") : t("homepageRemoved"));
  };

  const menuHandlers = {
    onChangeStatus: (collection: AdminCollectionItem, target: CollectionStatus) =>
      setStatusChange({ collection, target }),
    onToggleHomepage: handleToggleHomepage,
    onDelete: setDeleting,
  };

  return (
    <>
      <AdminListPanel
        icon={GalleryVerticalEnd}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("create.open"), onClick: () => setIsCreating(true) }}
        filters={
          <>
            <AdminFilterSelect
              label={t("statusLabel")}
              value={statusFilter}
              onChange={setStatusFilter}
              options={(["ALL", ...COLLECTION_STATUSES] as const).map((status) => ({
                value: status,
                label: `${status === "ALL" ? t("filterAll") : t(`status.${status}`)} (${
                  status === "ALL" ? searched.length : searched.filter((c) => c.status === status).length
                })`,
              }))}
              className="w-full sm:w-56"
            />
            <AdminFilterSelect
              label={t("homepageFilter.label")}
              value={homepageFilter}
              onChange={setHomepageFilter}
              options={HOMEPAGE_FILTERS.map((value) => ({ value, label: t(`homepageFilter.${value}`) }))}
              className="w-full sm:w-56"
            />
          </>
        }
      />

      {collections.length === 0 ? (
        <EmptyState onCreate={() => setIsCreating(true)} />
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-[#E4E4E7] bg-white py-16 text-center text-sm text-[#71717A]">
          {t("noResults")}
        </p>
      ) : (
        // Tự chia cột theo chỗ trống: mỗi cột rộng tối thiểu max(10rem, 1/5 khung) → không bao giờ quá 5 thẻ / hàng
        <div className="grid grid-cols-[repeat(auto-fill,minmax(max(10rem,calc((100%-3rem)/5)),1fr))] gap-3">
          {visible.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} {...menuHandlers} />
          ))}
        </div>
      )}

      {isCreating && <CreateCollectionDialog open onOpenChange={setIsCreating} />}
      {statusChange && (
        <ChangeCollectionStatusDialog
          collection={statusChange.collection}
          target={statusChange.target}
          onOpenChange={(open) => !open && setStatusChange(null)}
          onChanged={replaceCollection}
        />
      )}
      <ConfirmDeleteCollectionDialog
        collection={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={(id) => setCollections((prev) => prev.filter((c) => c.id !== id))}
      />
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("AdminPage.collections");

  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-[#D4D4D8] bg-white px-6 py-20 text-center">
      <div className="flex -space-x-3" aria-hidden>
        {["#9F1239", "#B45309", "#15803D"].map((color, index) => (
          <span
            key={color}
            className="h-20 w-16 rounded-lg border-2 border-white shadow-sm"
            style={{
              background: `linear-gradient(160deg, ${color}40, ${color}14)`,
              transform: `rotate(${(index - 1) * 6}deg)`,
            }}
          />
        ))}
      </div>
      <h2 className="mt-5 text-lg font-semibold text-[#09090B]">{t("empty.title")}</h2>
      <p className="mt-1 max-w-sm text-sm text-[#71717A]">{t("empty.description")}</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#18181B] px-3.5 text-sm font-medium text-white hover:bg-[#09090B]"
      >
        <Plus size={16} aria-hidden /> {t("create.open")}
      </button>
    </div>
  );
}
