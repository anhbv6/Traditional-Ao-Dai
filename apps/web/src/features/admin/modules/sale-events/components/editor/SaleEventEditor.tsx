"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Copy, Flag, MoreHorizontal, Pause, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDatePicker,
  AdminDetailHeader,
  AdminDialog,
  AdminField,
  AdminLangSwitch,
  AdminSegmentedControl,
  AdminSwitch,
  AdminTextArea,
  AdminTextField,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import {
  type AdminSaleEvent,
  type SaleActivity,
  type SaleDiscountType,
  type SaleEventEditorData,
  type SaleProductRule,
  type SaleScope,
  type SaleStoredStatus,
} from "../../types/saleEvents.types";
import {
  DAY_MS,
  DEEP_DISCOUNT_PERCENT,
  HOUR_MS,
  TIME_REGEX,
  computeSalePrice,
  effectiveEnd,
  findConflicts,
  mockId,
  productsInScope,
  saleState,
  shopPartsToIso,
  toShopParts,
} from "../../utils/saleRules";
import { SaleBadge, SaleStateText, useSaleDateText, useSaleOfferText } from "../shared/SaleParts";
import { PublishChecklist, SaleActivityLog, SaleResults, StorefrontPreview, type CheckItem } from "./SaleAside";
import { SaleProductsCard, buildProductRows } from "./SaleProductsCard";
import { ScopePickerDialog, type PickerOption } from "./ScopePickerDialog";

const MOCK_ACTOR = "Bạn";
const BADGE_MAX = 18;

function Card({ title, description, aside, children, className }: { title: string; description?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-[#71717A]">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** Ngày YYYY-MM-DD cộng n ngày */
const addDays = (day: string, days: number) => new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();
const digits = (raw: string) => (raw.replace(/\D/g, "") ? Number(raw.replace(/\D/g, "")) : null);

const EMPTY_EVENT: Omit<AdminSaleEvent, "startAt" | "endAt"> = {
  id: "",
  name: "",
  nameEn: null,
  badge: "",
  badgeEn: null,
  description: null,
  descriptionEn: null,
  status: "DRAFT",
  endedEarlyAt: null,
  discountType: "PERCENTAGE",
  value: 0,
  scope: "COLLECTIONS",
  scopeIds: [],
  excludeCustom: true,
  excludedProductIds: [],
  productRules: {},
  perCustomerLimit: null,
  stackWithCoupon: false,
  showCountdown: true,
  featuredOnHome: false,
  stats: null,
  activity: [],
  createdBy: MOCK_ACTOR,
  updatedAt: "",
};

/**
 * Soạn / xem chương trình sale. Trái theo thứ tự người soạn nghĩ: hiển thị gì → giảm bao nhiêu & khi nào → áp cho đâu →
 * từng sản phẩm ra giá nào → quy tắc mua. Phải: kiểm tra trước khi công bố (chặn / nhắc), xem trước thẻ sản phẩm ở
 * storefront, kết quả bán (khi đã chạy), nhật ký. Đã kết thúc thì chỉ xem — nhân bản để chạy lại.
 * Dữ liệu mock: lưu chỉ đổi state ở client.
 */
export function SaleEventEditor({ data }: { data: SaleEventEditorData }) {
  const t = useTranslations("AdminPage.saleEvents");
  const locale = useLocale() as Locale;
  const notify = useNotify();
  const router = useRouter();
  const offerText = useSaleOfferText();
  const dateText = useSaleDateText();

  const today = toShopParts(data.now).day;
  const seed = data.event ?? data.template;
  const initialStart = seed ? toShopParts(seed.startAt) : { day: addDays(today, 1), time: "00:00" };
  const initialEnd = seed ? toShopParts(seed.endAt) : { day: addDays(today, 7), time: "23:59" };

  // Trạng thái lưu, nhật ký: đổi khi bấm lưu / tạm dừng (mock)
  const [saved, setSaved] = useState<AdminSaleEvent | null>(data.event);
  const base = saved ?? { ...EMPTY_EVENT, ...(data.template ?? {}) };

  const [lang, setLang] = useState<AdminContentLang>("vi");
  const [text, setText] = useState({
    name: base.name,
    nameEn: base.nameEn ?? "",
    badge: base.badge,
    badgeEn: base.badgeEn ?? "",
    description: base.description ?? "",
    descriptionEn: base.descriptionEn ?? "",
  });
  const [startDay, setStartDay] = useState(initialStart.day);
  const [startTime, setStartTime] = useState(initialStart.time);
  const [endDay, setEndDay] = useState(initialEnd.day);
  const [endTime, setEndTime] = useState(initialEnd.time);
  const [discountType, setDiscountType] = useState<SaleDiscountType>(base.discountType);
  const [valueRaw, setValueRaw] = useState(base.value ? String(base.value) : "");
  const [scope, setScope] = useState<SaleScope>(base.scope);
  const [scopeIds, setScopeIds] = useState<string[]>(base.scopeIds);
  const [excludeCustom, setExcludeCustom] = useState(base.excludeCustom);
  const [excludedProductIds, setExcludedProductIds] = useState<string[]>(base.excludedProductIds);
  const [productRules, setProductRules] = useState<Record<string, SaleProductRule>>(base.productRules);
  const [perCustomerRaw, setPerCustomerRaw] = useState(base.perCustomerLimit ? String(base.perCustomerLimit) : "");
  const [stackWithCoupon, setStackWithCoupon] = useState(base.stackWithCoupon);
  const [showCountdown, setShowCountdown] = useState(base.showCountdown);
  const [featuredOnHome, setFeaturedOnHome] = useState(base.featuredOnHome);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const state = saved ? saleState(saved, data.now) : "DRAFT";
  const readOnly = state === "ENDED";
  const started = state === "RUNNING" || state === "PAUSED";

  // ─── Giá trị suy ra ──────────────────────────────────────────────────────
  const value = discountType === "PERCENTAGE" ? Number(valueRaw.replace(",", ".")) || 0 : (digits(valueRaw) ?? 0);
  const rule = { discountType, value };
  const timesValid = TIME_REGEX.test(startTime) && TIME_REGEX.test(endTime) && Boolean(startDay) && Boolean(endDay);
  const startAt = timesValid ? shopPartsToIso(startDay, startTime) : null;
  const endAt = timesValid ? shopPartsToIso(endDay, endTime) : null;

  const draft = {
    id: saved?.id ?? "__new__",
    scope,
    scopeIds,
    excludeCustom,
    excludedProductIds,
    productRules,
    startAt: startAt ?? data.now,
    endAt: endAt ?? data.now,
  };
  const inScope = productsInScope(draft, data.products);
  const conflicts = findConflicts(draft, data.others, data.products, data.now);
  const rows = buildProductRows(inScope, draft, rule, conflicts);
  const appliedRows = rows.filter((row) => !row.excluded);
  const customInScope = inScope.filter((product) => product.saleMode === "CUSTOM").length;
  const featuredElsewhere = data.others.find((other) => {
    const otherState = saleState(other, data.now);
    return other.featuredOnHome && (otherState === "RUNNING" || otherState === "SCHEDULED") && startAt && endAt && other.startAt < endAt && startAt < effectiveEnd(other);
  });

  // ─── Lỗi ─────────────────────────────────────────────────────────────────
  const errors = {
    name: !text.name.trim() ? t("errors.name") : null,
    badge: !text.badge.trim() ? t("errors.badge") : null,
    value:
      value <= 0
        ? t(`errors.value.${discountType}`)
        : discountType === "PERCENTAGE" && value > 90
          ? t("errors.percentMax")
          : null,
    time: !timesValid
      ? t("errors.time")
      : endAt! <= startAt!
        ? t("errors.endBeforeStart")
        : endAt! <= data.now
          ? t("errors.endPast")
          : null,
  };
  const shown = (key: keyof typeof errors) => (showErrors ? (errors[key] ?? undefined) : undefined);

  // ─── Kiểm tra trước khi công bố ──────────────────────────────────────────
  const count = (warning: (typeof rows)[number]["warnings"][number]) => appliedRows.filter((row) => row.warnings.includes(warning)).length;
  const durationDays = startAt && endAt ? (Date.parse(endAt) - Date.parse(startAt)) / DAY_MS : 0;
  const checks: CheckItem[] = [
    appliedRows.length > 0
      ? { key: "products", status: "ok", label: t("check.products", { count: appliedRows.length }) }
      : { key: "products", status: "block", label: t("check.noProducts"), detail: t("check.noProductsDetail") },
    errors.time
      ? { key: "time", status: "block", label: errors.time }
      : {
          key: "time",
          status: "ok",
          label: t("check.time", { days: Math.max(1, Math.round(durationDays)) }),
          detail: `${dateText(startAt!, true)} → ${dateText(endAt!, true)}`,
        },
    errors.value ? { key: "value", status: "block", label: errors.value } : { key: "value", status: "ok", label: offerText(rule) },
    ...(errors.name || errors.badge ? [{ key: "text", status: "block" as const, label: errors.name ?? errors.badge ?? "" }] : []),
    ...(count("DEEP") ? [{ key: "deep", status: "warn" as const, label: t("check.deep", { count: count("DEEP"), percent: DEEP_DISCOUNT_PERCENT }), detail: t("check.deepDetail") }] : []),
    ...(count("CONFLICT") ? [{ key: "conflict", status: "warn" as const, label: t("check.conflict", { count: count("CONFLICT") }), detail: t("check.conflictDetail") }] : []),
    ...(count("OUT_OF_STOCK") ? [{ key: "stock", status: "warn" as const, label: t("check.stock", { count: count("OUT_OF_STOCK") }), detail: t("check.stockDetail") }] : []),
    ...(count("NO_DISCOUNT") ? [{ key: "noDiscount", status: "warn" as const, label: t("check.noDiscount", { count: count("NO_DISCOUNT") }) }] : []),
    ...(!text.nameEn.trim() || !text.badgeEn.trim() ? [{ key: "en", status: "warn" as const, label: t("check.english"), detail: t("check.englishDetail") }] : []),
    ...(featuredOnHome && featuredElsewhere ? [{ key: "home", status: "warn" as const, label: t("check.home", { name: featuredElsewhere.name }) }] : []),
  ];
  const blocking = checks.some((check) => check.status === "block");

  // ─── Thay đổi chưa lưu ───────────────────────────────────────────────────
  const snapshot = JSON.stringify([text, startDay, startTime, endDay, endTime, discountType, value, scope, scopeIds, excludeCustom, excludedProductIds, productRules, perCustomerRaw, stackWithCoupon, showCountdown, featuredOnHome]);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const dirty = snapshot !== savedSnapshot;

  // ─── Lưu (mock) ──────────────────────────────────────────────────────────
  const commit = (status: SaleStoredStatus, kind: SaleActivity["kind"], extra: Partial<AdminSaleEvent> = {}) => {
    const next: AdminSaleEvent = {
      ...base,
      id: saved?.id ?? mockId("s"),
      name: text.name.trim(),
      nameEn: text.nameEn.trim() || null,
      badge: text.badge.trim(),
      badgeEn: text.badgeEn.trim() || null,
      description: text.description.trim() || null,
      descriptionEn: text.descriptionEn.trim() || null,
      startAt: startAt ?? base.startAt ?? data.now,
      endAt: endAt ?? base.endAt ?? data.now,
      status,
      discountType,
      value,
      scope,
      scopeIds,
      excludeCustom,
      excludedProductIds,
      productRules,
      perCustomerLimit: digits(perCustomerRaw),
      stackWithCoupon,
      showCountdown,
      featuredOnHome,
      updatedAt: new Date().toISOString(),
      activity: [{ id: mockId("a"), kind, at: new Date().toISOString(), actor: MOCK_ACTOR, note: null }, ...(saved?.activity ?? [])],
      ...extra,
    };
    if (!saved) {
      notify.success(status === "DRAFT" ? t("toast.createdDraft", { name: next.name }) : t("toast.createdPublished", { name: next.name }));
      router.push("/admin/sale-events");
      return;
    }
    setSaved(next);
    setSavedSnapshot(snapshot);
    setShowErrors(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) return;
    setShowErrors(true);
    if (blocking) return notify.error("SALE_EVENT_INVALID");
    const status: SaleStoredStatus = saved && saved.status !== "DRAFT" ? saved.status : "PUBLISHED";
    commit(status, saved?.status === "DRAFT" || !saved ? "PUBLISHED" : "UPDATED");
    if (saved) notify.success(saved.status === "DRAFT" ? t("toast.published", { name: text.name }) : t("toast.saved"));
  };

  const saveDraft = () => {
    setShowErrors(true);
    if (errors.name) return notify.error("SALE_EVENT_NAME_REQUIRED");
    commit("DRAFT", saved ? "UPDATED" : "CREATED");
    if (saved) notify.success(t("toast.savedDraft"));
  };

  const setStatus = (status: SaleStoredStatus, kind: SaleActivity["kind"], message: string) => {
    if (!saved) return;
    setSaved({
      ...saved,
      status,
      activity: [{ id: mockId("a"), kind, at: new Date().toISOString(), actor: MOCK_ACTOR, note: null }, ...saved.activity],
    });
    notify.success(message);
  };

  const endNow = () => {
    if (!saved) return;
    setSaved({
      ...saved,
      endedEarlyAt: data.now,
      featuredOnHome: false,
      activity: [{ id: mockId("a"), kind: "ENDED_EARLY", at: new Date().toISOString(), actor: MOCK_ACTOR, note: null }, ...saved.activity],
    });
    setConfirmEnd(false);
    notify.success(t("toast.ended", { name: saved.name }));
  };

  // ─── Phạm vi ─────────────────────────────────────────────────────────────
  const scopeOptions: PickerOption[] =
    scope === "COLLECTIONS"
      ? data.collections.map((option) => ({ id: option.id, name: option.name, meta: t("productCount", { count: data.products.filter((product) => product.isActive && product.collectionIds.includes(option.id)).length }) }))
      : scope === "CATEGORIES"
        ? data.categories.map((option) => ({ id: option.id, name: option.name, meta: t("productCount", { count: data.products.filter((product) => product.isActive && product.categoryId === option.id).length }) }))
        : data.products.map((product) => ({
            id: product.id,
            name: product.name,
            meta: `${product.code} · ${product.categoryName} · ${formatVnd(product.basePrice, locale)}`,
            disabledReason: product.isActive ? undefined : t("picker.inactive"),
          }));
  const scopeName = (id: string) => scopeOptions.find((option) => option.id === id)?.name ?? id;

  const changeRule = (productId: string, change: Partial<SaleProductRule>) =>
    setProductRules((current) => {
      const next = { ...(current[productId] ?? { overridePrice: null, quota: null, sold: 0 }), ...change };
      return { ...current, [productId]: next };
    });

  // Ví dụ một dòng cho mức giảm: lấy món đầu tiên đang được giảm (hoặc một chiếc áo 1.890.000 ₫ mẫu)
  const exampleBase = appliedRows[0]?.product.basePrice ?? 1_890_000;
  const exampleSale = computeSalePrice(exampleBase, rule);

  // ─── Đầu trang ───────────────────────────────────────────────────────────
  const headerMenu: AppMenuEntry[] = [];
  if (saved && !readOnly) {
    if (state === "RUNNING" || state === "SCHEDULED")
      headerMenu.push({ key: "pause", label: t("menu.pause"), description: t("menu.pauseHint"), icon: Pause, onSelect: () => setStatus("PAUSED", "PAUSED", t("toast.paused", { name: saved.name })) });
    headerMenu.push({ key: "duplicate", label: t("menu.duplicate"), icon: Copy, href: `/admin/sale-events/new?from=${saved.id}` });
    if (state !== "DRAFT") headerMenu.push({ type: "separator", key: "sep" }, { key: "end", label: t("menu.endNow"), icon: Flag, tone: "danger", onSelect: () => setConfirmEnd(true) });
  }

  const startsNow = startAt !== null && startAt <= data.now;
  const titleText = saved?.name || text.name || t("editor.newTitle");
  const subtitle = readOnly
    ? t("editor.endedSubtitle")
    : dirty
      ? t("editor.unsaved")
      : saved
        ? t("editor.savedSubtitle", { actor: saved.createdBy, date: dateText(saved.updatedAt, true) })
        : data.template
          ? t("editor.copySubtitle")
          : t("editor.newSubtitle");

  return (
    <form onSubmit={handleSubmit} noValidate className="contents">
      <AdminDetailHeader
        backHref="/admin/sale-events"
        backLabel={t("editor.back")}
        title={titleText}
        badge={saved ? <span className="text-sm"><SaleStateText event={saved} now={data.now} /></span> : undefined}
        subtitle={<span className={cn(dirty && !readOnly && "text-amber-700")}>{subtitle}</span>}
        actions={
          readOnly ? (
            saved && (
              <button type="button" onClick={() => router.push(`/admin/sale-events/new?from=${saved.id}`)} className={ADMIN_PRIMARY_BUTTON_CLASS}>
                <Copy size={15} aria-hidden /> {t("editor.rerun")}
              </button>
            )
          ) : (
            <>
              {headerMenu.length > 0 && (
                <AppMenu
                  tone="admin"
                  width={240}
                  align="end"
                  items={headerMenu}
                  trigger={
                    <button type="button" aria-label={t("editor.more")} className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "border border-[#E4E4E7] bg-white")}>
                      <MoreHorizontal size={18} />
                    </button>
                  }
                />
              )}
              {state === "PAUSED" && saved && (
                <button type="button" onClick={() => setStatus("PUBLISHED", "RESUMED", t("toast.resumed", { name: saved.name }))} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                  {t("menu.resume")}
                </button>
              )}
              {(!saved || state === "DRAFT") && (
                <button type="button" onClick={saveDraft} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                  {t("editor.saveDraft")}
                </button>
              )}
              <button type="submit" className={ADMIN_PRIMARY_BUTTON_CLASS}>
                {!saved || state === "DRAFT" ? (startsNow ? t("editor.publishNow") : t("editor.publish")) : t("editor.save")}
              </button>
            </>
          )
        }
      />

      {(state === "PAUSED" || readOnly || started) && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            state === "PAUSED" ? "border-rose-200 bg-rose-50 text-rose-800" : readOnly ? "border-[#E4E4E7] bg-white text-[#52525B]" : "border-amber-200 bg-amber-50 text-amber-900"
          )}
        >
          {state === "PAUSED" ? t("banner.paused") : readOnly ? t("banner.ended") : t("banner.running")}
        </div>
      )}

      {/* Điểm ngắt theo bề rộng vùng nội dung (khung admin có thêm cột phải) — không theo màn hình */}
      <div className="@container">
      <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_340px]">
        <fieldset disabled={readOnly} className="@container min-w-0 space-y-5">
          {/* 1 · Hiển thị */}
          <Card
            title={t("editor.sections.display")}
            description={t("editor.sections.displayHint")}
            aside={
              <AdminLangSwitch
                value={lang}
                onChange={setLang}
                label={t("editor.lang")}
                hint={t("editor.langHint")}
                status={{ en: !text.nameEn.trim() || !text.badgeEn.trim() ? "missing" : undefined }}
                missingLabel={t("editor.langMissing")}
              />
            }
          >
            <div className="grid gap-4 @xl:grid-cols-[minmax(0,1fr)_220px]">
              <AdminTextField
                key={`name-${lang}`}
                required={lang === "vi"}
                label={t("editor.field.name")}
                hint={t("editor.hint.name")}
                value={lang === "vi" ? text.name : text.nameEn}
                onValueChange={(next) => setText((current) => ({ ...current, [lang === "vi" ? "name" : "nameEn"]: next }))}
                placeholder={lang === "vi" ? t("editor.placeholder.name") : text.name || t("editor.placeholder.name")}
                maxLength={80}
                error={lang === "vi" ? shown("name") : undefined}
              />
              <AdminTextField
                key={`badge-${lang}`}
                required={lang === "vi"}
                label={t("editor.field.badge")}
                hint={t("editor.hint.badge", { max: BADGE_MAX })}
                value={lang === "vi" ? text.badge : text.badgeEn}
                onValueChange={(next) => setText((current) => ({ ...current, [lang === "vi" ? "badge" : "badgeEn"]: next.slice(0, BADGE_MAX) }))}
                placeholder={lang === "vi" ? t("editor.placeholder.badge") : text.badge || t("editor.placeholder.badge")}
                suffix={<span className="font-mono text-2xs text-[#A1A1AA]">{(lang === "vi" ? text.badge : text.badgeEn).length}/{BADGE_MAX}</span>}
                error={lang === "vi" ? shown("badge") : undefined}
              />
            </div>
            <AdminTextArea
              key={`desc-${lang}`}
              className="mt-4"
              label={t("editor.field.description")}
              hint={t("editor.hint.description")}
              rows={2}
              maxLength={240}
              value={lang === "vi" ? text.description : text.descriptionEn}
              onChange={(event) => setText((current) => ({ ...current, [lang === "vi" ? "description" : "descriptionEn"]: event.target.value }))}
              placeholder={t("editor.placeholder.description")}
            />
          </Card>

          {/* 2 · Ưu đãi + thời gian — cạnh nhau ở màn rộng vì luôn được đọc cùng nhau */}
          <div className="grid items-start gap-5 @3xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <Card title={t("editor.sections.offer")}>
              <div className="space-y-4">
                <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
                  <AdminSegmentedControl<SaleDiscountType>
                    value={discountType}
                    onChange={(next) => {
                      setDiscountType(next);
                      setValueRaw("");
                    }}
                    disabled={readOnly}
                    options={(["PERCENTAGE", "FIXED_AMOUNT", "FIXED_PRICE"] as const).map((type) => ({ value: type, label: t(`editor.type.${type}`) }))}
                  />
                </div>
                {discountType === "PERCENTAGE" ? (
                  <AdminTextField
                    key="percent"
                    required
                    label={t("editor.field.percent")}
                    hint={t("editor.hint.percent")}
                    value={valueRaw}
                    onValueChange={(next) => setValueRaw(next.replace(/[^0-9.,]/g, ""))}
                    inputMode="decimal"
                    suffix="%"
                    placeholder="15"
                    error={shown("value")}
                    inputClassName="font-mono tabular-nums"
                  />
                ) : (
                  <AdminTextField
                    key={discountType}
                    required
                    label={t(`editor.field.${discountType}`)}
                    hint={t(`editor.hint.${discountType}`)}
                    mask="currency"
                    suffix="₫"
                    value={valueRaw}
                    onValueChange={(next) => setValueRaw(next)}
                    inputMode="numeric"
                    placeholder={discountType === "FIXED_AMOUNT" ? "200.000" : "199.000"}
                    error={shown("value")}
                    inputClassName="font-mono tabular-nums"
                  />
                )}
                <p className="rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs text-[#52525B]">
                  {value > 0 ? (
                    <>
                      {t("editor.example")}{" "}
                      <span className="font-mono tabular-nums line-through decoration-[#A1A1AA]">{formatVnd(exampleBase, locale)}</span>
                      {" → "}
                      <span className="font-mono font-semibold tabular-nums text-[#09090B]">{formatVnd(exampleSale, locale)}</span>
                    </>
                  ) : (
                    t("editor.exampleEmpty")
                  )}
                </p>
              </div>
            </Card>

            <Card title={t("editor.sections.time")} description={t("editor.timezone")}>
              <div className="space-y-4">
                <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3">
                  <AdminField label={t("editor.field.start")} required hint={started ? t("editor.hint.startLocked") : undefined}>
                    <AdminDatePicker value={startDay} onChange={setStartDay} disabled={readOnly || started} />
                  </AdminField>
                  <AdminTextField
                    label={t("editor.field.time")}
                    value={startTime}
                    onValueChange={(next) => setStartTime(next.replace(/[^0-9:]/g, "").slice(0, 5))}
                    placeholder="00:00"
                    disabled={readOnly || started}
                    inputClassName="font-mono tabular-nums text-center"
                  />
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3">
                  <AdminField label={t("editor.field.end")} required error={shown("time")}>
                    <AdminDatePicker value={endDay} onChange={setEndDay} min={startDay} invalid={Boolean(shown("time"))} disabled={readOnly} />
                  </AdminField>
                  <AdminTextField
                    label={t("editor.field.time")}
                    value={endTime}
                    onValueChange={(next) => setEndTime(next.replace(/[^0-9:]/g, "").slice(0, 5))}
                    placeholder="23:59"
                    disabled={readOnly}
                    inputClassName="font-mono tabular-nums text-center"
                  />
                </div>
                {!readOnly && !started && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#71717A]">{t("editor.quick.label")}</span>
                    {(
                      [
                        ["weekend", () => {
                          const wd = weekday(today);
                          const friday = wd === 6 ? addDays(today, -1) : wd === 0 ? addDays(today, -2) : addDays(today, 5 - wd);
                          return [friday < today ? today : friday, wd === 6 || wd === 0 ? "00:00" : "18:00", addDays(friday, 2), "23:59"];
                        }],
                        ["week", () => [addDays(today, 1), "00:00", addDays(today, 7), "23:59"]],
                        ["month", () => {
                          const [year, month] = today.split("-").map(Number);
                          const last = new Date(Date.UTC(year!, month!, 0)).toISOString().slice(0, 10);
                          return [addDays(today, 1), "00:00", last <= addDays(today, 1) ? new Date(Date.UTC(year!, month! + 1, 0)).toISOString().slice(0, 10) : last, "23:59"];
                        }],
                      ] as const
                    ).map(([key, make]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const [sd, st, ed, et] = make();
                          setStartDay(sd);
                          setStartTime(st);
                          setEndDay(ed);
                          setEndTime(et);
                        }}
                        className="h-7 cursor-pointer rounded-full border border-[#E4E4E7] px-3 text-xs font-medium text-[#3F3F46] transition-colors hover:border-[#18181B] hover:text-[#09090B]"
                      >
                        {t(`editor.quick.${key}`)}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-dashed border-[#E4E4E7] pt-3">
                  <span className="text-sm text-[#3F3F46]">{t("editor.field.countdown")}</span>
                  <AdminSwitch checked={showCountdown} onChange={setShowCountdown} label={t("editor.field.countdown")} disabled={readOnly} />
                </div>
                {!errors.time && startAt && endAt && (
                  <p className="text-xs text-[#71717A]">
                    {t("editor.duration", { days: Math.floor(durationDays), hours: Math.round((durationDays % 1) * 24) })}
                    {Date.parse(startAt) - Date.parse(data.now) > 0 && Date.parse(startAt) - Date.parse(data.now) < HOUR_MS * 2 && ` · ${t("editor.startsVerySoon")}`}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* 3 · Phạm vi */}
          <Card title={t("editor.sections.scope")} description={t("editor.sections.scopeHint")}>
            <div className="space-y-4">
              <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
                <AdminSegmentedControl<SaleScope>
                  value={scope}
                  disabled={readOnly}
                  onChange={(next) => {
                    setScope(next);
                    setScopeIds([]);
                  }}
                  options={(["ALL", "COLLECTIONS", "CATEGORIES", "PRODUCTS"] as const).map((value) => ({ value, label: t(`editor.scope.${value}`) }))}
                />
              </div>

              {scope === "ALL" ? (
                <p className="text-sm text-[#52525B]">{t("editor.scope.allNote")}</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {scopeIds.length === 0 && <span className="text-sm text-[#A1A1AA]">{t(`editor.scope.none.${scope}`)}</span>}
                  {(scope === "PRODUCTS" && scopeIds.length > 6 ? scopeIds.slice(0, 6) : scopeIds).map((id) => (
                    <span key={id} className="inline-flex h-8 max-w-full items-center gap-1 rounded-full border border-[#E4E4E7] bg-white pl-3 pr-1 text-sm text-[#09090B]">
                      <span className="truncate">{scopeName(id)}</span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setScopeIds((current) => current.filter((item) => item !== id))}
                          aria-label={t("editor.scope.remove", { name: scopeName(id) })}
                          className="grid size-6 cursor-pointer place-items-center rounded-full text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                  {scope === "PRODUCTS" && scopeIds.length > 6 && <span className="text-sm text-[#71717A]">{t("editor.scope.more", { count: scopeIds.length - 6 })}</span>}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-dashed border-[#A1A1AA] px-3 text-sm font-medium text-[#3F3F46] hover:border-[#18181B] hover:text-[#09090B]"
                    >
                      <Plus size={14} aria-hidden /> {t(`editor.scope.pick.${scope}`)}
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between gap-4 border-t border-dashed border-[#E4E4E7] pt-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#3F3F46]">{t("editor.field.excludeCustom")}</p>
                  <p className="mt-0.5 text-xs text-[#71717A]">
                    {customInScope > 0 ? t("editor.hint.excludeCustomCount", { count: customInScope }) : t("editor.hint.excludeCustom")}
                  </p>
                </div>
                <AdminSwitch checked={excludeCustom} onChange={setExcludeCustom} label={t("editor.field.excludeCustom")} disabled={readOnly} />
              </div>

              <p className="text-sm text-[#52525B]">
                {t.rich("editor.scope.summary", {
                  inScope: inScope.length,
                  excluded: inScope.length - appliedRows.length,
                  applied: appliedRows.length,
                  b: (chunks) => <span className="font-semibold text-[#09090B]">{chunks}</span>,
                })}
              </p>
            </div>
          </Card>

          {/* 4 · Sản phẩm & giá */}
          <SaleProductsCard
            rows={rows}
            readOnly={readOnly}
            showSold={Boolean(saved?.stats)}
            onRuleChange={changeRule}
            onToggleExcluded={(productId, exclude) =>
              setExcludedProductIds((current) => (exclude ? [...current, productId] : current.filter((id) => id !== productId)))
            }
          />

          {/* 5 · Quy tắc mua & hiển thị */}
          <Card title={t("editor.sections.rules")}>
            <div className="divide-y divide-dashed divide-[#E4E4E7]">
              <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-[#3F3F46]">{t("editor.field.perCustomer")}</p>
                  <p className="mt-0.5 text-xs text-[#71717A]">{t("editor.hint.perCustomer")}</p>
                </div>
                <div className="w-full shrink-0 sm:w-44">
                  <AdminTextField
                    aria-label={t("editor.field.perCustomer")}
                    value={perCustomerRaw}
                    onValueChange={(next) => setPerCustomerRaw(next.replace(/\D/g, "").slice(0, 3))}
                    inputMode="numeric"
                    placeholder={t("editor.placeholder.noLimit")}
                    suffix={<span className="text-xs text-[#A1A1AA]">{t("editor.perOrder")}</span>}
                    inputClassName="font-mono tabular-nums"
                  />
                </div>
              </div>
              <ToggleRow label={t("editor.field.stack")} hint={stackWithCoupon ? t("editor.hint.stackOn") : t("editor.hint.stackOff")} checked={stackWithCoupon} onChange={setStackWithCoupon} disabled={readOnly} />
              <ToggleRow
                label={t("editor.field.home")}
                hint={featuredElsewhere ? t("editor.hint.homeTaken", { name: featuredElsewhere.name }) : t("editor.hint.home")}
                warn={featuredOnHome && Boolean(featuredElsewhere)}
                checked={featuredOnHome}
                onChange={setFeaturedOnHome}
                disabled={readOnly}
              />
            </div>
          </Card>
        </fieldset>

        {/* Vùng hẹp: cột phải xuống dưới, các thẻ xếp 2 cột để không thành một dải dài */}
        <aside className="grid min-w-0 items-start gap-5 @3xl:grid-cols-2 @5xl:sticky @5xl:top-28 @5xl:grid-cols-1">
          {readOnly && saved?.stats && <SaleResults stats={saved.stats} products={data.products} />}
          {!readOnly && <PublishChecklist items={checks} live={state !== "DRAFT"} />}
          <StorefrontPreview
            rows={rows}
            previewId={previewId}
            onPreviewChange={setPreviewId}
            badge={lang === "en" ? text.badgeEn || text.badge : text.badge}
            startAt={startAt}
            endAt={endAt}
            showCountdown={showCountdown}
            now={data.now}
          />
          {!readOnly && saved?.stats && <SaleResults stats={saved.stats} products={data.products} />}
          {saved && <SaleActivityLog activity={saved.activity} />}
          {!saved && (
            <div className={cn(ADMIN_CARD_CLASS, "p-4 text-xs leading-relaxed text-[#71717A]")}>
              <p className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[#09090B]">
                {text.badge ? <SaleBadge>{text.badge}</SaleBadge> : null}
                {t("editor.tipsTitle")}
              </p>
              {t("editor.tips")}
            </div>
          )}
          <p className="px-1 text-xs leading-relaxed text-[#A1A1AA]">{t("editor.mockNote")}</p>
        </aside>
      </div>
      </div>

      {pickerOpen && scope !== "ALL" && (
        <ScopePickerDialog
          open
          onOpenChange={setPickerOpen}
          title={t(`editor.scope.pick.${scope}`)}
          options={scopeOptions}
          selected={scopeIds}
          onConfirm={setScopeIds}
        />
      )}

      {confirmEnd && saved && (
        <AdminDialog
          open
          onOpenChange={setConfirmEnd}
          icon={Flag}
          tone="danger"
          title={t("confirm.end.title", { name: saved.name })}
          description={t("confirm.end.description")}
          footer={
            <>
              <button type="button" onClick={() => setConfirmEnd(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
                {t("cancel")}
              </button>
              <button type="button" onClick={endNow} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
                {t("confirm.end.action")}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#3F3F46]">{t("confirm.end.body")}</p>
        </AdminDialog>
      )}
    </form>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
  warn,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm text-[#3F3F46]">{label}</p>
        <p className={cn("mt-0.5 text-xs", warn ? "text-amber-700" : "text-[#71717A]")}>{hint}</p>
      </div>
      <AdminSwitch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}
