"use client";

import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
  AdminDialog,
  AdminInfoTip,
  AdminLangSwitch,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { deleteMaterialAction, updateMaterialAction } from "../../actions/materials.actions";
import { type MaterialFormValues } from "../../schemas/materials.schemas";
import { type AdminMaterialDetail } from "../../types/materials.types";
import {
  CARE_CODES,
  CARE_ICONS,
  MATERIAL_METRICS,
  SEASONS,
  SEASON_ICONS,
  compositionTotal,
  topsFromRolls,
} from "../../utils/materialMeta";
import { CareLabel } from "../shared/CareLabel";
import { CompositionBar } from "../shared/CompositionBar";
import { MaterialSwatch } from "../shared/MaterialSwatch";
import { MetricScale } from "../shared/MetricBars";
import { MaterialCompositionField } from "./MaterialCompositionField";
import { MaterialMediaField } from "./MaterialMediaField";
import { MaterialProcessField } from "./MaterialProcessField";

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]";
type ContentLang = AdminContentLang;

/** Trường văn bản theo ngôn ngữ — cột gốc tiếng Việt, cột `En` cho tiếng Anh */
const LANG_FIELDS = {
  vi: { name: "name", origin: "origin", description: "description", careNote: "careNote" },
  en: { name: "nameEn", origin: "originEn", description: "descriptionEn", careNote: "careNoteEn" },
} as const satisfies Record<ContentLang, Record<string, keyof MaterialFormValues>>;

function toFormValues(material: AdminMaterialDetail): MaterialFormValues {
  return {
    code: material.code,
    name: material.name,
    nameEn: material.nameEn ?? "",
    origin: material.origin ?? "",
    originEn: material.originEn ?? "",
    description: material.description ?? "",
    descriptionEn: material.descriptionEn ?? "",
    composition: material.composition,
    processSteps: material.processSteps,
    closeupImages: material.closeupImages,
    videoUrl: material.videoUrl ?? "",
    metrics: material.metrics,
    seasons: material.seasons,
    careCodes: material.careCodes,
    careNote: material.careNote ?? "",
    careNoteEn: material.careNoteEn ?? "",
    widthCm: material.widthCm,
    metersPerTop: material.metersPerTop,
    metersPerPants: material.metersPerPants,
    isActive: material.isActive,
  };
}

function Card({
  title,
  hint,
  aside,
  children,
  className,
}: {
  title: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-lg font-semibold text-[#09090B]">
          {title}
          {hint && <AdminInfoTip content={hint} />}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0 space-y-1.5", className)}>
      <span className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
        {label}
        {hint && <AdminInfoTip content={hint} />}
      </span>
      {children}
    </label>
  );
}

/** Ô số có đơn vị ở cuối (m, cm) */
function UnitInput({
  value,
  onChange,
  unit,
  step,
  placeholder,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  unit: string;
  step: number;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        placeholder={placeholder}
        className={cn(INPUT_CLASS, "pr-10 font-mono tabular-nums")}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A1A1AA]">{unit}</span>
    </div>
  );
}

/**
 * Màn chi tiết chất liệu vải: nhận diện (xuất xứ, thành phần sợi) → thanh đo vật lý & mùa → ảnh cận / video →
 * quy trình → bảo quản (nhãn may xem trước) → định mức vải. Cột phải: mẫu vải, trạng thái và kho vải theo chất liệu.
 */
export function MaterialEditor({ initialMaterial }: { initialMaterial: AdminMaterialDetail }) {
  const t = useTranslations("AdminPage.materials");
  const format = useFormatter();
  const locale = useLocale();
  const notify = useNotify();
  const router = useRouter();
  const [material, setMaterial] = useState(initialMaterial);
  const [values, setValues] = useState(() => toFormValues(initialMaterial));
  const [baseline, setBaseline] = useState(values);
  const [lang, setLang] = useState<ContentLang>(locale === "en" ? "en" : "vi");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fields = LANG_FIELDS[lang];
  const isDirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const compositionOk = values.composition.length === 0 || compositionTotal(values.composition) === 100;
  const totalMeters = material.rolls.reduce((sum, roll) => sum + roll.remainingMeters, 0);
  const tops = topsFromRolls(material.rolls, values.metersPerTop);
  const perSet =
    values.metersPerTop !== null && values.metersPerPants !== null ? values.metersPerTop + values.metersPerPants : null;

  const set = <K extends keyof MaterialFormValues>(key: K, value: MaterialFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const toggleIn = <T extends string>(list: T[], item: T, order: readonly T[]) =>
    (list.includes(item) ? list.filter((value) => value !== item) : [...list, item]).sort(
      (a, b) => order.indexOf(a) - order.indexOf(b)
    );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setLang("vi");
      notify.error("MATERIAL_NAME_REQUIRED", "MATERIAL_UPDATE_FAILED");
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateMaterialAction({ ...values, materialId: material.id });
      if (!res.success) {
        notify.error(res.error, "MATERIAL_UPDATE_FAILED");
        return;
      }
      notify.success(t("editor.saved"));
      const next = toFormValues(res.data);
      setMaterial(res.data);
      setValues(next);
      setBaseline(next);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteMaterialAction({ materialId: material.id });
      if (!res.success) {
        notify.error(res.error, "MATERIAL_DELETE_FAILED");
        return;
      }
      notify.success(t("delete.success"));
      router.push("/admin/catalog/materials");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <AdminDetailHeader
        backHref="/admin/catalog/materials"
        backLabel={t("editor.back")}
        title={values.name || material.name}
        badge={
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
              baseline.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}
          >
            <span className={cn("size-1.5 rounded-full", baseline.isActive ? "bg-emerald-500" : "bg-rose-500")} />
            {baseline.isActive ? t("status.active") : t("status.inactive")}
          </span>
        }
        subtitle={
          <>
            <span className="font-mono">{values.code}</span>
            {isDirty && <span className="ml-2 text-amber-700">● {t("editor.unsaved")}</span>}
          </>
        }
        actions={
          <>
            {/* Một công tắc ngôn ngữ cho mọi trường song ngữ trên màn (tên, xuất xứ, mô tả, quy trình, ghi chú bảo quản) */}
            <AdminLangSwitch
              value={lang}
              onChange={setLang}
              label={t("editor.langLabel")}
              hint={t("editor.langHint")}
              status={{ en: values.nameEn ? undefined : "missing" }}
            />
            {material.rolls.length === 0 && (
              <button type="button" onClick={() => setConfirmDelete(true)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                <Trash2 size={15} aria-hidden /> {t("delete.open")}
              </button>
            )}
            <button type="submit" disabled={!isDirty || isSaving} className={ADMIN_PRIMARY_BUTTON_CLASS}>
              {isSaving ? t("processing") : t("editor.save")}
            </button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">

          <Card title={t("sections.identity")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t("field.name")}${lang === "vi" ? " *" : ""}`}>
                <input
                  key={`name-${lang}`}
                  value={values[fields.name]}
                  onChange={(e) => set(fields.name, e.target.value)}
                  placeholder={t(`placeholders.${lang}.name`)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label={t("field.code")} hint={t("hints.code")}>
                <input
                  value={values.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                  placeholder={t("placeholders.code")}
                  className={cn(INPUT_CLASS, "font-mono")}
                />
              </Field>
              <Field label={t("field.origin")} className="sm:col-span-2">
                <input
                  key={`origin-${lang}`}
                  value={values[fields.origin]}
                  onChange={(e) => set(fields.origin, e.target.value)}
                  placeholder={t(`placeholders.${lang}.origin`)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label={t("field.description")} className="sm:col-span-2">
                <textarea
                  key={`description-${lang}`}
                  value={values[fields.description]}
                  onChange={(e) => set(fields.description, e.target.value)}
                  rows={3}
                  placeholder={t(`placeholders.${lang}.description`)}
                  className={cn(INPUT_CLASS, "h-auto resize-y py-2")}
                />
              </Field>
            </div>

            <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-body font-semibold text-[#09090B]">
                {t("field.composition")}
                <AdminInfoTip content={t("hints.composition")} />
              </h3>
              <MaterialCompositionField
                items={values.composition}
                onChange={(items) => set("composition", items)}
                inputClassName={INPUT_CLASS}
              />
            </div>
          </Card>

          <Card title={t("sections.metrics")} hint={t("hints.metrics")}>
            <div className="space-y-4">
              {MATERIAL_METRICS.map((key) => (
                <div key={key} className="grid items-center gap-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
                  <span className="text-sm font-medium text-[#3F3F46]">{t(`metrics.${key}.label`)}</span>
                  <div className="min-w-0">
                    <MetricScale
                      value={values.metrics[key]}
                      onChange={(value) => set("metrics", { ...values.metrics, [key]: value })}
                      label={t(`metrics.${key}.label`)}
                    />
                    <div className="mt-1 flex justify-between text-2xs text-[#A1A1AA]">
                      <span>{t(`metrics.${key}.low`)}</span>
                      <span>{t(`metrics.${key}.high`)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid items-center gap-2 border-t border-dashed border-[#E4E4E7] pt-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
              <span className="text-sm font-medium text-[#3F3F46]">{t("field.seasons")}</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SEASONS.map((season) => {
                  const Icon = SEASON_ICONS[season];
                  const on = values.seasons.includes(season);
                  return (
                    <button
                      key={season}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("seasons", toggleIn(values.seasons, season, SEASONS))}
                      className={cn(
                        "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                        on
                          ? "border-[#18181B] bg-[#18181B] text-white"
                          : "border-[#E4E4E7] text-[#52525B] hover:border-[#A1A1AA]"
                      )}
                    >
                      <Icon size={15} aria-hidden /> {t(`season.${season}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card title={t("sections.media")} hint={t("hints.media")}>
            <MaterialMediaField
              images={values.closeupImages}
              onImagesChange={(images) => set("closeupImages", images)}
              videoUrl={values.videoUrl}
              onVideoUrlChange={(url) => set("videoUrl", url)}
              inputClassName={INPUT_CLASS}
            />
          </Card>

          <Card title={t("sections.process")} hint={t("hints.process")}>
            <MaterialProcessField
              steps={values.processSteps}
              onChange={(steps) => set("processSteps", steps)}
              lang={lang}
              inputClassName={INPUT_CLASS}
            />
          </Card>

          <Card title={t("sections.care")} hint={t("hints.care")}>
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CARE_CODES.map((code) => {
                    const Icon = CARE_ICONS[code];
                    const on = values.careCodes.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set("careCodes", toggleIn(values.careCodes, code, CARE_CODES))}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                          on
                            ? "border-[#18181B] bg-[#18181B] text-white"
                            : "border-[#E4E4E7] text-[#3F3F46] hover:border-[#A1A1AA]"
                        )}
                      >
                        <Icon size={15} className="shrink-0" aria-hidden />
                        <span className="leading-tight">{t(`careCode.${code}`)}</span>
                      </button>
                    );
                  })}
                </div>
                <Field label={t("field.careNote")}>
                  <textarea
                    key={`care-${lang}`}
                    value={values[fields.careNote]}
                    onChange={(e) => set(fields.careNote, e.target.value)}
                    rows={2}
                    placeholder={t(`placeholders.${lang}.careNote`)}
                    className={cn(INPUT_CLASS, "h-auto resize-y py-2")}
                  />
                </Field>
              </div>
              <div className="max-w-xs">
                <p className="mb-2 text-xs text-[#71717A]">{t("care.labelPreview")}</p>
                <CareLabel codes={values.careCodes} note={values[fields.careNote]} />
              </div>
            </div>
          </Card>

          <Card title={t("sections.yield")} hint={t("hints.yield")}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("field.widthCm")}>
                <UnitInput
                  value={values.widthCm}
                  onChange={(value) => set("widthCm", value === null ? null : Math.round(value))}
                  unit="cm"
                  step={1}
                  placeholder={t("placeholders.widthCm")}
                />
              </Field>
              <Field label={t("field.metersPerTop")}>
                <UnitInput
                  value={values.metersPerTop}
                  onChange={(value) => set("metersPerTop", value)}
                  unit="m"
                  step={0.1}
                  placeholder={t("placeholders.meters")}
                />
              </Field>
              <Field label={t("field.metersPerPants")}>
                <UnitInput
                  value={values.metersPerPants}
                  onChange={(value) => set("metersPerPants", value)}
                  unit="m"
                  step={0.1}
                  placeholder={t("placeholders.meters")}
                />
              </Field>
            </div>
            {perSet !== null && (
              <p className="mt-3 rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs text-[#52525B]">
                {t("yield.perSet", { meters: format.number(Math.round(perSet * 100) / 100) })}
              </p>
            )}
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-[8rem]">
          <section className={cn(ADMIN_CARD_CLASS, "overflow-hidden")}>
            <MaterialSwatch src={values.closeupImages[0] ?? null} className="aspect-[4/3]">
              <span className="absolute left-2.5 top-2.5 rounded bg-white/90 px-1.5 py-0.5 font-mono text-2xs font-semibold text-[#09090B] shadow-2xs">
                {values.code}
              </span>
            </MaterialSwatch>
            <div className="space-y-3 px-4 pb-4 pt-1">
              <div>
                <p className="truncate text-body font-semibold text-[#09090B]">{values[fields.name] || values.name}</p>
                <p className="truncate text-xs text-[#71717A]">{values[fields.origin] || t("card.noOrigin")}</p>
              </div>
              <CompositionBar items={values.composition} />
              {!compositionOk && <p className="text-xs text-amber-700">{t("composition.notFull")}</p>}

              <label className="flex cursor-pointer items-start justify-between gap-3 border-t border-dashed border-[#E4E4E7] pt-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#09090B]">{t("field.isActive")}</span>
                  <span className="mt-0.5 block text-2xs leading-4 text-[#A1A1AA]">{t("hints.isActive")}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={values.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#18181B]/25",
                    values.isActive ? "bg-[#18181B]" : "bg-[#E4E4E7]"
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full bg-white shadow-xs transition-transform",
                      values.isActive ? "translate-x-[18px]" : "translate-x-0.5"
                    )}
                  />
                </span>
              </label>
            </div>
          </section>

          <section className={cn(ADMIN_CARD_CLASS, "p-4")}>
            <h2 className="mb-3 text-lg font-semibold text-[#09090B]">{t("stock.title")}</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[#FAFAFA] px-3 py-2.5">
                <p className="font-mono text-xl font-semibold tabular-nums text-[#09090B]">{format.number(totalMeters)}</p>
                <p className="text-xs text-[#71717A]">{t("stock.meters", { rolls: material.rolls.length })}</p>
              </div>
              <div className="rounded-lg bg-[#FAFAFA] px-3 py-2.5">
                <p className="font-mono text-xl font-semibold tabular-nums text-[#09090B]">{tops ?? "—"}</p>
                <p className="text-xs text-[#71717A]">{t("stock.tops")}</p>
              </div>
            </div>
            {tops === null && <p className="mt-2 text-2xs text-[#A1A1AA]">{t("stock.needYield")}</p>}
            {material.rolls.length > 0 ? (
              <ul className="mt-3 divide-y divide-dashed divide-[#E4E4E7] border-t border-dashed border-[#E4E4E7]">
                {material.rolls.map((roll) => (
                  <li key={roll.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[#09090B]">{roll.name}</span>
                      <span className="block font-mono text-2xs text-[#71717A]">{roll.code}</span>
                    </span>
                    <span
                      className={cn(
                        "font-mono text-sm tabular-nums",
                        roll.isLow ? "font-semibold text-rose-600" : "text-[#09090B]"
                      )}
                    >
                      {format.number(roll.remainingMeters)} m
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-[#71717A]">{t("stock.empty")}</p>
            )}
          </section>
        </aside>
      </div>

      {confirmDelete && (
        <AdminDialog
          open
          onOpenChange={setConfirmDelete}
          icon={Trash2}
          tone="danger"
          title={t("delete.title")}
          description={t("delete.description", { name: material.name })}
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}
              >
                {isDeleting ? t("processing") : t("delete.confirm")}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#52525B]">{t("delete.body")}</p>
        </AdminDialog>
      )}
    </form>
  );
}
