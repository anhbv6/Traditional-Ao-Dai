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
import { groupUsesSizeChart } from "../../utils/productGroupMeta";
import { categoryName } from "../../utils/categoryName";
import { CategoryStatusBadge } from "../shared/CategoryStatusBadge";

// Dialog chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const CategoryEditorDialog = dynamic(() => import("../dialog/CategoryEditorDialog").then((m) => m.CategoryEditorDialog));
const ConfirmDeleteCategoryDialog = dynamic(() =>
  import("../dialog/ConfirmDeleteCategoryDialog").then((m) => m.ConfirmDeleteCategoryDialog)
);

function Card({
  title,
  subtitle,
  aside,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-5 sm:p-6")}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#09090B]">{title}</h2>
          {subtitle && <div className="mt-0.5 text-xs text-[#71717A]">{subtitle}</div>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
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
 * Màn chi tiết loại sản phẩm (chỉ xem):
 * - Toàn bộ thông tin được gom gọn gàng, tự nhiên trong thẻ "Thông tin chung".
 * - Tách riêng khối loại con thành thẻ Card riêng để bố cục thoáng đãng, không bị dính liền/rối rắm.
 * - Hiển thị ngôn ngữ theo ngữ cảnh dự án (Tiếng Việt hiện bản Việt, Tiếng Anh và khác mặc định bản Anh).
 * - Mọi chuỗi ký tự đều dùng hệ thống đa ngôn ngữ (không fix cứng text).
 * - Màu sắc, kiểu chữ và kích thước chữ đồng bộ chuẩn mực.
 */
export function CategoryDetail({ node, roots, sizeCharts, sizeChart }: CategoryDetailProps) {
  const t = useTranslations("AdminPage.categories");
  const router = useRouter();
  const locale = useLocale();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isVi = locale === "vi";
  const name = categoryName(node, locale);
  const description = isVi ? (node.description || node.descriptionEn) : (node.descriptionEn || node.description);

  const isRoot = node.parentId === null;
  const parentNode = roots.find((root) => root.id === node.parentId) ?? null;

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
        title={name}
        badge={<CategoryStatusBadge isActive={node.isActive} />}
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

      <div className="space-y-5">
        {/* Thông tin chung */}
        <Card title={t("detail.sections.general")}>
          <div className="space-y-5">
            {/* Mô tả theo ngôn ngữ đang chọn - tự nhiên, mộc mạc như bài viết editorial */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-[#71717A]">
                {t("field.description")}
              </span>
              {description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#18181B]">
                  {description}
                </p>
              ) : (
                <p className="text-sm italic text-[#A1A1AA]">
                  {isVi ? t("detail.info.none") : t("detail.info.noEnglish")}
                </p>
              )}
            </div>

            {/* Thuộc tính & số liệu dạng danh sách 2 cột cân đối, thanh nhã */}
            <div className="border-t border-[#F4F4F5] pt-1">
              <dl className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
                <div className="flex items-center justify-between border-b border-[#F4F4F5] py-3">
                  <dt className="text-sm text-[#71717A]">{t("slug")}</dt>
                  <dd className="text-sm font-medium text-[#18181B]">
                    <span>/{node.slug}</span>
                  </dd>
                </div>

                {/* Cấp danh mục / Thuộc nhóm */}
                <div className="flex items-center justify-between border-b border-[#F4F4F5] py-3">
                  <dt className="text-sm text-[#71717A]">
                    {isRoot ? t("field.parentShort") : t("field.parent")}
                  </dt>
                  <dd className="text-sm font-medium text-[#18181B]">
                    {isRoot ? (
                      <span className="text-[#52525B]">{t("detail.info.rootGroup")}</span>
                    ) : parentNode ? (
                      <Link
                        href={`/admin/catalog/categories/${parentNode.id}`}
                        className="inline-flex items-center gap-1 text-[#18181B] hover:text-emerald-800 hover:underline"
                      >
                        <span>{categoryName(parentNode, locale)}</span>
                        <ArrowUpRight size={14} className="text-[#71717A]" aria-hidden />
                      </Link>
                    ) : (
                      <span className="text-[#A1A1AA]">{t("detail.info.none")}</span>
                    )}
                  </dd>
                </div>

                {/* Số sản phẩm */}
                <div className="flex items-center justify-between border-b border-[#F4F4F5] py-3">
                  <dt className="text-sm text-[#71717A]">{t("detail.stats.products")}</dt>
                  <dd className="text-sm font-medium text-[#18181B]">
                    <span>{t("detail.stats.productUnit", { count: productCount })}</span>
                    {isRoot && children.length > 0 && (
                      <span className="ml-1.5 text-xs text-[#71717A]">
                        ({t("detail.stats.directCount", { count: node.productCount })})
                      </span>
                    )}
                  </dd>
                </div>

                {/* Số SKU hoặc Số loại con */}
                <div className="flex items-center justify-between border-b border-[#F4F4F5] py-3">
                  <dt className="text-sm text-[#71717A]">
                    {isRoot ? t("detail.stats.children") : t("detail.stats.skus")}
                  </dt>
                  <dd className="text-sm font-medium text-[#18181B]">
                    {isRoot
                      ? t("detail.stats.childUnit", { count: children.length })
                      : t("detail.stats.skuUnit", { count: skuCount })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>

        {/* Danh sách loại con trực thuộc (tách thành Card riêng biệt cho nhóm gốc) */}
        {isRoot && (
          <Card
            title={`${t("detail.sections.children")} (${children.length})`}
            subtitle={t("detail.childrenHint", { name })}
            aside={
              <button
                type="button"
                onClick={() => setEditor({ mode: "addChild" })}
                className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "h-8 px-3 text-xs")}
              >
                <Plus size={14} aria-hidden /> {t("menu.addChild")}
              </button>
            }
          >
            {children.length === 0 ? (
              <p className="py-6 text-center text-sm italic text-[#A1A1AA]">
                {t("detail.noChildren")}
              </p>
            ) : (
              <div className="divide-y divide-[#F4F4F5]">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/admin/catalog/categories/${child.id}`}
                    className="group -mx-2 flex items-center justify-between rounded-lg px-3 py-3.5 transition-colors hover:bg-[#F4F4F5]/70"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#18181B] transition-colors group-hover:text-emerald-800">
                          {categoryName(child, locale)}
                        </span>
                        {!child.isActive && <CategoryStatusBadge isActive={false} />}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                        <span className="font-mono">/{child.slug}</span>
                        <span aria-hidden="true" className="text-[#D4D4D8]">·</span>
                        <span>{t("detail.stats.productUnit", { count: child.productCount })}</span>
                        <span aria-hidden="true" className="text-[#D4D4D8]">·</span>
                        <span>{t("detail.stats.skuUnit", { count: child.skuCount })}</span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-[#A1A1AA] transition-transform group-hover:translate-x-0.5 group-hover:text-[#18181B]"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Bảng size áp dụng (đối với loại con có size) */}
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
