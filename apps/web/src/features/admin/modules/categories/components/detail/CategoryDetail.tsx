"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
} from "@/features/admin/core/ui";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import {
  PRODUCT_GROUP_COLORS,
  PRODUCT_GROUP_ICONS,
  getGroupTraitKeys,
  groupUsesSizeChart,
} from "../../utils/productGroupMeta";
import { CategoryStatusBadge } from "../shared/CategoryStatusBadge";

// Dialog chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const CategoryEditorDialog = dynamic(() =>
  import("../tree/CategoryEditorDialog").then((m) => m.CategoryEditorDialog)
);
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

/** Một dòng thông tin: nhãn trái, giá trị phải (xuống dòng ở màn nhỏ) */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs text-[#71717A]">{label}</dt>
      <dd className="min-w-0 text-sm text-[#09090B]">{children}</dd>
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
}

/**
 * Màn chi tiết loại sản phẩm (chỉ xem): trái là thông tin chung + nhóm hàng & bảng size, phải là thẻ Tổng quan
 * (trạng thái, số liệu, loại con / nhóm cha). Sửa và thêm loại con mở CategoryEditorDialog.
 */
export function CategoryDetail({ node, roots, sizeCharts }: CategoryDetailProps) {
  const t = useTranslations("AdminPage.categories");
  const tSizing = useTranslations("AdminPage.sizing");
  const router = useRouter();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isRoot = node.parentId === null;
  const parentNode = roots.find((root) => root.id === node.parentId) ?? null;
  // Cùng sắc với khối trong danh sách: loại con lấy màu nhóm hàng của nhóm gốc
  const blockGroup = parentNode?.group ?? node.group;
  const treeColor = PRODUCT_GROUP_COLORS[blockGroup];
  const BlockIcon = PRODUCT_GROUP_ICONS[blockGroup];
  const groupColor = PRODUCT_GROUP_COLORS[node.group];
  const GroupIcon = PRODUCT_GROUP_ICONS[node.group];

  // Số liệu của nhóm gốc tính cả loại con
  const children = node.children;
  const productCount = node.productCount + children.reduce((sum, child) => sum + child.productCount, 0);
  const skuCount = node.skuCount + children.reduce((sum, child) => sum + child.skuCount, 0);
  const canDelete = children.length === 0 && node.productCount === 0;

  // Bảng size: của riêng loại này, hoặc thừa hưởng nhóm gốc khi cùng nhóm hàng (cùng quy tắc với bảng danh sách)
  const chartMap = new Map(sizeCharts.map((chart) => [chart.id, chart]));
  const chart = node.defaultSizeChartId ? chartMap.get(node.defaultSizeChartId) : undefined;
  const inherited =
    !chart && parentNode?.defaultSizeChartId && parentNode.group === node.group
      ? chartMap.get(parentNode.defaultSizeChartId)
      : undefined;
  const traits = PRODUCT_GROUP_TRAITS[node.group];

  const chartLink = (target: SizeChartOption) => (
    <Link href={`/admin/catalog/size-charts/${target.id}`} className="font-medium hover:underline">
      {target.name}
    </Link>
  );

  return (
    <div className="space-y-5">
      <AdminDetailHeader
        backHref="/admin/catalog/categories"
        backLabel={t("detail.back")}
        title={node.name}
        badge={<CategoryStatusBadge isActive={node.isActive} />}
        subtitle={
          <>
            {isRoot ? (
              <span className="mr-2">{t("detail.childCount", { count: children.length })} ·</span>
            ) : (
              parentNode && (
                <span className="mr-2">
                  {t("detail.childOf")}{" "}
                  <Link
                    href={`/admin/catalog/categories/${parentNode.id}`}
                    className="font-medium text-[#3F3F46] hover:underline"
                  >
                    {parentNode.name}
                  </Link>{" "}
                  ·
                </span>
              )
            )}
            <span className="font-mono">/{node.slug}</span>
          </>
        }
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
          <Card title={t("detail.sections.general")}>
            <dl className="-my-2.5 divide-y divide-dashed divide-[#E4E4E7]">
              <InfoRow label={t("detail.info.nameVi")}>
                <span className="font-medium">{node.name}</span>
              </InfoRow>
              <InfoRow label={t("detail.info.nameEn")}>
                {node.nameEn || <Empty>{t("detail.info.noEnglish")}</Empty>}
              </InfoRow>
              <InfoRow label={t("field.slug")}>
                <span className="font-mono text-xs">/{node.slug}</span>
              </InfoRow>
              <InfoRow label={t("field.parent")}>
                {parentNode ? (
                  <Link href={`/admin/catalog/categories/${parentNode.id}`} className="font-medium hover:underline">
                    {parentNode.name}
                  </Link>
                ) : (
                  t("detail.info.isRoot")
                )}
              </InfoRow>
              <InfoRow label={t("detail.info.descriptionVi")}>
                {node.description ? (
                  <span className="whitespace-pre-line leading-relaxed">{node.description}</span>
                ) : (
                  <Empty>{t("detail.info.none")}</Empty>
                )}
              </InfoRow>
              <InfoRow label={t("detail.info.descriptionEn")}>
                {node.descriptionEn ? (
                  <span className="whitespace-pre-line leading-relaxed">{node.descriptionEn}</span>
                ) : (
                  <Empty>{t("detail.info.none")}</Empty>
                )}
              </InfoRow>
            </dl>
          </Card>

          <Card title={t("detail.sections.group")}>
            <div className="flex items-start gap-3">
              <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-lg", groupColor.tile)}>
                <GroupIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#09090B]">{tSizing(`group.${node.group}`)}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#71717A]">{tSizing(`groupHint.${node.group}`)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    ...getGroupTraitKeys(node.group).map((trait) => tSizing(`trait.${trait}`)),
                    tSizing(`sellUnit.${traits.sellUnit}`),
                  ].map((label) => (
                    <span
                      key={label}
                      className="rounded border border-[#E4E4E7] bg-white px-1.5 py-px text-2xs text-[#52525B]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {groupUsesSizeChart(node.group) && (
              <>
                <DashedDivider />
                <dl>
                  <InfoRow label={t("field.sizeChart")}>
                    {chart ? (
                      <>
                        {chartLink(chart)}
                        {!chart.isActive && <Empty> ({t("editor.chartInactive")})</Empty>}
                      </>
                    ) : inherited ? (
                      <>
                        {chartLink(inherited)} <Empty>· {t("inheritChart")}</Empty>
                      </>
                    ) : (
                      <span className="text-amber-700">{t("noChart")}</span>
                    )}
                  </InfoRow>
                </dl>
              </>
            )}
          </Card>
        </div>

        <aside className="lg:sticky lg:top-[8rem]">
          <Card title={t("detail.sections.overview")}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#71717A]">{t("field.isActive")}</span>
              <CategoryStatusBadge isActive={node.isActive} />
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
                          <span className="min-w-0 flex-1 truncate">{child.name}</span>
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
                  <span className="min-w-0 flex-1 truncate font-medium">{parentNode.name}</span>
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
