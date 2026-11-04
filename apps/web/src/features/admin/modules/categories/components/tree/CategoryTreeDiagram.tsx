"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { EyeOff, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { type AdminCategoryNode } from "../../types/categories.types";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS } from "../../utils/productGroupMeta";

interface CategoryTreeDiagramProps {
  tree: AdminCategoryNode[];
  /** Nhóm gốc đang mở ở danh sách — sơ đồ thu gọn theo */
  isExpanded: (rootId: string) => boolean;
  activeId: string | null;
  onActivate: (id: string | null) => void;
}

// Chiều cao cố định của từng nút để dây nối rẽ đúng vào giữa nút (px)
const ROOT_NODE_H = 48;
const CHILD_NODE_H = 40;
const ITEM_GAP = 10;
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
 * Sơ đồ cây động của danh mục (Cửa hàng → nhóm gốc → loại con) — minh họa cách khách duyệt danh mục, không phải bảng.
 * Nhánh mọc ra khi tải, tự dời chỗ khi đổi thứ tự / thu gọn; trỏ vào dòng bên danh sách thì sáng cả đường đi tới nút đó
 * (và ngược lại). Loại đang ẩn vẽ nét đứt; vạch dưới tên dài theo số sản phẩm.
 */
export function CategoryTreeDiagram({ tree, isExpanded, activeId, onActivate }: CategoryTreeDiagramProps) {
  const t = useTranslations("AdminPage.categories");
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

  const node = (item: AdminCategoryNode, isRoot: boolean) => {
    const Icon = PRODUCT_GROUP_ICONS[item.group];
    const color = PRODUCT_GROUP_COLORS[item.group];
    const products = totalProducts(item);
    const active = activeId === item.id;
    return (
      <Link
        href={`/admin/catalog/categories/${item.id}`}
        onMouseEnter={() => onActivate(item.id)}
        onMouseLeave={() => onActivate(null)}
        onFocus={() => onActivate(item.id)}
        onBlur={() => onActivate(null)}
        style={{ height: isRoot ? ROOT_NODE_H : CHILD_NODE_H }}
        className={cn(
          "flex min-w-0 items-center gap-2.5 rounded-xl border bg-white px-2.5 outline-none transition-[opacity,box-shadow,border-color] duration-200",
          item.isActive ? "border-[#E4E4E7]" : "border-dashed border-[#D4D4D8]",
          active ? "border-[#18181B] shadow-[0_6px_16px_-10px_rgba(9,9,11,0.45)]" : "hover:border-[#A1A1AA]",
          dimmed(item.id) && "opacity-40"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "grid shrink-0 place-items-center rounded-lg",
            isRoot ? cn("size-8", color.tile) : cn("size-6", color.chip),
            !item.isActive && "grayscale"
          )}
        >
          <Icon size={isRoot ? 15 : 13} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "flex items-center gap-1 truncate text-sm",
              isRoot ? "font-semibold" : "font-medium",
              item.isActive ? "text-[#09090B]" : "text-[#A1A1AA]"
            )}
          >
            <span className="truncate">{item.name}</span>
            {!item.isActive && <EyeOff size={12} className="shrink-0" aria-label={t("diagram.hidden")} />}
          </span>
          {/* Vạch số sản phẩm: dài theo tỉ lệ với loại nhiều sản phẩm nhất */}
          <span className="mt-1 flex items-center gap-1.5">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-[#F4F4F5]">
              <motion.span
                className={cn("block h-full rounded-full", item.isActive ? color.line : "bg-[#D4D4D8]")}
                initial={{ width: 0 }}
                animate={{ width: `${(products / maxProducts) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              />
            </span>
            <span className="font-mono text-2xs tabular-nums text-[#71717A]">{products}</span>
          </span>
        </span>
      </Link>
    );
  };

  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <header>
        <h2 className="text-lg font-semibold text-[#09090B]">{t("diagram.title")}</h2>
        <p className="mt-0.5 text-xs text-[#71717A]">{t("diagram.description")}</p>
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
          <ul className="ml-[28px]">
            <AnimatePresence initial={false}>
              {tree.map((root, rootIndex) => {
                const isLastRoot = rootIndex === tree.length - 1;
                const expanded = isExpanded(root.id);
                const color = PRODUCT_GROUP_COLORS[root.group];
                return (
                  <motion.li
                    key={root.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.3, delay: rootIndex * 0.05 }}
                    className="relative"
                    style={{ paddingTop: ITEM_GAP, paddingLeft: BRANCH_W + 6 }}
                  >
                    <Branch
                      isLast={isLastRoot}
                      mid={ITEM_GAP + ROOT_NODE_H / 2}
                      lineClass={dimmed(root.id) ? "bg-[#E4E4E7]" : "bg-[#D4D4D8]"}
                      borderClass={dimmed(root.id) ? "border-[#E4E4E7]" : "border-[#D4D4D8]"}
                    />
                    {node(root, true)}

                    <AnimatePresence initial={false}>
                      {expanded && root.children.length > 0 && (
                        <motion.ul
                          key="children"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="ml-[26px] overflow-hidden"
                        >
                          {root.children.map((child, childIndex) => (
                            <motion.li
                              key={child.id}
                              layout
                              className="relative"
                              style={{ paddingTop: ITEM_GAP - 2, paddingLeft: BRANCH_W + 6 }}
                            >
                              <Branch
                                isLast={childIndex === root.children.length - 1}
                                mid={ITEM_GAP - 2 + CHILD_NODE_H / 2}
                                lineClass={color.line}
                                borderClass={color.lineBorder}
                              />
                              {node(child, false)}
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                    {!expanded && root.children.length > 0 && (
                      <p className="ml-[52px] mt-1.5 text-2xs text-[#A1A1AA]">
                        {t("diagram.collapsed", { count: root.children.length })}
                      </p>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </MotionConfig>
      )}
    </section>
  );
}
