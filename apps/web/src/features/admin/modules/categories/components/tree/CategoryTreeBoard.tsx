"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FolderTree } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRODUCT_GROUPS, type ProductGroup } from "@repo/shared/sizing";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNotify } from "@/hooks/useNotify";
import { AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import { reorderCategoriesAction, updateCategoryAction } from "../../actions/categories.actions";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { filterTree, filterTreeByGroup, getSiblings, moveSibling, replaceSiblings } from "../../utils/categoryTree";
import { CategoryListTable, type CategoryRowHandlers } from "./CategoryListTable";

// Hộp thoại chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const ConfirmDeleteCategoryDialog = dynamic(() =>
  import("./ConfirmDeleteCategoryDialog").then((m) => m.ConfirmDeleteCategoryDialog)
);
const CategoryEditorDialog = dynamic(() => import("./CategoryEditorDialog").then((m) => m.CategoryEditorDialog));
// Sơ đồ dùng motion — tách chunk để danh sách hiện trước; màn nhỏ không tải
const CategoryTreeDiagram = dynamic(() => import("./CategoryTreeDiagram").then((m) => m.CategoryTreeDiagram));

/** Đang mở dialog: sửa `node`, hoặc thêm mới (`node` null, `parent` = nhóm gốc khi thêm loại con) */
type EditorState = { node: AdminCategoryNode | null; parent: AdminCategoryNode | null };

/**
 * Màn loại sản phẩm: trái là bảng dữ liệu (chỉ xem, mọi thao tác ở menu ⋯), phải là sơ đồ cây động — thu gọn / mở rộng và
 * kéo thả đổi thứ tự cùng cấp nằm trên sơ đồ; trỏ một bên thì bên kia sáng theo.
 * Màn nhỏ (dưới md) chỉ có danh sách gọn, đổi thứ tự qua menu ⋯.
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
  // Cây trước khi bắt đầu kéo trên sơ đồ — để biết có đổi gì không và trả về khi lưu lỗi
  const dragSnapshot = useRef<AdminCategoryNode[] | null>(null);
  const showDiagram = useMediaQuery("(min-width: 768px)", true);

  const chartMap = useMemo(() => new Map(sizeCharts.map((chart) => [chart.id, chart])), [sizeCharts]);
  // Đang lọc thì chỉ thấy một phần anh em cùng cấp — tắt đổi thứ tự để không xếp sai
  const isFiltering = search.trim().length > 0 || groupFilter !== "ALL";
  const visibleTree = filterTreeByGroup(filterTree(tree, search), groupFilter);
  const totalChildren = tree.reduce((sum, root) => sum + root.children.length, 0);
  const groupCounts = PRODUCT_GROUPS.map((group) => ({
    group,
    count: tree.flatMap((root) => [root, ...root.children]).filter((node) => node.group === group).length,
  }));

  /** Lưu thứ tự đã cập nhật lạc quan; lỗi thì trả cây về `previous` */
  const saveOrder = async (parentId: string | null, ordered: AdminCategoryNode[], previous: AdminCategoryNode[]) => {
    const res = await reorderCategoriesAction({ parentId, orderedIds: ordered.map((node) => node.id) });
    if (!res.success) {
      setTree(previous);
      notify.error(res.error, "CATEGORY_UPDATE_FAILED");
      return;
    }
    notify.success(t("reordered"));
  };

  const persistOrder = (parentId: string | null, ordered: AdminCategoryNode[]) => {
    const previous = tree;
    setTree(replaceSiblings(tree, parentId, ordered));
    void saveOrder(parentId, ordered, previous);
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
        // Chỉ bật / tắt hiển thị — giữ nguyên bảng size đang gắn
        sizeChartMode: "preset",
        sizeChart: null,
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
      persistOrder(node.parentId, moveSibling(siblings, node.id, target.id, direction < 0 ? "before" : "after"));
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

  /** Kéo thả trên sơ đồ: đổi thứ tự tại chỗ trong lúc kéo, thả tay mới lưu (một lần) */
  const reorder = {
    onReorderStart: () => {
      dragSnapshot.current ??= tree;
    },
    onReorder: (parentId: string | null, orderedIds: string[]) => {
      const siblings = getSiblings(tree, parentId);
      const ordered = orderedIds.flatMap((id) => siblings.find((node) => node.id === id) ?? []);
      if (ordered.length === siblings.length) setTree(replaceSiblings(tree, parentId, ordered));
    },
    onReorderEnd: (parentId: string | null) => {
      const previous = dragSnapshot.current;
      dragSnapshot.current = null;
      if (!previous) return;
      const ordered = getSiblings(tree, parentId);
      const before = getSiblings(previous, parentId);
      if (ordered.some((node, index) => node.id !== before[index]?.id)) void saveOrder(parentId, ordered, previous);
    },
  };

  return (
    <>
      <AdminListPanel
        icon={FolderTree}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("createType"), onClick: () => setEditor({ node: null, parent: null }) }}
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
        Xếp theo bề rộng vùng nội dung (container query, không theo viewport — admin còn menu trái / cột phải):
        đủ rộng thì bảng | sơ đồ dính khi cuộn, hẹp hơn thì bảng trên sơ đồ dưới. Điện thoại: chỉ danh sách gọn.
      */}
      <div className="@container">
        <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#09090B]">{t("list.title")}</h2>
                <p className="mt-0.5 text-xs text-[#71717A]">
                  {t("summary", { roots: tree.length, children: totalChildren })}
                </p>
              </div>
            </div>
            <CategoryListTable
              tree={visibleTree}
              sizeCharts={chartMap}
              reorderDisabled={isFiltering}
              pendingIds={pendingIds}
              activeId={activeId}
              onActivate={setActiveId}
              empty={isFiltering ? t("noResults") : t("empty")}
              {...handlers}
            />
          </div>

          {showDiagram && (
            <div className="@5xl:sticky @5xl:top-3">
              <CategoryTreeDiagram
                tree={visibleTree}
                isExpanded={isExpanded}
                onToggleExpand={toggleExpand}
                allCollapsed={allCollapsed}
                onToggleAll={() => setCollapsed(allCollapsed ? new Set() : new Set(tree.map((root) => root.id)))}
                activeId={activeId}
                onActivate={setActiveId}
                reorderDisabled={isFiltering}
                {...reorder}
              />
            </div>
          )}
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
