"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRODUCT_GROUPS, PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { AdminFilterSelect } from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import { createCategoryAction, updateCategoryAction } from "../../actions/categories.actions";
import { type CategoryFormValues } from "../../schemas/categories.schemas";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { PRODUCT_GROUP_ICONS, getGroupTraitKeys, groupUsesSizeChart } from "../../utils/productGroupMeta";

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B] disabled:bg-[#FAFAFA] disabled:text-[#71717A]";
const TEXTAREA_CLASS =
  "min-h-20 w-full resize-y rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]";
const ROOT_PARENT = "__root__";
const NO_CHART = "__none__";

export type CategoryEditorTarget =
  | { mode: "create"; parent: AdminCategoryNode | null }
  | { mode: "edit"; node: AdminCategoryNode };

function initialValues(target: CategoryEditorTarget): CategoryFormValues {
  if (target.mode === "edit") {
    const { node } = target;
    return {
      name: node.name,
      nameEn: node.nameEn ?? "",
      slug: node.slug,
      description: node.description ?? "",
      descriptionEn: node.descriptionEn ?? "",
      group: node.group,
      isActive: node.isActive,
      defaultSizeChartId: node.defaultSizeChartId ?? "",
      parentId: node.parentId,
    };
  }
  return {
    name: "",
    nameEn: "",
    slug: "",
    description: "",
    descriptionEn: "",
    // Loại con mặc định cùng nhóm hàng với cha (đổi được — VD guốc mộc nằm trong Phụ kiện nhưng bán theo cỡ chân)
    group: target.parent?.group ?? "AO_DAI",
    isActive: true,
    defaultSizeChartId: "",
    parentId: target.parent?.id ?? null,
  };
}

/** Hộp thoại thêm/sửa loại sản phẩm: nhóm hàng quyết định cách may đo, đơn vị bán và bảng size được gắn */
export function CategoryEditorDialog({
  target,
  roots,
  sizeCharts,
  onOpenChange,
  onSaved,
}: {
  target: CategoryEditorTarget;
  roots: AdminCategoryNode[];
  sizeCharts: SizeChartOption[];
  onOpenChange: (open: boolean) => void;
  onSaved: (tree: AdminCategoryNode[]) => void;
}) {
  const t = useTranslations("AdminPage.categories");
  const tSizing = useTranslations("AdminPage.sizing");
  const notify = useNotify();
  const [values, setValues] = useState(() => initialValues(target));
  const [slugTouched, setSlugTouched] = useState(target.mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editingNode = target.mode === "edit" ? target.node : null;
  const hasChildren = (editingNode?.children.length ?? 0) > 0;
  const effectiveSlug = slugTouched ? values.slug : toSlug(values.name);
  const chartOptions = sizeCharts.filter((chart) => chart.group === values.group);
  const usesChart = groupUsesSizeChart(values.group);
  const traits = PRODUCT_GROUP_TRAITS[values.group];

  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const changeGroup = (group: ProductGroup) =>
    // Bảng size thuộc nhóm cũ không áp được cho nhóm mới
    setValues((prev) => ({ ...prev, group, defaultSizeChartId: "" }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...values, slug: effectiveSlug, defaultSizeChartId: usesChart ? values.defaultSizeChartId : "" };
      const res = editingNode
        ? await updateCategoryAction({ ...payload, categoryId: editingNode.id })
        : await createCategoryAction(payload);
      if (!res.success) {
        notify.error(res.error, editingNode ? "CATEGORY_UPDATE_FAILED" : "CATEGORY_CREATE_FAILED");
        return;
      }
      notify.success(editingNode ? t("editor.updated") : t("editor.created"));
      onSaved(res.data.tree);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parentOptions = [
    { value: ROOT_PARENT, label: t("editor.rootOption") },
    ...roots.filter((root) => root.id !== editingNode?.id).map((root) => ({ value: root.id, label: root.name })),
  ];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell max-h-[92dvh] gap-0 overflow-hidden rounded-xl border border-[#E4E4E7] bg-white p-0 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex max-h-[92dvh] flex-col">
          <div className="border-b border-[#E4E4E7] px-5 py-4 pr-12">
            <DialogTitle className="text-base font-semibold text-[#09090B]">
              {editingNode
                ? t("editor.editTitle", { name: editingNode.name })
                : target.mode === "create" && target.parent
                  ? t("editor.createChildTitle", { name: target.parent.name })
                  : t("editor.createRootTitle")}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-[#71717A]">{t("editor.description")}</DialogDescription>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[#3F3F46]">{t("field.group")} *</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {PRODUCT_GROUPS.map((group) => {
                  const Icon = PRODUCT_GROUP_ICONS[group];
                  const selected = values.group === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => changeGroup(group)}
                      className={cn(
                        "flex cursor-pointer flex-col items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-[#18181B] bg-[#18181B] text-white"
                          : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#A1A1AA]"
                      )}
                    >
                      <Icon size={16} aria-hidden />
                      <span className="text-xs font-semibold leading-tight">{tSizing(`group.${group}`)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 text-xs leading-relaxed text-[#3F3F46]">
                <Info size={14} aria-hidden className="mt-0.5 shrink-0 text-[#71717A]" />
                <div>
                  <p>{tSizing(`groupHint.${values.group}`)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {getGroupTraitKeys(values.group).map((trait) => (
                      <span key={trait} className="rounded border border-[#E4E4E7] bg-white px-1.5 py-px text-[11px] text-[#52525B]">
                        {tSizing(`trait.${trait}`)}
                      </span>
                    ))}
                    <span className="rounded border border-[#E4E4E7] bg-white px-1.5 py-px text-[11px] text-[#52525B]">
                      {tSizing(`sellUnit.${traits.sellUnit}`)}
                    </span>
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#3F3F46]">{t("field.name")} *</span>
                <input
                  autoFocus
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t("field.namePlaceholder")}
                  className={INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#3F3F46]">{t("field.nameEn")}</span>
                <input value={values.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={INPUT_CLASS} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#3F3F46]">{t("field.slug")}</span>
                <input
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", toSlug(e.target.value));
                  }}
                  className={cn(INPUT_CLASS, "font-mono text-[13px]")}
                />
              </label>
              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#3F3F46]">{t("field.parent")}</span>
                {hasChildren ? (
                  <p className="flex h-10 items-center rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 text-xs text-[#71717A]">
                    {t("editor.parentLocked")}
                  </p>
                ) : (
                  <AdminFilterSelect
                    label={t("field.parentShort")}
                    value={values.parentId ?? ROOT_PARENT}
                    options={parentOptions}
                    onChange={(value) => set("parentId", value === ROOT_PARENT ? null : value)}
                    className="h-10 w-full"
                  />
                )}
              </div>
            </div>

            {usesChart && (
              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#3F3F46]">{t("field.sizeChart")}</span>
                <AdminFilterSelect
                  label={t("field.sizeChartShort")}
                  value={values.defaultSizeChartId || NO_CHART}
                  options={[
                    { value: NO_CHART, label: values.parentId ? t("editor.chartInherit") : t("editor.chartNone") },
                    ...chartOptions.map((chart) => ({
                      value: chart.id,
                      label: chart.isActive ? chart.name : `${chart.name} (${t("editor.chartInactive")})`,
                    })),
                  ]}
                  onChange={(value) => set("defaultSizeChartId", value === NO_CHART ? "" : value)}
                  className="h-10 w-full"
                />
                <p className="text-xs text-[#71717A]">{t("editor.chartHint")}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#3F3F46]">{t("field.description")}</span>
                <textarea
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={TEXTAREA_CLASS}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#3F3F46]">{t("field.descriptionEn")}</span>
                <textarea
                  value={values.descriptionEn}
                  onChange={(e) => set("descriptionEn", e.target.value)}
                  className={TEXTAREA_CLASS}
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E4E4E7] px-3 py-3">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="mt-0.5 size-4 accent-[#18181B]"
              />
              <span>
                <span className="block text-sm font-medium text-[#09090B]">{t("field.isActive")}</span>
                <span className="mt-0.5 block text-xs text-[#71717A]">{t("field.isActiveHint")}</span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E4E4E7] px-5 py-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 cursor-pointer rounded-lg px-3.5 text-sm font-medium text-[#52525B] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !values.name.trim()}
              className="h-9 cursor-pointer rounded-lg bg-[#18181B] px-4 text-sm font-medium text-white transition-colors hover:bg-[#09090B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("processing") : editingNode ? t("editor.save") : t("editor.create")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
