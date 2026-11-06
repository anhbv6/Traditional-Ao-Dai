"use client";

import { ArrowDown, ArrowUp, CircleAlert, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminStatusText,
  AdminTooltip,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { categoryName } from "../../utils/categoryName";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS, groupUsesSizeChart } from "../../utils/productGroupMeta";

export interface CategoryRowHandlers {
  onEdit: (node: AdminCategoryNode) => void;
  onAddChild: (parent: AdminCategoryNode) => void;
  onToggleActive: (node: AdminCategoryNode) => void;
  onDelete: (node: AdminCategoryNode) => void;
  onMove: (node: AdminCategoryNode, direction: -1 | 1) => void;
}

/** Một dòng bảng — cây 2 cấp trải phẳng theo đúng thứ tự hiển thị: nhóm gốc rồi tới các loại con của nó */
interface CategoryRow {
  node: AdminCategoryNode;
  /** Nhóm gốc của loại con */
  parent?: AdminCategoryNode;
  isFirst: boolean;
  isLast: boolean;
}

interface CategoryListTableProps extends CategoryRowHandlers {
  tree: AdminCategoryNode[];
  sizeCharts: Map<string, SizeChartOption>;
  /** Tắt đổi thứ tự khi đang lọc — thứ tự đang thấy không phải thứ tự đầy đủ */
  reorderDisabled: boolean;
  /** Id đang lưu bật / tắt hiển thị */
  pendingIds: Set<string>;
  /** Dòng đang được trỏ (ở bảng hoặc ở sơ đồ) — tô nền để hai bên khớp nhau */
  activeId: string | null;
  onActivate: (id: string | null) => void;
  empty: string;
}

const totalProducts = (node: AdminCategoryNode) =>
  node.productCount + node.children.reduce((sum, child) => sum + child.productCount, 0);
const totalSkus = (node: AdminCategoryNode) =>
  node.skuCount + node.children.reduce((sum, child) => sum + child.skuCount, 0);

/**
 * Bảng dữ liệu loại sản phẩm — chỉ để xem, luôn hiện đủ mọi dòng (thu gọn / mở rộng nằm ở sơ đồ): tên (mở màn chi tiết)
 * + dòng phụ (số loại con / nhóm gốc), số sản phẩm / SKU, trạng thái hiển thị. Mọi thao tác gom vào menu ⋯
 * (sửa, thêm loại con, ẩn / hiện, lên / xuống, xóa); kéo thả đổi thứ tự ở sơ đồ. Màn nhỏ là danh sách gọn.
 */
export function CategoryListTable({
  tree,
  sizeCharts,
  reorderDisabled,
  pendingIds,
  activeId,
  onActivate,
  empty,
  ...handlers
}: CategoryListTableProps) {
  const t = useTranslations("AdminPage.categories");
  const locale = useLocale();

  const rows: CategoryRow[] = tree.flatMap((root, rootIndex) => [
    { node: root, isFirst: rootIndex === 0, isLast: rootIndex === tree.length - 1 },
    ...root.children.map((child, childIndex) => ({
      node: child,
      parent: root,
      isFirst: childIndex === 0,
      isLast: childIndex === root.children.length - 1,
    })),
  ]);

  // Nhóm gốc không có bảng size — chỉ cảnh báo loại sản phẩm có size mà chưa gắn bảng
  const missingChart = ({ node }: CategoryRow) =>
    node.parentId !== null &&
    groupUsesSizeChart(node.group) &&
    !(node.defaultSizeChartId && sizeCharts.has(node.defaultSizeChartId));

  const nameCell = (row: CategoryRow) => {
    const { node, parent } = row;
    const isRoot = node.parentId === null;
    const GroupIcon = PRODUCT_GROUP_ICONS[node.group];
    return (
      <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
        <span
          aria-hidden
          className={cn(
            "grid shrink-0 place-items-center rounded-xl",
            isRoot
              ? cn("size-9 md:size-10", PRODUCT_GROUP_COLORS[node.group].tile)
              : "size-8 border border-[#E4E4E7] bg-white text-[#52525B] md:size-9"
          )}
        >
          <GroupIcon className={isRoot ? "size-4 md:size-[18px]" : "size-3.5 md:size-4"} />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              href={`/admin/catalog/categories/${node.id}`}
              className={cn(
                "truncate hover:underline",
                isRoot ? "font-semibold" : "font-medium",
                node.isActive ? "text-[#09090B]" : "text-[#71717A]"
              )}
            >
              {categoryName(node, locale)}
            </Link>
            {!node.isActive && (
              <AdminTooltip content={t("diagram.hidden")}>
                <span
                  tabIndex={0}
                  aria-label={t("diagram.hidden")}
                  className="inline-flex shrink-0 rounded-sm text-[#A1A1AA] outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]/20 md:hidden"
                >
                  <EyeOff size={14} aria-hidden />
                </span>
              </AdminTooltip>
            )}
            {missingChart(row) && (
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
          <p className="truncate text-xs tabular-nums text-[#71717A]">
            {isRoot
              ? t("row.children", { count: node.children.length })
              : t("row.parent", { name: parent ? categoryName(parent, locale) : "" })}
          </p>
        </div>
      </div>
    );
  };

  const status = ({ node }: CategoryRow) => (
    <AdminStatusText tone={node.isActive ? "success" : "neutral"}>
      {node.isActive ? t("status.active") : t("status.hidden")}
    </AdminStatusText>
  );

  const count = (value: number) => (
    <span className={cn("font-mono tabular-nums", value > 0 ? "text-[#09090B]" : "text-[#A1A1AA]")}>{value}</span>
  );

  const columns: AdminTableColumn<CategoryRow>[] = [
    { key: "name", header: t("column.name"), cell: nameCell },
    {
      key: "products",
      header: t("list.columnProducts"),
      align: "right",
      className: "w-24",
      cell: ({ node }) => count(totalProducts(node)),
    },
    {
      key: "skus",
      header: t("list.columnSkus"),
      align: "right",
      className: "hidden w-20 @6xl:table-cell",
      cell: ({ node }) => count(totalSkus(node)),
    },
    { key: "status", header: t("list.columnStatus"), className: "w-36", cell: status },
  ];

  const menu = ({ node, isFirst, isLast }: CategoryRow) => {
    const isRoot = node.parentId === null;
    const canDelete = node.children.length === 0 && node.productCount === 0;
    const items: AppMenuEntry[] = [
      { key: "edit", label: t("menu.edit"), icon: Pencil, onSelect: () => handlers.onEdit(node) },
      ...(isRoot
        ? [{ key: "add-child", label: t("menu.addChild"), icon: Plus, onSelect: () => handlers.onAddChild(node) }]
        : []),
      // Bật / tắt hiển thị trên cửa hàng gom vào menu — cột trạng thái chỉ để xem
      {
        key: "toggle",
        label: node.isActive ? t("menu.hide") : t("menu.show"),
        icon: node.isActive ? EyeOff : Eye,
        disabled: pendingIds.has(node.id),
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
      <AppMenu
        tone="admin"
        width={232}
        align="end"
        sideOffset={4}
        items={items}
        trigger={
          <button
            type="button"
            aria-label={t("menu.label", { name: categoryName(node, locale) })}
            className={ADMIN_ROW_ICON_BUTTON_CLASS}
          >
            <MoreHorizontal size={18} />
          </button>
        }
      />
    );
  };

  return (
    <AdminDataTable
      rows={rows}
      columns={columns}
      getRowId={(row) => row.node.id}
      rowActions={menu}
      actionsLabel={t("list.columnActions")}
      minWidth={460}
      activeRowId={activeId}
      onRowHover={(row) => onActivate(row?.node.id ?? null)}
      empty={empty}
      // Màn nhỏ: một dòng gọn — tên + dòng phụ (loại đang ẩn có icon cạnh tên), mọi thao tác trong menu ⋯
      mobileRow={nameCell}
    />
  );
}
