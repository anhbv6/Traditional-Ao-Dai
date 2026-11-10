"use client";

import { useState, type FormEvent } from "react";
import { MoreHorizontal, Package, Pencil, Plus, Store, Trash2, Truck, Bike } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { AppMenu } from "@/components/shared/AppMenu";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_BODY_CLASS,
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDataTable,
  AdminDatePicker,
  AdminDialog,
  AdminDialogFooter,
  AdminField,
  AdminSegmentedControl,
  AdminSwitch,
  AdminTextArea,
  AdminTextField,
  AdminTooltip,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { type Carrier, type CarrierKind, type Province, type ShippingPaymentSettings, type ShippingZone } from "../../types/shippingPayment.types";
import { findZone, mockId } from "../../utils/shippingRules";
import { MiniLabel, SettingsCard, SwitchRow, formatDigits, parseDigits } from "../shared/SettingsParts";
import { ZoneDialog } from "./ZoneDialog";

type Update = (change: (settings: ShippingPaymentSettings) => ShippingPaymentSettings) => void;

const KIND_ICON = { COURIER: Truck, SHOP_DELIVERY: Bike, PICKUP: Store } as const;

/** Tab Vận chuyển: vùng & phí (kèm bản đồ phủ 34 tỉnh), đơn vị giao, miễn phí giao, chuẩn bị hàng & ngày nghỉ */
export function ShippingTab({ settings, provinces, update }: { settings: ShippingPaymentSettings; provinces: Province[]; update: Update }) {
  const t = useTranslations("AdminPage.shippingPayment");
  const locale = useLocale() as Locale;
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [deletingZone, setDeletingZone] = useState<ShippingZone | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);

  const carrierName = (id: string) => settings.carriers.find((carrier) => carrier.id === id);
  const provinceName = (code: string) => provinces.find((province) => province.code === code)?.name ?? code;
  const { freeShipping, fulfillment } = settings;
  const setFree = (change: Partial<ShippingPaymentSettings["freeShipping"]>) => update((s) => ({ ...s, freeShipping: { ...s.freeShipping, ...change } }));
  const setFulfillment = (change: Partial<ShippingPaymentSettings["fulfillment"]>) => update((s) => ({ ...s, fulfillment: { ...s.fulfillment, ...change } }));

  const saveZone = (zone: ShippingZone) => {
    update((s) => {
      const exists = s.zones.some((item) => item.id === zone.id);
      // Mỗi tỉnh chỉ thuộc một vùng: tỉnh vừa chọn được gỡ khỏi các vùng khác
      const others = s.zones.map((item) => (item.id === zone.id ? zone : { ...item, provinceCodes: item.provinceCodes.filter((code) => !zone.provinceCodes.includes(code)) }));
      return { ...s, zones: exists ? others : [...others, zone] };
    });
    setEditingZone(null);
  };

  const newZone = (): ShippingZone => ({
    id: mockId("z"),
    name: "",
    provinceCodes: [],
    baseFee: 30_000,
    extraItemFee: 0,
    etaMinDays: 2,
    etaMaxDays: 4,
    carrierId: settings.carriers.find((carrier) => carrier.kind === "COURIER" && carrier.isActive)?.id ?? settings.carriers[0]?.id ?? "",
    freeShipEligible: true,
  });

  const zoneIndex = (id: string) => settings.zones.findIndex((zone) => zone.id === id) + 1;

  const columns: AdminTableColumn<ShippingZone>[] = [
    {
      key: "zone",
      header: t("zones.column.zone"),
      cell: (zone) => (
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-[#F4F4F5] font-mono text-xs text-[#52525B]">{zoneIndex(zone.id)}</span>
          <div className="min-w-0">
            <p className="text-[#09090B]">{zone.name}</p>
            <p className="mt-0.5 truncate text-xs text-[#71717A]">
              {zone.provinceCodes.length === 0
                ? t("zones.noProvinces")
                : zone.provinceCodes.length <= 2
                  ? zone.provinceCodes.map(provinceName).join(", ")
                  : t("zones.provinceSummary", { count: zone.provinceCodes.length, names: zone.provinceCodes.slice(0, 2).map(provinceName).join(", ") })}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "fee",
      header: t("zones.column.fee"),
      className: "w-40",
      cell: (zone) => (
        <div className="whitespace-nowrap">
          <p className="font-mono tabular-nums text-[#09090B]">{zone.baseFee === 0 ? t("zones.free") : formatVnd(zone.baseFee, locale)}</p>
          <p className="mt-0.5 text-xs text-[#71717A]">
            {zone.extraItemFee ? t("zones.extra", { amount: formatVnd(zone.extraItemFee, locale) }) : t("zones.noExtra")}
          </p>
        </div>
      ),
    },
    {
      key: "eta",
      header: t("zones.column.eta"),
      className: "hidden w-28 @2xl:table-cell",
      cell: (zone) => (
        <span className="whitespace-nowrap tabular-nums text-[#3F3F46]">
          {zone.etaMaxDays === 0 ? t("zones.sameDay") : t("zones.etaRange", { min: zone.etaMinDays, max: zone.etaMaxDays })}
        </span>
      ),
    },
    {
      key: "carrier",
      header: t("zones.column.carrier"),
      className: "hidden w-44 @3xl:table-cell",
      cell: (zone) => {
        const carrier = carrierName(zone.carrierId);
        return (
          <div className="min-w-0">
            <p className={cn("truncate", carrier?.isActive ? "text-[#3F3F46]" : "text-rose-600")}>{carrier?.name ?? "—"}</p>
            <p className="mt-0.5 text-xs text-[#71717A]">{zone.freeShipEligible ? t("zones.freeShipYes") : t("zones.freeShipNo")}</p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1 · Vùng & phí */}
      <SettingsCard
        id="zones"
        title={t("zones.title")}
        description={t("zones.description")}
        aside={
          <button type="button" onClick={() => setEditingZone(newZone())} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            <Plus size={15} aria-hidden /> <span className="hidden sm:inline">{t("zones.add")}</span>
          </button>
        }
      >
        {/* Bản đồ phủ: 34 tỉnh theo miền, số = vùng đang thuộc; tỉnh chưa có vùng viền đỏ */}
        <div className="space-y-2.5">
          {(["NORTH", "CENTRAL", "SOUTH"] as const).map((region) => (
            <div key={region} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <span className="w-24 shrink-0 pt-1 text-xs text-[#71717A]">{t(`region.${region}`)}</span>
              <div className="flex flex-wrap gap-1.5">
                {provinces
                  .filter((province) => province.region === region)
                  .map((province) => {
                    const zone = findZone(province.code, settings.zones);
                    const active = hoverZone !== null && zone?.id === hoverZone;
                    return (
                      <AdminTooltip key={province.code} content={zone ? zone.name : t("zones.unassigned")}>
                        <button
                          type="button"
                          // Tỉnh chưa có vùng: mở "Thêm vùng" với tỉnh đó chọn sẵn (có thể chọn thêm hoặc chuyển vào vùng có sẵn từ dialog vùng đó)
                          onClick={() => setEditingZone(zone ?? { ...newZone(), provinceCodes: [province.code] })}
                          onMouseEnter={() => zone && setHoverZone(zone.id)}
                          onMouseLeave={() => setHoverZone(null)}
                          className={cn(
                            "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-xs transition-colors",
                            !zone
                              ? "border-rose-300 bg-rose-50 text-rose-700"
                              : active
                                ? "border-[#18181B] bg-[#18181B] text-white"
                                : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#A1A1AA]"
                          )}
                        >
                          <span className={cn("font-mono text-2xs", active ? "text-[#D4D4D8]" : zone ? "text-[#A1A1AA]" : "text-rose-500")}>{zone ? zoneIndex(zone.id) : "!"}</span>
                          {province.name}
                        </button>
                      </AdminTooltip>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <div onMouseLeave={() => setHoverZone(null)}>
        <AdminDataTable
          rows={settings.zones}
          columns={columns}
          getRowId={(zone) => zone.id}
          activeRowId={hoverZone}
          onRowHover={(zone) => setHoverZone(zone?.id ?? null)}
          minWidth={480}
          actionsLabel={t("actions")}
          empty={t("zones.empty")}
          rowActions={(zone) => (
            <AppMenu
              tone="admin"
              width={220}
              align="end"
              items={[
                { key: "edit", label: t("zones.menu.edit"), icon: Pencil, onSelect: () => setEditingZone(zone) },
                { type: "separator", key: "sep" },
                { key: "delete", label: t("zones.menu.delete"), icon: Trash2, tone: "danger", onSelect: () => setDeletingZone(zone) },
              ]}
              trigger={
                <button type="button" aria-label={t("zones.menu.label", { name: zone.name })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                  <MoreHorizontal size={18} />
                </button>
              }
            />
          )}
          mobileRow={(zone) => (
            <div className="space-y-2">
              {columns[0]!.cell(zone)}
              <div className="flex items-start justify-between gap-3 pl-9 text-sm">
                {columns[1]!.cell(zone)}
                <div className="text-right text-xs text-[#71717A]">
                  <p>{columns[2]!.cell(zone)}</p>
                  <p className="mt-0.5">{carrierName(zone.carrierId)?.name}</p>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* 2 · Miễn phí giao + chuẩn bị hàng — cạnh nhau ở vùng rộng */}
      <div className="grid items-start gap-5 @3xl:grid-cols-2">
        <SettingsCard
          id="free"
          title={t("free.title")}
          description={t("free.description")}
          aside={<AdminSwitch checked={freeShipping.enabled} onChange={(enabled) => setFree({ enabled })} label={t("free.title")} />}
        >
          <fieldset disabled={!freeShipping.enabled} className={cn("space-y-4 transition-opacity", !freeShipping.enabled && "opacity-50")}>
            <AdminTextField
              label={t("free.threshold")}
              hint={t("free.thresholdHint")}
              mask="currency"
              suffix="₫"
              inputMode="numeric"
              value={formatDigits(freeShipping.threshold)}
              onValueChange={(next) => setFree({ threshold: parseDigits(next) ?? 0 })}
              inputClassName="font-mono tabular-nums"
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#3F3F46]">{t("free.tailored")}</p>
                <p className="mt-0.5 text-xs text-[#71717A]">{t("free.tailoredHint")}</p>
              </div>
              <AdminSwitch checked={freeShipping.tailoredAlwaysFree} onChange={(tailoredAlwaysFree) => setFree({ tailoredAlwaysFree })} label={t("free.tailored")} />
            </div>
            {settings.zones.some((zone) => !zone.freeShipEligible) && (
              <p className="rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs text-[#52525B]">
                {t("free.excludedZones", { names: settings.zones.filter((zone) => !zone.freeShipEligible).map((zone) => zone.name).join(", ") })}
              </p>
            )}
          </fieldset>
        </SettingsCard>

        <SettingsCard id="fulfillment" title={t("fulfillment.title")} description={t("fulfillment.description")}>
          <div className="grid grid-cols-2 gap-3">
            <AdminTextField
              label={t("fulfillment.prepDays")}
              hint={t("fulfillment.prepDaysHint")}
              value={String(fulfillment.prepDays)}
              onValueChange={(next) => setFulfillment({ prepDays: Math.min(14, Number(next.replace(/\D/g, "") || 0)) })}
              inputMode="numeric"
              suffix={<span className="text-xs text-[#A1A1AA]">{t("zones.days")}</span>}
              inputClassName="font-mono tabular-nums"
            />
            <AdminTextField
              label={t("fulfillment.cutoff")}
              hint={t("fulfillment.cutoffHint")}
              value={fulfillment.cutoffTime}
              onValueChange={(next) => setFulfillment({ cutoffTime: next.replace(/[^0-9:]/g, "").slice(0, 5) })}
              placeholder="15:00"
              inputClassName="font-mono tabular-nums"
            />
          </div>
          <div className="mt-1 divide-y divide-dashed divide-[#E4E4E7]">
            <SwitchRow
              label={t("fulfillment.giftWrap")}
              hint={t("fulfillment.giftWrapHint")}
              checked={fulfillment.giftWrapEnabled}
              onChange={(giftWrapEnabled) => setFulfillment({ giftWrapEnabled })}
            >
              <AdminTextField
                aria-label={t("fulfillment.giftWrapFee")}
                mask="currency"
                prefix={<span className="text-xs text-[#71717A]">{t("fulfillment.giftWrapFee")}</span>}
                suffix="₫"
                inputMode="numeric"
                value={formatDigits(fulfillment.giftWrapFee)}
                onValueChange={(next) => setFulfillment({ giftWrapFee: parseDigits(next) ?? 0 })}
                inputClassName="font-mono tabular-nums"
              />
            </SwitchRow>
            <SwitchRow
              className="pb-0"
              label={t("fulfillment.pause")}
              hint={t("fulfillment.pauseHint")}
              checked={fulfillment.pause !== null}
              onChange={(on) => setFulfillment({ pause: on ? { from: "", to: "", message: "" } : null })}
            >
              {fulfillment.pause && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminField label={t("fulfillment.pauseFrom")}>
                      <AdminDatePicker value={fulfillment.pause.from} onChange={(from) => setFulfillment({ pause: { ...fulfillment.pause!, from } })} />
                    </AdminField>
                    <AdminField label={t("fulfillment.pauseTo")}>
                      <AdminDatePicker value={fulfillment.pause.to} min={fulfillment.pause.from} onChange={(to) => setFulfillment({ pause: { ...fulfillment.pause!, to } })} />
                    </AdminField>
                  </div>
                  <AdminTextArea
                    label={t("fulfillment.pauseMessage")}
                    hint={t("fulfillment.pauseMessageHint")}
                    rows={2}
                    maxLength={160}
                    value={fulfillment.pause.message}
                    onChange={(event) => setFulfillment({ pause: { ...fulfillment.pause!, message: event.target.value } })}
                    placeholder={t("fulfillment.pausePlaceholder")}
                  />
                </div>
              )}
            </SwitchRow>
          </div>
        </SettingsCard>
      </div>

      {/* 3 · Đơn vị giao */}
      <SettingsCard
        id="carriers"
        title={t("carriers.title")}
        description={t("carriers.description")}
        aside={
          <button
            type="button"
            onClick={() => setEditingCarrier({ id: mockId("c"), name: "", kind: "COURIER", isActive: true, note: "" })}
            className={ADMIN_SECONDARY_BUTTON_CLASS}
          >
            <Plus size={15} aria-hidden /> <span className="hidden sm:inline">{t("carriers.add")}</span>
          </button>
        }
      >
        <ul className="-mx-1 divide-y divide-dashed divide-[#E4E4E7]">
          {settings.carriers.map((carrier) => {
            const Icon = KIND_ICON[carrier.kind];
            const usedBy = settings.zones.filter((zone) => zone.carrierId === carrier.id);
            return (
              <li key={carrier.id} className="flex items-start gap-3 px-1 py-3">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border", carrier.isActive ? "border-[#E4E4E7] text-[#52525B]" : "border-dashed border-[#D4D4D8] text-[#A1A1AA]")}>
                  <Icon size={16} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-body", carrier.isActive ? "text-[#09090B]" : "text-[#A1A1AA]")}>
                    {carrier.name}
                    <span className="ml-2 text-xs text-[#71717A]">{t(`carriers.kind.${carrier.kind}`)}</span>
                  </p>
                  {carrier.note && <p className="mt-0.5 text-xs leading-relaxed text-[#71717A]">{carrier.note}</p>}
                  <p className={cn("mt-1 text-xs", !carrier.isActive && usedBy.length > 0 ? "text-rose-600" : "text-[#A1A1AA]")}>
                    {carrier.kind === "PICKUP"
                      ? t("carriers.pickupUse")
                      : usedBy.length > 0
                        ? t("carriers.usedBy", { names: usedBy.map((zone) => zone.name).join(", ") })
                        : t("carriers.unused")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <AdminTooltip content={t("carriers.edit")}>
                    <button type="button" onClick={() => setEditingCarrier(carrier)} aria-label={t("carriers.editNamed", { name: carrier.name })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                      <Pencil size={15} />
                    </button>
                  </AdminTooltip>
                  <AdminSwitch
                    checked={carrier.isActive}
                    onChange={(isActive) => update((s) => ({ ...s, carriers: s.carriers.map((item) => (item.id === carrier.id ? { ...item, isActive } : item)) }))}
                    label={carrier.name}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </SettingsCard>

      {editingZone && (
        <ZoneDialog zone={editingZone} zones={settings.zones} carriers={settings.carriers} provinces={provinces} onClose={() => setEditingZone(null)} onSave={saveZone} />
      )}

      {editingCarrier && (
        <CarrierDialog
          carrier={editingCarrier}
          isNew={!settings.carriers.some((item) => item.id === editingCarrier.id)}
          onClose={() => setEditingCarrier(null)}
          onSave={(carrier) => {
            update((s) => ({
              ...s,
              carriers: s.carriers.some((item) => item.id === carrier.id) ? s.carriers.map((item) => (item.id === carrier.id ? carrier : item)) : [...s.carriers, carrier],
            }));
            setEditingCarrier(null);
          }}
        />
      )}

      {deletingZone && (
        <AdminDialog
          open
          onOpenChange={(open) => !open && setDeletingZone(null)}
          icon={Trash2}
          tone="danger"
          title={t("zones.deleteDialog.title", { name: deletingZone.name })}
          description={t("zones.deleteDialog.description", { count: deletingZone.provinceCodes.length })}
          footer={
            <>
              <button type="button" onClick={() => setDeletingZone(null)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  update((s) => ({ ...s, zones: s.zones.filter((zone) => zone.id !== deletingZone.id) }));
                  setDeletingZone(null);
                }}
                className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}
              >
                {t("zones.menu.delete")}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#3F3F46]">{t("zones.deleteDialog.body")}</p>
        </AdminDialog>
      )}
    </div>
  );
}

function CarrierDialog({ carrier, isNew, onClose, onSave }: { carrier: Carrier; isNew: boolean; onClose: () => void; onSave: (carrier: Carrier) => void }) {
  const t = useTranslations("AdminPage.shippingPayment");
  const [name, setName] = useState(carrier.name);
  const [kind, setKind] = useState<CarrierKind>(carrier.kind);
  const [note, setNote] = useState(carrier.note);
  const [showError, setShowError] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowError(true);
    if (!name.trim()) return;
    onSave({ ...carrier, name: name.trim(), kind, note: note.trim() });
  };

  return (
    <AdminDialog
      open
      onOpenChange={(open) => !open && onClose()}
      icon={Package}
      title={isNew ? t("carriers.dialog.newTitle") : t("carriers.dialog.editTitle", { name: carrier.name })}
      description={t("carriers.dialog.description")}
      bare
    >
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className={cn(ADMIN_DIALOG_BODY_CLASS, "space-y-4")}>
          <AdminTextField
            required
            label={t("carriers.dialog.name")}
            value={name}
            onValueChange={setName}
            placeholder={t("carriers.dialog.namePlaceholder")}
            maxLength={50}
            error={showError && !name.trim() ? t("carriers.dialog.nameError") : undefined}
          />
          <AdminField label={t("carriers.dialog.kind")}>
            <div className="-mx-1 overflow-x-auto px-1">
              <AdminSegmentedControl<CarrierKind>
                value={kind}
                onChange={setKind}
                options={(["COURIER", "SHOP_DELIVERY", "PICKUP"] as const).map((value) => ({ value, label: t(`carriers.kind.${value}`) }))}
              />
            </div>
          </AdminField>
          <AdminTextArea label={t("carriers.dialog.note")} hint={t("carriers.dialog.noteHint")} rows={3} maxLength={200} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("carriers.dialog.notePlaceholder")} />
          <MiniLabel>{t("carriers.dialog.footnote")}</MiniLabel>
        </div>
        <AdminDialogFooter>
          <button type="button" onClick={onClose} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {isNew ? t("carriers.dialog.create") : t("carriers.dialog.apply")}
          </button>
        </AdminDialogFooter>
      </form>
    </AdminDialog>
  );
}
