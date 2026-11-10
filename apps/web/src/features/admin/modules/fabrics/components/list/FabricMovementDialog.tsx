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
  AdminSegmentedControl,
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
import { FabricMeter } from "../shared/FabricMeter";
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
 * Ghi một biến động cho cây vải: chọn loại → nhập số mét (cắt may có nút nhanh theo định mức chất liệu) →
 * xem trước số mét còn lại và số áo còn cắt được trước khi lưu. Dưới cùng là vài lần ghi gần nhất để đối chiếu.
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
      icon={MOVEMENT_ICONS[type]}
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
      <div className="space-y-5">
        <div className="overflow-x-auto">
          <AdminSegmentedControl
            value={type}
            onChange={(next) => {
              setType(next);
              setMetersRaw("");
            }}
            options={FABRIC_MOVEMENT_TYPES.map((value) => ({ value, label: t(`movementType.${value}`) }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
          {type === "CUT" ? (
            <AdminTextField
              label={t("movement.field.orderCode")}
              hint={t("movement.hint.orderCode")}
              value={orderCode}
              onValueChange={(value) => setOrderCode(value.toUpperCase())}
              placeholder="TC-2611-XXXX"
              error={orderError ?? undefined}
              inputClassName="font-mono uppercase"
            />
          ) : (
            <AdminTextField
              label={t("movement.field.note")}
              value={note}
              onValueChange={setNote}
              placeholder={t(`movement.placeholder.note${type}`)}
            />
          )}
        </div>

        {presets.length > 0 && (
          <div className="-mt-2 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setMetersRaw(String(preset.value))}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs text-[#3F3F46] transition-colors hover:border-[#D4D4D8] hover:bg-[#FAFAFA]"
              >
                {preset.label}
                <span className="font-mono tabular-nums text-[#71717A]">{fmt(preset.value)} m</span>
              </button>
            ))}
          </div>
        )}

        {type === "CUT" && (
          <AdminTextField
            label={t("movement.field.note")}
            value={note}
            onValueChange={setNote}
            placeholder={t("movement.placeholder.noteCUT")}
          />
        )}

        {/* Xem trước: trước → sau */}
        <AdminField label={t("movement.preview")}>
          <div className="rounded-xl border border-dashed border-[#E4E4E7] p-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-mono tabular-nums text-[#71717A]">{fmt(roll.remainingMeters)} m</span>
              <ArrowRight size={14} className="text-[#A1A1AA]" aria-hidden />
              <span className={cn("font-mono font-semibold tabular-nums", after === null ? "text-[#A1A1AA]" : "text-[#09090B]")}>
                {after === null ? "—" : `${fmt(Math.max(after, 0))} m`}
              </span>
            </div>
            <FabricMeter
              className="mt-3"
              remaining={Math.max(after ?? roll.remainingMeters, 0)}
              received={roll.receivedMeters}
              threshold={roll.lowStockThreshold}
              status={afterStatus ?? resolveFabricStatus(roll)}
              tops={topsLeft(Math.max(after ?? roll.remainingMeters, 0), material?.metersPerTop ?? null)}
            />
            {crossesThreshold && !meterError && (
              <p className="mt-3 flex items-start gap-2 text-xs text-amber-700">
                <TriangleAlert size={14} className="mt-px shrink-0" aria-hidden />
                {after !== null && after <= 0
                  ? t("movement.warnOut")
                  : t("movement.warnLow", { threshold: fmt(roll.lowStockThreshold) })}
              </p>
            )}
          </div>
        </AdminField>

        {roll.movements.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#3F3F46]">{t("movement.recent")}</h3>
            <ul className="mt-2 divide-y divide-dashed divide-[#E4E4E7]">
              {roll.movements.slice(0, 4).map((movement) => {
                const Icon = MOVEMENT_ICONS[movement.type];
                return (
                  <li key={movement.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <Icon size={14} className="shrink-0 text-[#A1A1AA]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[#3F3F46]">
                        {t(`movementType.${movement.type}`)}
                        {movement.orderCode && <span className="ml-1.5 font-mono text-2xs text-[#71717A]">{movement.orderCode}</span>}
                        {movement.note && <span className="text-[#71717A]"> · {movement.note}</span>}
                      </p>
                      <p className="text-xs text-[#71717A]">
                        {movement.actorName} · {format.relativeTime(new Date(movement.createdAt), new Date(now))}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs tabular-nums",
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
