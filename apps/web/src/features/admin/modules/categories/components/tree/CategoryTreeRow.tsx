"use client";

import { useState, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_ROW_ICON_BUTTON_CLASS, AdminSwitch } from "@/features/admin/core/ui";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS, groupUsesSizeChart } from "../../utils/productGroupMeta";

/** Lưới cột dùng chung cho hàng tiêu đề và từng dòng: tay kéo · tên · công tắc hiển thị · menu */
export const CATEGORY_LIST_GRID = "grid grid-cols-[20px_minmax(0,1fr)_auto_36px] items-center gap-3";

export interface CategoryRowHandlers {
  onEdit: (node: AdminCategoryNode) => void;
  onAddChild: (parent: AdminCategoryNode) => void;
  onToggleActive: (node: AdminCategoryNode) => void;
  onDelete: (node: AdminCategoryNode) => void;
  onMove: (node: AdminCategoryNode, direction: -1 | 1) => void;
}

/** Kéo thả đổi thứ tự trong cùng cấp — trạng thái giữ ở CategoryTreeBoard */
export interface CategoryRowDrag {
  /** Đang kéo dòng này */
  isDragging: boolean;
  /** Vạch báo chỗ thả phía trên / dưới dòng này */
  dropPlacement: "before" | "after" | null;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

interface CategoryTreeRowProps extends CategoryRowHandlers {
  node: AdminCategoryNode;
  /** Nhóm gốc của loại con — để biết loại con chưa gắn bảng có thừa hưởng được bảng của gốc không */
  parent?: AdminCategoryNode;
  sizeCharts: Map<string, SizeChartOption>;
  isFirst: boolean;
  isLast: boolean;
  /** Có loại con và đang mở (chỉ nhóm gốc) */
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** Tắt đổi thứ tự khi đang lọc — thứ tự đang thấy không phải thứ tự đầy đủ */
  reorderDisabled: boolean;
  /** Đang lưu bật / tắt hiển thị */
  togglePending: boolean;
  /** Dòng đang được trỏ (ở danh sách hoặc ở sơ đồ cây) — tô nền để hai bên khớp nhau */
  isActive: boolean;
  onActivate: (id: string | null) => void;
  drag: CategoryRowDrag;
}

/**
 * Một dòng danh sách loại sản phẩm: tay kéo, ô icon nhóm hàng, tên (mở màn chi tiết) + dòng mô tả,
 * công tắc hiển thị trên cửa hàng, menu ⋯. Thêm / sửa mở dialog; thông tin đầy đủ ở màn chi tiết.
 */
export function CategoryTreeRow({
  node,
  parent,
  sizeCharts,
  isFirst,
  isLast,
  expanded,
  onToggleExpand,
  reorderDisabled,
  togglePending,
  isActive,
  onActivate,
  drag,
  ...handlers
}: CategoryTreeRowProps) {
  const t = useTranslations("AdminPage.categories");
  const tSizing = useTranslations("AdminPage.sizing");
  // Chỉ cho kéo khi đang nhấn tay kéo — tránh kéo nhầm khi bôi chọn chữ hay bấm công tắc
  const [armed, setArmed] = useState(false);
  const isRoot = node.parentId === null;
  const GroupIcon = PRODUCT_GROUP_ICONS[node.group];
  const color = PRODUCT_GROUP_COLORS[node.group];
  const chart = node.defaultSizeChartId ? sizeCharts.get(node.defaultSizeChartId) : undefined;
  // Cùng quy tắc với form sản phẩm: loại con chưa gắn bảng chỉ thừa hưởng khi cùng nhóm hàng với gốc
  const inherited =
    !chart && parent?.defaultSizeChartId && parent.group === node.group
      ? sizeCharts.get(parent.defaultSizeChartId)
      : undefined;
  const productCount = node.productCount + node.children.reduce((sum, child) => sum + child.productCount, 0);
  const canDelete = node.children.length === 0 && node.productCount === 0;

  // Dòng mô tả: nhóm gốc = nhóm hàng · số loại con · số sản phẩm; loại con = bảng size · số sản phẩm
  const chartText = !groupUsesSizeChart(node.group)
    ? null
    : chart
      ? { text: chart.name, warn: false }
      : inherited
        ? { text: t("inheritChart"), warn: false }
        : isRoot && node.children.length > 0 && node.children.every((child) => child.defaultSizeChartId)
          ? null
          : { text: t("noChart"), warn: true };

  const menuItems: AppMenuEntry[] = [
    { key: "edit", label: t("menu.edit"), icon: Pencil, onSelect: () => handlers.onEdit(node) },
    ...(isRoot
      ? [{ key: "add-child", label: t("menu.addChild"), icon: Plus, onSelect: () => handlers.onAddChild(node) }]
      : []),
    {
      key: "toggle",
      label: node.isActive ? t("menu.hide") : t("menu.show"),
      icon: node.isActive ? EyeOff : Eye,
      onSelect: () => handlers.onToggleActive(node),
    },
    { type: "separator", key: "sep-move" },
    {
      key: "up",
      label: t("menu.moveUp"),
      icon: ArrowUp,
      disabled: isFirst || reorderDisabled,
      onSelect: () => handlers.onMove(node, -1),
    },
    {
      key: "down",
      label: t("menu.moveDown"),
      icon: ArrowDown,
      disabled: isLast || reorderDisabled,
      onSelect: () => handlers.onMove(node, 1),
    },
    { type: "separator", key: "sep-delete" },
    {
      key: "delete",
      label: t("menu.delete"),
      description: canDelete
        ? undefined
        : t(node.children.length > 0 ? "deleteBlocked.children" : "deleteBlocked.products"),
      icon: Trash2,
      tone: "danger",
      disabled: !canDelete,
      onSelect: () => handlers.onDelete(node),
    },
  ];

  return (
    <div
      draggable={armed && !reorderDisabled}
      onDragStart={drag.onDragStart}
      onDragOver={drag.onDragOver}
      onDrop={drag.onDrop}
      onDragEnd={() => {
        setArmed(false);
        drag.onDragEnd();
      }}
      onMouseEnter={() => onActivate(node.id)}
      onMouseLeave={() => onActivate(null)}
      className={cn(
        CATEGORY_LIST_GRID,
        "relative rounded-xl px-2 py-3 transition-colors",
        isActive ? "bg-[#F4F4F5]" : "hover:bg-[#FAFAFA]",
        drag.isDragging && "opacity-40"
      )}
    >
      {drag.dropPlacement && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-2 h-0.5 rounded-full bg-[#18181B]",
            drag.dropPlacement === "before" ? "-top-px" : "-bottom-px"
          )}
        />
      )}

      <span
        role="button"
        tabIndex={-1}
        aria-label={t("list.dragHandle", { name: node.name })}
        title={reorderDisabled ? t("reorderDisabled") : undefined}
        onPointerDown={() => setArmed(true)}
        onPointerUp={() => setArmed(false)}
        className={cn(
          "grid h-8 place-items-center rounded-md text-[#A1A1AA] transition-colors",
          reorderDisabled ? "cursor-not-allowed opacity-40" : "cursor-grab hover:text-[#09090B] active:cursor-grabbing"
        )}
      >
        <GripVertical size={16} aria-hidden />
      </span>

      <div className={cn("flex min-w-0 items-center gap-3", !isRoot && "pl-9")}>
        {isRoot &&
          (node.children.length > 0 ? (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={expanded}
              aria-label={expanded ? t("collapse", { name: node.name }) : t("expand", { name: node.name })}
              className="-mr-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#E4E4E7]/70 hover:text-[#09090B]"
            >
              <ChevronRight size={15} className={cn("transition-transform", expanded && "rotate-90")} aria-hidden />
            </button>
          ) : (
            <span className="-mr-1 size-6 shrink-0" aria-hidden />
          ))}
        <span
          aria-hidden
          className={cn(
            "grid shrink-0 place-items-center rounded-xl",
            isRoot ? cn("size-10", color.tile) : "size-9 border border-[#E4E4E7] bg-white text-[#52525B]"
          )}
        >
          <GroupIcon size={isRoot ? 18 : 16} />
        </span>
        <div className="min-w-0">
          <Link
            href={`/admin/catalog/categories/${node.id}`}
            className={cn(
              "block truncate text-body hover:underline",
              isRoot ? "font-semibold" : "font-medium",
              node.isActive ? "text-[#09090B]" : "text-[#71717A]"
            )}
          >
            {node.name}
          </Link>
          <p className="truncate text-xs text-[#71717A]">
            {isRoot && <>{tSizing(`group.${node.group}`)} · </>}
            {isRoot && node.children.length > 0 && <>{t("row.children", { count: node.children.length })} · </>}
            {chartText && <span className={cn(chartText.warn && "text-amber-700")}>{chartText.text} · </span>}
            {t("row.products", { count: productCount })}
          </p>
        </div>
      </div>

      <AdminSwitch
        checked={node.isActive}
        disabled={togglePending}
        onChange={() => handlers.onToggleActive(node)}
        label={t("list.toggleLabel", { name: node.name })}
      />

      <AppMenu
        tone="admin"
        width={232}
        align="end"
        sideOffset={4}
        items={menuItems}
        trigger={
          <button
            type="button"
            aria-label={t("menu.label", { name: node.name })}
            className={ADMIN_ROW_ICON_BUTTON_CLASS}
          >
            <MoreHorizontal size={18} />
          </button>
        }
      />
    </div>
  );
}
