"use client";

import { Eye, EyeOff, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminStatusText,
  AdminTooltip,
  type AdminStatusTone,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import {
  type AdminFabricRoll,
  type FabricColorOption,
  type FabricMaterialOption,
  type FabricMovementType,
  type FabricProductOption,
  type FabricStockStatus,
} from "../../types/fabrics.types";
import { resolveFabricStatus, topsLeft } from "../../utils/fabricStock";
import { MOVEMENT_ICONS } from "../../utils/movementIcons";
import { FabricMeter } from "../shared/FabricMeter";
import { FabricSwatch } from "../shared/FabricSwatch";

const STATUS_TONE: Record<FabricStockStatus, AdminStatusTone> = {
  OK: "success",
  LOW: "warning",
  OUT: "danger",
  INACTIVE: "neutral",
};

export interface FabricRollsTableProps {
  rolls: AdminFabricRoll[];
  materials: FabricMaterialOption[];
  colors: FabricColorOption[];
  products: FabricProductOption[];
  now: string;
  onRecordMovement: (roll: AdminFabricRoll, type: FabricMovementType) => void;
  onEditRoll?: (roll: AdminFabricRoll) => void;
  onToggleProduct: (productId: string) => void;
  onToggleActive: (roll: AdminFabricRoll) => void;
  emptyText: string;
}

/**
 * Bảng hiển thị danh sách cây vải dùng component AdminDataTable chuẩn:
 * - Cột: Tên + Mã cây vải & Chất liệu › Thước vải còn lại › Sản phẩm gắn kèm › Trạng thái & ngày cập nhật
 * - Thao tác menu: Cắt may, Nhập thêm, Hao hụt, Kiểm kê, Sửa thông tin, Ẩn/Hiện sản phẩm, Ngưng dùng/Kích hoạt
 * - Chế độ xem mobile gom gọn dòng
 */
export function FabricRollsTable({
  rolls,
  materials,
  colors,
  products,
  now,
  onRecordMovement,
  onEditRoll: _onEditRoll,
  onToggleProduct,
  onToggleActive,
  emptyText,
}: FabricRollsTableProps) {
  const t = useTranslations("AdminPage.fabrics");
  const locale = useLocale();
  const format = useFormatter();

  const materialOf = (roll: AdminFabricRoll) => materials.find((m) => m.id === roll.materialId);
  const colorOf = (roll: AdminFabricRoll) => colors.find((c) => c.id === roll.colorId);
  const productsOf = (roll: AdminFabricRoll) => products.filter((p) => p.materialId === roll.materialId);
  const localized = (item: { name: string; nameEn: string | null } | undefined) =>
    item ? (locale === "en" && item.nameEn ? item.nameEn : item.name) : "";
  const displayName = (roll: AdminFabricRoll) =>
    locale === "en" && roll.nameEn ? roll.nameEn : roll.name;
  const relative = (iso: string) => format.relativeTime(new Date(iso), new Date(now));

  const menuItems = (roll: AdminFabricRoll): AppMenuEntry[] => {
    const rollProducts = productsOf(roll);
    const movement = (type: FabricMovementType): AppMenuEntry => ({
      key: type,
      label: t(`menu.${type}`),
      icon: MOVEMENT_ICONS[type],
      disabled: !roll.isActive || ((type === "CUT" || type === "WASTE") && roll.remainingMeters <= 0),
      onSelect: () => onRecordMovement(roll, type),
    });
    return [
      movement("CUT"),
      movement("RESTOCK"),
      movement("WASTE"),
      movement("ADJUST"),
      { type: "separator", key: "sep-1" },
      { key: "edit", label: t("menu.edit"), icon: Pencil, href: `/admin/inventory/fabrics/${roll.id}` },
      ...(rollProducts.length === 1
        ? [
            {
              key: "product",
              label: rollProducts[0].isVisible ? t("menu.hideProduct") : t("menu.showProduct"),
              description: rollProducts[0].code,
              icon: rollProducts[0].isVisible ? EyeOff : Eye,
              onSelect: () => onToggleProduct(rollProducts[0].id),
            },
          ]
        : []),
      {
        key: "toggle",
        label: roll.isActive ? t("menu.deactivate") : t("menu.activate"),
        icon: roll.isActive ? PowerOff : Power,
        onSelect: () => onToggleActive(roll),
      },
    ];
  };

  const nameCell = (roll: AdminFabricRoll) => {
    const mat = materialOf(roll);
    const color = colorOf(roll);
    const customWidth = roll.widthCm;
    const hasCustomWidth = customWidth != null && customWidth !== mat?.widthCm;
    const effectiveWidth = customWidth ?? mat?.widthCm ?? null;
    const swatchImg =
      roll.image ||
      mat?.closeupImages?.[0] ||
      mat?.colorImages?.find((ci) => ci.colorId === roll.colorId)?.image ||
      null;

    return (
      <div className="flex min-w-0 items-center gap-3">
        <FabricSwatch hex={color?.hex ?? null} image={swatchImg} className={cn(!roll.isActive && "opacity-40")} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/inventory/fabrics/${roll.id}`}
              className="block truncate text-left font-medium text-[#09090B] hover:underline"
            >
              {displayName(roll)}
            </Link>
            {hasCustomWidth && customWidth != null && (
              <span className="inline-flex shrink-0 items-center rounded-sm bg-[#F4F4F5] px-1 py-0.5 font-mono text-2xs font-medium text-[#3F3F46]">
                {t("rollDialog.customWidthBadge", { width: customWidth })}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#71717A]">
            <span className="font-mono text-2xs">{roll.code}</span> · {localized(mat)}
            {effectiveWidth && ` · khổ ${effectiveWidth}cm`}
            {locale === "en" && roll.nameEn && <span className="text-[#A1A1AA]"> ({roll.name})</span>}
          </p>
        </div>
      </div>
    );
  };

  const meterCell = (roll: AdminFabricRoll) => {
    const effectiveMetersPerTop = roll.metersPerTop ?? materialOf(roll)?.metersPerTop ?? null;
    return (
      <FabricMeter
        remaining={roll.remainingMeters}
        received={roll.receivedMeters}
        threshold={roll.lowStockThreshold}
        status={resolveFabricStatus(roll)}
        tops={topsLeft(roll.remainingMeters, effectiveMetersPerTop)}
      />
    );
  };

  const productCell = (roll: AdminFabricRoll) => {
    const rollProducts = productsOf(roll);
    if (rollProducts.length === 0) return <span className="text-[#A1A1AA]">—</span>;
    if (rollProducts.length === 1) {
      const p = rollProducts[0];
      return (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#3F3F46]">{p.name}</p>
          <p className={cn("mt-0.5 text-xs", p.isVisible ? "text-[#71717A]" : "text-[#A1A1AA]")}>
            <span className="font-mono text-2xs">{p.code}</span> · {p.isVisible ? t("product.visible") : t("product.hidden")}
          </p>
        </div>
      );
    }
    return (
      <AdminTooltip
        content={rollProducts
          .map((p) => `${p.code} · ${p.name}${p.isVisible ? "" : ` (${t("product.hidden")})`}`)
          .join("\n")}
      >
        <div className="min-w-0 cursor-default">
          <p className="truncate font-medium text-[#3F3F46]">
            {rollProducts.length} {t("column.productsCount")}
          </p>
          <p className="mt-0.5 truncate font-mono text-2xs text-[#71717A]">
            {rollProducts.map((p) => p.code).join(", ")}
          </p>
        </div>
      </AdminTooltip>
    );
  };

  const statusCell = (roll: AdminFabricRoll) => {
    const status = resolveFabricStatus(roll);
    return (
      <div>
        <AdminStatusText tone={STATUS_TONE[status]}>{t(`status.${status}`)}</AdminStatusText>
        {/* <p className="mt-1 pl-4 text-xs text-[#71717A]">{relative(roll.updatedAt)}</p> */}
      </div>
    );
  };

  const columns: AdminTableColumn<AdminFabricRoll>[] = [
    { key: "name", header: t("column.roll"), cell: nameCell },
    { key: "meters", header: t("column.remaining"), className: "w-[240px] xl:w-[280px]", cell: meterCell },
    { key: "product", header: t("column.product"), className: "hidden w-[220px] lg:table-cell", cell: productCell },
    { key: "status", header: t("column.status"), className: "w-[150px] whitespace-nowrap", cell: statusCell },
  ];

  return (
    <AdminDataTable
      rows={rolls}
      columns={columns}
      getRowId={(roll) => roll.id}
      rowActions={(roll) => (
        <AppMenu
          tone="admin"
          width={240}
          align="end"
          sideOffset={4}
          items={menuItems(roll)}
          trigger={
            <button
              type="button"
              aria-label={t("menu.label", { name: displayName(roll) })}
              className={ADMIN_ROW_ICON_BUTTON_CLASS}
            >
              <MoreHorizontal size={18} />
            </button>
          }
        />
      )}
      actionsLabel={t("column.actions")}
      minWidth={640}
      empty={emptyText}
      mobileRow={(roll) => (
        <div className="space-y-3">
          {nameCell(roll)}
          {meterCell(roll)}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
            <AdminStatusText tone={STATUS_TONE[resolveFabricStatus(roll)]}>
              {t(`status.${resolveFabricStatus(roll)}`)}
            </AdminStatusText>
            <span className="text-[#71717A]">{relative(roll.updatedAt)}</span>
          </div>
        </div>
      )}
    />
  );
}
