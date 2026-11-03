"use client";

import { type DragEvent } from "react";
import { ArrowDown, ArrowUp, ChevronRight, EyeOff, GripVertical, MoreHorizontal, Pencil, Plus, Table2, Trash2, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { PRODUCT_GROUP_ICONS, getGroupTraitKeys, groupUsesSizeChart } from "../../utils/productGroupMeta";

export interface CategoryRowHandlers {
  onEdit: (node: AdminCategoryNode) => void;
  onAddChild: (parent: AdminCategoryNode) => void;
  onToggleActive: (node: AdminCategoryNode) => void;
  onDelete: (node: AdminCategoryNode) => void;
  onMove: (node: AdminCategoryNode, direction: -1 | 1) => void;
  onDragStart: (node: AdminCategoryNode) => void;
  onDragOverRow: (event: DragEvent<HTMLElement>, node: AdminCategoryNode) => void;
  onDropRow: (event: DragEvent<HTMLElement>) => void;
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
  isDragging: boolean;
  dropPlacement: "before" | "after" | null;
  /** Tắt kéo thả khi đang lọc — thứ tự đang thấy không phải thứ tự đầy đủ */
  reorderDisabled: boolean;
}

/** Một dòng trong cây: tay nắm kéo, nhóm hàng, đặc tính, bảng size, số sản phẩm/SKU, thao tác */
export function CategoryTreeRow({
  node,
  parent,
  sizeCharts,
  isFirst,
  isLast,
  expanded,
  onToggleExpand,
  isDragging,
  dropPlacement,
  reorderDisabled,
  ...handlers
}: CategoryTreeRowProps) {
  const t = useTranslations("AdminPage.categories");
  const tSizing = useTranslations("AdminPage.sizing");
  const isRoot = node.parentId === null;
  const GroupIcon = PRODUCT_GROUP_ICONS[node.group];
  const chart = node.defaultSizeChartId ? sizeCharts.get(node.defaultSizeChartId) : undefined;
  // Cùng quy tắc với form sản phẩm: loại con chưa gắn bảng chỉ thừa hưởng khi cùng nhóm hàng với gốc
  const inheritedChart =
    !chart && parent?.defaultSizeChartId && parent.group === node.group ? sizeCharts.get(parent.defaultSizeChartId) : undefined;
  // Nhóm gốc không cần bảng riêng khi mọi loại con đã tự gắn bảng
  const chartCovered = isRoot && node.children.length > 0 && node.children.every((child) => child.defaultSizeChartId);
  const childProductCount = node.children.reduce((sum, child) => sum + child.productCount, 0);
  const childSkuCount = node.children.reduce((sum, child) => sum + child.skuCount, 0);
  const productCount = node.productCount + childProductCount;
  const skuCount = node.skuCount + childSkuCount;
  const canDelete = node.children.length === 0 && node.productCount === 0;

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
      description: canDelete ? undefined : t(node.children.length > 0 ? "deleteBlocked.children" : "deleteBlocked.products"),
      icon: Trash2,
      tone: "danger",
      disabled: !canDelete,
      onSelect: () => handlers.onDelete(node),
    },
  ];

  return (
    <div
      onDragOver={(event) => handlers.onDragOverRow(event, node)}
      onDrop={handlers.onDropRow}
      className={cn(
        "group/row relative flex items-center gap-2 bg-white px-2 py-2.5 transition-colors sm:gap-3 sm:px-3",
        isRoot ? "min-h-16" : "min-h-13 hover:bg-[#FAFAFA]",
        isDragging && "opacity-40",
        !node.isActive && "bg-[#FAFAFA]"
      )}
    >
      {dropPlacement && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-2 z-10 h-0.5 rounded-full bg-[#18181B]",
            dropPlacement === "before" ? "-top-px" : "-bottom-px"
          )}
        />
      )}

      <span
        draggable={!reorderDisabled}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          // Firefox cần dữ liệu để kích hoạt kéo
          event.dataTransfer.setData("text/plain", node.id);
          const row = event.currentTarget.parentElement;
          if (row) event.dataTransfer.setDragImage(row, 24, 24);
          handlers.onDragStart(node);
        }}
        onDragEnd={handlers.onDragEnd}
        title={reorderDisabled ? t("dragDisabled") : t("dragHint")}
        className={cn(
          "hidden size-7 shrink-0 place-items-center rounded-md text-[#A1A1AA] sm:grid",
          reorderDisabled ? "cursor-not-allowed opacity-40" : "cursor-grab hover:bg-[#F4F4F5] hover:text-[#09090B] active:cursor-grabbing"
        )}
      >
        <GripVertical size={15} aria-hidden />
      </span>

      {isRoot ? (
        <button
          type="button"
          onClick={onToggleExpand}
          disabled={node.children.length === 0}
          aria-expanded={expanded}
          aria-label={expanded ? t("collapse", { name: node.name }) : t("expand", { name: node.name })}
          className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-[#52525B] transition-colors hover:bg-[#F4F4F5] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} aria-hidden className={cn("transition-transform duration-200", expanded && "rotate-90")} />
        </button>
      ) : null}

      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg border border-[#E4E4E7]",
          isRoot ? "size-10 bg-[#F4F4F5] text-[#09090B]" : "size-8 bg-white text-[#52525B]"
        )}
      >
        <GroupIcon size={isRoot ? 18 : 15} aria-hidden />
      </span>

      <button type="button" onClick={() => handlers.onEdit(node)} className="min-w-0 flex-1 cursor-pointer text-left">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "truncate text-[#09090B]",
              isRoot ? "text-[15px] font-semibold" : "text-sm font-medium",
              !node.isActive && "text-[#71717A]"
            )}
          >
            {node.name}
          </span>
          {!node.isActive && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#F4F4F5] px-1.5 py-0.5 text-[11px] font-medium text-[#71717A]">
              <EyeOff size={11} aria-hidden /> {t("hidden")}
            </span>
          )}
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[#52525B]">{tSizing(`group.${node.group}`)}</span>
          {getGroupTraitKeys(node.group).map((trait) => (
            <span
              key={trait}
              className="rounded border border-[#E4E4E7] bg-white px-1.5 py-px text-[11px] leading-4 text-[#52525B]"
            >
              {tSizing(`trait.${trait}`)}
            </span>
          ))}
          <span className="text-[11px] tabular-nums text-[#71717A] md:hidden">
            · {productCount} {t("products")} · {skuCount} SKU
          </span>
        </span>
      </button>

      <div className="hidden shrink-0 items-center gap-4 md:flex">
        {groupUsesSizeChart(node.group) &&
          !(chartCovered && !chart) &&
          (chart ? (
            <Link
              href={`/admin/catalog/size-charts/${chart.id}`}
              className="inline-flex max-w-52 items-center gap-1.5 rounded-md border border-[#E4E4E7] px-2 py-1 text-xs text-[#3F3F46] transition-colors hover:border-[#18181B] hover:text-[#09090B]"
            >
              <Table2 size={13} aria-hidden className="shrink-0" />
              <span className="truncate">{chart.name}</span>
            </Link>
          ) : inheritedChart ? (
            <span
              title={inheritedChart.name}
              className="inline-flex max-w-52 items-center gap-1.5 rounded-md border border-dashed border-[#D4D4D8] px-2 py-1 text-xs text-[#71717A]"
            >
              <Table2 size={13} aria-hidden className="shrink-0" />
              <span className="truncate">
                {t("inheritChart")} · {inheritedChart.name}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700">
              <Table2 size={13} aria-hidden /> {t("noChart")}
            </span>
          ))}
        <div className="w-24 text-right text-xs leading-tight text-[#71717A]">
          <div>
            <span className="font-mono font-semibold tabular-nums text-[#09090B]">{productCount}</span> {t("products")}
          </div>
          <div className="mt-0.5">
            <span className="font-mono tabular-nums text-[#3F3F46]">{skuCount}</span> SKU
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        {isRoot && (
          <button
            type="button"
            onClick={() => handlers.onAddChild(node)}
            aria-label={t("addChildTo", { name: node.name })}
            title={t("addChildTo", { name: node.name })}
            className="grid size-8 cursor-pointer place-items-center rounded-md text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
          >
            <Plus size={16} aria-hidden />
          </button>
        )}
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
              className="grid size-8 cursor-pointer place-items-center rounded-md text-[#71717A] outline-none transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 data-popup-open:bg-[#F4F4F5]"
            >
              <MoreHorizontal size={16} />
            </button>
          }
        />
      </div>
    </div>
  );
}
