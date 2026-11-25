"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  TriangleAlert,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ORDER_CODE_REGEX, normalizeOrderCode } from "@repo/shared/orders";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminButton,
  AdminDataTable,
  AdminDetailHeader,
  AdminField,
  AdminFilterSelect,
  AdminLangSwitch,
  AdminStatusText,
  AdminTextField,
  type AdminContentLang,
  type AdminStatusTone,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import {
  type AdminFabricRollDetailData,
  type FabricMovement,
  type FabricMovementType,
  type FabricStockStatus,
} from "../../types/fabrics.types";
import {
  applyMovement,
  parseMeters,
  resolveFabricStatus,
  roundMeters,
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
import { FabricMeter } from "../shared/FabricMeter";
import { FabricSwatch } from "../shared/FabricSwatch";

const NO_PRODUCT = "NONE";

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
  const [productId, setProductId] = useState(roll.productId ?? NO_PRODUCT);

  // ─── Form Ghi biến động ───────────────────────────────────────────────────
  const [movementType, setMovementType] = useState<FabricMovementType>("CUT");
  const [metersRaw, setMetersRaw] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [note, setNote] = useState("");

  const material = data.materials.find((m) => m.id === materialId);
  const color = data.colors.find((c) => c.id === colorId);
  const product = products.find((p) => p.id === (productId === NO_PRODUCT ? null : productId));

  const localized = (item: { name: string; nameEn: string | null } | undefined) =>
    item ? (locale === "en" && item.nameEn ? item.nameEn : item.name) : "";
  const fmt = (value: number) => format.number(value, { maximumFractionDigits: 2 });
  const status = resolveFabricStatus(roll);
  const displayName = locale === "en" && roll.nameEn ? roll.nameEn : roll.name;

  // Tính toán biến động mét
  const meters = parseMeters(metersRaw);
  const after = meters === null ? null : applyMovement(roll.remainingMeters, movementType, meters);
  const normalizedOrder = orderCode.trim() ? normalizeOrderCode(orderCode) : "";

  const meterError =
    metersRaw.trim() === ""
      ? null
      : meters === null || meters < 0 || (movementType !== "ADJUST" && meters === 0)
        ? t("movement.errors.invalid")
        : after !== null && after < 0
          ? t("movement.errors.exceeds", { remaining: fmt(roll.remainingMeters) })
          : null;
  const orderError = normalizedOrder && !ORDER_CODE_REGEX.test(normalizedOrder) ? t("movement.errors.orderCode") : null;
  const canSubmitMovement = meters !== null && after !== null && !meterError && !orderError;

  const afterStatus = after === null ? null : resolveFabricStatus({ ...roll, remainingMeters: after });
  const crossesThreshold = after !== null && roll.remainingMeters >= roll.lowStockThreshold && after < roll.lowStockThreshold;

  const currentTops = topsLeft(roll.remainingMeters, material?.metersPerTop ?? null);
  const afterTops = after !== null ? topsLeft(Math.max(after, 0), material?.metersPerTop ?? null) : null;

  const presets =
    movementType === "CUT" && material?.metersPerTop
      ? [
          { key: "top", label: t("movement.presetTop"), value: material.metersPerTop },
          ...(material.metersPerPants
            ? [{ key: "set", label: t("movement.presetSet"), value: roundMeters(material.metersPerTop + material.metersPerPants) }]
            : []),
        ]
      : [];

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleSaveInfo = (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!name.trim()) {
      setContentLang("vi");
      notify.error(t("rollDialog.errors.name"));
      return;
    }

    const thresholdSuggestion = suggestThreshold(material?.metersPerTop ?? null, material?.metersPerPants ?? null);
    const threshold = thresholdRaw.trim() ? parseMeters(thresholdRaw) : thresholdSuggestion;
    if (threshold === null || threshold < 0) {
      notify.error(t("rollDialog.errors.threshold"));
      return;
    }

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
        productId: productId === NO_PRODUCT ? null : productId,
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
        productId: productId === NO_PRODUCT ? null : productId,
      }));

      notify.success(t("toast.updated"));
      router.refresh();
    });
  };

  const handleRecordMovement = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmitMovement || meters === null) return;

    startTransition(async () => {
      const res = await recordFabricMovementAction({
        fabricId: roll.id,
        type: movementType,
        meters,
        orderCode: movementType === "CUT" && normalizedOrder ? normalizedOrder : null,
        note: note.trim() || null,
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

      setMetersRaw("");
      setOrderCode("");
      setNote("");

      notify.success(t(`toast.${movementType}`, { name: roll.name, meters: fmt(fabric.remainingMeters) }));
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
      notify.success(res.data.isActive ? t("toast.productShown", { name: product?.name ?? "" }) : t("toast.productHidden", { name: product?.name ?? "" }));
      router.refresh();
    });
  };

  // ─── Cột bảng lịch sử biến động ───────────────────────────────────────────
  const historyColumns: AdminTableColumn<FabricMovement>[] = [
    {
      key: "time",
      header: t("column.time"),
      className: "w-[170px]",
      cell: (m) => (
        <div>
          <p className="text-xs font-medium text-[#09090B]">{format.dateTime(new Date(m.createdAt), { dateStyle: "short", timeStyle: "short" })}</p>
          <p className="text-2xs text-[#71717A]">{m.actorName} · {format.relativeTime(new Date(m.createdAt), new Date(now))}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: t("column.type"),
      className: "w-[130px]",
      cell: (m) => {
        const Icon = MOVEMENT_ICONS[m.type];
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3F3F46]">
            <Icon size={14} className="shrink-0 text-[#71717A]" aria-hidden />
            <span>{t(`movementType.${m.type}`)}</span>
          </span>
        );
      },
    },
    {
      key: "order",
      header: t("column.order"),
      className: "w-[130px]",
      cell: (m) =>
        m.orderCode ? (
          <span className="font-mono text-xs font-medium text-[#09090B] bg-[#F4F4F5] px-1.5 py-0.5 rounded">
            {m.orderCode}
          </span>
        ) : (
          <span className="text-xs text-[#A1A1AA]">—</span>
        ),
    },
    {
      key: "delta",
      header: t("column.delta"),
      align: "right",
      className: "w-[110px]",
      cell: (m) => (
        <span
          className={cn(
            "font-mono text-xs font-semibold tabular-nums",
            m.delta > 0 ? "text-emerald-700" : "text-[#3F3F46]"
          )}
        >
          {m.delta > 0 ? "+" : m.delta < 0 ? "−" : "±"}
          {fmt(Math.abs(m.delta))} m
        </span>
      ),
    },
    {
      key: "balance",
      header: t("column.balance"),
      align: "right",
      className: "w-[110px]",
      cell: (m) => (
        <span className="font-mono text-xs tabular-nums text-[#09090B]">
          {fmt(m.balanceAfter)} m
        </span>
      ),
    },
    {
      key: "note",
      header: t("column.note"),
      cell: (m) => <p className="truncate text-xs text-[#71717A]">{m.note || "—"}</p>,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminDetailHeader
        backHref="/admin/inventory/fabrics"
        backLabel={t("backToList")}
        title={displayName}
        icon={<FabricSwatch hex={color?.hex ?? null} size="sm" />}
        badge={<AdminStatusText tone={STATUS_TONE[status]}>{t(`status.${status}`)}</AdminStatusText>}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#71717A]">
            <span className="font-mono font-medium text-[#09090B]">{roll.code}</span>
            <span>·</span>
            <span>{localized(material)}</span>
            {color && (
              <>
                <span>·</span>
                <span>{localized(color)}</span>
              </>
            )}
            <span>·</span>
            <span>{t("detail.remainingStock")}: <strong className="font-mono text-[#09090B]">{fmt(roll.remainingMeters)} m</strong></span>
          </span>
        }
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

      <div className="grid gap-6 lg:grid-cols-3">
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
                    onChange={setMaterialId}
                    placeholder={t("rollDialog.placeholder.material")}
                    options={data.materials.map((item) => ({ value: item.id, label: localized(item) }))}
                    className="h-10 w-full"
                  />
                </AdminField>

                <AdminField label={t("rollDialog.field.color")} hint={t("rollDialog.hint.color")} required>
                  <AdminFilterSelect
                    value={colorId}
                    onChange={setColorId}
                    placeholder={t("rollDialog.placeholder.color")}
                    options={data.colors.map((item) => ({
                      value: item.id,
                      label: (
                        <span className="flex min-w-0 items-center gap-2.5">
                          <FabricSwatch hex={item.hex ?? null} size="sm" />
                          <span className="truncate">{localized(item)}</span>
                        </span>
                      ),
                      text: localized(item),
                    }))}
                    className="h-10 w-full"
                  />
                </AdminField>

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

                <AdminTextField
                  label={t("rollDialog.field.code")}
                  hint={t("rollDialog.hint.code")}
                  value={roll.code}
                  readOnly
                  disabled
                  inputClassName="font-mono text-xs text-[#71717A] bg-[#FAFAFA]"
                />

                <AdminTextField
                  label={t("rollDialog.field.threshold")}
                  hint={t("rollDialog.hint.threshold")}
                  value={thresholdRaw}
                  onValueChange={(val) => setThresholdRaw(val.replace(/[^0-9.,]/g, ""))}
                  inputMode="decimal"
                  placeholder={t("rollDialog.placeholder.threshold", {
                    value: format.number(suggestThreshold(material?.metersPerTop ?? null, material?.metersPerPants ?? null)),
                  })}
                  inputClassName="font-mono tabular-nums"
                />

                <AdminField label={t("rollDialog.field.product")} hint={t("rollDialog.hint.product")} className="sm:col-span-2">
                  <AdminFilterSelect
                    value={productId}
                    onChange={setProductId}
                    options={[
                      { value: NO_PRODUCT, label: t("rollDialog.noProduct") },
                      ...products.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
                    ]}
                    className="h-10 w-full"
                  />
                </AdminField>
              </div>

              <div className="flex justify-end pt-2">
                <AdminButton type="submit" variant="primary" disabled={isPending}>
                  {isPending ? t("detail.saving") : t("detail.saveInfo")}
                </AdminButton>
              </div>
            </form>
          </section>

          {/* 2. Thẻ Ghi biến động kho */}
          <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
            <header className="mb-4 border-b border-[#F4F4F5] pb-3">
              <h2 className="text-base font-semibold text-[#09090B]">{t("detail.movementTitle")}</h2>
              <p className="mt-0.5 text-xs text-[#71717A]">{t("detail.movementHint")}</p>
            </header>

            <form onSubmit={handleRecordMovement} className="space-y-4">
              {/* Tóm tắt tồn kho trước và sau khi ghi */}
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

              {/* Lưới các trường nhập liệu biến động */}
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label={t("movement.field.type")} required>
                  <AdminFilterSelect
                    value={movementType}
                    onChange={(next) => {
                      setMovementType(next as FabricMovementType);
                      setMetersRaw("");
                    }}
                    options={[
                      { value: "CUT", label: `${t("movementType.CUT")} (−)` },
                      { value: "RESTOCK", label: `${t("movementType.RESTOCK")} (+)` },
                      { value: "WASTE", label: `${t("movementType.WASTE")} (−)` },
                      { value: "ADJUST", label: `${t("movementType.ADJUST")} (±)` },
                    ]}
                    className="h-10 w-full"
                  />
                </AdminField>

                <div>
                  <AdminTextField
                    required
                    label={movementType === "ADJUST" ? t("movement.field.measured") : t("movement.field.meters")}
                    hint={t(`movement.hint.${movementType}`)}
                    value={metersRaw}
                    onValueChange={(val) => setMetersRaw(val.replace(/[^0-9.,]/g, ""))}
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

                {movementType === "CUT" ? (
                  <>
                    <AdminTextField
                      label={t("movement.field.orderCode")}
                      hint={t("movement.hint.orderCode")}
                      value={orderCode}
                      onValueChange={(val) => setOrderCode(val.toUpperCase())}
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
                    placeholder={t(`movement.placeholder.note${movementType}`)}
                    className="sm:col-span-2"
                  />
                )}
              </div>

              <div className="flex justify-end pt-2">
                <AdminButton type="submit" variant="primary" disabled={!canSubmitMovement || isPending}>
                  {t(`movement.submit.${movementType}`)}
                </AdminButton>
              </div>
            </form>
          </section>

          {/* 3. Thẻ Lịch sử biến động cây vải */}
          <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
            <header className="mb-4 flex items-center justify-between gap-3 border-b border-[#F4F4F5] pb-3">
              <div>
                <h2 className="text-base font-semibold text-[#09090B]">
                  {t("detail.historyTitle")} ({roll.movements.length})
                </h2>
              </div>
            </header>

            <AdminDataTable
              rows={roll.movements}
              columns={historyColumns}
              getRowId={(m) => m.id}
              empty={t("detail.historyEmpty")}
              minWidth={600}
            />
          </section>
        </div>

        {/* ─── CỘT PHẢI (SIDEBAR - 1 CỘT) ─────────────────────────────────── */}
        <div className="space-y-6">
          {/* Card: Tồn kho & Định mức */}
          <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
            <h2 className="text-base font-semibold text-[#09090B]">{t("detail.stockTitle")}</h2>
            <p className="mt-0.5 text-xs text-[#71717A]">{t("detail.stockHint")}</p>

            <div className="mt-4 space-y-4">
              <FabricMeter
                remaining={roll.remainingMeters}
                received={roll.receivedMeters}
                threshold={roll.lowStockThreshold}
                status={status}
                tops={currentTops}
              />

              <div className="divide-y divide-[#F4F4F5] rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] text-xs">
                <div className="flex items-center justify-between p-3">
                  <span className="text-[#71717A]">{t("detail.remainingStock")}</span>
                  <span className="font-mono font-semibold text-[#09090B]">{fmt(roll.remainingMeters)} m</span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-[#71717A]">{t("detail.initialStock")}</span>
                  <span className="font-mono text-[#71717A]">{fmt(roll.receivedMeters)} m</span>
                </div>
                {material?.metersPerTop && (
                  <div className="flex items-center justify-between p-3">
                    <span className="text-[#71717A]">{t("detail.estimatedTops")}</span>
                    <span className="font-medium text-[#09090B]">≈ {currentTops} {t("movement.unitTops")}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3">
                  <span className="text-[#71717A]">{t("detail.threshold")}</span>
                  <span className="font-mono text-[#71717A]">{fmt(roll.lowStockThreshold)} m</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card: Mẫu áo liên kết */}
          {product && (
            <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
              <h2 className="text-base font-semibold text-[#09090B]">{t("column.product")}</h2>
              <div className="mt-3 space-y-3 rounded-xl border border-[#E4E4E7] p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#09090B]">{product.name}</p>
                    <p className="mt-0.5 font-mono text-2xs text-[#71717A]">{product.code}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-2xs font-medium",
                      product.isVisible ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-[#71717A]"
                    )}
                  >
                    {product.isVisible ? t("product.visible") : t("product.hidden")}
                  </span>
                </div>

                <div className="border-t border-[#F4F4F5] pt-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggleProduct(product.id)}
                    className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "h-8 w-full gap-1.5 text-xs")}
                  >
                    {product.isVisible ? (
                      <>
                        <EyeOff size={13} className="text-[#71717A]" aria-hidden />
                        <span>{t("menu.hideProduct")}</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} className="text-[#71717A]" aria-hidden />
                        <span>{t("menu.showProduct")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Card: Thông tin vận hành */}
          <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
            <h2 className="text-base font-semibold text-[#09090B]">{t("detail.operationTitle")}</h2>
            <div className="mt-3 divide-y divide-[#F4F4F5] text-xs">
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
                <span className={cn("font-medium", roll.isActive ? "text-emerald-700" : "text-[#71717A]")}>
                  {roll.isActive ? t("toast.activated") : t("toast.deactivated")}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
