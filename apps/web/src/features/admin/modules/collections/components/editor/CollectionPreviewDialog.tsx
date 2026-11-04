"use client";

import { useState } from "react";
import { Eye, Monitor, Shirt, Smartphone, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { cn } from "@/lib/utils";
import { AdminDialog } from "@/features/admin/core/ui";
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
      bodyClassName="bg-[#E4E4E7] p-3 sm:p-6"
      headerAside={
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-lg border border-[#E4E4E7] p-0.5">
            {(
              [
                { value: "desktop", icon: Monitor },
                { value: "mobile", icon: Smartphone },
              ] as const
            ).map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={device === value}
                aria-label={t(`device.${value}`)}
                onClick={() => setDevice(value)}
                className={cn(
                  "grid h-7 w-8 cursor-pointer place-items-center rounded-md",
                  device === value ? "bg-[#18181B] text-white" : "text-[#71717A] hover:text-[#09090B]"
                )}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-[#E4E4E7] p-0.5">
            {(["vi", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={locale === code}
                onClick={() => setLocale(code)}
                className={cn(
                  "h-7 cursor-pointer rounded-md px-2 text-xs font-medium uppercase",
                  locale === code ? "bg-[#18181B] text-white" : "text-[#71717A] hover:text-[#09090B]"
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div
        className={cn(
          "mx-auto overflow-hidden bg-(--bg-main) text-(--text-main) shadow-xl transition-[max-width] duration-300",
          isMobile ? "max-w-[390px] rounded-[28px] border-8 border-[#18181B]" : "max-w-full rounded-lg"
        )}
      >
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
          <div className={cn("absolute inset-x-0 bottom-0 text-white", isMobile ? "p-5" : "p-10")}>
            {season && <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/85">{season}</p>}
            <h1
              className={cn(
                "mt-2 font-(family-name:--font-playfair) font-semibold leading-tight",
                isMobile ? "text-3xl" : "text-5xl"
              )}
            >
              {name || t("untitled")}
            </h1>
            {tagline && <p className={cn("mt-2 text-white/90", isMobile ? "text-sm" : "text-lg")}>{tagline}</p>}
            <span aria-hidden className="mt-4 block h-0.5 w-16" style={{ backgroundColor: accent }} />
          </div>
        </section>

        <div className={cn("space-y-10", isMobile ? "px-4 py-8" : "px-10 py-12")}>
          {description && (
            <p
              className={cn(
                "mx-auto max-w-2xl text-center leading-relaxed text-(--text-light)",
                isMobile ? "text-sm" : "text-base"
              )}
            >
              {description}
            </p>
          )}

          {highlighted.length > 0 && (
            <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-3")}>
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
            <div className={cn("grid gap-x-4 gap-y-6", isMobile ? "grid-cols-2" : "grid-cols-4")}>
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
              <h2
                className={cn(
                  "text-center font-(family-name:--font-playfair) font-semibold text-(--primary-ink)",
                  isMobile ? "text-2xl" : "text-3xl"
                )}
              >
                {t("lookbook")}
              </h2>
              {story && (
                <p className="mx-auto max-w-2xl whitespace-pre-line text-center text-sm leading-relaxed text-(--text-light)">
                  {story}
                </p>
              )}
              {values.gallery.length > 0 && (
                <div className={cn("grid gap-2", isMobile ? "grid-cols-2" : "grid-cols-4")}>
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
