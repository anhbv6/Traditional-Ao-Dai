"use client";

import { useState, type FormEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MAX_IMAGE_BYTES } from "@repo/shared";
import { PRODUCT_GROUPS, type ProductGroup } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
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

/**
 * Tự động cắt (center-crop) ảnh minh họa đo theo đúng tỉ lệ chuẩn 3:4 của khung mẫu:
 * - Cắt căn giữa theo tỉ lệ 3:4 để ảnh chỉ vừa vặn trong khung mẫu, không bị méo hay tràn
 * - Nén sang WebP nhẹ trên trình duyệt trước khi tải lên Cloudinary
 */
async function prepareGuideImage(file: File): Promise<{ success: true; file: File } | { success: false; error: string }> {
  if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "FILE_TOO_LARGE" };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { success: false, error: "ONLY_IMAGE_FILES_ALLOWED" };
  }

  // Tỉ lệ chuẩn 3:4 của khung mẫu minh họa đo
  const TARGET_ASPECT = 3 / 4;
  const currentAspect = bitmap.width / bitmap.height;

  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;

  if (currentAspect > TARGET_ASPECT) {
    // Ảnh rộng hơn 3:4 -> cắt bớt hai bên
    sw = Math.round(bitmap.height * TARGET_ASPECT);
    sx = Math.round((bitmap.width - sw) / 2);
  } else if (currentAspect < TARGET_ASPECT) {
    // Ảnh dài hơn 3:4 -> cắt bớt trên dưới
    sh = Math.round(bitmap.width / TARGET_ASPECT);
    sy = Math.round((bitmap.height - sh) / 2);
  }

  // Giới hạn chiều cao tối đa 1600px để tải nhanh
  const MAX_HEIGHT = 1600;
  const scale = Math.min(1, MAX_HEIGHT / sh);
  const outWidth = Math.round(sw * scale);
  const outHeight = Math.round(sh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { success: false, error: "IMAGE_PROCESS_FAILED" };
  }

  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outWidth, outHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  if (!blob || blob.type !== "image/webp") {
    return { success: true, file };
  }

  const name = file.name.replace(/\.[^.]+$/, "") || "guide";
  return { success: true, file: new File([blob], `${name}.webp`, { type: "image/webp" }) };
}

interface SizeChartInfoDialogProps {
  /** Bảng đang sửa; `null` = tạo mới (tạo xong chuyển sang màn chi tiết để nhập số đo) */
  chart: AdminSizeChartDetail | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog thêm / sửa THÔNG TIN bảng size mẫu:
 * - Đẩy switch ngôn ngữ [VI | EN] lên cạnh nút đóng X ở header.
 * - Mô tả ngắn gọn tránh chèn đè lên tiêu đề / nút đóng.
 * - Khung ảnh minh họa tỉ lệ chuẩn 3:4, tự động cắt ảnh vừa khít khung mẫu khi tải lên.
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
      const prepared = await prepareGuideImage(file);
      if (!prepared.success) {
        notify.error(prepared.error, "IMAGE_UPLOAD_FAILED");
        return;
      }
      const res = await uploadImageApi(prepared.file, "size-charts");
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

  const chartDisplayName = chart ? (locale === "vi" ? chart.name || chart.nameEn : chart.nameEn || chart.name) : "";

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      title={isNew ? t("create.title") : t("dialog.editTitle", { name: chartDisplayName })}
      description={isNew ? t("create.description") : t("dialog.description")}
      size="2xl"
      onSubmit={handleSubmit}
      bodyClassName="space-y-5"
      headerAside={
        <div className="-mr-1 shrink-0">
          <AdminLangSwitch
            value={contentLang}
            onChange={setContentLang}
            label={t("dialog.langLabel")}
            hint={t("dialog.langHint")}
            missingLabel={t("dialog.untranslated")}
            status={{ vi: nameError ? "error" : undefined, en: values.nameEn ? undefined : "missing" }}
          />
        </div>
      }
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
      {/* Các trường nhập liệu: tên / ghi chú / hướng dẫn đổi theo ngôn ngữ đang chọn */}
      <div key={`general-${contentLang}`} role="tabpanel" className="space-y-4">
        {/* Hàng 1: tên bảng theo ngôn ngữ nội dung đang chọn */}
        <AdminTextField
          autoFocus
          required={contentLang === "vi"}
          className="w-full"
          label={t("field.name")}
          value={values[fields.name]}
          onValueChange={(value) => {
            set(fields.name, value);
            if (contentLang === "vi") setNameError(false);
          }}
          placeholder={t(`dialog.placeholders.${contentLang}.name`)}
          error={contentLang === "vi" && nameError ? t("dialog.nameRequired") : undefined}
        />

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

        {/* Hàng 5: hướng dẫn đo + ảnh minh họa (khung tỉ lệ 3:4 tự động cắt vừa khít khung mẫu) */}
        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
          <AdminTextArea
            label={t("field.measurementGuide")}
            hint={t("dialog.guideHint")}
            rows={6}
            value={values[fields.guide]}
            onValueChange={(value) => set(fields.guide, value)}
            placeholder={t(`dialog.placeholders.${contentLang}.guide`)}
          />
          <div className="flex flex-col gap-1.5">
            <span className="block text-sm font-medium text-[#3F3F46]">{t("field.guideImage")}</span>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]">
              {values.guideImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tải lên Cloudinary, chưa khai báo remotePatterns */}
                  <img
                    src={values.guideImage}
                    alt={t("field.guideImage")}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => set("guideImage", "")}
                    aria-label={t("dialog.removeImage")}
                    className="absolute right-1.5 top-1.5 grid size-7 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs transition-colors hover:bg-white hover:text-rose-600"
                  >
                    <X size={14} aria-hidden />
                  </button>
                </>
              ) : (
                <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-[#D4D4D8] p-3 text-center text-xs text-[#71717A] transition-colors hover:border-[#18181B] hover:text-[#09090B]">
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin text-[#18181B]" aria-hidden />
                  ) : (
                    <ImagePlus size={20} aria-hidden />
                  )}
                  <span>{isUploading ? t("processing") : t("dialog.uploadImage")}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
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
