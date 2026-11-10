"use client";

import { useState, type FormEvent } from "react";
import { MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_BODY_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminCheckbox,
  AdminDialog,
  AdminDialogFooter,
  AdminField,
  AdminFilterSelect,
  AdminSwitch,
  AdminTextField,
} from "@/features/admin/core/ui";
import { type Carrier, type Province, type ShippingZone } from "../../types/shippingPayment.types";
import { formatDigits, parseDigits } from "../shared/SettingsParts";

const REGIONS = ["NORTH", "CENTRAL", "SOUTH"] as const;

/**
 * Thêm / sửa một vùng giao hàng: phí, thời gian, đơn vị giao và danh sách tỉnh. Tỉnh đang thuộc vùng khác vẫn chọn được —
 * lưu thì tỉnh đó chuyển sang vùng này (mỗi tỉnh chỉ thuộc một vùng); dòng tỉnh ghi rõ đang ở vùng nào.
 */
export function ZoneDialog({
  zone,
  zones,
  carriers,
  provinces,
  onClose,
  onSave,
}: {
  zone: ShippingZone;
  zones: ShippingZone[];
  carriers: Carrier[];
  provinces: Province[];
  onClose: () => void;
  onSave: (zone: ShippingZone) => void;
}) {
  const t = useTranslations("AdminPage.shippingPayment");
  const isNew = !zones.some((item) => item.id === zone.id);
  const [name, setName] = useState(zone.name);
  const [baseFee, setBaseFee] = useState<number | null>(zone.baseFee);
  const [extraFee, setExtraFee] = useState<number | null>(zone.extraItemFee);
  const [etaMin, setEtaMin] = useState(String(zone.etaMinDays));
  const [etaMax, setEtaMax] = useState(String(zone.etaMaxDays));
  const [carrierId, setCarrierId] = useState(zone.carrierId);
  const [freeShip, setFreeShip] = useState(zone.freeShipEligible);
  const [picked, setPicked] = useState(() => new Set(zone.provinceCodes));
  const [showErrors, setShowErrors] = useState(false);

  const ownerOf = (code: string) => zones.find((item) => item.id !== zone.id && item.provinceCodes.includes(code));
  const moving = [...picked].filter((code) => ownerOf(code)).length;
  const deliveryCarriers = carriers.filter((carrier) => carrier.kind !== "PICKUP");

  const errors = {
    name: !name.trim() ? t("zones.errors.name") : null,
    fee: baseFee === null ? t("zones.errors.fee") : null,
    eta: !/^\d{1,2}$/.test(etaMin) || !/^\d{1,2}$/.test(etaMax) || Number(etaMin) > Number(etaMax) ? t("zones.errors.eta") : null,
    provinces: picked.size === 0 ? t("zones.errors.provinces") : null,
  };

  const toggle = (code: string, checked: boolean) =>
    setPicked((current) => {
      const next = new Set(current);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (Object.values(errors).some(Boolean)) return;
    onSave({
      ...zone,
      name: name.trim(),
      baseFee: baseFee ?? 0,
      extraItemFee: extraFee ?? 0,
      etaMinDays: Number(etaMin),
      etaMaxDays: Number(etaMax),
      carrierId,
      freeShipEligible: freeShip,
      provinceCodes: provinces.filter((province) => picked.has(province.code)).map((province) => province.code),
    });
  };

  return (
    <AdminDialog
      open
      onOpenChange={(open) => !open && onClose()}
      icon={MapPinned}
      title={isNew ? t("zones.dialog.newTitle") : t("zones.dialog.editTitle", { name: zone.name })}
      description={t("zones.dialog.description")}
      size="2xl"
      bare
    >
      {/* Form tự dựng để có noValidate — lỗi hiện bằng chữ dưới ô thay vì bong bóng mặc định của trình duyệt */}
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className={cn(ADMIN_DIALOG_BODY_CLASS, "space-y-5")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminTextField
            required
            className="sm:col-span-2"
            label={t("zones.field.name")}
            value={name}
            onValueChange={setName}
            placeholder={t("zones.placeholder.name")}
            maxLength={60}
            error={showErrors ? (errors.name ?? undefined) : undefined}
          />
          <AdminTextField
            required
            label={t("zones.field.baseFee")}
            hint={t("zones.hint.baseFee")}
            mask="currency"
            suffix="₫"
            inputMode="numeric"
            value={formatDigits(baseFee)}
            onValueChange={(next) => setBaseFee(parseDigits(next))}
            placeholder="30.000"
            error={showErrors ? (errors.fee ?? undefined) : undefined}
            inputClassName="font-mono tabular-nums"
          />
          <AdminTextField
            label={t("zones.field.extraFee")}
            hint={t("zones.hint.extraFee")}
            mask="currency"
            suffix="₫"
            inputMode="numeric"
            value={formatDigits(extraFee)}
            onValueChange={(next) => setExtraFee(parseDigits(next))}
            placeholder="0"
            inputClassName="font-mono tabular-nums"
          />
          <AdminField label={t("zones.field.eta")} required hint={t("zones.hint.eta")} error={showErrors ? (errors.eta ?? undefined) : undefined}>
            <div className="flex items-center gap-2">
              <div className="w-16"><AdminTextField aria-label={t("zones.field.etaMin")} value={etaMin} onValueChange={(next) => setEtaMin(next.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" inputClassName="text-center font-mono tabular-nums" /></div>
              <span className="text-[#A1A1AA]">–</span>
              <div className="w-16"><AdminTextField aria-label={t("zones.field.etaMax")} value={etaMax} onValueChange={(next) => setEtaMax(next.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" inputClassName="text-center font-mono tabular-nums" /></div>
              <span className="shrink-0 text-sm text-[#71717A]">{t("zones.days")}</span>
            </div>
          </AdminField>
          <AdminField label={t("zones.field.carrier")}>
            <AdminFilterSelect
              label={t("zones.field.carrierShort")}
              value={carrierId}
              onChange={setCarrierId}
              options={deliveryCarriers.map((carrier) => ({ value: carrier.id, label: carrier.isActive ? carrier.name : t("carriers.offSuffix", { name: carrier.name }) }))}
              className="h-10 w-full"
            />
          </AdminField>
          <div className="flex items-start justify-between gap-4 rounded-xl border border-[#E4E4E7] px-3.5 py-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium text-[#3F3F46]">{t("zones.field.freeShip")}</p>
              <p className="mt-0.5 text-xs text-[#71717A]">{t("zones.hint.freeShip")}</p>
            </div>
            <AdminSwitch checked={freeShip} onChange={setFreeShip} label={t("zones.field.freeShip")} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-[#3F3F46]">
              {t("zones.field.provinces")} <span className="text-rose-600">*</span>
            </p>
            <p className="text-xs text-[#71717A]">
              {t("zones.dialog.picked", { count: picked.size })}
              {moving > 0 && <span className="text-amber-700"> · {t("zones.dialog.moving", { count: moving })}</span>}
            </p>
          </div>
          {showErrors && errors.provinces && <p className="mb-2 text-xs text-rose-600">{errors.provinces}</p>}
          <div className="space-y-4">
            {REGIONS.map((region) => {
              const list = provinces.filter((province) => province.region === region);
              const all = list.every((province) => picked.has(province.code));
              return (
                <div key={region}>
                  <label className="mb-1.5 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#71717A]">
                    <AdminCheckbox
                      checked={all}
                      indeterminate={!all && list.some((province) => picked.has(province.code))}
                      onChange={(checked) => list.forEach((province) => toggle(province.code, checked))}
                      label={t(`region.${region}`)}
                    />
                    {t(`region.${region}`)}
                  </label>
                  <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-3">
                    {list.map((province) => {
                      const owner = ownerOf(province.code);
                      return (
                        <label key={province.code} className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-[#FAFAFA]">
                          <AdminCheckbox checked={picked.has(province.code)} onChange={(checked) => toggle(province.code, checked)} label={province.name} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-[#09090B]">{province.name}</span>
                            {owner && <span className={cn("block truncate text-2xs", picked.has(province.code) ? "text-amber-700" : "text-[#A1A1AA]")}>{owner.name}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <AdminDialogFooter>
        <button type="button" onClick={onClose} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
          {t("cancel")}
        </button>
        <button type="submit" className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
          {isNew ? t("zones.dialog.create") : t("zones.dialog.apply")}
        </button>
      </AdminDialogFooter>
      </form>
    </AdminDialog>
  );
}
