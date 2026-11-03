"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, ArrowLeft, Eye, ImagePlus, Loader2, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ProductGroup } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminSecondaryButton, AdminSegmentedControl } from "@/features/admin/core/ui";
import { PRODUCT_GROUP_ICONS, groupUsesSizeChart } from "@/features/admin/modules/categories";
import { compressCollectionImage } from "@/features/admin/modules/collections";
import { uploadImageApi } from "@/features/upload";
import { saveSizeChartAction } from "../../actions/sizeCharts.actions";
import {
  type AdminSizeChartDetail,
  type SizeChartColumnValue,
  type SizeChartRowValue,
  type SurchargeType,
} from "../../types/sizeCharts.types";
import { parseNumberInput, toPreviewData } from "../../utils/sizeChartData";
import { collectGridIssues } from "../../utils/sizeChartGrid";
import { SizeChartGrid } from "./SizeChartGrid";

const SizeChartPreviewDialog = dynamic(() =>
  import("../preview/SizeChartPreviewDialog").then((m) => m.SizeChartPreviewDialog)
);

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]";
const TEXTAREA_CLASS =
  "w-full resize-y rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 text-sm leading-relaxed text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]";
const SECTION_TITLE = "text-sm font-semibold uppercase tracking-[0.5px] text-[#09090B]";
const SIZED_GROUPS: ProductGroup[] = ["AO_DAI", "PANTS", "FOOTWEAR"];

type InfoValues = Omit<AdminSizeChartDetail, "columns" | "rows" | "id" | "productCount" | "categoryNames" | "updatedAt">;
type SurchargeOption = "NONE" | SurchargeType;

function pickInfo(chart: AdminSizeChartDetail): InfoValues {
  const { columns: _columns, rows: _rows, id: _id, productCount: _p, categoryNames: _c, updatedAt: _u, ...info } = chart;
  return info;
}

/** Trình soạn bảng size mẫu: thông tin, lưới số đo, bigsize & phụ phí, hướng dẫn đo, xem trước như khách thấy */
export function SizeChartEditor({ initialChart }: { initialChart: AdminSizeChartDetail }) {
  const t = useTranslations("AdminPage.sizeCharts");
  const tSizing = useTranslations("AdminPage.sizing");
  const notify = useNotify();
  const router = useRouter();
  const [info, setInfo] = useState(() => pickInfo(initialChart));
  const [columns, setColumns] = useState<SizeChartColumnValue[]>(initialChart.columns);
  const [rows, setRows] = useState<SizeChartRowValue[]>(initialChart.rows);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify([pickInfo(initialChart), initialChart.columns, initialChart.rows])
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const issues = collectGridIssues(columns, rows);
  const isDirty = JSON.stringify([info, columns, rows]) !== savedSnapshot;
  const groupLocked = initialChart.categoryNames.length > 0;
  const GroupIcon = PRODUCT_GROUP_ICONS[info.group];
  const surchargeInvalid =
    info.surchargeType !== null &&
    (!info.surchargeValue || info.surchargeValue <= 0 || (info.surchargeType === "PERCENTAGE" && info.surchargeValue > 100));

  const set = <K extends keyof InfoValues>(key: K, value: InfoValues[K]) => setInfo((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveSizeChartAction({
        sizeChartId: initialChart.id,
        ...info,
        columns,
        rows: rows.map(({ sizeLabel, values }) => ({ sizeLabel: sizeLabel.trim(), values })),
      });
      if (!res.success) {
        notify.error(res.error, "SIZE_CHART_UPDATE_FAILED");
        return;
      }
      setSavedSnapshot(JSON.stringify([info, columns, rows]));
      notify.success(t("editor.saved"));
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleGuideImage = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const prepared = await compressCollectionImage(file);
      if (!prepared.success) {
        notify.error(prepared.error, "IMAGE_UPLOAD_FAILED");
        return;
      }
      const res = await uploadImageApi(prepared.file, "general");
      set("guideImage", res.data.url);
    } catch (error) {
      notify.error(error, "IMAGE_UPLOAD_FAILED");
    } finally {
      setIsUploading(false);
    }
  };

  const surchargeOption: SurchargeOption = info.surchargeType ?? "NONE";

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-[#E4E4E7] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/catalog/size-charts"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-[#71717A] hover:text-[#09090B]"
          >
            <ArrowLeft size={14} aria-hidden /> {t("editor.back")}
          </Link>
          <h1 className="flex min-w-0 items-center gap-2 text-xl font-semibold tracking-tight text-[#09090B] sm:text-2xl">
            <GroupIcon size={20} aria-hidden className="shrink-0 text-[#52525B]" />
            <span className="truncate">{info.name || t("editor.untitled")}</span>
          </h1>
          <p className="mt-1 text-xs text-[#71717A]">
            {t("editor.usage", { products: initialChart.productCount, categories: initialChart.categoryNames.length })}
            {initialChart.categoryNames.length > 0 && ` — ${initialChart.categoryNames.join(", ")}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isDirty && <span className="text-xs font-medium text-amber-700">{t("editor.unsaved")}</span>}
          <AdminSecondaryButton onClick={() => setPreviewOpen(true)} className="h-9">
            <Eye size={14} aria-hidden /> {t("editor.preview")}
          </AdminSecondaryButton>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty || issues.total > 0 || surchargeInvalid || !info.name.trim()}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#18181B] px-3.5 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-[#09090B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Save size={15} aria-hidden />}
            {t("editor.save")}
          </button>
        </div>
      </div>

      <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={SECTION_TITLE}>{t("editor.gridTitle")}</h2>
            <p className="mt-1 text-xs text-[#71717A]">{t("editor.gridDescription")}</p>
          </div>
          {issues.total > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
              <AlertTriangle size={13} aria-hidden /> {t("editor.issues", { count: issues.total })}
            </span>
          )}
        </div>
        <SizeChartGrid
          group={info.group}
          columns={columns}
          rows={rows}
          issues={issues}
          onColumnsChange={setColumns}
          onRowsChange={setRows}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cn(ADMIN_CARD_CLASS, "space-y-4 p-4 sm:p-5")}>
          <h2 className={SECTION_TITLE}>{t("editor.infoTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3F3F46]">{t("field.name")} *</span>
              <input value={info.name} onChange={(e) => set("name", e.target.value)} className={INPUT_CLASS} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3F3F46]">{t("field.nameEn")}</span>
              <input value={info.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={INPUT_CLASS} />
            </label>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-medium text-[#3F3F46]">{t("field.group")}</legend>
            <div className="grid grid-cols-3 gap-2">
              {SIZED_GROUPS.filter(groupUsesSizeChart).map((group) => {
                const Icon = PRODUCT_GROUP_ICONS[group];
                return (
                  <button
                    key={group}
                    type="button"
                    aria-pressed={info.group === group}
                    disabled={groupLocked && info.group !== group}
                    onClick={() => set("group", group)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      info.group === group
                        ? "border-[#18181B] bg-[#18181B] text-white"
                        : "border-[#E4E4E7] text-[#3F3F46] hover:border-[#A1A1AA]"
                    )}
                  >
                    <Icon size={15} aria-hidden /> {tSizing(`group.${group}`)}
                  </button>
                );
              })}
            </div>
            {groupLocked && <p className="text-xs text-[#71717A]">{t("editor.groupLocked")}</p>}
          </fieldset>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#3F3F46]">{t("field.description")}</span>
            <textarea
              rows={2}
              value={info.description}
              onChange={(e) => set("description", e.target.value)}
              className={TEXTAREA_CLASS}
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E4E4E7] px-3 py-3">
            <input
              type="checkbox"
              checked={info.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="mt-0.5 size-4 accent-[#18181B]"
            />
            <span>
              <span className="block text-sm font-medium text-[#09090B]">{t("field.isActive")}</span>
              <span className="mt-0.5 block text-xs text-[#71717A]">
                {rows.length === 0 ? t("field.isActiveEmpty") : t("field.isActiveHint")}
              </span>
            </span>
          </label>
        </section>

        <section className={cn(ADMIN_CARD_CLASS, "space-y-4 p-4 sm:p-5")}>
          <div>
            <h2 className={SECTION_TITLE}>{t("editor.bigsizeTitle")}</h2>
            <p className="mt-1 text-xs text-[#71717A]">{t("editor.bigsizeDescription")}</p>
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[#3F3F46]">{t("field.surchargeType")}</span>
            <AdminSegmentedControl<SurchargeOption>
              value={surchargeOption}
              onChange={(value) => {
                set("surchargeType", value === "NONE" ? null : value);
                if (value === "NONE") set("surchargeValue", null);
              }}
              options={[
                { value: "NONE", label: t("surcharge.NONE") },
                { value: "FIXED_AMOUNT", label: t("surcharge.FIXED_AMOUNT") },
                { value: "PERCENTAGE", label: t("surcharge.PERCENTAGE") },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3F3F46]">{t("field.surchargeValue")}</span>
              <span
                className={cn(
                  "flex h-10 items-center rounded-lg border bg-white pr-3 focus-within:border-[#18181B]",
                  surchargeInvalid ? "border-rose-400" : "border-[#E4E4E7]",
                  info.surchargeType === null && "bg-[#FAFAFA]"
                )}
              >
                <input
                  inputMode="numeric"
                  disabled={info.surchargeType === null}
                  value={info.surchargeValue ?? ""}
                  onChange={(e) => set("surchargeValue", parseNumberInput(e.target.value.replace(/\./g, "")))}
                  placeholder={info.surchargeType === "PERCENTAGE" ? "15" : "150000"}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none disabled:text-[#A1A1AA]"
                />
                <span className="text-xs text-[#71717A]">{info.surchargeType === "PERCENTAGE" ? "%" : "₫"}</span>
              </span>
              {surchargeInvalid && <span className="block text-xs text-rose-600">{t("editor.surchargeInvalid")}</span>}
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3F3F46]">{t("field.extraFabric")}</span>
              <span className="flex h-10 items-center rounded-lg border border-[#E4E4E7] bg-white pr-3 focus-within:border-[#18181B]">
                <input
                  inputMode="decimal"
                  value={info.extraFabric ?? ""}
                  onChange={(e) => set("extraFabric", parseNumberInput(e.target.value))}
                  placeholder="0.8"
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none"
                />
                <span className="text-xs text-[#71717A]">m</span>
              </span>
            </label>
          </div>
          <p className="rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs leading-relaxed text-[#52525B]">
            {t("editor.bigsizeColumnsHint", {
              count: columns.filter((column) => column.bigsizeFrom !== null).length,
            })}
          </p>
        </section>
      </div>

      <section className={cn(ADMIN_CARD_CLASS, "space-y-4 p-4 sm:p-5")}>
        <div>
          <h2 className={SECTION_TITLE}>{t("editor.guideTitle")}</h2>
          <p className="mt-1 text-xs text-[#71717A]">{t("editor.guideDescription")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_220px]">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#3F3F46]">{t("field.measurementGuide")}</span>
            <textarea
              rows={7}
              value={info.measurementGuide}
              onChange={(e) => set("measurementGuide", e.target.value)}
              placeholder={t("editor.guidePlaceholder")}
              className={TEXTAREA_CLASS}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#3F3F46]">{t("field.measurementGuideEn")}</span>
            <textarea
              rows={7}
              value={info.measurementGuideEn}
              onChange={(e) => set("measurementGuideEn", e.target.value)}
              className={TEXTAREA_CLASS}
            />
          </label>
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[#3F3F46]">{t("field.guideImage")}</span>
            {info.guideImage ? (
              <div className="relative overflow-hidden rounded-lg border border-[#E4E4E7]">
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tải lên Cloudinary, chưa khai báo remotePatterns */}
                <img src={info.guideImage} alt={t("field.guideImage")} className="aspect-[3/4] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => set("guideImage", "")}
                  aria-label={t("editor.removeImage")}
                  className="absolute right-2 top-2 grid size-7 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs hover:text-rose-600"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            ) : (
              <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4D4D8] text-xs text-[#71717A] transition-colors hover:border-[#18181B] hover:text-[#09090B]">
                {isUploading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <ImagePlus size={18} aria-hidden />}
                {t("editor.uploadImage")}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(e) => {
                    void handleGuideImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </section>

      {previewOpen && (
        <SizeChartPreviewDialog
          chart={toPreviewData({ ...info, columns, rows })}
          onOpenChange={(open) => !open && setPreviewOpen(false)}
        />
      )}
    </>
  );
}
