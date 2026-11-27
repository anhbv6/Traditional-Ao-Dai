"use client";

import { useState, type FormEvent } from "react";
import { TriangleAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ORDER_CODE_REGEX, normalizeOrderCode } from "@repo/shared/orders";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminTextField,
} from "@/features/admin/core/ui";
import {
  FABRIC_MOVEMENT_TYPES,
  type AdminFabricRoll,
  type FabricMaterialOption,
  type FabricMovementInput,
  type FabricMovementType,
} from "../../types/fabrics.types";
import { applyMovement, parseMeters, resolveFabricStatus, roundMeters, topsLeft } from "../../utils/fabricStock";
import { MOVEMENT_ICONS } from "../../utils/movementIcons";
import { FabricMeter } from "../shared/FabricMeter";

interface FabricMovementDialogProps {
  roll: AdminFabricRoll;
  material: FabricMaterialOption | undefined;
  hex: string | null;
  initialType: FabricMovementType;
  now: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: FabricMovementInput) => void;
}

/**
 * Dialog điều chỉnh tồn kho cây vải (chỉnh sửa số lượng hàng trong kho: cắt may, nhập thêm, hao hụt, kiểm kê):
 * - Khối thước đo "Hiện có" dạng view-only theo chuẩn thước vải (không kéo thả).
 * - Khối "Thao tác" chủ đạo với 4 nút độc lập to rõ ràng, dễ nhìn, dễ bấm.
 * - Hàng nhập "Số mét" và "Mã đơn" cùng 1 hàng khi cắt may; khi không có mã đơn thì số mét kéo dài hết hàng.
 * - Hàng "Ghi chú" đứng riêng 1 hàng dài rộng rãi.
 */
export function FabricMovementDialog({
  roll,
  material,
  initialType,
  now: _now,
  onOpenChange,
  onSubmit,
}: FabricMovementDialogProps) {
  const t = useTranslations("AdminPage.fabrics");
  const format = useFormatter();
  const [type, setType] = useState<FabricMovementType>(initialType);
  const [metersRaw, setMetersRaw] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [note, setNote] = useState("");

  const meters = parseMeters(metersRaw);
  const fmt = (value: number) => format.number(value, { maximumFractionDigits: 2 });
  const after = meters === null ? null : applyMovement(roll.remainingMeters, type, meters);
  const normalizedOrder = orderCode.trim() ? normalizeOrderCode(orderCode) : "";

  // Lỗi chỉ hiện khi đã gõ — nút lưu vẫn khóa khi chưa nhập
  const meterError =
    metersRaw.trim() === ""
      ? null
      : meters === null || meters < 0 || (type !== "ADJUST" && meters === 0)
        ? t("movement.errors.invalid")
        : after !== null && after < 0
          ? t("movement.errors.exceeds", { remaining: fmt(roll.remainingMeters) })
          : null;
  const orderError = normalizedOrder && !ORDER_CODE_REGEX.test(normalizedOrder) ? t("movement.errors.orderCode") : null;
  const canSubmit = meters !== null && after !== null && !meterError && !orderError;

  const crossesThreshold = after !== null && roll.remainingMeters >= roll.lowStockThreshold && after < roll.lowStockThreshold;

  const currentTops = topsLeft(roll.remainingMeters, material?.metersPerTop ?? null);
  const afterTops = after !== null ? topsLeft(Math.max(after, 0), material?.metersPerTop ?? null) : null;

  // Nút nhanh khi cắt may: một thân áo / một bộ áo + quần theo định mức
  const _presets =
    type === "CUT" && material?.metersPerTop
      ? [
          { key: "top", label: t("movement.presetTop"), value: material.metersPerTop },
          ...(material.metersPerPants
            ? [{ key: "set", label: t("movement.presetSet"), value: roundMeters(material.metersPerTop + material.metersPerPants) }]
            : []),
        ]
      : [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || meters === null) return;
    onSubmit({
      type,
      meters,
      orderCode: type === "CUT" && normalizedOrder ? normalizedOrder : null,
      note: note.trim() || null,
    });
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      title={t("movement.title")}
      description={
        <span className="inline-flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
          <span className="font-mono font-medium text-[#09090B]">{roll.code}</span>
          <span>·</span>
          <span>{roll.name}</span>
          {material && (
            <>
              <span>·</span>
              <span>{material.name}</span>
            </>
          )}
        </span>
      }
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" disabled={!canSubmit} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {t(`movement.submit.${type}`)}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 1. Khối thước đo số lượng vải hiện có (View-only không kéo thả theo ảnh 1) */}
        <div className="rounded-xl px-3.5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-2xs font-medium text-[#71717A]">
            {/* <span className="uppercase tracking-wider">{t("movement.currentStock")}</span> */}
            {after !== null && (
              <span className="flex items-center gap-1 font-normal normal-case">
                <span className="text-[#A1A1AA]">{t("movement.afterStock")}:</span>
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    after < roll.lowStockThreshold
                      ? after <= 0
                        ? "text-rose-600"
                        : "text-amber-600"
                      : "text-emerald-700"
                  )}
                >
                  {fmt(Math.max(after, 0))} m
                </span>
                {afterTops !== null && (
                  <span className="text-2xs text-[#71717A]">
                    (≈ {afterTops} {t("movement.unitTops")})
                  </span>
                )}
              </span>
            )}
          </div>

          <FabricMeter
            remaining={roll.remainingMeters}
            received={roll.receivedMeters}
            threshold={roll.lowStockThreshold}
            status={resolveFabricStatus(roll)}
            tops={currentTops}
            interactive={false}
            showTooltip={false}
          />

          {crossesThreshold && !meterError && (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700">
              <TriangleAlert size={13} className="shrink-0" aria-hidden />
              <span>
                {after !== null && after <= 0
                  ? t("movement.warnOut")
                  : t("movement.warnLow", { threshold: fmt(roll.lowStockThreshold) })}
              </span>
            </p>
          )}
        </div>

        {/* 2. Khối Thao tác chủ đạo - 4 nút bấm độc lập, dễ nhìn, dễ ấn */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#09090B]">
            {t("movement.field.type")}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FABRIC_MOVEMENT_TYPES.map((moveType) => {
              const isSelected = type === moveType;
              const Icon = MOVEMENT_ICONS[moveType];
              const sign =
                moveType === "RESTOCK"
                  ? "+ "
                  : moveType === "ADJUST"
                    ? "± "
                    : "− ";
              const actionSubLabel =
                moveType === "CUT"
                  ? t("movement.signCut")
                  : moveType === "RESTOCK"
                    ? t("movement.signRestock")
                    : moveType === "WASTE"
                      ? t("movement.signWaste")
                      : t("movement.signAdjust");

              return (
                <button
                  key={moveType}
                  type="button"
                  onClick={() => {
                    setType(moveType);
                    setMetersRaw("");
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition-all cursor-pointer",
                    isSelected
                      ? "border-[#18181B] bg-[#18181B] text-white shadow-xs font-medium"
                      : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#D4D4D8] hover:bg-[#FAFAFA]"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon size={15} className={isSelected ? "text-white" : "text-[#71717A]"} />
                    <span className="text-xs">{t(`movementType.${moveType}`)}</span>
                  </div>
                  <span className={cn("text-[11px] font-mono", isSelected ? "text-zinc-300" : "text-[#A1A1AA]")}>
                    {sign}
                    {actionSubLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Khối nhập số mét và mã đơn (1 hàng khi có mã đơn; không có mã đơn thì số mét chiếm hết hàng) */}
        <div className={cn("grid gap-3.5", type === "CUT" ? "sm:grid-cols-2" : "grid-cols-1")}>
          {/* Ô số mét */}
          <div className={cn(type !== "CUT" && "w-full")}>
            <AdminTextField
              autoFocus
              required
              label={type === "ADJUST" ? t("movement.field.measured") : t("movement.field.meters")}
              hint={t(`movement.hint.${type}`)}
              value={metersRaw}
              onValueChange={(value) => setMetersRaw(value.replace(/[^0-9.,]/g, ""))}
              inputMode="decimal"
              placeholder={t("movement.placeholder.meters")}
              error={meterError ?? undefined}
              inputClassName="font-mono tabular-nums"
            />

            {/* {presets.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-2xs text-[#71717A]">{t("movement.presetLabel")}:</span>
                {presets.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setMetersRaw(String(preset.value))}
                    className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-[#E4E4E7] bg-white px-2 text-2xs font-medium text-[#3F3F46] shadow-2xs transition-colors hover:bg-[#F4F4F5]"
                  >
                    <span>{preset.label}</span>
                    <span className="font-mono tabular-nums text-[#71717A]">{fmt(preset.value)}m</span>
                  </button>
                ))}
              </div>
            )} */}
          </div>

          {/* Ô mã đơn hàng chỉ xuất hiện khi Cắt may */}
          {type === "CUT" && (
            <AdminTextField
              label={t("movement.field.orderCode")}
              hint={t("movement.hint.orderCode")}
              value={orderCode}
              onValueChange={(value) => setOrderCode(value.toUpperCase())}
              placeholder="TC-2611-XXXX"
              error={orderError ?? undefined}
              inputClassName="font-mono uppercase"
            />
          )}
        </div>

        {/* 4. Khối Ghi chú đứng riêng 1 hàng dài hơn */}
        <div className="w-full">
          <AdminTextField
            label={t("movement.field.note")}
            value={note}
            onValueChange={setNote}
            placeholder={t(`movement.placeholder.note${type}`)}
            className="w-full"
          />
        </div>
      </div>
    </AdminDialog>
  );
}
