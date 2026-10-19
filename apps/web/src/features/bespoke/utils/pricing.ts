import {
  BASE_DAYS,
  DECORATIONS,
  FABRICS,
  PANTS,
  RUSH_DAYS,
  RUSH_RATE,
  STYLES,
  type BespokeConfig,
} from "../data/bespokeOptions";

export interface BespokeQuote {
  basePrice: number;
  fabricSurcharge: number;
  decorationSurcharge: number;
  pantsSurcharge: number;
  rushFee: number;
  total: number;
  /** Khoảng ngày hoàn thiện (đã gồm thử & chỉnh) */
  minDays: number;
  maxDays: number;
}

const findById = <T extends { id: string }>(list: readonly T[], id: string): T => list.find((item) => item.id === id) ?? list[0];

/** Báo giá tạm tính — hàm thuần (Backend tính lại khi có API đặt may) */
export function quoteBespoke(config: BespokeConfig): BespokeQuote {
  const style = findById(STYLES, config.style);
  const fabric = findById(FABRICS, config.fabric);
  const decoration = findById(DECORATIONS, config.decoration);
  const pants = findById(PANTS, config.pants);

  const subtotal = style.basePrice + fabric.surcharge + decoration.surcharge + pants.surcharge;
  const rushFee = config.timeline === "rush" ? Math.round((subtotal * RUSH_RATE) / 1000) * 1000 : 0;
  const minDays = config.timeline === "rush" ? RUSH_DAYS : BASE_DAYS + style.extraDays + decoration.extraDays;

  return {
    basePrice: style.basePrice,
    fabricSurcharge: fabric.surcharge,
    decorationSurcharge: decoration.surcharge,
    pantsSurcharge: pants.surcharge,
    rushFee,
    total: subtotal + rushFee,
    minDays,
    maxDays: config.timeline === "rush" ? RUSH_DAYS + 1 : minDays + 3,
  };
}
