"use client";

import { useState } from "react";
import { Eye, Monitor, Shirt, Smartphone, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { cn } from "@/lib/utils";
import { AdminDialog, AdminLangSwitch } from "@/features/admin/core/ui";
import { type SaveCollectionValues } from "../../schemas/collections.schemas";
import { type CollectionPickerProduct, type CollectionStatus } from "../../types/collections.types";
import { daysUntil, fromDateInputValue, orderCollectionProducts } from "../../utils/collectionLifecycle";
import { DEFAULT_ACCENT } from "../../utils/collectionStatusMeta";

interface CollectionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: SaveCollectionValues;
  status: CollectionStatus;
  productsById: Map<string, CollectionPickerProduct>;
}

type Device = "desktop" | "mobile";

const DEVICES = [
  { value: "desktop", icon: Monitor },
  { value: "mobile", icon: Smartphone },
] as const;

/* Cùng kiểu AdminLangSwitch: khung trắng cao 32px, mục đang chọn nền xám nhạt */
const SEGMENT_CLASS =
  "flex h-full cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#18181B]/15";

/**
 * Xem trước trang bộ sưu tập như khách thấy, dựng từ dữ liệu ĐANG SOẠN (chưa cần lưu).
 * Bố cục đổi theo nút thiết bị chứ không theo kích thước cửa sổ admin; có cả bản tiếng Anh.
 * Áp đúng luật hiển thị: ẩn sản phẩm đang tắt bán, đẩy hàng hết xuống cuối nếu bật, ảnh mobile nếu có.
 */
export function CollectionPreviewDialog({
  open,
  onOpenChange,
  values,
  status,
  productsById,
}: CollectionPreviewDialogProps) {
  const t = useTranslations("AdminPage.collections.preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [locale, setLocale] = useState<Locale>("vi");
  const isMobile = device === "mobile";
  const en = locale === "en";

  const pick = (vi: string, enValue: string) => (en && enValue ? enValue : vi);
  const name = pick(values.name, values.nameEn);
  const tagline = pick(values.tagline, values.taglineEn);
  const season = pick(values.season, values.seasonEn);
  const description = pick(values.description, values.descriptionEn);
  const story = pick(values.story, values.storyEn);
  const accent = values.accentColor || DEFAULT_ACCENT;

  const hero = isMobile
    ? values.bannerImageMobile || values.coverImageMobile || values.coverImage || values.bannerImage
    : values.bannerImage || values.coverImage;

  // Khách chỉ thấy sản phẩm đang mở bán; nháp/lưu trữ vẫn liệt kê để admin hình dung bố cục
  const resolved = values.products.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ ...product, isHighlighted: item.isHighlighted }] : [];
  });
  const visibleProducts = status === "ARCHIVED" ? resolved : resolved.filter((p) => p.isActive);
  const hiddenCount = resolved.length - visibleProducts.length;
  const ordered = orderCollectionProducts(visibleProducts, values.autoPushOosToBottom);
  const highlighted = ordered.filter((p) => p.isHighlighted && (!values.autoPushOosToBottom || p.totalStock > 0));
  const rest = ordered.filter((p) => !highlighted.includes(p));

  const launch = fromDateInputValue(values.launchAt);
  const launchDays = launch ? daysUntil(launch) : null;
  const price = (amount: number) => formatVnd(amount, locale);

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Eye}
      title={t("title")}
      description={t(`statusNote.${status}`)}
      size="full"
      bodyClassName="bg-[#F4F4F5] p-3 sm:p-6"
      toolbar={
        <div className="flex items-center justify-between gap-3">
          <div
            role="group"
            aria-label={t("deviceLabel")}
            className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-[#E4E4E7] bg-white p-0.5"
          >
            {DEVICES.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={device === value}
                onClick={() => setDevice(value)}
                className={cn(
                  SEGMENT_CLASS,
                  device === value
                    ? "bg-[#F4F4F5] text-[#09090B]"
                    : "text-[#71717A] hover:bg-[#FAFAFA] hover:text-[#09090B]"
                )}
              >
                <Icon size={14} aria-hidden /> {t(`device.${value}`)}
              </button>
            ))}
          </div>
          <AdminLangSwitch value={locale} onChange={setLocale} label={t("languageLabel")} />
        </div>
      }
    >
      <div
        className={cn(
          "@container mx-auto overflow-hidden bg-(--bg-main) text-(--text-main) shadow-[0_24px_48px_-24px_rgba(9,9,11,0.35)] transition-[max-width] duration-300",
          isMobile
            ? "max-w-[390px] rounded-[32px] border-[10px] border-[#18181B]"
            : "max-w-[1200px] rounded-xl border border-[#E4E4E7]"
        )}
      >
        {!isMobile && (
          <div aria-hidden className="flex items-center gap-3 border-b border-[#E4E4E7] bg-[#FAFAFA] px-4 py-2.5">
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#E4E4E7]" />
              <span className="size-2.5 rounded-full bg-[#E4E4E7]" />
              <span className="size-2.5 rounded-full bg-[#E4E4E7]" />
            </span>
            <span className="mx-auto w-full max-w-md truncate rounded-md border border-[#E4E4E7] bg-white px-3 py-1 text-center font-mono text-2xs text-[#71717A]">
              tiemthiencanh.vn/{locale}/bo-suu-tap/{values.slug}
            </span>
            <span className="w-[42px]" />
          </div>
        )}
        {status !== "ACTIVE" && (
          <div className="px-4 py-2 text-center text-xs font-medium text-white" style={{ backgroundColor: accent }}>
            {status === "COMING_SOON"
              ? launchDays !== null && launchDays > 0
                ? t("ribbon.comingSoonDays", { count: launchDays })
                : t("ribbon.comingSoon")
              : t(`ribbon.${status}`)}
          </div>
        )}

        <section className={cn("relative bg-(--bg-secondary)", isMobile ? "aspect-[4/5]" : "aspect-[16/7]")}>
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
            <img src={hero} alt="" className="absolute inset-0 size-full object-cover" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white @2xl:p-8 @4xl:p-10">
            {season && <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/85">{season}</p>}
            <h1 className="mt-2 font-(family-name:--font-playfair) text-3xl font-semibold leading-tight @2xl:text-4xl @4xl:text-5xl">
              {name || t("untitled")}
            </h1>
            {tagline && <p className="mt-2 text-sm text-white/90 @2xl:text-base @4xl:text-lg">{tagline}</p>}
            <span aria-hidden className="mt-4 block h-0.5 w-16" style={{ backgroundColor: accent }} />
          </div>
        </section>

        <div className="space-y-10 px-4 py-8 @2xl:px-8 @4xl:px-10 @4xl:py-12">
          {description && (
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-(--text-light) @2xl:text-base">
              {description}
            </p>
          )}

          {highlighted.length > 0 && (
            <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
              {highlighted.map((product) => (
                <PreviewProduct
                  key={product.id}
                  product={product}
                  price={price}
                  large
                  status={status}
                  locale={locale}
                />
              ))}
            </div>
          )}

          {rest.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 @3xl:grid-cols-3 @4xl:grid-cols-4">
              {rest.map((product) => (
                <PreviewProduct key={product.id} product={product} price={price} status={status} locale={locale} />
              ))}
            </div>
          ) : highlighted.length === 0 ? (
            <p className="py-10 text-center text-sm text-(--text-light)">{t("noProducts")}</p>
          ) : null}

          {hiddenCount > 0 && (
            <p className="rounded-md border border-dashed border-(--border) px-3 py-2 text-center text-xs text-(--text-light)">
              {t("hiddenNote", { count: hiddenCount })}
            </p>
          )}

          {(story || values.gallery.length > 0) && (
            <section className="space-y-5">
              <h2 className="text-center font-(family-name:--font-playfair) text-2xl font-semibold text-(--primary-ink) @3xl:text-3xl">
                {t("lookbook")}
              </h2>
              {story && (
                <p className="mx-auto max-w-2xl whitespace-pre-line text-center text-sm leading-relaxed text-(--text-light)">
                  {story}
                </p>
              )}
              {values.gallery.length > 0 && (
                <div className="grid grid-cols-2 gap-2 @3xl:grid-cols-4">
                  {values.gallery.map((url, index) => (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className={cn("w-full rounded object-cover", index % 3 === 0 ? "aspect-[3/4]" : "aspect-square")}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </AdminDialog>
  );
}

function PreviewProduct({
  product,
  price,
  large,
  status,
  locale,
}: {
  product: CollectionPickerProduct & { isHighlighted: boolean };
  price: (amount: number) => string;
  large?: boolean;
  status: CollectionStatus;
  locale: Locale;
}) {
  const t = useTranslations("AdminPage.collections.preview");
  const outOfStock = product.totalStock <= 0;
  const name = locale === "en" && product.nameEn ? product.nameEn : product.name;

  return (
    <article>
      <div className="relative aspect-[3/4] overflow-hidden rounded bg-(--bg-secondary)">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
          <img src={product.image} alt="" className={cn("size-full object-contain", outOfStock && "opacity-60")} />
        ) : (
          <span className="grid size-full place-items-center">
            <Shirt size={24} className="text-(--text-light)" aria-hidden />
          </span>
        )}
        {large && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-(--primary-ink)">
            <Star size={10} className="fill-current" aria-hidden /> {t("highlight")}
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-2 bottom-2 rounded bg-white/90 py-1 text-center text-[11px] font-medium text-(--text-main)">
            {t("outOfStock")}
          </span>
        )}
      </div>
      <h3 className={cn("mt-2 line-clamp-2 leading-snug", large ? "text-base font-medium" : "text-sm")}>{name}</h3>
      <p className="mt-0.5 text-sm font-medium text-(--primary-ink)">
        {status === "COMING_SOON"
          ? t("comingSoonPrice", { price: price(product.basePrice) })
          : status === "ARCHIVED"
            ? product.isActive
              ? t("stillSelling")
              : t("pastSeason")
            : price(product.basePrice)}
      </p>
    </article>
  );
}
