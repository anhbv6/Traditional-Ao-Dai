"use client";

import { Shirt } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type SkuStockStatus } from "../../types/inventory.types";
import { FREE_SIZE, type SizeSummary } from "../../utils/skuStock";

/** Ảnh dọc 3:4 rộng 48px như bảng sản phẩm — giữ trọn dáng áo */
export function SkuProductThumb({ image, className }: { image: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "grid aspect-[3/4] w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] ring-1 ring-[#E4E4E7]/70",
        className
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm do admin nhập (URL tùy ý), không qua next/image
        <img src={image} alt="" className="size-full object-contain" />
      ) : (
        <Shirt size={18} className="text-[#A1A1AA]" aria-hidden />
      )}
    </span>
  );
}

/** Chấm màu của SKU — chưa có mã màu thì vòng rỗng */
export function ColorDot({ hex, className }: { hex: string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-3 shrink-0 rounded-full border border-black/10", !hex && "border-dashed border-[#A1A1AA]", className)}
      style={hex ? { backgroundColor: hex } : undefined}
    />
  );
}

/** Nhãn size hiển thị — FREE_SIZE dịch thành "Freesize" */
export function useSizeLabel() {
  const t = useTranslations("AdminPage.inventory");
  return (size: string) => (size === FREE_SIZE ? t("freeSize") : size);
}

const QTY_CLASS: Record<SkuStockStatus, string> = {
  OK: "text-[#09090B]",
  LOW: "text-amber-700",
  OUT: "text-rose-600",
};

/**
 * Dải size của một sản phẩm: mỗi ô là ký hiệu size + tổng tồn các màu — như cuốn sổ ghi tồn ở quầy.
 * Màu ô theo tổng (hết = hồng, sắp hết = hổ phách); chấm đỏ nhỏ ở góc = còn hàng nhưng có màu đã hết.
 */
export function SizeStrip({ sizes, muted }: { sizes: SizeSummary[]; muted?: boolean }) {
  const sizeLabel = useSizeLabel();
  const t = useTranslations("AdminPage.inventory");
  return (
    <ul className={cn("flex flex-wrap gap-1.5", muted && "opacity-50")}>
      {sizes.map((item) => (
        <li
          key={item.size}
          className={cn(
            "relative flex min-w-11 flex-col items-center rounded-md border px-1.5 pb-0.5 pt-1 leading-none",
            item.status === "OUT"
              ? "border-rose-200 bg-rose-50/60"
              : item.status === "LOW"
                ? "border-amber-200 bg-amber-50/60"
                : "border-[#E4E4E7] bg-white"
          )}
        >
          <span className="text-2xs text-[#71717A]">{sizeLabel(item.size)}</span>
          <span className={cn("mt-0.5 font-mono text-sm font-semibold tabular-nums", QTY_CLASS[item.status])}>{item.total}</span>
          {item.hasColorGap && (
            <span className="absolute -right-1 -top-1 size-2 rounded-full bg-rose-500 ring-2 ring-white">
              <span className="sr-only">{t("colorGap")}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
