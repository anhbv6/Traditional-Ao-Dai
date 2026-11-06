"use client";

import { type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, Reorder, motion, useDragControls } from "motion/react";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, EyeOff, GripVertical, Info, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, AdminTooltip } from "@/features/admin/core/ui";
import { type AdminCategoryNode } from "../../types/categories.types";
import { categoryName } from "../../utils/categoryName";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS } from "../../utils/productGroupMeta";

interface CategoryTreeDiagramProps {
  tree: AdminCategoryNode[];
  /** Nhóm gốc đang mở (đang lọc thì luôn mở) */
  isExpanded: (rootId: string) => boolean;
  onToggleExpand: (rootId: string) => void;
  /** Mọi nhóm gốc có loại con đều đang thu gọn */
  allCollapsed: boolean;
  onToggleAll: () => void;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  /** Tắt kéo thả khi đang lọc — chỉ thấy một phần anh em cùng cấp */
  reorderDisabled: boolean;
  /** Bắt đầu kéo một nút (để chụp lại thứ tự cũ) */
  onReorderStart: () => void;
  /** Thứ tự anh em đổi trong lúc kéo (`parentId` null = nhóm gốc) — chỉ cập nhật tại chỗ */
  onReorder: (parentId: string | null, orderedIds: string[]) => void;
  /** Thả tay — lưu thứ tự nếu có thay đổi */
  onReorderEnd: (parentId: string | null) => void;
}

type StartDrag = ((event: PointerEvent) => void) | null;

// Chiều cao cố định của từng nút để dây nối rẽ đúng vào giữa nút (px)
const ROOT_NODE_H = 56;
const CHILD_NODE_H = 48;
const ITEM_GAP = 12;
const BRANCH_W = 20;

const totalProducts = (node: AdminCategoryNode) =>
  node.productCount + node.children.reduce((sum, child) => sum + child.productCount, 0);

/** Dây nối một nút vào trục dọc: nút cuối là khuỷu bo góc, nút giữa là trục chạy tiếp + nhánh ngang */
function Branch({
  isLast,
  mid,
  lineClass,
  borderClass,
}: {
  isLast: boolean;
  mid: number;
  lineClass: string;
  borderClass: string;
}) {
  return isLast ? (
    <motion.span
      aria-hidden
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ height: mid, width: BRANCH_W, originY: 0 }}
      className={cn("absolute left-0 top-0 rounded-bl-lg border-b border-l", borderClass)}
    />
  ) : (
    <>
      <motion.span
        aria-hidden
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ originY: 0 }}
        className={cn("absolute bottom-0 left-0 top-0 w-px", lineClass)}
      />
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
        style={{ top: mid, width: BRANCH_W, originX: 0 }}
        className={cn("absolute left-0 h-px", lineClass)}
      />
    </>
  );
}

/**
 * Một nút kéo được trong Reorder.Group — chỉ bắt đầu kéo từ tay ⋮⋮ (`dragListener={false}`) để kéo loại con
 * không kéo theo nhóm gốc chứa nó, và bôi chọn / cuộn ở phần còn lại vẫn bình thường.
 */
function DraggableItem({
  id,
  parentId,
  paddingTop,
  disabled,
  onReorderStart,
  onReorderEnd,
  children,
}: {
  id: string;
  parentId: string | null;
  paddingTop: number;
  disabled: boolean;
  onReorderStart: () => void;
  onReorderEnd: (parentId: string | null) => void;
  children: (startDrag: StartDrag) => ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      onDragStart={onReorderStart}
      onDragEnd={() => onReorderEnd(parentId)}
      className="relative"
      style={{ paddingTop, paddingLeft: BRANCH_W + 6 }}
    >
      {children(disabled ? null : (event) => controls.start(event))}
    </Reorder.Item>
  );
}

/**
 * Sơ đồ cây động của danh mục (Cửa hàng → nhóm gốc → loại con) — minh họa cách khách duyệt danh mục.
 * Kéo tay ⋮⋮ để đổi thứ tự trong cùng cấp; ▸ ở nhóm gốc (hoặc nút đầu thẻ) để thu gọn / mở rộng — bảng danh sách
 * luôn hiện đủ. Nhánh tự dời chỗ khi đổi thứ tự / thu gọn. Trỏ vào dòng bên bảng thì
 * sáng cả đường đi tới nút đó (và ngược lại). Loại đang ẩn vẽ nét đứt; vạch dưới tên dài theo số sản phẩm.
 * Chỉ hiện từ md — màn nhỏ chỉ có danh sách.
 */
export function CategoryTreeDiagram({
  tree,
  isExpanded,
  onToggleExpand,
  allCollapsed,
  onToggleAll,
  activeId,
  onActivate,
  reorderDisabled,
  onReorderStart,
  onReorder,
  onReorderEnd,
}: CategoryTreeDiagramProps) {
  const t = useTranslations("AdminPage.categories");
  const locale = useLocale();
  const maxProducts = Math.max(
    1,
    ...tree.flatMap((root) => [totalProducts(root), ...root.children.map(totalProducts)])
  );

  // Đường đi tới nút đang trỏ: chính nó + nhóm gốc chứa nó; có nút đang trỏ thì làm mờ phần còn lại
  const activeRoot = activeId
    ? tree.find((root) => root.id === activeId || root.children.some((c) => c.id === activeId))
    : undefined;
  const pathIds = new Set(activeRoot ? [activeRoot.id, activeId ?? ""] : []);
  const dimmed = (id: string) => activeRoot !== undefined && !pathIds.has(id);
  const totalCount = tree.reduce((sum, root) => sum + 1 + root.children.length, 0);

  const node = (item: AdminCategoryNode, isRoot: boolean, startDrag: StartDrag) => {
    const Icon = PRODUCT_GROUP_ICONS[item.group];
    const color = PRODUCT_GROUP_COLORS[item.group];
    const products = totalProducts(item);
    const active = activeId === item.id;
    const name = categoryName(item, locale);
    return (
      <div
        onMouseEnter={() => onActivate(item.id)}
        onMouseLeave={() => onActivate(null)}
        style={{ height: isRoot ? ROOT_NODE_H : CHILD_NODE_H }}
        className={cn(
          "flex min-w-0 cursor-default select-none items-center gap-2 rounded-xl border bg-white pl-1 pr-3 transition-[opacity,box-shadow,border-color] duration-200",
          item.isActive ? "border-[#E4E4E7]" : "border-dashed border-[#D4D4D8]",
          active ? "border-[#18181B] shadow-[0_6px_16px_-10px_rgba(9,9,11,0.45)]" : "hover:border-[#A1A1AA]",
          dimmed(item.id) && "opacity-40"
        )}
      >
        <AdminTooltip content={startDrag ? null : t("reorderDisabled")}>
          <span
            role="button"
            tabIndex={-1}
            aria-label={t("diagram.dragHandle", { name })}
            aria-disabled={!startDrag}
            onPointerDown={(event) => {
              if (!startDrag) return;
              event.preventDefault();
              startDrag(event);
            }}
            // Không để trình duyệt cuộn trang khi kéo tay trên màn cảm ứng
            style={{ touchAction: "none" }}
            className={cn(
              "grid h-8 w-5 shrink-0 place-items-center rounded-md text-[#A1A1AA] transition-colors",
              startDrag ? "cursor-grab hover:text-[#09090B] active:cursor-grabbing" : "cursor-not-allowed opacity-40"
            )}
          >
            <GripVertical size={15} aria-hidden />
          </span>
        </AdminTooltip>
        <span
          aria-hidden
          className={cn(
            "grid shrink-0 place-items-center rounded-lg",
            isRoot ? cn("size-9", color.tile) : cn("size-7", color.chip),
            !item.isActive && "grayscale"
          )}
        >
          <Icon size={isRoot ? 16 : 14} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "flex items-center gap-1 truncate text-sm leading-tight",
              isRoot ? "font-semibold" : "font-medium",
              item.isActive ? "text-[#09090B]" : "text-[#A1A1AA]"
            )}
          >
            <span className="truncate">{name}</span>
            {!item.isActive && <EyeOff size={12} className="shrink-0" aria-label={t("diagram.hidden")} />}
          </span>
          {/* Vạch số sản phẩm: dài theo tỉ lệ với loại nhiều sản phẩm nhất */}
          <span className="mt-2 flex items-center gap-2">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-[#F4F4F5]">
              <motion.span
                className={cn("block h-full rounded-full", item.isActive ? color.line : "bg-[#D4D4D8]")}
                initial={{ width: 0 }}
                animate={{ width: `${(products / maxProducts) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              />
            </span>
            <span className="min-w-4 text-right font-mono text-2xs tabular-nums text-[#71717A]">{products}</span>
          </span>
        </span>
        {isRoot && item.children.length > 0 && (
          <button
            type="button"
            onClick={() => onToggleExpand(item.id)}
            aria-expanded={isExpanded(item.id)}
            aria-label={isExpanded(item.id) ? t("collapse", { name }) : t("expand", { name })}
            className="-mr-1.5 grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]"
          >
            <ChevronRight
              size={15}
              className={cn("transition-transform", isExpanded(item.id) && "rotate-90")}
              aria-hidden
            />
          </button>
        )}
      </div>
    );
  };

  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <header>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#09090B]">{t("diagram.title")}</h2>
          <button type="button" onClick={onToggleAll} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            {allCollapsed ? <ChevronsUpDown size={15} aria-hidden /> : <ChevronsDownUp size={15} aria-hidden />}
            {allCollapsed ? t("expandAll") : t("collapseAll")}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#71717A]">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-3.5 w-5 rounded border border-dashed border-[#A1A1AA]" />
            {t("diagram.legendHidden")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-1 w-5 rounded-full bg-violet-300" />
            {t("diagram.legendProducts")}
          </span>
        </div>
      </header>

      <div className="my-4 border-t border-dashed border-[#E4E4E7]" aria-hidden />

      {tree.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#71717A]">{t("noResults")}</p>
      ) : (
        <MotionConfig reducedMotion="user">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-12 items-center gap-2.5 rounded-xl bg-[#18181B] px-3 text-white"
          >
            <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-white/10">
              <Store size={16} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">Thiên Canh</span>
              <span className="block text-2xs text-white/60">{t("diagram.storeMeta", { count: totalCount })}</span>
            </span>
          </motion.div>

          {/* Trục dọc thẳng hàng tâm icon cửa hàng (px-3 + nửa ô 32px = 28px) */}
          <Reorder.Group
            axis="y"
            values={tree.map((root) => root.id)}
            onReorder={(ids: string[]) => onReorder(null, ids)}
            className="ml-[28px]"
          >
            {tree.map((root, rootIndex) => {
              const expanded = isExpanded(root.id);
              const color = PRODUCT_GROUP_COLORS[root.group];
              return (
                <DraggableItem
                  key={root.id}
                  id={root.id}
                  parentId={null}
                  paddingTop={ITEM_GAP}
                  disabled={reorderDisabled}
                  onReorderStart={onReorderStart}
                  onReorderEnd={onReorderEnd}
                >
                  {(startDrag) => (
                    <>
                      <Branch
                        isLast={rootIndex === tree.length - 1}
                        mid={ITEM_GAP + ROOT_NODE_H / 2}
                        lineClass={dimmed(root.id) ? "bg-[#E4E4E7]" : "bg-[#D4D4D8]"}
                        borderClass={dimmed(root.id) ? "border-[#E4E4E7]" : "border-[#D4D4D8]"}
                      />
                      {node(root, true, startDrag)}

                      <AnimatePresence initial={false}>
                        {expanded && root.children.length > 0 && (
                          <motion.div
                            key="children"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            {/* Trục loại con thẳng hàng tâm icon nhóm gốc (pl-1 + tay kéo 20px + gap 8px + nửa ô 36px = 50px) */}
                            <Reorder.Group
                              axis="y"
                              values={root.children.map((child) => child.id)}
                              onReorder={(ids: string[]) => onReorder(root.id, ids)}
                              className="ml-[50px]"
                            >
                              {root.children.map((child, childIndex) => (
                                <DraggableItem
                                  key={child.id}
                                  id={child.id}
                                  parentId={root.id}
                                  paddingTop={ITEM_GAP - 2}
                                  disabled={reorderDisabled}
                                  onReorderStart={onReorderStart}
                                  onReorderEnd={onReorderEnd}
                                >
                                  {(startChildDrag) => (
                                    <>
                                      <Branch
                                        isLast={childIndex === root.children.length - 1}
                                        mid={ITEM_GAP - 2 + CHILD_NODE_H / 2}
                                        lineClass={color.line}
                                        borderClass={color.lineBorder}
                                      />
                                      {node(child, false, startChildDrag)}
                                    </>
                                  )}
                                </DraggableItem>
                              ))}
                            </Reorder.Group>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {!expanded && root.children.length > 0 && (
                        <p className="ml-[76px] mt-2 text-2xs text-[#A1A1AA]">
                          {t("diagram.collapsed", { count: root.children.length })}
                        </p>
                      )}
                    </>
                  )}
                </DraggableItem>
              );
            })}
          </Reorder.Group>
        </MotionConfig>
      )}

      <p className="mt-4 flex items-center gap-2 border-t border-dashed border-[#E4E4E7] pt-4 text-xs text-[#71717A]">
        <Info size={14} className="shrink-0" aria-hidden />
        {reorderDisabled ? t("reorderDisabled") : t("diagram.dragHint")}
      </p>
    </section>
  );
}
