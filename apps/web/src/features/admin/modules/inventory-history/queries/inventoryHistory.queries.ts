import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { STOCK_ADJUST_REASONS, type StockAdjustReason } from "@/features/admin/modules/inventory";
import { getMockFabricStock } from "@/features/admin/modules/fabrics";
import { prisma } from "../../../core/server/db.server";
import { type StockEvent, type StockEventLine, type StockHistoryData } from "../types/inventoryHistory.types";
import { HISTORY_PERIODS, toShopDayKey } from "../utils/stockEventMeta";

const DAY = 24 * 60 * 60 * 1000;
/** Chặn số bản ghi mỗi nguồn — tiệm nhỏ, 6 tháng hiếm khi vượt */
const MAX_ROWS_PER_SOURCE = 1000;

interface AdjustChange {
  sku: string;
  from: number;
  to: number;
}

interface AdjustMeta {
  reason: StockAdjustReason;
  note: string | null;
  changes: AdjustChange[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Đọc metadata của AuditLog INVENTORY_ADJUSTED — bỏ qua bản ghi sai dạng thay vì làm hỏng cả màn */
function parseAdjustMeta(value: unknown): AdjustMeta | null {
  if (!isRecord(value) || !Array.isArray(value.changes)) return null;
  const reason = STOCK_ADJUST_REASONS.find((item) => item === value.reason);
  if (!reason) return null;
  const changes = value.changes.flatMap((change): AdjustChange[] =>
    isRecord(change) && typeof change.sku === "string" && typeof change.from === "number" && typeof change.to === "number"
      ? [{ sku: change.sku, from: change.from, to: change.to }]
      : []
  );
  return { reason, note: typeof value.note === "string" ? value.note : null, changes };
}

const variantDetail = (variant: { size: string; color: string | null } | null | undefined) =>
  variant ? [variant.color, variant.size === "FREE_SIZE" ? "Freesize" : variant.size].filter(Boolean).join(" · ") : null;

/**
 * Nhật ký biến động kho trong `maxDays` ngày gần nhất, mới nhất trước, gộp:
 * điều chỉnh tay SKU (AuditLog), đơn online trừ tồn (OrderItem) và biến động cây vải (mock tạm).
 */
export async function getStockHistoryQuery(): Promise<StockHistoryData> {
  const maxDays = HISTORY_PERIODS[HISTORY_PERIODS.length - 1];
  const now = new Date();
  const since = new Date(now.getTime() - maxDays * DAY);

  const [logs, orderItems] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: "INVENTORY_ADJUSTED", createdAt: { gte: since } },
      select: { id: true, targetId: true, metadata: true, createdAt: true, actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS_PER_SOURCE,
    }),
    prisma.orderItem.findMany({
      where: { variantId: { not: null }, isCustomFit: false, order: { createdAt: { gte: since } } },
      select: {
        id: true,
        quantity: true,
        sku: true,
        productId: true,
        productName: true,
        product: { select: { code: true, images: true, category: { select: { group: true } } } },
        variant: { select: { size: true, color: true, colorValue: { select: { hex: true } } } },
        order: { select: { id: true, orderNumber: true, orderStatus: true, customerName: true, createdAt: true } },
      },
      orderBy: { order: { createdAt: "desc" } },
      take: MAX_ROWS_PER_SOURCE,
    }),
  ]);

  // ─── SKU điều chỉnh tay ────────────────────────────────────────────────────
  const parsedLogs = logs.flatMap((log) => {
    const meta = parseAdjustMeta(log.metadata);
    return meta && log.targetId ? [{ log, meta, productId: log.targetId }] : [];
  });
  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: [...new Set(parsedLogs.map((item) => item.productId))] } },
      select: { id: true, name: true, code: true, images: true, category: { select: { group: true } } },
    }),
    prisma.productVariant.findMany({
      where: { sku: { in: [...new Set(parsedLogs.flatMap((item) => item.meta.changes.map((change) => change.sku)))] } },
      select: { sku: true, size: true, color: true, colorValue: { select: { hex: true } } },
    }),
  ]);
  const productById = new Map(products.map((product) => [product.id, product]));
  const variantBySku = new Map(variants.map((variant) => [variant.sku, variant]));

  const adjustEvents: StockEvent[] = parsedLogs.map(({ log, meta, productId }) => {
    const product = productById.get(productId);
    const lines: StockEventLine[] = meta.changes.map((change) => {
      const variant = variantBySku.get(change.sku);
      return {
        code: change.sku,
        detail: variantDetail(variant),
        hex: variant?.colorValue?.hex ?? null,
        from: change.from,
        to: change.to,
        delta: change.to - change.from,
      };
    });
    return {
      id: `audit-${log.id}`,
      subject: "SKU",
      kind: meta.reason,
      // Sản phẩm đã xóa thì vẫn giữ dòng nhật ký, hiện bằng SKU
      title: product?.name ?? lines[0]?.code ?? productId,
      code: product?.code ?? "",
      image: product?.images[0] ?? null,
      hex: null,
      unit: product && PRODUCT_GROUP_TRAITS[product.category.group].sellUnit === "METER" ? "METER" : "PIECE",
      lines,
      delta: lines.reduce((sum, line) => sum + line.delta, 0),
      orderCode: null,
      orderCancelled: false,
      note: meta.note,
      actorName: log.actor?.name ?? log.actor?.email ?? null,
      actorIsCustomer: false,
      createdAt: log.createdAt.toISOString(),
      dayKey: toShopDayKey(log.createdAt),
      href: product ? `/admin/products/${productId}` : null,
    };
  });

  // ─── Đơn online: gộp các SKU cùng sản phẩm trong một đơn thành một dòng ─────
  const orderGroups = new Map<string, typeof orderItems>();
  for (const item of orderItems) {
    const key = `${item.order.id}:${item.productId}`;
    orderGroups.set(key, [...(orderGroups.get(key) ?? []), item]);
  }
  const orderEvents: StockEvent[] = [...orderGroups.entries()].map(([key, items]) => {
    const first = items[0];
    const lines = items.map((item) => ({
      code: item.sku ?? item.productName,
      detail: variantDetail(item.variant),
      hex: item.variant?.colorValue?.hex ?? null,
      from: null,
      to: null,
      delta: -item.quantity,
    }));
    return {
      id: `order-${key}`,
      subject: "SKU",
      kind: "ONLINE_ORDER",
      title: first.productName,
      code: first.product.code,
      image: first.product.images[0] ?? null,
      hex: null,
      unit: PRODUCT_GROUP_TRAITS[first.product.category.group].sellUnit === "METER" ? "METER" : "PIECE",
      lines,
      delta: lines.reduce((sum, line) => sum + line.delta, 0),
      orderCode: first.order.orderNumber,
      orderCancelled: first.order.orderStatus === "CANCELLED" || first.order.orderStatus === "REFUNDED",
      note: null,
      actorName: first.order.customerName,
      actorIsCustomer: true,
      createdAt: first.order.createdAt.toISOString(),
      dayKey: toShopDayKey(first.order.createdAt),
      href: `/admin/products/${first.productId}`,
    };
  });

  // ─── Cây vải (mock tạm — màn Số lượng vải chưa nối DB) ─────────────────────
  const fabricStock = getMockFabricStock();
  const fabricEvents: StockEvent[] = fabricStock.rolls.flatMap((roll) => {
    const material = fabricStock.materials.find((item) => item.id === roll.materialId);
    const hex = fabricStock.colors.find((item) => item.id === roll.colorId)?.hex ?? null;
    return roll.movements
      .filter((movement) => new Date(movement.createdAt) >= since)
      .map((movement) => ({
        id: `fabric-${movement.id}`,
        subject: "FABRIC" as const,
        kind: movement.type,
        title: roll.name,
        code: material?.name ?? "",
        image: null,
        hex,
        unit: "METER" as const,
        lines: [
          {
            code: roll.code,
            detail: null,
            hex,
            from: Math.round((movement.balanceAfter - movement.delta) * 100) / 100,
            to: movement.balanceAfter,
            delta: movement.delta,
          },
        ],
        delta: movement.delta,
        orderCode: movement.orderCode,
        orderCancelled: false,
        note: movement.note,
        actorName: movement.actorName,
        actorIsCustomer: false,
        createdAt: movement.createdAt,
        dayKey: toShopDayKey(new Date(movement.createdAt)),
        href: "/admin/inventory/fabrics",
      }));
  });

  const events = [...adjustEvents, ...orderEvents, ...fabricEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    events,
    todayKey: toShopDayKey(now),
    yesterdayKey: toShopDayKey(new Date(now.getTime() - DAY)),
    maxDays,
  };
}
