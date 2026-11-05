"use client";

import { useState, useSyncExternalStore, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CircleAlert,
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
import { ADMIN_ROW_ICON_BUTTON_CLASS, AdminSwitch, AdminTooltip } from "@/features/admin/core/ui";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS, groupUsesSizeChart } from "../../utils/productGroupMeta";

/**
 * Lưới cột dùng chung cho hàng tiêu đề và từng dòng: tay kéo · tên · số sản phẩm · công tắc hiển thị · menu.
 * Dưới xl (iPad) bỏ cột tay kéo — kéo thả không dùng trên màn cảm ứng, đổi thứ tự qua menu ⋯ — và thu hẹp các cột
 * để danh sách đứng cạnh sơ đồ.
 */
export const CATEGORY_LIST_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto_32px] items-center gap-2 xl:grid-cols-[20px_minmax(0,1fr)_5.5rem_auto_36px] xl:gap-3";

/*
 * PC (xl) bật / tắt hiển thị bằng công tắc ngay trên dòng; iPad bỏ cột công tắc cho tên đủ chỗ → thao tác nằm trong menu ⋯.
 * Menu là dữ liệu (không ẩn được bằng CSS) nên đọc cỡ màn bằng matchMedia.
 */
const DESKTOP_QUERY = "(min-width: 1280px)";
function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;
const getDesktopOnServer = () => true;

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
  // Chỉ cho kéo khi đang nhấn tay kéo — tránh kéo nhầm khi bôi chọn chữ hay bấm công tắc
  const [armed, setArmed] = useState(false);
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, getDesktopOnServer);
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

  // Chỉ cảnh báo khi thật sự thiếu bảng size (không có bảng riêng, không thừa hưởng, loại con chưa đủ bảng);
  // tên bảng size không hiện ở danh sách cho gọn — xem ở màn chi tiết / khi sửa
  const missingChart =
    groupUsesSizeChart(node.group) &&
    !chart &&
    !inherited &&
    !(isRoot && node.children.length > 0 && node.children.every((child) => child.defaultSizeChartId));

  const menuItems: AppMenuEntry[] = [
    { key: "edit", label: t("menu.edit"), icon: Pencil, onSelect: () => handlers.onEdit(node) },
    ...(isRoot
      ? [{ key: "add-child", label: t("menu.addChild"), icon: Plus, onSelect: () => handlers.onAddChild(node) }]
      : []),
    ...(isDesktop
      ? []
      : [
          {
            key: "toggle",
            label: node.isActive ? t("menu.hide") : t("menu.show"),
            icon: node.isActive ? EyeOff : Eye,
            disabled: togglePending,
            onSelect: () => handlers.onToggleActive(node),
          },
        ]),
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
    // Nhóm gốc cố định theo nhóm hàng — không có mục xóa (chỉ ẩn)
    ...(isRoot
      ? []
      : [
          { type: "separator" as const, key: "sep-delete" },
          {
            key: "delete",
            label: t("menu.delete"),
            description: canDelete ? undefined : t("deleteBlocked.products"),
            icon: Trash2,
            tone: "danger" as const,
            disabled: !canDelete,
            onSelect: () => handlers.onDelete(node),
          },
        ]),
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
        "relative rounded-xl px-1.5 py-2.5 transition-colors xl:px-2 xl:py-3",
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

      <AdminTooltip content={reorderDisabled ? t("reorderDisabled") : null}>
        <span
          role="button"
          tabIndex={-1}
          aria-label={t("list.dragHandle", { name: node.name })}
          onPointerDown={() => setArmed(true)}
          onPointerUp={() => setArmed(false)}
          className={cn(
            "hidden h-8 place-items-center rounded-md text-[#A1A1AA] transition-colors xl:grid",
            reorderDisabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-grab hover:text-[#09090B] active:cursor-grabbing"
          )}
        >
          <GripVertical size={16} aria-hidden />
        </span>
      </AdminTooltip>

      <div className={cn("flex min-w-0 items-center gap-2.5 xl:gap-3", !isRoot && "pl-5 xl:pl-9")}>
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
            isRoot
              ? cn("size-8 xl:size-10", color.tile)
              : "size-7 border border-[#E4E4E7] bg-white text-[#52525B] xl:size-9"
          )}
        >
          <GroupIcon className={isRoot ? "size-4 xl:size-[18px]" : "size-3.5 xl:size-4"} />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              href={`/admin/catalog/categories/${node.id}`}
              className={cn(
                "truncate text-sm hover:underline xl:text-body",
                isRoot ? "font-semibold" : "font-medium",
                node.isActive ? "text-[#09090B]" : "text-[#71717A]"
              )}
            >
              {node.name}
            </Link>
            {/* iPad không có công tắc → đánh dấu loại đang ẩn ngay cạnh tên */}
            {!node.isActive && (
              <AdminTooltip content={t("diagram.hidden")}>
                <span
                  tabIndex={0}
                  aria-label={t("diagram.hidden")}
                  className="inline-flex shrink-0 rounded-sm text-[#A1A1AA] outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]/20 xl:hidden"
                >
                  <EyeOff size={14} aria-hidden />
                </span>
              </AdminTooltip>
            )}
            {missingChart && (
              <AdminTooltip content={t("noChart")}>
                <span
                  tabIndex={0}
                  aria-label={t("noChart")}
                  className="inline-flex shrink-0 cursor-help rounded-full text-amber-500 outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]/20"
                >
                  <CircleAlert size={14} aria-hidden />
                </span>
              </AdminTooltip>
            )}
          </div>
          {/* Chỉ nhóm gốc có dòng phụ (số loại con); số sản phẩm nằm ở cột riêng bên phải — chi tiết xem ở màn chi tiết */}
          {isRoot && node.children.length > 0 && (
            <p className="truncate text-xs tabular-nums text-[#71717A]">
              {t("row.children", { count: node.children.length })}
            </p>
          )}
        </div>
      </div>

      <AdminTooltip content={t("row.products", { count: productCount })}>
        <span
          className={cn(
            "justify-self-end pr-1 text-right font-mono text-sm tabular-nums xl:mr-4 xl:pr-0",
            productCount > 0 ? "text-[#09090B]" : "text-[#A1A1AA]"
          )}
        >
          {productCount}
        </span>
      </AdminTooltip>

      <AdminSwitch
        checked={node.isActive}
        disabled={togglePending}
        onChange={() => handlers.onToggleActive(node)}
        label={t("list.toggleLabel", { name: node.name })}
        className="max-xl:hidden"
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
