"use client";

import { useState, type FormEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUPS, type ProductGroup } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminLangSwitch,
  AdminSwitch,
  AdminTextArea,
  AdminTextField,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { groupUsesSizeChart } from "@/features/admin/modules/categories";
import { compressCollectionImage } from "@/features/admin/modules/collections";
import { uploadImageApi } from "@/features/upload";
import { createSizeChartAction, updateSizeChartInfoAction } from "../../actions/sizeCharts.actions";
import { type AdminSizeChartDetail, type SurchargeType } from "../../types/sizeCharts.types";
import { parseNumberInput } from "../../utils/sizeChartData";

// Phụ kiện, vải bán theo mét không có size nên không có bảng size
const SIZED_GROUPS = PRODUCT_GROUPS.filter(groupUsesSizeChart);

type SurchargeOption = "NONE" | SurchargeType;

interface InfoValues {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  measurementGuide: string;
  measurementGuideEn: string;
  guideImage: string;
  group: ProductGroup;
  surchargeType: SurchargeType | null;
  surchargeValue: number | null;
  extraFabric: number | null;
  isActive: boolean;
}

/** Trường đổi theo ngôn ngữ nội dung — cột gốc tiếng Việt, cột `En` cho tiếng Anh */
const LANG_FIELDS = {
  vi: { name: "name", description: "description", guide: "measurementGuide" },
  en: { name: "nameEn", description: "descriptionEn", guide: "measurementGuideEn" },
} as const satisfies Record<AdminContentLang, Record<string, keyof InfoValues>>;

function initialValues(chart: AdminSizeChartDetail | null): InfoValues {
  return {
    name: chart?.name ?? "",
    nameEn: chart?.nameEn ?? "",
    description: chart?.description ?? "",
    descriptionEn: chart?.descriptionEn ?? "",
    measurementGuide: chart?.measurementGuide ?? "",
    measurementGuideEn: chart?.measurementGuideEn ?? "",
    guideImage: chart?.guideImage ?? "",
    group: chart?.group ?? "AO_DAI",
    surchargeType: chart?.surchargeType ?? null,
    surchargeValue: chart?.surchargeValue ?? null,
    extraFabric: chart?.extraFabric ?? null,
    isActive: chart?.isActive ?? false,
  };
}

interface SizeChartInfoDialogProps {
  /** Bảng đang sửa; `null` = tạo mới (tạo xong chuyển sang màn chi tiết để nhập số đo) */
  chart: AdminSizeChartDetail | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog thêm / sửa THÔNG TIN bảng size mẫu — các hàng phẳng 2 cột: tên + VI/EN, kiểu phụ phí + nhóm hàng (select),
 * mức phụ phí + vải cộng thêm, ghi chú, hướng dẫn đo + ảnh; nội dung chữ chuyển VI / EN như bộ sưu tập. Lưới số đo nhập ở dialog riêng trên màn chi tiết.
 */
export function SizeChartInfoDialog({ chart, onOpenChange }: SizeChartInfoDialogProps) {
  const t = useTranslations("AdminPage.sizeCharts");
  const tSizing = useTranslations("AdminPage.sizing");
  const locale = useLocale();
  const notify = useNotify();
  const router = useRouter();
  const [values, setValues] = useState(() => initialValues(chart));
  const [contentLang, setContentLang] = useState<AdminContentLang>(locale === "en" ? "en" : "vi");
  const [nameError, setNameError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isNew = chart === null;
  // Bảng đang gắn cho loại sản phẩm thì không đổi nhóm hàng (server cũng chặn)
  const groupLocked = !isNew && chart.categoryNames.length > 0;
  const hasRows = !isNew && chart.rows.length > 0;
  const fields = LANG_FIELDS[contentLang];
  const surchargeOption: SurchargeOption = values.surchargeType ?? "NONE";
  const surchargeInvalid =
    values.surchargeType !== null &&
    (!values.surchargeValue ||
      values.surchargeValue <= 0 ||
      (values.surchargeType === "PERCENTAGE" && values.surchargeValue > 100));

  const set = <K extends keyof InfoValues>(key: K, value: InfoValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      // Tên tiếng Việt bắt buộc — chuyển về tab VI để thấy ô lỗi
      setContentLang("vi");
      setNameError(true);
      return;
    }
    if (surchargeInvalid) return;
    setIsSaving(true);
    try {
      const { isActive, ...info } = values;
      if (isNew) {
        const res = await createSizeChartAction(info);
        if (!res.success) {
          notify.error(res.error, "SIZE_CHART_CREATE_FAILED");
          return;
        }
        notify.success(t("create.success"));
        router.push(`/admin/catalog/size-charts/${res.data.id}`);
        return;
      }
      const res = await updateSizeChartInfoAction({ ...info, isActive, sizeChartId: chart.id });
      if (!res.success) {
        notify.error(res.error, "SIZE_CHART_UPDATE_FAILED");
        return;
      }
      notify.success(t("dialog.saved"));
      onOpenChange(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      title={isNew ? t("create.title") : t("dialog.editTitle", { name: chart.name })}
      description={isNew ? t("create.description") : t("dialog.description")}
      size="2xl"
      onSubmit={handleSubmit}
      bodyClassName="space-y-5"
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSaving || isUploading || surchargeInvalid}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {isSaving ? t("processing") : isNew ? t("create.submit") : t("dialog.save")}
          </button>
        </>
      }
    >
      {/* Các hàng cùng khuôn: lưới 2 cột bằng nhau, ô cao 40px; tên / ghi chú / hướng dẫn đổi theo ngôn ngữ đang chọn */}
      <div key={`general-${contentLang}`} role="tabpanel" className="space-y-4">
        {/* Hàng 1: tên bảng + công tắc VI / EN gióng giữa theo ô nhập (bù chiều cao nhãn bằng items-end) */}
        <div className="flex items-end gap-3">
          <AdminTextField
            autoFocus
            required={contentLang === "vi"}
            className="min-w-0 flex-1"
            label={t("field.name")}
            value={values[fields.name]}
            onValueChange={(value) => {
              set(fields.name, value);
              if (contentLang === "vi") setNameError(false);
            }}
            placeholder={t(`dialog.placeholders.${contentLang}.name`)}
            error={contentLang === "vi" && nameError ? t("dialog.nameRequired") : undefined}
          />
          <div className={cn("flex h-10 shrink-0 items-center", nameError && contentLang === "vi" && "mb-6")}>
            <AdminLangSwitch
              value={contentLang}
              onChange={setContentLang}
              label={t("dialog.langLabel")}
              hint={t("dialog.langHint")}
              missingLabel={t("dialog.untranslated")}
              status={{ vi: nameError ? "error" : undefined, en: values.nameEn ? undefined : "missing" }}
            />
          </div>
        </div>

        {/* Hàng 2: kiểu phụ phí + nhóm hàng (bảng đang gắn cho loại sản phẩm thì chỉ còn nhóm hiện tại) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label={t("field.surchargeType")} hint={t("dialog.bigsizeHint")}>
            <AdminFilterSelect<SurchargeOption>
              label={t("field.surchargeType")}
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
              className="h-10 w-full"
            />
          </AdminField>
          <AdminField
            required
            label={t("field.group")}
            hint={groupLocked ? t("dialog.groupLocked") : t("create.groupHint")}
          >
            <AdminFilterSelect
              label={t("field.group")}
              value={values.group}
              onChange={(group) => set("group", group)}
              options={(groupLocked ? [values.group] : SIZED_GROUPS).map((group) => ({
                value: group,
                label: tSizing(`group.${group}`),
              }))}
              className="h-10 w-full"
            />
          </AdminField>
        </div>

        {/* Hàng 3: mức phụ phí + vải cộng thêm */}
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminTextField
            label={t("field.surchargeValue")}
            inputMode="numeric"
            disabled={values.surchargeType === null}
            value={values.surchargeValue === null ? "" : String(values.surchargeValue)}
            onValueChange={(value) =>
              set(
                "surchargeValue",
                // Số tiền chỉ giữ chữ số (bỏ dấu chấm phân cách nghìn); phần trăm nhận số thập phân
                values.surchargeType === "FIXED_AMOUNT"
                  ? parseNumberInput(value.replace(/\D/g, ""))
                  : parseNumberInput(value)
              )
            }
            placeholder={values.surchargeType === "PERCENTAGE" ? "15" : "150000"}
            error={surchargeInvalid ? t("dialog.surchargeInvalid") : undefined}
            suffix={<span className="text-xs">{values.surchargeType === "PERCENTAGE" ? "%" : "₫"}</span>}
            inputClassName="tabular-nums"
          />
          <AdminTextField
            label={t("field.extraFabric")}
            inputMode="decimal"
            value={values.extraFabric === null ? "" : String(values.extraFabric)}
            onValueChange={(value) => set("extraFabric", parseNumberInput(value))}
            placeholder="0.8"
            suffix={<span className="text-xs">m</span>}
            inputClassName="tabular-nums"
          />
        </div>

        {/* Hàng 4: ghi chú */}
        <AdminTextArea
          label={t("field.description")}
          rows={2}
          value={values[fields.description]}
          onValueChange={(value) => set(fields.description, value)}
          placeholder={t(`dialog.placeholders.${contentLang}.description`)}
        />

        {/* Hàng 5: hướng dẫn đo + ảnh minh họa — hai cột cao bằng nhau (ô ảnh giãn theo ô chữ) */}
        <div className="grid items-stretch gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
          <AdminTextArea
            label={t("field.measurementGuide")}
            hint={t("dialog.guideHint")}
            rows={6}
            value={values[fields.guide]}
            onValueChange={(value) => set(fields.guide, value)}
            placeholder={t(`dialog.placeholders.${contentLang}.guide`)}
          />
          <div className="flex min-h-40 flex-col gap-1.5">
            <span className="block text-sm font-medium text-[#3F3F46]">{t("field.guideImage")}</span>
            {values.guideImage ? (
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-[#E4E4E7]">
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tải lên Cloudinary, chưa khai báo remotePatterns */}
                <img src={values.guideImage} alt={t("field.guideImage")} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => set("guideImage", "")}
                  aria-label={t("dialog.removeImage")}
                  className="absolute right-1.5 top-1.5 grid size-7 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs hover:text-rose-600"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            ) : (
              <label className="flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#D4D4D8] text-xs text-[#71717A] transition-colors hover:border-[#18181B] hover:text-[#09090B]">
                {isUploading ? (
                  <Loader2 size={18} className="animate-spin" aria-hidden />
                ) : (
                  <ImagePlus size={18} aria-hidden />
                )}
                {t("dialog.uploadImage")}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(event) => {
                    void handleGuideImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Bảng mới chưa có hàng size nên chưa áp dụng được — chỉ bật / tắt khi sửa */}
      {!isNew && (
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[#09090B]">{t("field.isActive")}</span>
            <span className="mt-0.5 block text-xs text-[#71717A]">
              {hasRows ? t("field.isActiveHint") : t("field.isActiveEmpty")}
            </span>
          </span>
          <AdminSwitch
            checked={values.isActive}
            disabled={!hasRows}
            onChange={(checked) => set("isActive", checked)}
            label={t("field.isActive")}
          />
        </div>
      )}
    </AdminDialog>
  );
}
