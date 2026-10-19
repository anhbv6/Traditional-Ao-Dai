"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useLenis } from "lenis/react";
import { type Locale } from "@repo/shared";
import { useCartStore } from "@/features/cart";
import { showToast } from "@/components/ui/toast";
import {
  COLORS,
  DEFAULT_CONFIG,
  MEASUREMENT_FIELDS,
  OCCASION_PRESETS,
  STYLE_IMAGES,
  type BespokeConfig,
  type Occasion,
} from "../data/bespokeOptions";
import { quoteBespoke } from "../utils/pricing";
import { measurementsSchema, type MeasurementsInput } from "../validations/bespoke.validation";

const EMPTY_MEASUREMENTS = Object.fromEntries(MEASUREMENT_FIELDS.map((field) => [field.id, ""])) as MeasurementsInput;

/** Id phần Số đo — cuộn tới khi số đo chưa hợp lệ lúc thêm vào giỏ */
export const MEASUREMENTS_SECTION_ID = "bespoke-measurements";

/**
 * Trạng thái màn May áo dài theo yêu cầu:
 * - `config`: toàn bộ lựa chọn; chọn DỊP MẶC thì áp bộ gợi ý (OCCASION_PRESETS), khách đổi lẻ từng mục sau đó.
 * - Số đo riêng: React Hook Form + Zod (chỉ kiểm tra khi chọn "Tự nhập số đo").
 * - Báo giá / thời gian tính lại mỗi lần đổi (hàm thuần `quoteBespoke`).
 * - Thêm vào giỏ: một dòng "Áo dài may đo" — mọi lựa chọn + số đo lưu trong `measurements` (hiện ở giỏ / hoá đơn),
 *   `href` trỏ về `/custom` (không có trang chi tiết sản phẩm).
 */
export function useBespoke() {
  const t = useTranslations("BespokePage");
  const locale = useLocale() as Locale;
  const lenis = useLenis();

  const [config, setConfig] = useState<BespokeConfig>(DEFAULT_CONFIG);
  const [notes, setNotes] = useState("");

  const measurementsForm = useForm<MeasurementsInput>({
    resolver: zodResolver(measurementsSchema),
    mode: "onTouched",
    defaultValues: EMPTY_MEASUREMENTS,
  });

  const quote = quoteBespoke(config);

  const setOption = <K extends keyof BespokeConfig>(key: K, value: BespokeConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  /** Chọn dịp mặc → áp bộ gợi ý (giữ nguyên cách lấy số đo / size / thời gian khách đã chọn) */
  const selectOccasion = (occasion: Occasion) =>
    setConfig((current) => ({ ...current, occasion, ...OCCASION_PRESETS[occasion] }));

  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    setNotes("");
    measurementsForm.reset(EMPTY_MEASUREMENTS);
    if (lenis) lenis.scrollTo(0, { duration: 0.8 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Bản mô tả thiết kế (nhãn đã dịch) — lưu kèm dòng giỏ hàng để thợ may / khách xem lại */
  const describe = (measurements?: MeasurementsInput): Record<string, string> => {
    const spec: Record<string, string> = {
      [t("summary.specs.style")]: t(`options.style.${config.style}.label`),
      [t("summary.specs.fabric")]: t(`options.fabric.${config.fabric}.label`),
      [t("summary.specs.collar")]: t(`options.collar.${config.collar}`),
      [t("summary.specs.sleeve")]: t(`options.sleeve.${config.sleeve}`),
      [t("summary.specs.length")]: t(`options.length.${config.length}`),
      [t("summary.specs.decoration")]:
        config.decoration === "embroidery"
          ? `${t("options.decoration.embroidery.label")} · ${t(`options.motif.${config.motif}`)}`
          : t(`options.decoration.${config.decoration}.label`),
      [t("summary.specs.pants")]: t(`options.pants.${config.pants}.label`),
      [t("summary.specs.timeline")]: t(`options.timeline.${config.timeline}.label`),
    };
    if (config.measureMode === "studio") spec[t("summary.specs.measurements")] = t("options.measureMode.studio.label");
    if (measurements) {
      MEASUREMENT_FIELDS.forEach((field) => {
        spec[t(`options.measurement.${field.id}`)] = `${measurements[field.id]} ${t("labels.unit")}`;
      });
    }
    if (notes.trim()) spec[t("summary.notes")] = notes.trim();
    return spec;
  };

  const addToCart = async () => {
    let measurements: MeasurementsInput | undefined;
    if (config.measureMode === "custom") {
      const valid = await measurementsForm.trigger();
      if (!valid) {
        showToast.error(t("cart.invalid"));
        document.getElementById(MEASUREMENTS_SECTION_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      measurements = measurementsForm.getValues();
    }

    const styleLabel = t(`options.style.${config.style}.label`);
    useCartStore.getState().addItem({
      name: t("cart.name", { style: styleLabel }),
      slug: `custom-${config.style}`,
      href: "/custom",
      image: STYLE_IMAGES[config.style],
      price: quote.total,
      color: t(`options.color.${config.color}`),
      size: config.measureMode === "standard" ? config.size : t("summary.customMeasurements"),
      measurements: describe(measurements),
    });
    showToast.success(t("cart.added"), `${styleLabel} · ${t(`options.fabric.${config.fabric}.label`)}`);
  };

  const colorHex = COLORS.find((color) => color.id === config.color)?.hex ?? COLORS[0].hex;

  return {
    t,
    locale,
    config,
    setOption,
    selectOccasion,
    notes,
    setNotes,
    measurementsForm,
    quote,
    colorHex,
    addToCart,
    reset,
  };
}
