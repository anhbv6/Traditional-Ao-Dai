import { Layers, Scissors, Shirt, type LucideIcon } from "lucide-react";
import { PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";

/**
 * Hình thức bán:
 * - SINGLE: một món may sẵn, mua theo size có sẵn (áo lẻ, quần lẻ, phụ kiện, guốc, vải theo mét)
 * - SET: nhiều món bán chung một giá và một size bộ (áo + quần, combo mấn + kiềng...)
 * - CUSTOM: may đo theo số đo khách — không có size, không giữ tồn kho thành phẩm
 */
export const SALE_MODES = ["SINGLE", "SET", "CUSTOM"] as const;
export type SaleMode = (typeof SALE_MODES)[number];

export const SALE_MODE_ICONS: Record<SaleMode, LucideIcon> = {
  SINGLE: Shirt,
  SET: Layers,
  CUSTOM: Scissors,
};

/** Nhóm hàng bán được theo bộ (bộ áo dài, combo phụ kiện); quần lẻ, guốc, vải mét không có khái niệm bộ */
const SET_GROUPS: readonly ProductGroup[] = ["AO_DAI", "ACCESSORY"];

/** Nhóm hàng nhận may đo theo số đo — lấy từ đặc tính nhóm hàng (danh mục), không khai báo lại */
export function groupAllowsCustom(group: ProductGroup): boolean {
  return PRODUCT_GROUP_TRAITS[group].customMeasurement !== null;
}

/** Hình thức bán hợp lệ của một nhóm hàng — đổi danh mục thì danh sách này đổi theo */
export function allowedSaleModes(group: ProductGroup): SaleMode[] {
  return SALE_MODES.filter(
    (mode) => mode === "SINGLE" || (mode === "SET" && SET_GROUPS.includes(group)) || (mode === "CUSTOM" && groupAllowsCustom(group))
  );
}

/** Tiền tố mã sản phẩm theo nhóm hàng: AD0007, QD0002, PK0010, GM0003, VA0001 */
export const PRODUCT_CODE_PREFIX: Record<ProductGroup, string> = {
  AO_DAI: "AD",
  PANTS: "QD",
  ACCESSORY: "PK",
  FOOTWEAR: "GM",
  MATERIAL: "VA",
};

/** Ký hiệu size đặc biệt lưu ở `ProductVariant.size` */
export const FREE_SIZE = "FREE_SIZE";
export const CUSTOM_SIZE = "CUSTOM";

export type SizeAxis =
  /** Size theo bảng size / thuộc tính size */
  | { kind: "sized"; sizes: string[]; source: "chart" | "attributes" }
  /** Không có size (phụ kiện, vải mét) — mỗi màu một SKU */
  | { kind: "free" }
  /** May đo — mỗi màu / vải một SKU, size là số đo của khách */
  | { kind: "custom" };

/**
 * Trục size của SKU kế thừa từ danh mục: may đo → không size; nhóm hàng không có size → một cỡ;
 * còn lại lấy ký hiệu từ bảng size hiệu lực, chưa có bảng thì dùng thuộc tính size chung.
 */
export function resolveSizeAxis(params: {
  group: ProductGroup;
  saleMode: SaleMode;
  chartSizes: string[] | null;
  attributeSizes: string[];
}): SizeAxis {
  if (params.saleMode === "CUSTOM") return { kind: "custom" };
  if (PRODUCT_GROUP_TRAITS[params.group].sizing === "NONE") return { kind: "free" };
  if (params.chartSizes && params.chartSizes.length > 0) {
    return { kind: "sized", sizes: params.chartSizes, source: "chart" };
  }
  return { kind: "sized", sizes: params.attributeSizes.filter((size) => size !== FREE_SIZE), source: "attributes" };
}

/** Bỏ dấu, chỉ giữ chữ-số, in hoa: "Hồng Sen" → "HONGSEN", "do-nhung" → "DONHUNG" */
export function toSkuPart(value: string, max = 8): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, max);
}

/**
 * Quy tắc SKU: <mã sản phẩm>-<màu>-<size>.
 * VD AD0007-HONGSEN-M · AD0007-HONGSEN-MD (may đo) · PK0003-DONHUNG (không size) · AD0007-M (không màu)
 */
export function buildVariantSku(params: { productCode: string; colorCode: string | null; size: string }): string {
  const sizePart = params.size === CUSTOM_SIZE ? "MD" : params.size === FREE_SIZE ? "" : toSkuPart(params.size, 6);
  return [params.productCode, params.colorCode ? toSkuPart(params.colorCode) : "", sizePart].filter(Boolean).join("-");
}

/** Khóa tổ hợp màu + size để phát hiện trùng / tìm tổ hợp còn thiếu */
export function comboKey(colorId: string | null, size: string): string {
  return `${colorId ?? "-"}|${size.trim().toUpperCase()}`;
}
