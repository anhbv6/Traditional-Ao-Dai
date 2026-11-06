"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilePenLine, Library, Pencil, WandSparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminInfoTip,
  AdminTextArea,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import { createStarterGrid } from "@/features/admin/modules/size-charts";
import {
  createCategoryAction,
  getCategorySizeChartAction,
  updateCategoryAction,
} from "../../actions/categories.actions";
import { type CategoryFormValues, type SizeChartMode } from "../../schemas/categories.schemas";
import { type AdminCategoryNode, type SizeChartOption } from "../../types/categories.types";
import { PRODUCT_GROUP_ICONS, getGroupTraitKeys, groupUsesSizeChart } from "../../utils/productGroupMeta";
import { compactSlug } from "../../utils/categorySlug";
import { categoryName } from "../../utils/categoryName";
import {
  CategorySizeChartDialog,
  isSizeChartGridComplete,
  type CategorySizeChartGrid,
} from "./CategorySizeChartDialog";

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
    // Loại con luôn thừa hưởng nhóm hàng của nhóm gốc (server cũng ép lại)
    group: parent?.group ?? "AO_DAI",
    isActive: true,
    defaultSizeChartId: "",
    parentId: parent?.id ?? null,
  };
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
 * Dialog thêm / sửa loại sản phẩm: thông tin chung (tên, slug, nhóm gốc, mô tả) → khung bảng size (tiêu đề là tên nhóm
 * gốc) → hiển thị. Nhóm gốc cố định theo nhóm hàng (Áo dài, Quần, Phụ kiện, Giày guốc, Nguyên liệu) và KHÔNG có bảng
 * size: chỉ sửa tên / mô tả / hiển thị, kèm số loại con và sản phẩm. Loại sản phẩm luôn thuộc một nhóm gốc và thừa hưởng
 * nhóm hàng của gốc. Bảng size (thêm và sửa như nhau): nhập bảng riêng hoặc dùng bảng size mẫu — khi sửa, bảng đang gắn
 * chỉ thuộc riêng loại này thì mở sẵn ở "Nhập bảng size riêng" với số liệu cũ.
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
  // Thêm loại từ nút chung (chưa có nhóm gốc sẵn) phải chủ động chọn "Thuộc nhóm"
  const [parentChosen, setParentChosen] = useState(node !== null || parent !== null);
  const [parentError, setParentError] = useState(false);
  // Thêm mới mặc định nhập bảng riêng; sửa thì theo bảng đang gắn (null = chưa chọn, xem `sizeChartMode` bên dưới)
  const [modeChoice, setModeChoice] = useState<SizeChartMode | null>(node === null ? "custom" : null);
  // Bảng size riêng nhập ngay trong dialog con — chỉ lưu cùng loại sản phẩm khi bấm "Thêm loại"
  const [grid, setGrid] = useState<CategorySizeChartGrid | null>(null);
  const [gridOpen, setGridOpen] = useState(false);
  const [gridError, setGridError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isNew = node === null;
  // Đang sửa một nhóm gốc (cố định) — chỉ tên, mô tả, hiển thị; không có nhóm cha, không có bảng size
  const isRoot = node !== null && node.parentId === null;
  const effectiveSlug = slugTouched ? values.slug : toSlug(values.name);
  const usesChart = !isRoot && groupUsesSizeChart(values.group);
  const traits = PRODUCT_GROUP_TRAITS[values.group];
  const chartOptions = sizeCharts.filter((chart) => chart.group === values.group);
  const langFields = LANG_FIELDS[contentLang];

  // Sửa loại sản phẩm đang gắn bảng size: nạp lưới để sửa ngay trong "Nhập bảng size riêng"
  const currentChartQuery = useQuery({
    queryKey: ["admin", "category-size-chart", node?.id],
    queryFn: async () => {
      if (!node) return null;
      const res = await getCategorySizeChartAction(node.id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !isNew && !isRoot && Boolean(node?.defaultSizeChartId),
    staleTime: 0,
  });
  // Chuyển sang nhóm gốc khác nhóm hàng thì bảng cũ không dùng được nữa
  const currentChart = node && values.group === node.group ? (currentChartQuery.data ?? null) : null;
  const sizeChartMode: SizeChartMode = modeChoice ?? (currentChart?.exclusive ? "custom" : "preset");
  const customChart = usesChart && sizeChartMode === "custom";
  // Lưới đang thấy: lưới vừa nhập, hoặc lưới của bảng riêng đang gắn (lưu mà không sửa thì giữ nguyên bảng)
  const shownGrid = grid ?? (currentChart?.exclusive ? currentChart.grid : null);

  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const changeParent = (value: string) => {
    const root = roots.find((item) => item.id === value);
    if (!root) return;
    setParentChosen(true);
    setParentError(false);
    // Bảng size đã nhập thuộc nhóm hàng cũ (cột số đo khác) → bỏ khi đổi sang gốc khác nhóm hàng
    if (root.group !== values.group) setGrid(null);
    // Loại sản phẩm thừa hưởng nhóm hàng của nhóm gốc; đổi nhóm hàng thì bỏ bảng size của nhóm cũ
    setValues((prev) => ({
      ...prev,
      parentId: root.id,
      group: root.group,
      defaultSizeChartId: prev.group === root.group ? prev.defaultSizeChartId : "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missingName = !values.name.trim();
    const missingGrid = customChart && !isSizeChartGridComplete(shownGrid);
    if (missingName || !parentChosen || missingGrid) {
      if (missingName) {
        // Tên tiếng Việt bắt buộc — chuyển về tab VI để thấy ô lỗi
        setContentLang("vi");
        setNameError(true);
      }
      setParentError(!parentChosen);
      setGridError(missingGrid);
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...values,
        slug: effectiveSlug,
        defaultSizeChartId: usesChart && !customChart ? values.defaultSizeChartId : "",
        sizeChartMode: customChart ? ("custom" as const) : ("preset" as const),
        // Chỉ gửi lưới khi vừa nhập / sửa — sửa loại mà không mở lưới thì server giữ nguyên bảng riêng đang gắn
        sizeChart:
          customChart && grid
            ? {
                columns: grid.columns,
                rows: grid.rows.map((row) => ({ sizeLabel: row.sizeLabel.trim(), values: row.values })),
              }
            : null,
      };
      if (isNew) {
        if (!payload.parentId) return;
        const res = await createCategoryAction({ ...payload, parentId: payload.parentId });
        if (!res.success) {
          notify.error(res.error, "CATEGORY_CREATE_FAILED");
          return;
        }
        notify.success(res.data.sizeChartId ? t("editor.createdWithChart") : t("editor.created"));
        onSaved(res.data.tree);
        onOpenChange(false);
        return;
      }
      const res = await updateCategoryAction({ ...payload, categoryId: node.id });
      if (res.success) setGrid(null);
      if (!res.success) {
        notify.error(res.error, "CATEGORY_UPDATE_FAILED");
        return;
      }
      notify.success(t("editor.updated"));
      onSaved(res.data.tree);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const parentOptions = roots.map((root) => ({ value: root.id, label: categoryName(root, locale) }));
  const chosenParent = roots.find((root) => root.id === values.parentId);
  const GroupIcon = PRODUCT_GROUP_ICONS[values.group];
  const title = isRoot
    ? t("editor.editRootTitle", { name: categoryName(node, locale) })
    : !isNew
      ? t("editor.editTitle", { name: categoryName(node, locale) })
      : chosenParent
        ? t("editor.createChildTitle", { name: categoryName(chosenParent, locale) })
        : t("editor.createTitle");

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      // icon={isNew ? FolderPlus : Pencil}
      title={title}
      description={t(isRoot ? "editor.rootDescription" : "editor.dialogDescription")}
      size="2xl"
      onSubmit={handleSubmit}
      bodyClassName="space-y-5"
      // headerAside={
      //   <AdminLangSwitch
      //     value={contentLang}
      //     onChange={setContentLang}
      //     label={t("editor.langLabel")}
      //     status={{ en: values.nameEn ? undefined : "missing" }}
      //     className="mt-1"
      //   />
      // }
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("editor.cancel")}
          </button>
          <button type="submit" disabled={isSaving} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {isSaving ? t("processing") : !isNew ? t("editor.save") : t("editor.create")}
          </button>
        </>
      }
    >
      <div key={contentLang} role="tabpanel" className="grid gap-4 sm:grid-cols-2">
        {/* Tên nhóm gốc cố định hai ngôn ngữ (PRODUCT_GROUP_NAMES) — chỉ hiện ở tiêu đề, không sửa */}
        {!isRoot && (
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
        )}
        {!isRoot && (
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
            suffix={
              <AdminTooltip content={t("editor.slugGenerate")}>
                <button
                  type="button"
                  aria-label={t("editor.slugGenerate")}
                  disabled={!values.name.trim()}
                  onClick={() => {
                    setSlugTouched(true);
                    set("slug", compactSlug(values.name));
                  }}
                  className="-mr-1.5 grid size-7 cursor-pointer place-items-center rounded-md text-[#09090B] outline-none transition-colors hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5] disabled:cursor-not-allowed disabled:text-[#D4D4D8] disabled:hover:bg-transparent"
                >
                  <WandSparkles size={15} aria-hidden />
                </button>
              </AdminTooltip>
            }
          />
        )}
        {!isRoot && (
          <AdminField
            required
            label={t("field.parent")}
            hint={t("editor.parentHint")}
            error={parentError ? t("editor.parentRequired") : undefined}
          >
            <AdminFilterSelect
              label={t("field.parentShort")}
              value={parentChosen ? (values.parentId ?? "") : ""}
              options={parentOptions}
              onChange={changeParent}
              placeholder={t("editor.parentPlaceholder")}
              invalid={parentError}
              className="h-10 w-full"
            />
          </AdminField>
        )}
        <AdminTextArea
          autoFocus={isRoot}
          className="sm:col-span-2"
          label={t("field.description")}
          value={values[langFields.description]}
          onValueChange={(value) => set(langFields.description, value)}
          rows={2}
          placeholder={t(`editor.placeholders.${contentLang}.description`)}
        />
      </div>

      {/* Nhóm gốc: không có bảng size — chỉ số lượng tổng */}
      {isRoot && (
        <p className="flex items-center gap-2.5 rounded-xl bg-[#FAFAFA] px-3 py-2.5 text-sm text-[#3F3F46]">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[#09090B] shadow-2xs">
            <GroupIcon size={16} aria-hidden />
          </span>
          <span className="tabular-nums">
            {t("row.children", { count: node.children.length })}
            {" · "}
            {t("row.products", {
              count: node.productCount + node.children.reduce((sum, child) => sum + child.productCount, 0),
            })}
          </span>
        </p>
      )}

      {/* Loại sản phẩm: khung bảng size, tiêu đề là tên nhóm gốc (nhóm hàng + đặc tính gom vào ⓘ). Chưa chọn nhóm thì ẩn */}
      {!isRoot && parentChosen && (
        <fieldset className="space-y-3 rounded-xl border border-[#E4E4E7] px-4 pb-4 pt-2">
          <legend className="flex items-center gap-1.5 px-1.5 text-sm font-semibold text-[#09090B]">
            <GroupIcon size={15} aria-hidden />
            {chosenParent ? categoryName(chosenParent, locale) : tSizing(`group.${values.group}`)}
            <AdminInfoTip
              content={
                <>
                  <span className="block font-medium">
                    {t("editor.groupInherited", { name: tSizing(`group.${values.group}`) })}
                  </span>
                  <span className="mt-1 block">{tSizing(`groupHint.${values.group}`)}</span>
                  <span className="mt-1 block text-white/70">
                    {[
                      ...getGroupTraitKeys(values.group).map((trait) => tSizing(`trait.${trait}`)),
                      tSizing(`sellUnit.${traits.sellUnit}`),
                    ].join(" · ")}
                  </span>
                </>
              }
            />
          </legend>

          {!usesChart ? (
            <p className="text-xs text-[#71717A]">{t("editor.noSizeChart")}</p>
          ) : (
            // Thêm và sửa như nhau: nhập bảng size riêng (nên dùng) hoặc dùng bảng size mẫu
            <div role="radiogroup" aria-label={t("field.sizeChart")} className="space-y-2">
              <span className="block text-sm font-medium text-[#3F3F46]">{t("field.sizeChart")}</span>
              <SizeModeOption
                selected={sizeChartMode === "custom"}
                onSelect={() => {
                  setModeChoice("custom");
                  if (!isSizeChartGridComplete(shownGrid)) setGridOpen(true);
                }}
                icon={FilePenLine}
                title={t("editor.sizeMode.custom.title")}
                description={t("editor.sizeMode.custom.description")}
                badge={t("editor.sizeMode.recommended")}
                invalid={gridError && !isSizeChartGridComplete(shownGrid)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs",
                      isSizeChartGridComplete(shownGrid)
                        ? "text-[#3F3F46]"
                        : gridError
                          ? "text-rose-600"
                          : "text-[#71717A]"
                    )}
                  >
                    {isSizeChartGridComplete(shownGrid)
                      ? t("editor.sizeMode.custom.summary", {
                          sizes: shownGrid.rows.map((row) => row.sizeLabel.trim()).join(" · "),
                          columns: shownGrid.columns.length,
                        })
                      : gridError
                        ? t("editor.sizeMode.custom.required")
                        : t("editor.sizeMode.custom.empty")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGridOpen(true)}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm font-medium text-[#09090B] transition-colors hover:bg-[#FAFAFA]"
                  >
                    <Pencil size={14} aria-hidden />
                    {shownGrid ? t("editor.sizeMode.custom.edit") : t("editor.sizeMode.custom.enter")}
                  </button>
                </div>
              </SizeModeOption>
              <SizeModeOption
                selected={sizeChartMode === "preset"}
                onSelect={() => {
                  setModeChoice("preset");
                  // Bảng đang gắn là bảng riêng → bỏ chọn, để admin chủ động chọn bảng mẫu
                  if (currentChart?.exclusive && values.defaultSizeChartId === currentChart.id) {
                    set("defaultSizeChartId", "");
                  }
                }}
                icon={Library}
                title={t("editor.sizeMode.preset.title")}
                description={t("editor.sizeMode.preset.description")}
                secondary
              >
                <AdminFilterSelect
                  label={t("field.sizeChartShort")}
                  value={values.defaultSizeChartId || NO_CHART}
                  options={chartSelectOptions(t, chartOptions)}
                  onChange={(value) => set("defaultSizeChartId", value === NO_CHART ? "" : value)}
                  className="h-10 w-full"
                />
              </SizeModeOption>
            </div>
          )}
        </fieldset>
      )}

      {gridOpen && (
        <CategorySizeChartDialog
          group={values.group}
          typeName={values.name}
          // Bảng mẫu dùng chung đang gắn làm điểm khởi đầu — lưu sẽ tạo bảng riêng mới, không đổi bảng mẫu
          initial={shownGrid ?? currentChart?.grid ?? createStarterGrid(values.group)}
          onCancel={() => setGridOpen(false)}
          onDone={(next) => {
            setGrid(next);
            setGridError(false);
            setGridOpen(false);
          }}
        />
      )}

      {/* <DashedDivider /> */}

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

type Translate = ReturnType<typeof useTranslations>;

/** Lựa chọn bảng size mẫu: "chưa gắn" + các bảng size cùng nhóm hàng (nhóm gốc không có bảng size để thừa hưởng) */
function chartSelectOptions(t: Translate, charts: SizeChartOption[]) {
  return [
    { value: NO_CHART, label: t("editor.chartNone") },
    ...charts.map((chart) => ({
      value: chart.id,
      label: chart.isActive ? chart.name : `${chart.name} (${t("editor.chartInactive")})`,
    })),
  ];
}

interface SizeModeOptionProps {
  selected: boolean;
  onSelect: () => void;
  icon: typeof FilePenLine;
  title: string;
  description: string;
  badge?: string;
  /** Lựa chọn phụ: thẻ nhạt hơn, chữ nhỏ hơn */
  secondary?: boolean;
  /** Nội dung thêm khi đang chọn (VD ô chọn bảng size mẫu) */
  children?: React.ReactNode;
  /** Viền đỏ khi lựa chọn này bắt buộc nhập mà chưa nhập */
  invalid?: boolean;
}

/** Thẻ chọn cách gắn bảng size (radio) — lựa chọn chính nổi hơn, lựa chọn phụ nhạt hơn */
function SizeModeOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
  badge,
  secondary,
  children,
  invalid,
}: SizeModeOptionProps) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        invalid ? "border-rose-400" : selected ? "border-[#18181B]" : "border-[#E4E4E7] hover:border-[#A1A1AA]",
        secondary && !selected && "bg-[#FAFAFA]"
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={cn(
          "flex w-full cursor-pointer items-start gap-3 text-left outline-none",
          secondary ? "px-3 py-2.5" : "px-3 py-3"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
            selected ? "border-[#18181B]" : "border-[#D4D4D8]"
          )}
        >
          {selected && <span className="size-2 rounded-full bg-[#18181B]" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <Icon size={15} aria-hidden className={secondary ? "text-[#71717A]" : "text-[#09090B]"} />
            <span className={cn("font-semibold", secondary ? "text-sm text-[#3F3F46]" : "text-body text-[#09090B]")}>
              {title}
            </span>
            {badge && (
              <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 text-2xs font-medium text-[#3F3F46]">{badge}</span>
            )}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-[#71717A]">{description}</span>
        </span>
      </button>
      {selected && children && <div className="px-3 pb-3 pl-10">{children}</div>}
    </div>
  );
}
