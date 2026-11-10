import { topsFromRolls } from "@repo/shared/materials";
import { toSlug } from "@/features/admin/modules/products";
import {
  type AdminFabricRoll,
  type FabricMovementType,
  type FabricStockStatus,
} from "../types/fabrics.types";

/** Ngưỡng cảnh báo mặc định khi chất liệu chưa có định mức (≈ một bộ áo dài) */
export const DEFAULT_LOW_THRESHOLD = 3;

/** Thứ tự hiện trong danh sách: cần xử lý lên trước, cây ngưng dùng xuống cuối */
export const FABRIC_STATUS_ORDER: Record<FabricStockStatus, number> = { OUT: 0, LOW: 1, OK: 2, INACTIVE: 3 };

/** Tình trạng cây vải theo số mét còn lại và ngưỡng */
export function resolveFabricStatus(roll: Pick<AdminFabricRoll, "isActive" | "remainingMeters" | "lowStockThreshold">): FabricStockStatus {
  if (!roll.isActive) return "INACTIVE";
  if (roll.remainingMeters <= 0) return "OUT";
  if (roll.remainingMeters < roll.lowStockThreshold) return "LOW";
  return "OK";
}

/** Làm tròn mét về 2 chữ số (khớp Decimal(8, 2) trong DB) */
export function roundMeters(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Số thân áo còn cắt được từ MỘT cây vải — vải lẻ của các cây không cộng dồn được */
export function topsLeft(remainingMeters: number, metersPerTop: number | null): number | null {
  return topsFromRolls([{ remainingMeters }], metersPerTop);
}

/** Số mét sau khi ghi biến động; kiểm kê thì lấy thẳng số đo thực tế */
export function applyMovement(remaining: number, type: FabricMovementType, meters: number): number {
  if (type === "ADJUST") return roundMeters(meters);
  if (type === "RESTOCK") return roundMeters(remaining + meters);
  return roundMeters(remaining - meters);
}

/** Đọc số mét người dùng gõ — nhận cả dấu phẩy thập phân ("2,5") */
export function parseMeters(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  return raw.trim() && Number.isFinite(value) ? value : null;
}

/** Ngưỡng gợi ý: đủ một bộ áo + quần theo định mức chất liệu */
export function suggestThreshold(metersPerTop: number | null, metersPerPants: number | null): number {
  if (!metersPerTop) return DEFAULT_LOW_THRESHOLD;
  return roundMeters(metersPerTop + (metersPerPants ?? 0));
}

/**
 * Mã cây vải `<mã chất liệu>-<màu>-<số thứ tự>`, VD "LUA-TO-TAM-HONG-PHAN-02" — số thứ tự tăng theo các cây cùng tiền tố
 */
export function buildFabricCode(materialCode: string, colorName: string, existingCodes: string[]): string {
  const prefix = `${materialCode}-${toSlug(colorName).toUpperCase()}`;
  const used = existingCodes
    .filter((code) => code.startsWith(`${prefix}-`))
    .map((code) => Number(code.slice(prefix.length + 1)))
    .filter(Number.isInteger);
  const next = (used.length > 0 ? Math.max(...used) : 0) + 1;
  return `${prefix}-${String(next).padStart(2, "0")}`;
}
