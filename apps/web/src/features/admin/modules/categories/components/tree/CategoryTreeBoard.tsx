"use client";

import { useMemo, useState, type DragEvent } from "react";
import dynamic from "next/dynamic";
import { ChevronsDownUp, ChevronsUpDown, FolderTree } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRODUCT_GROUPS, type ProductGroup } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import { reorderCategoriesAction, updateCategoryAction } from "../../actions/categories.actions";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { filterTree, filterTreeByGroup, getSiblings, moveSibling, replaceSiblings } from "../../utils/categoryTree";
import { type CategoryEditorTarget } from "./CategoryEditorDialog";
import { CategoryTreeRow, type CategoryRowHandlers } from "./CategoryTreeRow";

// Hộp thoại chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const CategoryEditorDialog = dynamic(() => import("./CategoryEditorDialog").then((m) => m.CategoryEditorDialog));
const ConfirmDeleteCategoryDialog = dynamic(() =>
  import("./ConfirmDeleteCategoryDialog").then((m) => m.ConfirmDeleteCategoryDialog)
);

interface DragState {
  id: string;
  parentId: string | null;
}

interface DropHint {
  id: string;
  placement: "before" | "after";
}

/** Màn loại sản phẩm: cây 2 cấp (nhóm gốc → loại con), kéo thả đổi thứ tự trong cùng cấp */
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
  const [editor, setEditor] = useState<CategoryEditorTarget | null>(null);
  const [deleting, setDeleting] = useState<AdminCategoryNode | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropHint, setDropHint] = useState<DropHint | null>(null);

  const chartMap = useMemo(() => new Map(sizeCharts.map((chart) => [chart.id, chart])), [sizeCharts]);
  // Đang lọc thì chỉ thấy một phần anh em cùng cấp — tắt kéo thả để không đổi thứ tự sai
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
    onEdit: (node) => setEditor({ mode: "edit", node }),
    onAddChild: (parent) => setEditor({ mode: "create", parent }),
    onDelete: setDeleting,
    onToggleActive: async (node) => {
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
    onDragStart: (node) => setDrag({ id: node.id, parentId: node.parentId }),
    onDragOverRow: (event: DragEvent<HTMLElement>, node) => {
      // Chỉ cho thả giữa các nút cùng cha — đổi cha dùng ô "Thuộc nhóm" trong hộp thoại sửa
      if (!drag || drag.parentId !== node.parentId || drag.id === node.id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const rect = event.currentTarget.getBoundingClientRect();
      const placement = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
      if (dropHint?.id !== node.id || dropHint.placement !== placement) setDropHint({ id: node.id, placement });
    },
    onDropRow: (event) => {
      event.preventDefault();
      if (drag && dropHint) {
        const siblings = getSiblings(tree, drag.parentId);
        const ordered = moveSibling(siblings, drag.id, dropHint.id, dropHint.placement);
        if (ordered.some((node, index) => node.id !== siblings[index]?.id)) void persistOrder(drag.parentId, ordered);
      }
      setDrag(null);
      setDropHint(null);
    },
    onDragEnd: () => {
      setDrag(null);
      setDropHint(null);
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

  return (
    <>
      <AdminListPanel
        icon={FolderTree}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("createRoot"), onClick: () => setEditor({ mode: "create", parent: null }) }}
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#71717A]">
          {t("summary", { roots: tree.length, children: totalChildren })} ·{" "}
          {isFiltering ? t("dragDisabled") : t("dragHint")}
        </p>
        <button
          type="button"
          onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(tree.map((root) => root.id)))}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#52525B] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
        >
          {allCollapsed ? <ChevronsUpDown size={14} aria-hidden /> : <ChevronsDownUp size={14} aria-hidden />}
          {allCollapsed ? t("expandAll") : t("collapseAll")}
        </button>
      </div>

      {visibleTree.length === 0 ? (
        <p className="rounded-xl border border-[#E4E4E7] bg-white py-16 text-center text-sm text-[#71717A]">
          {isFiltering ? t("noResults") : t("empty")}
        </p>
      ) : (
        <ol className="space-y-3">
          {visibleTree.map((root, rootIndex) => {
            const expanded = isFiltering || !collapsed.has(root.id);
            return (
              <li
                key={root.id}
                className={cn(
                  "overflow-hidden rounded-xl border border-[#E4E4E7] bg-white shadow-2xs",
                  drag?.id === root.id && "border-dashed"
                )}
              >
                <CategoryTreeRow
                  node={root}
                  sizeCharts={chartMap}
                  isFirst={rootIndex === 0}
                  isLast={rootIndex === visibleTree.length - 1}
                  expanded={expanded}
                  onToggleExpand={() => toggleExpand(root.id)}
                  isDragging={drag?.id === root.id}
                  dropPlacement={dropHint?.id === root.id ? dropHint.placement : null}
                  reorderDisabled={isFiltering}
                  {...handlers}
                />
                {expanded && root.children.length > 0 && (
                  <ol className="relative border-t border-[#F4F4F5] py-1 pl-6 sm:pl-14">
                    {/* Đường dẫn phân cấp nối các loại con với nhóm gốc */}
                    <span aria-hidden className="absolute bottom-6 left-4 top-0 w-px bg-[#E4E4E7] sm:left-[46px]" />
                    {root.children.map((child, childIndex) => (
                      <li key={child.id} className="relative">
                        <span aria-hidden className="absolute -left-2 top-1/2 h-px w-2 bg-[#E4E4E7] sm:-left-2" />
                        <CategoryTreeRow
                          node={child}
                          parent={root}
                          sizeCharts={chartMap}
                          isFirst={childIndex === 0}
                          isLast={childIndex === root.children.length - 1}
                          isDragging={drag?.id === child.id}
                          dropPlacement={dropHint?.id === child.id ? dropHint.placement : null}
                          reorderDisabled={isFiltering}
                          {...handlers}
                        />
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {editor && (
        <CategoryEditorDialog
          key={editor.mode === "edit" ? editor.node.id : `new-${editor.parent?.id ?? "root"}`}
          target={editor}
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
