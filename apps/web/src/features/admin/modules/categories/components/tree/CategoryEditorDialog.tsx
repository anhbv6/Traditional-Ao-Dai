"use client";

import { useState } from "react";
import { FolderPlus, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUPS, PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminInfoTip,
  AdminLangSwitch,
  AdminTextArea,
  AdminTextField,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import { createCategoryAction, updateCategoryAction } from "../../actions/categories.actions";
import { type CategoryFormValues } from "../../schemas/categories.schemas";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { PRODUCT_GROUP_ICONS, getGroupTraitKeys, groupUsesSizeChart } from "../../utils/productGroupMeta";

const ROOT_PARENT = "__root__";
const NO_CHART = "__none__";
type ContentLang = AdminContentLang;

/** Tên trường theo ngôn ngữ — cột gốc tiếng Việt, cột `En` cho tiếng Anh */
const LANG_FIELDS = {
  vi: { name: "name", description: "description" },
  en: { name: "nameEn", description: "descriptionEn" },
} as const satisfies Record<ContentLang, Record<string, keyof CategoryFormValues>>;

function initialValues(node: AdminCategoryNode | null, parent: AdminCategoryNode | null): CategoryFormValues {
  if (node) {
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
    group: parent?.group ?? "AO_DAI",
    isActive: true,
    defaultSizeChartId: "",
    parentId: parent?.id ?? null,
  };
}

/** Nét đứt ngăn các phần trong thân dialog */
function DashedDivider() {
  return <div aria-hidden className="border-t border-dashed border-[#E4E4E7]" />;
}

interface CategoryEditorDialogProps {
  /** Loại đang sửa; `null` = tạo mới */
  node: AdminCategoryNode | null;
  /** Khi tạo loại con từ một nhóm gốc */
  parent: AdminCategoryNode | null;
  roots: AdminCategoryNode[];
  sizeCharts: SizeChartOption[];
  onOpenChange: (open: boolean) => void;
  /** Lưu xong — trả cây mới để bảng cập nhật */
  onSaved: (tree: AdminCategoryNode[]) => void;
}

/**
 * Dialog thêm / sửa loại sản phẩm: thông tin chung (tab VI/EN, slug, nhóm cha, mô tả) → nhóm hàng & bảng size
 * → hiển thị trên cửa hàng.
 */
export function CategoryEditorDialog({
  node,
  parent,
  roots,
  sizeCharts,
  onOpenChange,
  onSaved,
}: CategoryEditorDialogProps) {
  const t = useTranslations("AdminPage.categories");
  const tSizing = useTranslations("AdminPage.sizing");
  const locale = useLocale();
  const notify = useNotify();
  const [values, setValues] = useState(() => initialValues(node, parent));
  const [slugTouched, setSlugTouched] = useState(Boolean(node));
  const [contentLang, setContentLang] = useState<ContentLang>(locale === "en" ? "en" : "vi");
  const [nameError, setNameError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isNew = node === null;
  const hasChildren = (node?.children.length ?? 0) > 0;
  const effectiveSlug = slugTouched ? values.slug : toSlug(values.name);
  const usesChart = groupUsesSizeChart(values.group);
  const traits = PRODUCT_GROUP_TRAITS[values.group];
  const chartOptions = sizeCharts.filter((chart) => chart.group === values.group);
  const langFields = LANG_FIELDS[contentLang];

  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const changeGroup = (group: ProductGroup) =>
    // Bảng size thuộc nhóm cũ không áp được cho nhóm mới
    setValues((prev) => ({ ...prev, group, defaultSizeChartId: "" }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      // Tên tiếng Việt bắt buộc — chuyển về tab VI để thấy ô lỗi
      setContentLang("vi");
      setNameError(true);
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...values,
        slug: effectiveSlug,
        defaultSizeChartId: usesChart ? values.defaultSizeChartId : "",
      };
      const res = isNew
        ? await createCategoryAction(payload)
        : await updateCategoryAction({ ...payload, categoryId: node.id });
      if (!res.success) {
        notify.error(res.error, isNew ? "CATEGORY_CREATE_FAILED" : "CATEGORY_UPDATE_FAILED");
        return;
      }
      notify.success(isNew ? t("editor.created") : t("editor.updated"));
      onSaved(res.data.tree);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const parentOptions = [
    { value: ROOT_PARENT, label: t("editor.rootOption") },
    ...roots.filter((root) => root.id !== node?.id).map((root) => ({ value: root.id, label: root.name })),
  ];

  const title = isNew
    ? parent
      ? t("editor.createChildTitle", { name: parent.name })
      : t("editor.createRootTitle")
    : t("editor.editTitle", { name: node.name });

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={isNew ? FolderPlus : Pencil}
      title={title}
      description={t("editor.dialogDescription")}
      size="2xl"
      onSubmit={handleSubmit}
      bodyClassName="space-y-5"
      headerAside={
        <AdminLangSwitch
          value={contentLang}
          onChange={setContentLang}
          label={t("editor.langLabel")}
          status={{ en: values.nameEn ? undefined : "missing" }}
          className="mt-1"
        />
      }
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("editor.cancel")}
          </button>
          <button type="submit" disabled={isSaving} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {isSaving ? t("processing") : isNew ? t("editor.create") : t("editor.save")}
          </button>
        </>
      }
    >
      <div key={contentLang} role="tabpanel" className="grid gap-4 sm:grid-cols-2">
        <AdminTextField
          autoFocus
          required={contentLang === "vi"}
          className="sm:col-span-2"
          label={t("field.name")}
          value={values[langFields.name]}
          onValueChange={(value) => {
            set(langFields.name, value);
            if (contentLang === "vi") setNameError(false);
          }}
          placeholder={t(`editor.placeholders.${contentLang}.name`)}
          error={contentLang === "vi" && nameError ? t("editor.nameRequired") : undefined}
        />
        <AdminTextField
          label={t("field.slug")}
          hint={t("editor.slugHint")}
          value={effectiveSlug}
          onValueChange={(value) => {
            setSlugTouched(true);
            set("slug", toSlug(value));
          }}
          placeholder={t("editor.placeholders.slug")}
          inputClassName="font-mono"
        />
        <AdminField label={t("field.parent")} hint={hasChildren ? t("editor.parentLocked") : undefined}>
          <AdminFilterSelect
            label={t("field.parentShort")}
            value={values.parentId ?? ROOT_PARENT}
            options={hasChildren ? parentOptions.slice(0, 1) : parentOptions}
            onChange={(value) => set("parentId", value === ROOT_PARENT ? null : value)}
            className="h-10 w-full"
          />
        </AdminField>
        <AdminTextArea
          className="sm:col-span-2"
          label={t("field.description")}
          value={values[langFields.description]}
          onValueChange={(value) => set(langFields.description, value)}
          rows={2}
          placeholder={t(`editor.placeholders.${contentLang}.description`)}
        />
      </div>

      <DashedDivider />

      <div className="space-y-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
          {t("editor.groupLabel")}
          <AdminInfoTip content={t("editor.description")} />
        </span>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
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

        {/* Nhóm hàng đang chọn nghĩa là gì: mô tả + đặc tính may đo / đơn vị bán */}
        <div className="rounded-lg bg-[#FAFAFA] px-3 py-2.5 text-xs leading-relaxed text-[#3F3F46]">
          <p>{tSizing(`groupHint.${values.group}`)}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              ...getGroupTraitKeys(values.group).map((trait) => tSizing(`trait.${trait}`)),
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

        {usesChart && (
          <AdminField label={t("field.sizeChart")} hint={t("editor.chartHint")}>
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
          </AdminField>
        )}
      </div>

      <DashedDivider />

      <label className="flex cursor-pointer items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#09090B]">{t("field.isActive")}</span>
          <span className="mt-0.5 block text-2xs leading-4 text-[#A1A1AA]">{t("field.isActiveHint")}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#18181B]/25",
            values.isActive ? "bg-[#18181B]" : "bg-[#E4E4E7]"
          )}
        >
          <span
            className={cn(
              "size-4 rounded-full bg-white shadow-xs transition-transform",
              values.isActive ? "translate-x-[18px]" : "translate-x-0.5"
            )}
          />
        </span>
      </label>
    </AdminDialog>
  );
}
