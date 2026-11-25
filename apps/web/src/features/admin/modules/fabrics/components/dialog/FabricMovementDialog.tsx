"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ORDER_CODE_REGEX, normalizeOrderCode } from "@repo/shared/orders";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminTextField,
} from "@/features/admin/core/ui";
import {
  FABRIC_MOVEMENT_TYPES,
  type AdminFabricRoll,
  type FabricMaterialOption,
  type FabricMovementInput,
  type FabricMovementType,
} from "../../types/fabrics.types";
import { MOVEMENT_ICONS } from "../../utils/movementIcons";
import { applyMovement, parseMeters, resolveFabricStatus, roundMeters, topsLeft } from "../../utils/fabricStock";
import { FabricSwatch } from "../shared/FabricSwatch";

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
 * Ghi một biến động cho cây vải (cắt may, nhập thêm, hao hụt, kiểm kê):
 * - Tích hợp gọn trong một lưới nhập liệu 2 cột cân xứng, không chia nhiều tab.
 * - Thanh tóm tắt trước → sau mỏng nhẹ hiển thị trực tiếp số mét và ước tính số áo.
 * - Hỗ trợ các nút định mức bấm nhanh (1 thân, 1 bộ) ngay dưới ô số mét.
 */
export function FabricMovementDialog({ roll, material, hex, initialType, now, onOpenChange, onSubmit }: FabricMovementDialogProps) {
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

  const afterStatus = after === null ? null : resolveFabricStatus({ ...roll, remainingMeters: after });
  const crossesThreshold = after !== null && roll.remainingMeters >= roll.lowStockThreshold && after < roll.lowStockThreshold;

  const currentTops = topsLeft(roll.remainingMeters, material?.metersPerTop ?? null);
  const afterTops = after !== null ? topsLeft(Math.max(after, 0), material?.metersPerTop ?? null) : null;

  // Nút nhanh khi cắt may: một thân áo / một bộ áo + quần theo định mức
  const presets =
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
        <span className="inline-flex items-center gap-2">
          <FabricSwatch hex={hex} size="sm" />
          <span className="truncate">
            {roll.name} · <span className="font-mono">{roll.code}</span>
          </span>
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
        {/* Tóm tắt nhanh số mét trước và sau khi ghi */}
        <div className="rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#71717A]">
              <span>
                {t("movement.currentStock")}:{" "}
                <strong className="font-mono font-semibold text-[#09090B]">{fmt(roll.remainingMeters)} m</strong>
              </span>
              {currentTops !== null && (
                <span className="text-[#A1A1AA]">
                  (≈ {currentTops} {t("movement.unitTops")})
                </span>
              )}
            </div>

            {after !== null && (
              <div className="flex items-center gap-1.5 font-medium">
                <ArrowRight size={13} className="text-[#A1A1AA]" aria-hidden />
                <span
                  className={cn(
                    "font-mono",
                    after < roll.lowStockThreshold
                      ? after <= 0
                        ? "text-rose-600"
                        : "text-amber-600"
                      : "text-emerald-700"
                  )}
                >
                  {t("movement.afterStock")}: <strong>{fmt(Math.max(after, 0))} m</strong>
                </span>
                {afterTops !== null && (
                  <span className="font-normal text-[#71717A]">
                    (≈ {afterTops} {t("movement.unitTops")})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E4E4E7]">
            <div
              className={cn(
                "h-full transition-all duration-300",
                afterStatus === "OUT" ? "bg-rose-500" : afterStatus === "LOW" ? "bg-amber-500" : "bg-[#09090B]"
              )}
              style={{
                width: `${Math.min(100, Math.max(0, ((after ?? roll.remainingMeters) / roll.receivedMeters) * 100))}%`,
              }}
            />
          </div>

          {crossesThreshold && !meterError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
              <TriangleAlert size={13} className="shrink-0" aria-hidden />
              <span>
                {after !== null && after <= 0
                  ? t("movement.warnOut")
                  : t("movement.warnLow", { threshold: fmt(roll.lowStockThreshold) })}
              </span>
            </p>
          )}
        </div>

        {/* Lưới các trường nhập liệu - 2 cột thẳng hàng, không chia tab */}
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label={t("movement.field.type")} required>
            <AdminFilterSelect
              value={type}
              onChange={(next) => {
                setType(next as FabricMovementType);
                setMetersRaw("");
              }}
              options={FABRIC_MOVEMENT_TYPES.map((value) => ({
                value,
                label: `${t(`movementType.${value}`)} (${value === "RESTOCK" ? "+" : value === "ADJUST" ? "±" : "−"})`,
              }))}
              className="h-10 w-full"
            />
          </AdminField>

          <div>
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

            {presets.length > 0 && (
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
            )}
          </div>

          {type === "CUT" ? (
            <>
              <AdminTextField
                label={t("movement.field.orderCode")}
                hint={t("movement.hint.orderCode")}
                value={orderCode}
                onValueChange={(value) => setOrderCode(value.toUpperCase())}
                placeholder="TC-2611-XXXX"
                error={orderError ?? undefined}
                inputClassName="font-mono uppercase"
              />

              <AdminTextField
                label={t("movement.field.note")}
                value={note}
                onValueChange={setNote}
                placeholder={t("movement.placeholder.noteCUT")}
              />
            </>
          ) : (
            <AdminTextField
              label={t("movement.field.note")}
              value={note}
              onValueChange={setNote}
              placeholder={t(`movement.placeholder.note${type}`)}
              className="sm:col-span-2"
            />
          )}
        </div>

        {/* Lịch sử 3 lần gần nhất (thu gọn) */}
        {roll.movements.length > 0 && (
          <div className="border-t border-dashed border-[#E4E4E7] pt-3">
            <h3 className="text-xs font-medium text-[#71717A]">{t("movement.recent")}</h3>
            <ul className="mt-1.5 divide-y divide-[#F4F4F5]">
              {roll.movements.slice(0, 3).map((movement) => {
                const Icon = MOVEMENT_ICONS[movement.type];
                return (
                  <li key={movement.id} className="flex items-center gap-2.5 py-1.5 text-xs">
                    <Icon size={13} className="shrink-0 text-[#A1A1AA]" aria-hidden />
                    <div className="min-w-0 flex-1 truncate text-[#3F3F46]">
                      <span className="font-medium">{t(`movementType.${movement.type}`)}</span>
                      {movement.orderCode && <span className="ml-1 font-mono text-2xs text-[#71717A]">{movement.orderCode}</span>}
                      {movement.note && <span className="text-[#71717A]"> · {movement.note}</span>}
                    </div>
                    <span className="shrink-0 text-2xs text-[#A1A1AA]">
                      {format.relativeTime(new Date(movement.createdAt), new Date(now))}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs font-medium tabular-nums",
                        movement.delta > 0 ? "text-emerald-700" : "text-[#3F3F46]"
                      )}
                    >
                      {movement.delta > 0 ? "+" : movement.delta < 0 ? "−" : "±"}
                      {fmt(Math.abs(movement.delta))} m
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </AdminDialog>
  );
}
