"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  ArrowRightLeft,
  ChevronRight,
  Power,
  PowerOff,
  Ruler,
  Shirt,
  Trash2,
  X,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminInfoTip,
  AdminLangSwitch,
  AdminStatusText,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
  type AdminStatusTone,
} from "@/features/admin/core/ui";
import {
  type AdminFabricRollDetailData,
  type FabricMovementInput,
  type FabricStockStatus,
} from "../../types/fabrics.types";
import {
  parseMeters,
  resolveFabricStatus,
  suggestThreshold,
  topsLeft,
} from "../../utils/fabricStock";
import { MOVEMENT_ICONS } from "../../utils/movementIcons";
import {
  recordFabricMovementAction,
  toggleFabricActiveAction,
  toggleFabricProductVisibilityAction,
  upsertFabricRollAction,
} from "../../actions/fabrics.actions";
import { FabricMovementDialog } from "../dialog/FabricMovementDialog";
import { FabricRelatedProductsDialog } from "../dialog/FabricRelatedProductsDialog";
import { FabricSpecsDialog } from "../dialog/FabricSpecsDialog";
import { FabricMeter } from "../shared/FabricMeter";

const STATUS_TONE: Record<FabricStockStatus, AdminStatusTone> = {
  OK: "success",
  LOW: "warning",
  OUT: "danger",
  INACTIVE: "neutral",
};

interface FabricDetailProps {
  data: AdminFabricRollDetailData;
}

/**
 * Màn hình chi tiết cây vải (mở trang riêng theo chuẩn module Admin như Bộ sưu tập, Chất liệu):
 * - Thanh đầu trang AdminDetailHeader với nút quay về danh sách, mã cây vải, tình trạng tồn và nút lưu nhanh
 * - Cột trái (chính):
 *   + Thẻ "Thông tin cây vải": chuyển ngữ VI/EN, chọn chất liệu, màu, mã, ngưỡng cảnh báo, mẫu áo
 *   + Thẻ "Ghi biến động kho": cắt may, nhập thêm, hao hụt, kiểm kê kèm tính toán trước -> sau
 *   + Thẻ "Lịch sử biến động": bảng toàn bộ nhật ký cắt may và thay đổi số mét của cây vải
 * - Cột phải (phụ):
 *   + Thẻ "Tồn kho & Định mức": thước vải trực quan, số mét còn lại, ước tính số áo dài có thể may
 *   + Thẻ "Vận hành & Mẫu áo": trạng thái hoạt động, ẩn/hiện mẫu áo trên web, ngày nhập kho
 */
export function FabricDetail({ data }: FabricDetailProps) {
  const t = useTranslations("AdminPage.fabrics");
  const locale = useLocale();
  const format = useFormatter();
  const notify = useNotify();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [roll, setRoll] = useState(data.roll);
  const [products, setProducts] = useState(data.products);
  const now = data.now;

  // ─── Form Thông tin chung ──────────────────────────────────────────────────
  const [contentLang, setContentLang] = useState<AdminContentLang>("vi");
  const [materialId, setMaterialId] = useState(roll.materialId);
  const [colorId, setColorId] = useState(roll.colorId ?? "");
  const [name, setName] = useState(roll.name);
  const [nameEn, setNameEn] = useState(roll.nameEn ?? "");
  const [thresholdRaw, setThresholdRaw] = useState(String(roll.lowStockThreshold));
  const [isCustomSpecs, setIsCustomSpecs] = useState(Boolean(roll.widthCm || roll.metersPerTop));
  const [customWidthRaw, setCustomWidthRaw] = useState(roll.widthCm ? String(roll.widthCm) : "");
  const [customMetersPerTopRaw, setCustomMetersPerTopRaw] = useState(roll.metersPerTop ? String(roll.metersPerTop) : "");

  // ─── Dialogs ─────────────────────────────────────────────────────────────
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  const [isSpecsDialogOpen, setIsSpecsDialogOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  const material = data.materials.find((m) => m.id === materialId);
  const color = data.colors.find((c) => c.id === colorId);
  const availableColors = materialId
    ? data.colors.filter((c) => material?.colorIds?.includes(c.id))
    : [];
  const swatchImg = isImageDeleted
    ? null
    : (roll.image ||
      material?.closeupImages?.[0] ||
      material?.colorImages?.find((ci) => ci.colorId === colorId)?.image ||
      null);

  // Danh sách các mẫu áo sử dụng chất liệu này (tự động theo materialId)
  const relatedProducts = materialId ? products.filter((p) => p.materialId === materialId) : [];
  const sortedRelatedProducts = relatedProducts;

  const parsedCustomWidth = customWidthRaw.trim() ? Number(customWidthRaw) : null;
  const parsedCustomMetersPerTop = customMetersPerTopRaw.trim() ? parseMeters(customMetersPerTopRaw) : null;
  const effectiveWidth = isCustomSpecs
    ? (parsedCustomWidth ?? material?.widthCm ?? null)
    : (material?.widthCm ?? null);
  const effectiveMetersPerTop = isCustomSpecs
    ? (parsedCustomMetersPerTop ?? material?.metersPerTop ?? null)
    : (material?.metersPerTop ?? null);

  const localized = (item: { name: string; nameEn: string | null } | undefined) =>
    item ? (locale === "en" && item.nameEn ? item.nameEn : item.name) : "";
  const fmt = (value: number) => format.number(value, { maximumFractionDigits: 2 });
  const status = resolveFabricStatus(roll);
  const displayName = locale === "en" && roll.nameEn ? roll.nameEn : roll.name;
  const currentTops = topsLeft(roll.remainingMeters, effectiveMetersPerTop);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleSaveInfo = (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!name.trim()) {
      setContentLang("vi");
      notify.error(t("rollDialog.errors.name"));
      return;
    }

    const thresholdSuggestion = suggestThreshold(effectiveMetersPerTop, material?.metersPerPants ?? null);
    const threshold = thresholdRaw.trim() ? parseMeters(thresholdRaw) : thresholdSuggestion;
    if (threshold === null || threshold < 0) {
      notify.error(t("rollDialog.errors.threshold"));
      return;
    }

    if (
      isCustomSpecs &&
      parsedCustomWidth !== null &&
      (parsedCustomWidth < 30 || parsedCustomWidth > 400 || !Number.isInteger(parsedCustomWidth))
    ) {
      notify.error(t("rollDialog.errors.customWidth"));
      return;
    }
    if (
      isCustomSpecs &&
      parsedCustomMetersPerTop !== null &&
      (parsedCustomMetersPerTop <= 0 || parsedCustomMetersPerTop > 20)
    ) {
      notify.error(t("rollDialog.errors.customMetersPerTop"));
      return;
    }

    const autoProductId = roll.productId ?? sortedRelatedProducts[0]?.id ?? null;
    const finalWidthCm = isCustomSpecs ? parsedCustomWidth : null;
    const finalMetersPerTop = isCustomSpecs ? parsedCustomMetersPerTop : null;

    startTransition(async () => {
      const res = await upsertFabricRollAction({
        id: roll.id,
        materialId,
        colorId: colorId || null,
        name: name.trim(),
        nameEn: nameEn.trim() || null,
        code: roll.code,
        receivedMeters: roll.receivedMeters,
        lowStockThreshold: threshold,
        productId: autoProductId,
        widthCm: finalWidthCm,
        metersPerTop: finalMetersPerTop,
        image: swatchImg,
      });

      if (!res.success) {
        notify.error(res.error);
        return;
      }

      setRoll((prev) => ({
        ...prev,
        materialId,
        colorId: colorId || null,
        name: name.trim(),
        nameEn: nameEn.trim() || null,
        lowStockThreshold: threshold,
        productId: autoProductId,
        widthCm: finalWidthCm,
        metersPerTop: finalMetersPerTop,
        image: swatchImg,
      }));

      notify.success(t("toast.updated"));
      router.refresh();
    });
  };

  const handleSpecsSave = (specs: {
    isCustomSpecs: boolean;
    widthCm: number | null;
    metersPerTop: number | null;
    widthRaw: string;
    metersPerTopRaw: string;
  }) => {
    setIsCustomSpecs(specs.isCustomSpecs);
    setCustomWidthRaw(specs.widthRaw);
    setCustomMetersPerTopRaw(specs.metersPerTopRaw);

    const thresholdSuggestion = suggestThreshold(
      specs.isCustomSpecs ? (specs.metersPerTop ?? material?.metersPerTop ?? null) : (material?.metersPerTop ?? null),
      material?.metersPerPants ?? null
    );
    const threshold = thresholdRaw.trim() ? parseMeters(thresholdRaw) : thresholdSuggestion;
    const autoProductId = roll.productId ?? sortedRelatedProducts[0]?.id ?? null;

    startTransition(async () => {
      const res = await upsertFabricRollAction({
        id: roll.id,
        materialId,
        colorId: colorId || null,
        name: name.trim(),
        nameEn: nameEn.trim() || null,
        code: roll.code,
        receivedMeters: roll.receivedMeters,
        lowStockThreshold: threshold ?? roll.lowStockThreshold,
        productId: autoProductId,
        widthCm: specs.widthCm,
        metersPerTop: specs.metersPerTop,
        image: swatchImg,
      });

      if (!res.success) {
        notify.error(res.error);
        return;
      }

      setRoll((prev) => ({
        ...prev,
        widthCm: specs.widthCm,
        metersPerTop: specs.metersPerTop,
      }));

      setIsSpecsDialogOpen(false);
      notify.success(t("toast.updated"));
      router.refresh();
    });
  };

  const handleRecordMovementSubmit = (input: FabricMovementInput) => {
    startTransition(async () => {
      const res = await recordFabricMovementAction({
        fabricId: roll.id,
        type: input.type,
        meters: input.meters,
        orderCode: input.orderCode,
        note: input.note,
      });

      if (!res.success) {
        notify.error(res.error);
        return;
      }

      const { fabric, movement } = res.data;
      setRoll((prev) => ({
        ...prev,
        remainingMeters: fabric.remainingMeters,
        receivedMeters: fabric.receivedMeters,
        updatedAt: fabric.updatedAt,
        movements: [movement, ...prev.movements],
      }));

      setIsMovementOpen(false);
      notify.success(t(`toast.${input.type}`, { name: roll.name, meters: fmt(fabric.remainingMeters) }));
      router.refresh();
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      const res = await toggleFabricActiveAction({ fabricId: roll.id });
      if (!res.success) {
        notify.error(res.error);
        return;
      }
      setRoll((prev) => ({ ...prev, isActive: res.data.isActive }));
      notify.success(res.data.isActive ? t("toast.activated") : t("toast.deactivated"));
      router.refresh();
    });
  };

  const handleToggleProduct = (targetProductId: string) => {
    startTransition(async () => {
      const res = await toggleFabricProductVisibilityAction({ productId: targetProductId });
      if (!res.success) {
        notify.error(res.error);
        return;
      }
      setProducts((prev) =>
        prev.map((item) => (item.id === targetProductId ? { ...item, isVisible: res.data.isActive } : item))
      );
      const targetProd = products.find((p) => p.id === targetProductId);
      notify.success(
        res.data.isActive
          ? t("toast.productShown", { name: targetProd?.name ?? "" })
          : t("toast.productHidden", { name: targetProd?.name ?? "" })
      );
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <AdminDetailHeader
        backHref="/admin/inventory/fabrics"
        backLabel={t("backToList")}
        title={displayName}
        badge={<AdminStatusText tone={STATUS_TONE[status]}>{t(`status.${status}`)}</AdminStatusText>}
        // subtitle={
        //   <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#71717A]">
        //     <span className="font-mono font-medium text-[#09090B]">{roll.code}</span>
        //     <span>·</span>
        //     <span>{localized(material)}</span>
        //     {color && (
        //       <>
        //         <span>·</span>
        //         <span>{localized(color)}</span>
        //       </>
        //     )}
        //     <span>·</span>
        //     <span>{t("detail.remainingStock")}: <strong className="font-mono text-[#09090B]">{fmt(roll.remainingMeters)} m</strong></span>
        //   </span>
        // }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleToggleActive}
              className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "h-9 gap-1.5 px-3 text-xs")}
            >
              {roll.isActive ? (
                <>
                  <PowerOff size={14} className="text-rose-600" aria-hidden />
                  <span>{t("menu.deactivate")}</span>
                </>
              ) : (
                <>
                  <Power size={14} className="text-emerald-700" aria-hidden />
                  <span>{t("menu.activate")}</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSaveInfo()}
              className={cn(ADMIN_PRIMARY_BUTTON_CLASS, "h-9 px-4 text-xs")}
            >
              {isPending ? t("detail.saving") : t("save")}
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* ─── CỘT TRÁI (CHÍNH - 2 CỘT) ─────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Thẻ Thông tin cây vải */}
          <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#F4F4F5] pb-3">
              <div>
                <h2 className="text-base font-semibold text-[#09090B]">{t("detail.infoTitle")}</h2>
                <p className="mt-0.5 text-xs text-[#71717A]">{t("detail.infoHint")}</p>
              </div>
              <AdminLangSwitch
                value={contentLang}
                onChange={setContentLang}
                label={t("rollDialog.langLabel")}
                status={{
                  vi: !name.trim() ? "error" : undefined,
                  en: nameEn.trim() ? undefined : "missing",
                }}
              />
            </header>

            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label={t("rollDialog.field.material")} required>
                  <AdminFilterSelect
                    value={materialId}
                    onChange={(nextMatId) => {
                      setMaterialId(nextMatId);
                      const nextMat = data.materials.find((m) => m.id === nextMatId);
                      if (nextMat?.colorIds && nextMat.colorIds.length > 0) {
                        if (!nextMat.colorIds.includes(colorId)) {
                          setColorId(nextMat.colorIds[0]);
                        }
                      } else {
                        setColorId("");
                      }
                    }}
                    placeholder={t("rollDialog.placeholder.material")}
                    options={data.materials.map((item) => ({ value: item.id, label: localized(item) }))}
                    className="h-10 w-full"
                  />
                </AdminField>

                <AdminField label={t("rollDialog.field.color")}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <AdminFilterSelect
                        value={colorId}
                        onChange={setColorId}
                        disabled={!materialId}
                        placeholder={
                          !materialId
                            ? t("rollDialog.selectMaterialFirst")
                            : availableColors.length === 0
                              ? t("rollDialog.noColorsForMaterial")
                              : t("rollDialog.placeholder.color")
                        }
                        emptyText={
                          !materialId
                            ? t("rollDialog.selectMaterialFirst")
                            : t("rollDialog.noColorsForMaterial")
                        }
                        options={availableColors.map((c) => ({
                          value: c.id,
                          label: (
                            <span className="flex items-center gap-2">
                              {c.hex && (
                                <span
                                  aria-hidden
                                  className="size-3 shrink-0 rounded-full border border-black/15 shadow-2xs"
                                  style={{ backgroundColor: c.hex }}
                                />
                              )}
                              <span>{c.name}</span>
                            </span>
                          ),
                          text: c.name,
                        }))}
                        className="h-10 w-full"
                      />
                    </div>
                    {swatchImg ? (
                      <AdminTooltip content={t("rollDialog.swatchViewTooltip")}>
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(swatchImg)}
                          className="size-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-black/10 bg-[#FAFAFA] shadow-2xs transition-transform hover:scale-105 hover:ring-2 hover:ring-[#18181B]"
                          aria-label={t("rollDialog.swatchViewTooltip")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- Preview ảnh mẫu vải kế thừa từ chất liệu (URL linh hoạt) */}
                          <img src={swatchImg} alt="" className="size-full object-cover" />
                        </button>
                      </AdminTooltip>
                    ) : color?.hex ? (
                      <span
                        className="size-10 shrink-0 rounded-xl border border-black/10 shadow-2xs"
                        style={{ backgroundColor: color.hex }}
                      />
                    ) : null}
                  </div>
                </AdminField>

                <AdminTextField
                  label={t("rollDialog.field.code")}
                  hint={t("rollDialog.hint.code")}
                  value={roll.code}
                  readOnly
                  disabled
                  inputClassName="font-mono text-xs text-[#71717A]"
                  className="sm:col-span-2"
                />

                <AdminTextField
                  required={contentLang === "vi"}
                  label={t("rollDialog.field.name")}
                  value={contentLang === "vi" ? name : nameEn}
                  onValueChange={(val) => {
                    if (contentLang === "vi") setName(val);
                    else setNameEn(val);
                  }}
                  placeholder={t("rollDialog.placeholder.name")}
                  className="sm:col-span-2"
                />

                <div className="sm:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-[#09090B]">{t("rollDialog.field.threshold")}</span>
                      <AdminInfoTip content={t("rollDialog.hint.threshold")} />
                    </div>
                    {/* <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#09090B] rounded">
                        {fmt(Number(thresholdRaw) || 0)} m
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setThresholdRaw(
                            String(suggestThreshold(material?.metersPerTop ?? null, material?.metersPerPants ?? null))
                          )
                        }
                        className="text-2xs text-amber-700 hover:underline cursor-pointer"
                      >
                        {t("detail.suggestThreshold", {
                          value: fmt(suggestThreshold(material?.metersPerTop ?? null, material?.metersPerPants ?? null)),
                        })}
                      </button>
                    </div> */}
                  </div>
                  <div className="rounded-xl px-3">
                    <FabricMeter
                      remaining={roll.remainingMeters}
                      received={roll.receivedMeters}
                      threshold={Number(thresholdRaw) || roll.lowStockThreshold}
                      status={status}
                      tops={currentTops}
                      interactive
                      showTooltip
                      onThresholdChange={(newVal) => setThresholdRaw(String(newVal))}
                    />
                  </div>
                </div>
              </div>

              {/* <div className="flex justify-end pt-2">
                <AdminButton type="submit" variant="primary" disabled={isPending}>
                  {isPending ? t("detail.saving") : t("detail.saveInfo")}
                </AdminButton>
              </div> */}
            </form>
          </section>

          {/* 2. Thẻ Lịch sử biến động cây vải (Timeline nhã nhặn, tự nhiên) */}
          <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
            <header className="mb-4 flex items-center justify-between border-b border-[#F4F4F5] pb-3">
              <div>
                <h2 className="text-base font-semibold text-[#09090B]">
                  {t("detail.historyTitle")} ({roll.movements.length})
                </h2>
                <p className="mt-0.5 text-xs text-[#71717A]">{t("detail.historyHint")}</p>
              </div>
            </header>

            {roll.movements.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#71717A]">{t("detail.historyEmpty")}</p>
            ) : (
              <ul className="space-y-1">
                {roll.movements.map((m, idx) => {
                  const Icon = MOVEMENT_ICONS[m.type];
                  const isLatest = idx === 0;
                  const isLast = idx === roll.movements.length - 1;

                  return (
                    <li key={m.id} className="flex items-stretch gap-3 sm:gap-3.5">
                      {/* Cột trục timeline gióng thẳng tuyệt đối */}
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full border bg-white shadow-2xs transition-colors",
                            isLatest
                              ? "border-[#18181B] text-[#09090B]"
                              : "border-[#E4E4E7] text-[#71717A]"
                          )}
                          aria-hidden
                        >
                          <Icon size={12} />
                        </span>
                        {!isLast && <div className="my-1 w-px flex-1 bg-[#E4E4E7]" aria-hidden />}
                      </div>

                      {/* Nội dung biến động */}
                      <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                        <div className="flex items-start justify-between gap-4">
                          {/* Cột trái: Tên hành động, mã đơn, mô tả, người làm & thời gian */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#09090B]">
                                {t(`movementType.${m.type}`)}
                              </span>
                              {m.orderCode && (
                                <span className="font-mono text-2xs text-[#71717A]">
                                  · {m.orderCode}
                                </span>
                              )}
                            </div>

                            {m.note && (
                              <p className="mt-1 line-clamp-2 pr-2 text-xs leading-relaxed text-[#52525B] break-words">
                                {m.note}
                              </p>
                            )}

                            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-2xs text-[#A1A1AA]">
                              <span>{m.actorName}</span>
                              <span>·</span>
                              <time dateTime={m.createdAt}>
                                {format.dateTime(new Date(m.createdAt), { dateStyle: "short", timeStyle: "short" })}
                              </time>
                              <span>·</span>
                              <span>{format.relativeTime(new Date(m.createdAt), new Date(now))}</span>
                            </p>
                          </div>

                          {/* Cột phải: Số mét biến động đứng cuối, thẳng hàng và không bị sát */}
                          <div className="shrink-0 pt-0.5 text-right font-mono">
                            <span
                              className={cn(
                                "block text-xs font-semibold tabular-nums",
                                m.delta > 0 ? "text-emerald-700" : "text-[#09090B]"
                              )}
                            >
                              {m.delta > 0 ? "+" : m.delta < 0 ? "−" : "±"}
                              {fmt(Math.abs(m.delta))} m
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ─── CỘT PHẢI (SIDEBAR - 1 CỘT, CỐ ĐỊNH KHI CUỘN) ─────────────── */}
        <aside className="space-y-6 lg:sticky lg:top-[7.5rem] xl:top-[8rem] lg:self-start">
          {/* Card: Thông tin cây vải (Dạng xem trước đồng nhất với Thông tin vận hành) */}
          <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
            <div className="flex items-center justify-between pb-3">
              {/* <div> */}
                <h2 className="text-base font-semibold text-[#09090B]">{t("detail.stockTitle")}</h2>
                {/* <p className="mt-0.5 text-xs text-[#71717A]">{t("detail.stockHint")}</p>
              </div> */}
              {/* <span className="font-mono text-xs font-semibold text-[#09090B] bg-[#F4F4F5] px-2 py-0.5 rounded">
                {roll.code}
              </span> */}
            </div>

            <div className="text-xs">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="shrink-0 text-[#71717A]">{t("rollDialog.field.name")}</span>
                <AdminTooltip content={locale === "en" ? nameEn || name || "—" : name || "—"}>
                  <span className="max-w-[65%] truncate text-right font-medium text-[#09090B] cursor-default">
                    {locale === "en" ? nameEn || name || "—" : name || "—"}
                  </span>
                </AdminTooltip>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[#71717A]">{t("rollDialog.field.code")}</span>
                <span className="font-mono font-medium text-[#09090B]">{roll.code}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[#71717A]">{t("rollDialog.field.material")}</span>
                <span className="font-medium text-[#09090B]">{localized(material) || "—"}</span>
              </div>
              {material && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[#71717A]">{t("column.materialSpecs")}</span>
                  <span className="font-mono text-[#09090B]">
                    {effectiveWidth && effectiveMetersPerTop ? t("rollDialog.specsSummary", { width: effectiveWidth, quota: fmt(effectiveMetersPerTop) }) : "—"}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[#71717A]">{t("detail.threshold")}</span>
                <span className="font-mono font-semibold text-[#09090B]">{fmt(Number(thresholdRaw) || roll.lowStockThreshold)} m</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[#71717A]">{t("detail.createdAt")}</span>
                <span className="font-mono text-[#09090B]">{format.dateTime(new Date(roll.receivedAt), { dateStyle: "short" })}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[#71717A]">{t("detail.updatedAt")}</span>
                <span className="text-[#09090B]">{format.relativeTime(new Date(roll.updatedAt), new Date(now))}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[#71717A]">{t("column.status")}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", roll.isActive ? "text-emerald-700" : "text-[#71717A]")}>
                    {roll.isActive ? t("toast.activated") : t("toast.deactivated")}
                  </span>
                  {/* <button
                    type="button"
                    disabled={isPending}
                    onClick={handleToggleActive}
                    className="cursor-pointer text-2xs text-[#71717A] underline hover:text-[#09090B]"
                  >
                    {roll.isActive ? t("menu.deactivate") : t("menu.activate")}
                  </button> */}
                </div>
              </div>

              {/* Action: Ghi biến động kho & Mẫu áo sử dụng chất liệu này */}
              <div className="border-t border-[#F4F4F5] pt-2.5">
                <button
                  type="button"
                  onClick={() => setIsMovementOpen(true)}
                  className="group -mx-1.5 flex w-[calc(100%+0.75rem)] cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#F4F4F5]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#E4E4E7] bg-white text-[#52525B] shadow-2xs transition-colors group-hover:border-[#D4D4D8] group-hover:text-[#09090B]">
                    <ArrowRightLeft size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#09090B]">{t("movement.title")}</p>
                    <p className="truncate text-2xs text-[#71717A]">{t("detail.movementActionHint")}</p>
                  </div>
                  <ChevronRight size={15} className="text-[#A1A1AA] transition-transform group-hover:translate-x-0.5" aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={() => setIsProductsDialogOpen(true)}
                  className="group -mx-1.5 mt-1 flex w-[calc(100%+0.75rem)] cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#F4F4F5]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#E4E4E7] bg-white text-[#52525B] shadow-2xs transition-colors group-hover:border-[#D4D4D8] group-hover:text-[#09090B]">
                    <Shirt size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#09090B]">{t("rollDialog.relatedProductsTitle")}</p>
                    <p className="truncate text-2xs text-[#71717A]">
                      {t("detail.relatedProductsActionHint", { count: sortedRelatedProducts.length })}
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-[#A1A1AA] transition-transform group-hover:translate-x-0.5" aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSpecsDialogOpen(true)}
                  className="group -mx-1.5 mt-1 flex w-[calc(100%+0.75rem)] cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#F4F4F5]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#E4E4E7] bg-white text-[#52525B] shadow-2xs transition-colors group-hover:border-[#D4D4D8] group-hover:text-[#09090B]">
                    <Ruler size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#09090B]">{t("rollDialog.customSpecsSwitch")}</p>
                    <p className="truncate text-2xs text-[#71717A]">
                      {effectiveWidth && effectiveMetersPerTop ? t("rollDialog.specsSummary", { width: effectiveWidth, quota: fmt(effectiveMetersPerTop) }) : "—"}
                      {isCustomSpecs ? ` · ${t("rollDialog.specsCustom")}` : ` · ${t("rollDialog.specsStandard")}`}
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-[#A1A1AA] transition-transform group-hover:translate-x-0.5" aria-hidden />
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {isMovementOpen && (
        <FabricMovementDialog
          roll={roll}
          material={material}
          hex={null}
          initialType="CUT"
          now={now}
          onOpenChange={setIsMovementOpen}
          onSubmit={handleRecordMovementSubmit}
        />
      )}

      {isProductsDialogOpen && (
        <FabricRelatedProductsDialog
          open={isProductsDialogOpen}
          onOpenChange={setIsProductsDialogOpen}
          products={sortedRelatedProducts}
          colorId={null}
          isPending={isPending}
          onToggleProduct={handleToggleProduct}
        />
      )}

      {isSpecsDialogOpen && (
        <FabricSpecsDialog
          open={isSpecsDialogOpen}
          onOpenChange={setIsSpecsDialogOpen}
          material={material}
          isCustomSpecs={isCustomSpecs}
          customWidthRaw={customWidthRaw}
          customMetersPerTopRaw={customMetersPerTopRaw}
          isPending={isPending}
          onSave={handleSpecsSave}
        />
      )}

      {/* Dialog xem ảnh chi tiết khi click vào ảnh swatch nhỏ */}
      {previewImageUrl && (
        <AdminDialog
          open={Boolean(previewImageUrl)}
          onOpenChange={(open) => {
            if (!open) setPreviewImageUrl(null);
          }}
          title={<span className="sr-only">{t("rollDialog.swatchPreviewTitle")}</span>}
          bare
          disableDivider
          size="sm"
          className="max-w-[340px] overflow-hidden rounded-2xl sm:max-w-[400px] [&>header]:hidden"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F4F4F5]">
            {/* eslint-disable-next-line @next/next/no-img-element -- Preview ảnh mẫu vải phóng to */}
            <img
              src={previewImageUrl}
              alt=""
              className="size-full select-none object-cover"
            />

            {/* Góc trên bên trái: Tag trạng thái Nháp */}
            {previewImageUrl.startsWith("blob:") && (
              <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-amber-500/95 px-2 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs">
                {t("rollDialog.draftBadge")}
              </span>
            )}

            {/* Góc trên bên phải: Icon thùng rác xóa ảnh và nút Đóng */}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
              <button
                type="button"
                title={t("rollDialog.removePhoto")}
                aria-label={t("rollDialog.removePhoto")}
                onClick={() => {
                  setIsImageDeleted(true);
                  setPreviewImageUrl(null);
                }}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-xs transition-colors hover:bg-rose-600 focus-visible:outline-none"
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                title={t("rollDialog.close")}
                aria-label={t("rollDialog.close")}
                onClick={() => setPreviewImageUrl(null)}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-xs transition-colors hover:bg-black/80 focus-visible:outline-none"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
