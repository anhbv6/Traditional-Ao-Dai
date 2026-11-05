"use client";

import { type ComponentProps } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { type AdminCollectionItem } from "../../types/collections.types";
import { DEFAULT_ACCENT } from "../../utils/collectionStatusMeta";
import { CollectionStatusBadge } from "../shared/CollectionStatusBadge";
import { CollectionTimelineHint } from "../shared/CollectionTimelineHint";
import { CollectionCardMenu } from "./CollectionCardMenu";
import { AdminTooltip } from "@/features/admin/core/ui";

type MenuHandlers = Omit<ComponentProps<typeof CollectionCardMenu>, "collection" | "className">;

/** Ảnh bìa, hoặc khối màu nhấn kèm mã khi chưa có ảnh */
export function CollectionCover({ collection, className }: { collection: AdminCollectionItem; className?: string }) {
  const accent = collection.accentColor ?? DEFAULT_ACCENT;

  return (
    <span className={cn("relative block overflow-hidden bg-[#F4F4F5]", className)}>
      {collection.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
        <img src={collection.coverImage} alt="" className="size-full object-cover" />
      ) : (
        <span
          className="grid size-full place-items-center"
          style={{ background: `linear-gradient(160deg, ${accent}26, ${accent}0D)` }}
        >
          <span className="font-mono text-sm font-semibold tracking-widest" style={{ color: accent }}>
            {collection.code}
          </span>
        </span>
      )}
    </span>
  );
}

/** Thẻ bộ sưu tập ở kiểu xem lưới — ảnh bìa là chính, thông tin vận hành gọn ở chân thẻ */
export function CollectionCard({ collection, ...menu }: { collection: AdminCollectionItem } & MenuHandlers) {
  const t = useTranslations("AdminPage.collections");

  return (
    <article className="@container group overflow-hidden rounded-xl border border-[#E4E4E7] bg-white transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(9,9,11,0.35)]">
      <Link href={`/admin/catalog/collections/${collection.id}`} className="relative block outline-none">
        <CollectionCover
          collection={collection}
          className="aspect-[4/5] transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2">
          <CollectionStatusBadge status={collection.status} className="bg-white/95 shadow-2xs backdrop-blur" />
          {collection.showOnHomepage && (
            // Thẻ hẹp chỉ hiện ngôi sao (chữ vẫn có cho trình đọc màn hình / rê chuột)
            <AdminTooltip content={t("homepageBadge")}>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#18181B]/85 px-1.5 py-0.5 text-2xs font-medium text-white backdrop-blur">
                <Star size={11} className="fill-current" aria-hidden />
                <span className="sr-only @min-[13rem]:not-sr-only">{t("homepageBadge")}</span>
              </span>
            </AdminTooltip>
          )}
        </span>
        <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/30 to-transparent p-3 pt-10 text-white">
          {collection.season && (
            <span className="block truncate text-2xs font-medium uppercase tracking-[0.16em] text-white/80">
              {collection.season}
            </span>
          )}
          <span className="mt-0.5 line-clamp-2 block text-body font-semibold leading-snug">{collection.name}</span>
          {collection.tagline && (
            <span className="mt-0.5 line-clamp-1 block text-xs text-white/80">{collection.tagline}</span>
          )}
        </span>
      </Link>

      <div className="flex items-center gap-2 py-2 pl-3 pr-1.5">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full ring-2 ring-white"
          style={{ backgroundColor: collection.accentColor ?? DEFAULT_ACCENT }}
        />
        <div className="min-w-0 flex-1 text-xs leading-tight">
          {/* Thẻ hẹp: số sản phẩm xuống dòng riêng thay vì bị cắt còn vài chữ; thẻ rộng: cùng một dòng */}
          <div className="flex flex-col text-[#09090B] @min-[14rem]:flex-row @min-[14rem]:items-center @min-[14rem]:gap-1.5">
            <span className="font-mono font-semibold">{collection.code}</span>
            <span aria-hidden className="hidden text-[#D4D4D8] @min-[14rem]:inline">
              ·
            </span>
            <span className="truncate tabular-nums text-[#3F3F46]">
              {t("productSummary", { count: collection.productCount, selling: collection.sellingCount })}
            </span>
          </div>
          <CollectionTimelineHint collection={collection} className="mt-0.5 block" />
        </div>
        <CollectionCardMenu collection={collection} {...menu} />
      </div>
    </article>
  );
}
