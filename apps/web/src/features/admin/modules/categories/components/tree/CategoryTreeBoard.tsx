"use client";

import { useMemo, useState, type DragEvent } from "react";
import dynamic from "next/dynamic";
import { ChevronsDownUp, ChevronsUpDown, FolderTree, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRODUCT_GROUPS, type ProductGroup } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminFilterSelect,
  AdminListPanel,
} from "@/features/admin/core/ui";
import { reorderCategoriesAction, updateCategoryAction } from "../../actions/categories.actions";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { filterTree, filterTreeByGroup, getSiblings, moveSibling, replaceSiblings } from "../../utils/categoryTree";
import { CATEGORY_LIST_GRID, CategoryTreeRow, type CategoryRowDrag, type CategoryRowHandlers } from "./CategoryTreeRow";

// Hộp thoại chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const ConfirmDeleteCategoryDialog = dynamic(() =>
  import("./ConfirmDeleteCategoryDialog").then((m) => m.ConfirmDeleteCategoryDialog)
);
const CategoryEditorDialog = dynamic(() => import("./CategoryEditorDialog").then((m) => m.CategoryEditorDialog));
// Sơ đồ dùng motion — tách chunk để danh sách hiện trước
const CategoryTreeDiagram = dynamic(() => import("./CategoryTreeDiagram").then((m) => m.CategoryTreeDiagram));

/** Đang mở dialog: sửa `node`, hoặc thêm mới (`node` null, `parent` = nhóm gốc khi thêm loại con) */
type EditorState = { node: AdminCategoryNode | null; parent: AdminCategoryNode | null };

/**
 * Màn loại sản phẩm: trái là danh sách theo cây 2 cấp (kéo thả đổi thứ tự cùng cấp, công tắc hiển thị, menu ⋯),
 * phải là sơ đồ cây động minh họa cách khách duyệt danh mục — trỏ một bên thì bên kia sáng theo.
 * Xem ở màn chi tiết `/admin/catalog/categories/[id]`, thêm / sửa mở CategoryEditorDialog.
 */
export function CategoryTreeBoard({
  initialTree,
  sizeCharts,
}: {
  initialTree: AdminCategoryNode[];
  sizeCharts: SizeChartOption[];
}) {
  const t = useTranslations("AdminPage.categories");
  const tPage = useTranslations("AdminPage.pages.categories");
  const tSizing = useTranslations("AdminPage.sizing");
  const notify = useNotify();
  const [tree, setTree] = useState(initialTree);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"ALL" | ProductGroup>("ALL");
  const [deleting, setDeleting] = useState<AdminCategoryNode | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [dragging, setDragging] = useState<AdminCategoryNode | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; placement: "before" | "after" } | null>(null);

  const chartMap = useMemo(() => new Map(sizeCharts.map((chart) => [chart.id, chart])), [sizeCharts]);
  // Đang lọc thì chỉ thấy một phần anh em cùng cấp — tắt đổi thứ tự để không xếp sai
  const isFiltering = search.trim().length > 0 || groupFilter !== "ALL";
  const visibleTree = filterTreeByGroup(filterTree(tree, search), groupFilter);
  const totalChildren = tree.reduce((sum, root) => sum + root.children.length, 0);
  const groupCounts = PRODUCT_GROUPS.map((group) => ({
    group,
    count: tree.flatMap((root) => [root, ...root.children]).filter((node) => node.group === group).length,
  }));

  /** Cập nhật lạc quan rồi lưu; lỗi thì trả cây về như cũ */
  const persistOrder = async (parentId: string | null, ordered: AdminCategoryNode[]) => {
    const previous = tree;
    setTree(replaceSiblings(tree, parentId, ordered));
    const res = await reorderCategoriesAction({ parentId, orderedIds: ordered.map((node) => node.id) });
    if (!res.success) {
      setTree(previous);
      notify.error(res.error, "CATEGORY_UPDATE_FAILED");
      return;
    }
    notify.success(t("reordered"));
  };

  const handlers: CategoryRowHandlers = {
    onDelete: setDeleting,
    onEdit: (node) => setEditor({ node, parent: null }),
    onAddChild: (parent) => setEditor({ node: null, parent }),
    onToggleActive: async (node) => {
      if (pendingIds.has(node.id)) return;
      setPendingIds((prev) => new Set(prev).add(node.id));
      const res = await updateCategoryAction({
        categoryId: node.id,
        name: node.name,
        nameEn: node.nameEn ?? "",
        slug: node.slug,
        description: node.description ?? "",
        descriptionEn: node.descriptionEn ?? "",
        group: node.group,
        isActive: !node.isActive,
        defaultSizeChartId: node.defaultSizeChartId ?? "",
        parentId: node.parentId,
      });
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(node.id);
        return next;
      });
      if (!res.success) {
        notify.error(res.error, "CATEGORY_UPDATE_FAILED");
        return;
      }
      setTree(res.data.tree);
      notify.success(node.isActive ? t("hiddenSuccess") : t("shownSuccess"));
    },
    onMove: (node, direction) => {
      const siblings = getSiblings(tree, node.parentId);
      const index = siblings.findIndex((s) => s.id === node.id);
      const target = siblings[index + direction];
      if (!target) return;
      void persistOrder(node.parentId, moveSibling(siblings, node.id, target.id, direction < 0 ? "before" : "after"));
    },
  };

  const toggleExpand = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allCollapsed = tree.every((root) => root.children.length === 0 || collapsed.has(root.id));
  const isExpanded = (rootId: string) => isFiltering || !collapsed.has(rootId);

  /** Kéo thả HTML5: chỉ thả được vào anh em cùng cấp; nửa trên dòng = chèn trước, nửa dưới = chèn sau */
  const dragFor = (node: AdminCategoryNode): CategoryRowDrag => ({
    isDragging: dragging?.id === node.id,
    dropPlacement: dropTarget?.id === node.id ? dropTarget.placement : null,
    onDragStart: (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", node.id);
      setDragging(node);
    },
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!dragging || dragging.id === node.id || dragging.parentId !== node.parentId) return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const placement = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
      if (dropTarget?.id !== node.id || dropTarget.placement !== placement) setDropTarget({ id: node.id, placement });
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (dragging && dropTarget && dragging.parentId === node.parentId) {
        const siblings = getSiblings(tree, node.parentId);
        const ordered = moveSibling(siblings, dragging.id, dropTarget.id, dropTarget.placement);
        if (ordered.some((item, index) => item.id !== siblings[index]?.id)) void persistOrder(node.parentId, ordered);
      }
      setDragging(null);
      setDropTarget(null);
    },
    onDragEnd: () => {
      setDragging(null);
      setDropTarget(null);
    },
  });

  return (
    <>
      <AdminListPanel
        icon={FolderTree}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("createRoot"), onClick: () => setEditor({ node: null, parent: null }) }}
        filters={
          <AdminFilterSelect
            label={t("groupLabel")}
            value={groupFilter}
            onChange={setGroupFilter}
            options={[
              { value: "ALL" as const, label: t("filterAll") },
              ...groupCounts.map(({ group, count }) => ({
                value: group,
                label: `${tSizing(`group.${group}`)} (${count})`,
              })),
            ]}
            className="w-full sm:w-60"
          />
        }
      />

      {/*
        Mobile: chỉ sơ đồ (bấm nút vào màn chi tiết). iPad: hai bảng trái / phải bằng nhau để so sánh.
        PC: danh sách rộng hơn, sơ đồ dính khi cuộn.
      */}
      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <section className={cn(ADMIN_CARD_CLASS, "hidden p-4 sm:p-5 md:block")}>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#09090B]">{t("list.title")}</h2>
              <p className="mt-0.5 text-xs text-[#71717A]">
                {t("summary", { roots: tree.length, children: totalChildren })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(tree.map((root) => root.id)))}
              className={ADMIN_SECONDARY_BUTTON_CLASS}
            >
              {allCollapsed ? <ChevronsUpDown size={15} aria-hidden /> : <ChevronsDownUp size={15} aria-hidden />}
              {allCollapsed ? t("expandAll") : t("collapseAll")}
            </button>
          </header>

          <div className="mt-4 border-t border-dashed border-[#E4E4E7]" aria-hidden />

          {visibleTree.length === 0 ? (
            <p className="py-16 text-center text-sm text-[#71717A]">{isFiltering ? t("noResults") : t("empty")}</p>
          ) : (
            <>
              <div
                className={cn(
                  CATEGORY_LIST_GRID,
                  "border-b border-dashed border-[#E4E4E7] px-1.5 py-3 text-sm font-semibold text-[#3F3F46] xl:px-2 xl:text-body"
                )}
              >
                <span aria-hidden className="hidden xl:block" />
                <span>{t("column.name")}</span>
                <span className="pr-1 text-right xl:pr-4">{t("list.columnProducts")}</span>
                <span className="hidden xl:block">{t("list.columnStatus")}</span>
                <span aria-hidden />
              </div>
              <ol className="divide-y divide-dashed divide-[#E4E4E7]">
                {visibleTree.map((root, rootIndex) => {
                  const expanded = isExpanded(root.id);
                  const rowProps = (node: AdminCategoryNode) => ({
                    sizeCharts: chartMap,
                    reorderDisabled: isFiltering,
                    togglePending: pendingIds.has(node.id),
                    isActive: activeId === node.id,
                    onActivate: setActiveId,
                    drag: dragFor(node),
                    ...handlers,
                  });
                  return (
                    <li key={root.id} className="py-1">
                      <CategoryTreeRow
                        node={root}
                        isFirst={rootIndex === 0}
                        isLast={rootIndex === visibleTree.length - 1}
                        expanded={expanded}
                        onToggleExpand={() => toggleExpand(root.id)}
                        {...rowProps(root)}
                      />
                      {expanded && root.children.length > 0 && (
                        <ol>
                          {root.children.map((child, childIndex) => (
                            <li key={child.id}>
                              <CategoryTreeRow
                                node={child}
                                parent={root}
                                isFirst={childIndex === 0}
                                isLast={childIndex === root.children.length - 1}
                                {...rowProps(child)}
                              />
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          <p
            className={cn(
              "mt-2 flex items-center gap-2 border-t border-dashed border-[#E4E4E7] pt-4 text-xs text-[#71717A]",
              !isFiltering && "max-xl:hidden"
            )}
          >
            <Info size={14} className="shrink-0" aria-hidden />
            {isFiltering ? t("reorderDisabled") : t("list.dragHint")}
          </p>
        </section>

        <div className="xl:sticky xl:top-3">
          <CategoryTreeDiagram
            tree={visibleTree}
            isExpanded={isExpanded}
            activeId={activeId}
            onActivate={setActiveId}
          />
        </div>
      </div>

      {editor && (
        <CategoryEditorDialog
          // Mỗi lần mở là một form mới
          key={editor.node?.id ?? `new-${editor.parent?.id ?? "root"}`}
          node={editor.node}
          parent={editor.parent}
          roots={tree}
          sizeCharts={sizeCharts}
          onOpenChange={(open) => !open && setEditor(null)}
          onSaved={setTree}
        />
      )}

      {deleting && (
        <ConfirmDeleteCategoryDialog
          category={deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          onDeleted={setTree}
        />
      )}
    </>
  );
}
