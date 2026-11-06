"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ArrowUpRight, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
} from "@/features/admin/core/ui";
import { SizeChartTable, type AdminSizeChartDetail } from "@/features/admin/modules/size-charts";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS, groupUsesSizeChart } from "../../utils/productGroupMeta";
import { categoryName } from "../../utils/categoryName";
import { CategoryStatusBadge } from "../shared/CategoryStatusBadge";

// Dialog chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const CategoryEditorDialog = dynamic(() => import("../tree/CategoryEditorDialog").then((m) => m.CategoryEditorDialog));
const ConfirmDeleteCategoryDialog = dynamic(() =>
  import("../tree/ConfirmDeleteCategoryDialog").then((m) => m.ConfirmDeleteCategoryDialog)
);

function Card({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** Nội dung hiển thị theo ngôn ngữ giao diện: tên, mô tả */
function LangBlock({ name, description, emptyLabel }: { name: ReactNode; description: ReactNode; emptyLabel: string }) {
  return (
    <div className="min-w-0 py-1">
      <p className="text-body font-semibold text-[#09090B]">{name || <Empty>{emptyLabel}</Empty>}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#3F3F46]">
        {description || <Empty>{emptyLabel}</Empty>}
      </p>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <span className="text-[#A1A1AA]">{children}</span>;
}

/** Ô số liệu trong thẻ Tổng quan */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#FAFAFA] px-3 py-2.5">
      <p className="font-mono text-xl font-semibold tabular-nums text-[#09090B]">{value}</p>
      <p className="text-xs text-[#71717A]">{label}</p>
    </div>
  );
}

/** Nét đứt ngăn các phần trong một thẻ */
function DashedDivider() {
  return <div aria-hidden className="my-4 border-t border-dashed border-[#E4E4E7]" />;
}

/** Đang mở dialog: sửa loại này, hoặc thêm loại con vào nó */
type EditorState = { mode: "edit" } | { mode: "addChild" };

interface CategoryDetailProps {
  node: AdminCategoryNode;
  roots: AdminCategoryNode[];
  sizeCharts: SizeChartOption[];
  /** Bảng size của loại sản phẩm (nhóm gốc luôn null) */
  sizeChart: AdminSizeChartDetail | null;
}

/**
 * Màn chi tiết loại sản phẩm (chỉ xem). Mỗi thông tin hiện đúng một chỗ:
 * đầu trang = tên, trạng thái, nhóm gốc, đường dẫn · trái = nội dung theo ngôn ngữ giao diện (vi → cột tiếng Việt,
 * en → cột `En`) rồi bảng size (chỉ xem) ·
 * phải = Tổng quan (nhóm hàng, số liệu, loại con / nhóm gốc). Sửa và thêm loại mở CategoryEditorDialog.
 */
export function CategoryDetail({ node, roots, sizeCharts, sizeChart }: CategoryDetailProps) {
  const t = useTranslations("AdminPage.categories");
  const router = useRouter();
  // Chỉ hiện nội dung của ngôn ngữ đang dùng; tiếng Anh chưa nhập thì báo thiếu (tiêu đề lùi về tên tiếng Việt)
  const locale = useLocale();
  const isEn = locale === "en";
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isRoot = node.parentId === null;
  const parentNode = roots.find((root) => root.id === node.parentId) ?? null;
  // Cùng sắc với khối trong danh sách: loại con lấy màu nhóm hàng của nhóm gốc
  const blockGroup = parentNode?.group ?? node.group;
  const treeColor = PRODUCT_GROUP_COLORS[blockGroup];
  const BlockIcon = PRODUCT_GROUP_ICONS[blockGroup];

  // Số liệu của nhóm gốc tính cả loại con
  const children = node.children;
  const productCount = node.productCount + children.reduce((sum, child) => sum + child.productCount, 0);
  const skuCount = node.skuCount + children.reduce((sum, child) => sum + child.skuCount, 0);
  // Nhóm gốc cố định theo nhóm hàng → không xóa
  const canDelete = node.parentId !== null && node.productCount === 0;

  const usesChart = groupUsesSizeChart(node.group);

  return (
    <div className="space-y-5">
      <AdminDetailHeader
        backHref="/admin/catalog/categories"
        backLabel={t("detail.back")}
        title={categoryName(node, locale)}
        badge={<CategoryStatusBadge isActive={node.isActive} />}
        // Chỉ đường dẫn — nhóm gốc / số loại con đã có ở thẻ Tổng quan bên phải
        subtitle={<span className="font-mono">/{node.slug}</span>}
        actions={
          <>
            {canDelete && (
              <button type="button" onClick={() => setDeleting(true)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                <Trash2 size={15} aria-hidden /> {t("menu.delete")}
              </button>
            )}
            <button type="button" onClick={() => setEditor({ mode: "edit" })} className={ADMIN_PRIMARY_BUTTON_CLASS}>
              <Pencil size={15} aria-hidden /> {t("menu.edit")}
            </button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {/* Nội dung hiển thị trên cửa hàng theo ngôn ngữ đang dùng */}
          <Card title={t("detail.sections.general")}>
            {isEn ? (
              <LangBlock name={node.nameEn} description={node.descriptionEn} emptyLabel={t("detail.info.noEnglish")} />
            ) : (
              <LangBlock name={node.name} description={node.description} emptyLabel={t("detail.info.none")} />
            )}
          </Card>

          {usesChart && !isRoot && (
            <Card
              title={t("detail.sections.sizeChart")}
              aside={
                sizeChart && (
                  <Link
                    href={`/admin/catalog/size-charts/${sizeChart.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                  >
                    {t("detail.chart.open")} <ArrowUpRight size={14} aria-hidden />
                  </Link>
                )
              }
            >
              {sizeChart ? (
                <>
                  <p className="-mt-2 mb-3 text-xs text-[#71717A]">
                    <span className="font-medium text-[#3F3F46]">{sizeChart.name}</span>
                    {!sizeChart.isActive && <span className="text-amber-700"> · {t("editor.chartInactive")}</span>}
                  </p>
                  <SizeChartTable chart={sizeChart} />
                </>
              ) : (
                <p className="text-sm text-amber-700">{t("noChart")}</p>
              )}
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-[8rem]">
          <Card title={t("detail.sections.overview")}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#71717A]">{t("field.isActive")}</span>
                <CategoryStatusBadge isActive={node.isActive} />
              </div>
              {/* <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#71717A]">{t("detail.info.group")}</span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn("grid size-6 shrink-0 place-items-center rounded-md", groupColor.tile)}
                  >
                    <GroupIcon size={13} />
                  </span>
                  <span className="truncate text-sm font-medium text-[#09090B]">{tSizing(`group.${node.group}`)}</span>
                  <AdminInfoTip
                    content={
                      <>
                        <span className="block">{tSizing(`groupHint.${node.group}`)}</span>
                        <span className="mt-1 block text-white/70">
                          {[
                            ...getGroupTraitKeys(node.group).map((trait) => tSizing(`trait.${trait}`)),
                            tSizing(`sellUnit.${traits.sellUnit}`),
                          ].join(" · ")}
                        </span>
                      </>
                    }
                  />
                </span>
              </div> */}
            </div>

            <DashedDivider />
            <div className={cn("grid gap-2", isRoot ? "grid-cols-3" : "grid-cols-2")}>
              <Stat label={t("detail.stats.products")} value={productCount} />
              <Stat label={t("detail.stats.skus")} value={skuCount} />
              {isRoot && <Stat label={t("detail.stats.children")} value={children.length} />}
            </div>

            {isRoot && (
              <>
                <DashedDivider />
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-body font-semibold text-[#09090B]">{t("detail.sections.children")}</h3>
                  <button
                    type="button"
                    onClick={() => setEditor({ mode: "addChild" })}
                    className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                  >
                    <Plus size={13} aria-hidden /> {t("menu.addChild")}
                  </button>
                </div>
                {children.length === 0 ? (
                  <p className="text-xs text-[#71717A]">{t("detail.noChildren")}</p>
                ) : (
                  // Danh sách loại con kèm dây nối cùng màu khối như ở màn danh sách
                  <ul className="relative ml-2 space-y-0.5">
                    <span aria-hidden className={cn("absolute bottom-4 left-0 top-0 w-px", treeColor.line)} />
                    {children.map((child) => (
                      <li key={child.id} className="relative pl-4">
                        <span aria-hidden className={cn("absolute left-0 top-1/2 h-px w-3", treeColor.line)} />
                        <Link
                          href={`/admin/catalog/categories/${child.id}`}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#09090B] hover:bg-[#F4F4F5]"
                        >
                          <span className="min-w-0 flex-1 truncate">{categoryName(child, locale)}</span>
                          {!child.isActive && <CategoryStatusBadge isActive={false} />}
                          <span className="font-mono text-xs tabular-nums text-[#A1A1AA]">{child.productCount}</span>
                          <ChevronRight size={14} className="text-[#A1A1AA]" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {!isRoot && parentNode && (
              <>
                <DashedDivider />
                <h3 className="mb-2 text-body font-semibold text-[#09090B]">{t("field.parent")}</h3>
                <Link
                  href={`/admin/catalog/categories/${parentNode.id}`}
                  className="flex items-center gap-2 rounded-lg border border-[#E4E4E7] px-2.5 py-2 text-sm text-[#09090B] hover:bg-[#FAFAFA]"
                >
                  <span
                    aria-hidden
                    className={cn("grid size-6 shrink-0 place-items-center rounded-md", treeColor.tile)}
                  >
                    <BlockIcon size={13} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{categoryName(parentNode, locale)}</span>
                  <ChevronRight size={14} className="text-[#A1A1AA]" aria-hidden />
                </Link>
              </>
            )}
          </Card>
        </aside>
      </div>

      {editor && (
        <CategoryEditorDialog
          key={editor.mode}
          node={editor.mode === "edit" ? node : null}
          parent={editor.mode === "addChild" ? node : null}
          roots={roots}
          sizeCharts={sizeCharts}
          onOpenChange={(open) => !open && setEditor(null)}
          // Dữ liệu màn này đến từ server — tải lại để thấy thay đổi
          onSaved={() => router.refresh()}
        />
      )}

      {deleting && (
        <ConfirmDeleteCategoryDialog
          category={node}
          onOpenChange={setDeleting}
          onDeleted={() => router.push("/admin/catalog/categories")}
        />
      )}
    </div>
  );
}
