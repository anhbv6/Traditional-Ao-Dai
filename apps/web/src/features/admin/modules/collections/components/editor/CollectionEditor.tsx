"use client";

import { useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { Eye, Lock, Search, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDatePicker,
  AdminDetailHeader,
  AdminInfoTip,
  AdminLangSwitch,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { saveCollectionAction } from "../../actions/collections.actions";
import { saveCollectionSchema, type SaveCollectionValues } from "../../schemas/collections.schemas";
import {
  type AdminCollectionDetail,
  type AdminCollectionItem,
  type CollectionPickerProduct,
  type CollectionStatus,
} from "../../types/collections.types";
import {
  daysUntil,
  HOMEPAGE_COLLECTION_LIMIT,
  isIdentityLocked,
  toDateInputValue,
} from "../../utils/collectionLifecycle";
import { ACCENT_PRESETS, DEFAULT_ACCENT } from "../../utils/collectionStatusMeta";
import { CollectionStatusBadge } from "../shared/CollectionStatusBadge";
import { GalleryField, ImageSlot } from "./CollectionImageFields";
import { CollectionLifecyclePanel } from "./CollectionLifecyclePanel";
import { CollectionAdvancedAction, CollectionAdvancedOptions } from "./CollectionAdvancedOptions";
import { CollectionNoticeHint, type CollectionNotice } from "./CollectionNoticeHint";
import { CollectionProductsField } from "./CollectionProductsField";

const CollectionPreviewDialog = dynamic(() =>
  import("./CollectionPreviewDialog").then((m) => m.CollectionPreviewDialog)
);
const CollectionSeoDialog = dynamic(() => import("./CollectionSeoDialog").then((m) => m.CollectionSeoDialog));
const ChangeCollectionStatusDialog = dynamic(() =>
  import("../shared/ChangeCollectionStatusDialog").then((m) => m.ChangeCollectionStatusDialog)
);

const INPUT_CLASS =
  "w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B] aria-invalid:border-rose-500 disabled:bg-[#F4F4F5] disabled:text-[#71717A]";

interface CollectionEditorProps {
  collection: AdminCollectionDetail;
  products: CollectionPickerProduct[];
  /** Số bộ sưu tập khác đang chiếm chỗ trên trang chủ */
  homepageUsedByOthers: number;
}

function toFormValues(c: AdminCollectionDetail): SaveCollectionValues {
  return {
    collectionId: c.id,
    name: c.name,
    nameEn: c.nameEn ?? "",
    code: c.code,
    slug: c.slug,
    tagline: c.tagline ?? "",
    taglineEn: c.taglineEn ?? "",
    season: c.season ?? "",
    seasonEn: c.seasonEn ?? "",
    description: c.description ?? "",
    descriptionEn: c.descriptionEn ?? "",
    story: c.story ?? "",
    storyEn: c.storyEn ?? "",
    coverImage: c.coverImage ?? "",
    coverImageMobile: c.coverImageMobile ?? "",
    bannerImage: c.bannerImage ?? "",
    bannerImageMobile: c.bannerImageMobile ?? "",
    autoPushOosToBottom: c.autoPushOosToBottom,
    gallery: c.gallery,
    accentColor: c.accentColor ?? "",
    launchAt: toDateInputValue(c.launchAt),
    endAt: toDateInputValue(c.endAt),
    showOnHomepage: c.showOnHomepage,
    homepageOrder: c.homepageOrder,
    showInLookbook: c.showInLookbook,
    seoTitle: c.seoTitle ?? "",
    seoTitleEn: c.seoTitleEn ?? "",
    seoDescription: c.seoDescription ?? "",
    seoDescriptionEn: c.seoDescriptionEn ?? "",
    products: c.products,
  };
}

/** Ngôn ngữ nội dung soạn trong thẻ "Thông tin chung" */
type ContentLang = AdminContentLang;

/** Tên trường form theo ngôn ngữ — cột gốc tiếng Việt, cột `En` cho tiếng Anh (AGENTS.md §9) */
const LANG_FIELDS = {
  vi: { name: "name", season: "season", tagline: "tagline", description: "description", story: "story" },
  en: { name: "nameEn", season: "seasonEn", tagline: "taglineEn", description: "descriptionEn", story: "storyEn" },
} as const satisfies Record<ContentLang, Record<string, keyof SaveCollectionValues>>;

function Section({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[12rem] flex-1">
          <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-[#71717A]">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0 space-y-1.5", className)}>
      {/* Hướng dẫn không chiếm dòng dưới ô nữa: gom vào icon ⓘ cạnh nhãn */}
      <span className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
        {label}
        {hint && <AdminInfoTip content={hint} />}
      </span>
      {children}
      {error && <span className="block text-xs text-rose-700">{error}</span>}
    </label>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-start justify-between gap-3", disabled ? "opacity-60" : "cursor-pointer")}>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#09090B]">{label}</span>
        {hint && <span className="mt-0.5 block text-2xs leading-4 text-[#A1A1AA]">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#18181B]/25",
          checked ? "bg-[#18181B]" : "bg-[#E4E4E7]"
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-white shadow-xs transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </label>
  );
}

/** Trình soạn bộ sưu tập: nội dung bên trái, vòng đời + hiển thị + nhắc việc ở cột phải */
export function CollectionEditor({ collection: initial, products, homepageUsedByOthers }: CollectionEditorProps) {
  const t = useTranslations("AdminPage.collections");
  const notify = useNotify();
  const [saved, setSaved] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [statusTarget, setStatusTarget] = useState<CollectionStatus | null>(null);

  const form = useForm<SaveCollectionValues>({
    resolver: zodResolver(saveCollectionSchema),
    defaultValues: toFormValues(initial),
  });
  const { errors, isDirty } = form.formState;
  const values = useWatch({ control: form.control }) as SaveCollectionValues;
  const locale = useLocale();
  const [contentLang, setContentLang] = useState<ContentLang>(locale === "en" ? "en" : "vi");
  const [isSeoOpen, setIsSeoOpen] = useState(false);
  const isEnglish = contentLang === "en";
  const langFields = LANG_FIELDS[contentLang];
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const locked = isIdentityLocked(saved);
  const err = (key?: string) => (key ? notify.translateError(key) : undefined);

  // Nhắc việc: các case cần người soạn chú ý trước khi công bố / trong lúc bán
  const selected = values.products.flatMap((item) => productsById.get(item.productId) ?? []);
  const hidden = selected.filter((p) => !p.isActive);
  const notReady = hidden.filter((p) => !p.isReady);
  const outOfStock = selected.filter((p) => p.totalStock <= 0);
  const shared = selected.filter((p) => p.collections.some((c) => c.id !== saved.id));
  const sellingBeforeLaunch = selected.filter(
    (p) => p.isActive && !p.collections.some((c) => c.id !== saved.id && c.status === "ACTIVE")
  );
  const warnings: CollectionNotice[] = [];
  // Còn thiếu dữ liệu trước khi công bố / mở bán
  if (values.products.length === 0) warnings.push({ tone: "info", text: t("warnings.noProducts") });
  if (!values.coverImage) warnings.push({ tone: "info", text: t("warnings.noCover") });
  if (!values.coverImageMobile) warnings.push({ tone: "info", text: t("warnings.noCoverMobile") });
  if ((saved.status === "DRAFT" || saved.status === "COMING_SOON") && !values.launchAt)
    warnings.push({ tone: "info", text: t("warnings.noLaunchAt") });
  if (saved.status === "ACTIVE" && hidden.length > 0)
    warnings.push({ tone: "warn", text: t("warnings.hiddenInActive", { count: hidden.length }) });
  if (saved.status !== "ACTIVE" && notReady.length > 0)
    warnings.push({ tone: "info", text: t("warnings.notReady", { count: notReady.length }) });
  if (saved.status === "COMING_SOON" && sellingBeforeLaunch.length > 0)
    warnings.push({ tone: "warn", text: t("warnings.sellingBeforeLaunch", { count: sellingBeforeLaunch.length }) });
  if (outOfStock.length > 0)
    warnings.push({
      tone: values.autoPushOosToBottom ? "info" : "warn",
      text: values.autoPushOosToBottom
        ? t("warnings.oosPushed", { count: outOfStock.length })
        : t("warnings.oosKept", { count: outOfStock.length }),
    });
  if (shared.length > 0) warnings.push({ tone: "info", text: t("warnings.shared", { count: shared.length }) });
  if (saved.status === "COMING_SOON" && saved.launchAt && daysUntil(saved.launchAt) <= 0)
    warnings.push({ tone: "warn", text: t("warnings.launchReached") });
  if (saved.status === "ACTIVE" && saved.endAt && daysUntil(saved.endAt) < 0)
    warnings.push({ tone: "warn", text: t("warnings.endPassed") });
  if (saved.status === "DRAFT" && values.showOnHomepage)
    warnings.push({ tone: "info", text: t("warnings.homepageDraft") });

  const homepageFull = !saved.showOnHomepage && homepageUsedByOthers >= HOMEPAGE_COLLECTION_LIMIT;

  // SEO nằm trong dialog nên lỗi ở đó không nhìn thấy trên form — bấm lưu mà lỗi ở SEO thì mở dialog ra
  const seoError = Boolean(
    errors.slug || errors.seoTitle || errors.seoTitleEn || errors.seoDescription || errors.seoDescriptionEn
  );
  const onInvalid = (invalid: FieldErrors<SaveCollectionValues>) => {
    if (invalid.slug || invalid.seoTitle || invalid.seoTitleEn || invalid.seoDescription || invalid.seoDescriptionEn) {
      setIsSeoOpen(true);
    }
  };

  const onSubmit = async (data: SaveCollectionValues) => {
    setIsSaving(true);
    try {
      const res = await saveCollectionAction(data);
      if (!res.success) {
        notify.error(res.error, "COLLECTION_UPDATE_FAILED");
        return;
      }
      const next = { ...data, slug: res.data.slug };
      form.reset(next);
      const selling = next.products.filter((p) => productsById.get(p.productId)?.isActive).length;
      setSaved((prev) => ({
        ...prev,
        ...next,
        nameEn: next.nameEn || null,
        tagline: next.tagline || null,
        coverImage: next.coverImage || null,
        bannerImage: next.bannerImage || null,
        accentColor: next.accentColor || null,
        launchAt: next.launchAt ? new Date(`${next.launchAt}T00:00:00+07:00`).toISOString() : null,
        endAt: next.endAt ? new Date(`${next.endAt}T00:00:00+07:00`).toISOString() : null,
        showOnHomepage: prev.status === "ARCHIVED" ? false : next.showOnHomepage,
        productCount: next.products.length,
        sellingCount: selling,
      }));
      notify.success(t("editor.saved"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChanged = (item: AdminCollectionItem) => {
    setSaved((prev) => ({ ...prev, ...item }));
    form.setValue("showOnHomepage", item.showOnHomepage);
    form.reset(form.getValues());
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-5">
      <AdminDetailHeader
        backHref="/admin/catalog/collections"
        backLabel={t("editor.back")}
        title={values.name || t("editor.untitled")}
        badge={<CollectionStatusBadge status={saved.status} />}
        subtitle={
          <>
            <span className="font-mono">{values.code}</span>
            {isDirty && <span className="ml-2 text-amber-700">● {t("editor.unsaved")}</span>}
          </>
        }
        actions={
          <>
            <button type="button" onClick={() => setIsPreviewing(true)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
              <Eye size={15} aria-hidden /> {t("editor.preview")}
            </button>
            <button type="submit" disabled={!isDirty || isSaving} className={ADMIN_PRIMARY_BUTTON_CLASS}>
              {isSaving ? t("processing") : t("editor.save")}
            </button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Section
            title={t("editor.sections.info")}
            description={t("editor.sections.infoHint")}
            aside={
              <div className="flex flex-wrap items-center gap-2">
                {/* Ngôn ngữ chỉ áp dụng cho thẻ này: hai ngôn ngữ dùng CHUNG một bộ trường (LANG_FIELDS) nên form luôn giống
                    hệt nhau; đổi ngôn ngữ thì gắn lại form theo tên trường của ngôn ngữ đó */}
                <AdminLangSwitch
                  value={contentLang}
                  onChange={setContentLang}
                  label={t("editor.langTabs.label")}
                  hint={t("editor.sections.englishHint")}
                  missingLabel={t("editor.langTabs.untranslated")}
                  status={{
                    vi: errors.name || errors.code ? "error" : undefined,
                    en: values.nameEn ? undefined : "missing",
                  }}
                />
                <CollectionAdvancedOptions
                  label={t("editor.advanced")}
                  activeCount={Number(values.showOnHomepage) + Number(values.showInLookbook)}
                >
                  <Controller
                    control={form.control}
                    name="showOnHomepage"
                    render={({ field }) => (
                      <ToggleRow
                        label={t("field.showOnHomepage")}
                        hint={
                          saved.status === "ARCHIVED"
                            ? t("field.homepageArchived")
                            : t("homepageUsage", {
                                used: homepageUsedByOthers + (field.value ? 1 : 0),
                                limit: HOMEPAGE_COLLECTION_LIMIT,
                              })
                        }
                        checked={field.value}
                        disabled={saved.status === "ARCHIVED" || (homepageFull && !field.value)}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {values.showOnHomepage && (
                    <Field label={t("field.homepageOrder")} hint={t("field.homepageOrderHint")}>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        {...form.register("homepageOrder", { valueAsNumber: true })}
                        className={cn(INPUT_CLASS, "h-9 w-24")}
                      />
                    </Field>
                  )}
                  <Controller
                    control={form.control}
                    name="showInLookbook"
                    render={({ field }) => (
                      <ToggleRow
                        label={t("field.showInLookbook")}
                        hint={t("field.lookbookHint")}
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <CollectionAdvancedAction
                    icon={Search}
                    label={t("seoDialog.open")}
                    description={
                      seoError
                        ? t("seoDialog.hasError")
                        : values.seoTitle || values.seoDescription || values.seoTitleEn || values.seoDescriptionEn
                          ? t("seoDialog.customized")
                          : t("seoDialog.auto")
                    }
                    tone={seoError ? "error" : "default"}
                    onClick={() => setIsSeoOpen(true)}
                  />
                </CollectionAdvancedOptions>
              </div>
            }
          >
            <div key={contentLang} role="tabpanel" className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`${t("field.name")}${isEnglish ? "" : " *"}`}
                error={isEnglish ? undefined : err(errors.name?.message)}
                className="sm:col-span-2"
              >
                <input
                  {...form.register(langFields.name)}
                  aria-invalid={!isEnglish && Boolean(errors.name)}
                  placeholder={t(`field.placeholders.${contentLang}.name`)}
                  className={cn(INPUT_CLASS, "h-10")}
                />
              </Field>
              <Field label={t("field.season")} hint={t("field.seasonHint")}>
                <input
                  {...form.register(langFields.season)}
                  placeholder={t(`field.placeholders.${contentLang}.season`)}
                  className={cn(INPUT_CLASS, "h-10")}
                />
              </Field>
              <Field
                label={t("field.code")}
                error={err(errors.code?.message)}
                hint={locked ? t("field.codeLocked") : t("field.codeHint")}
              >
                <div className="relative">
                  <input
                    {...form.register("code")}
                    disabled={locked}
                    placeholder={t("field.codePlaceholder")}
                    aria-invalid={Boolean(errors.code)}
                    className={cn(INPUT_CLASS, "h-10 pr-8 font-mono uppercase tracking-wider")}
                  />
                  {locked && (
                    <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" aria-hidden />
                  )}
                </div>
              </Field>
              <Field label={t("field.tagline")} className="sm:col-span-2">
                <input
                  {...form.register(langFields.tagline)}
                  placeholder={t(`field.placeholders.${contentLang}.tagline`)}
                  className={cn(INPUT_CLASS, "h-10")}
                />
              </Field>
              <Field label={t("field.description")} className="sm:col-span-2">
                <textarea
                  {...form.register(langFields.description)}
                  rows={3}
                  placeholder={t(`field.placeholders.${contentLang}.description`)}
                  className={cn(INPUT_CLASS, "py-2")}
                />
              </Field>
              <Field label={t("editor.sections.story")} hint={t("editor.sections.storyHint")} className="sm:col-span-2">
                <textarea
                  {...form.register(langFields.story)}
                  rows={5}
                  placeholder={t(`field.placeholders.${contentLang}.story`)}
                  className={cn(INPUT_CLASS, "py-2 leading-relaxed")}
                />
              </Field>
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-[#3F3F46]">{t("field.accent")}</span>
                <Controller
                  control={form.control}
                  name="accentColor"
                  render={({ field }) => (
                    <div className="flex flex-wrap items-center gap-2">
                      {ACCENT_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={color}
                          aria-pressed={field.value === color}
                          onClick={() => field.onChange(color)}
                          className={cn(
                            "size-7 cursor-pointer rounded-full ring-offset-2 transition-shadow",
                            field.value === color ? "ring-2 ring-[#18181B]" : "hover:ring-2 hover:ring-[#D4D4D8]"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <label className="ml-1 flex h-8 items-center gap-2 rounded-lg border border-[#E4E4E7] bg-white pl-1.5 pr-2.5">
                        <input
                          type="color"
                          value={field.value || DEFAULT_ACCENT}
                          onChange={(e) => field.onChange(e.target.value)}
                          aria-label={t("field.accentCustom")}
                          className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <span className="font-mono text-xs uppercase text-[#52525B]">
                          {field.value || t("field.accentNone")}
                        </span>
                      </label>
                      {field.value && (
                        <button
                          type="button"
                          onClick={() => field.onChange("")}
                          className="cursor-pointer text-xs text-[#71717A] hover:text-[#09090B]"
                        >
                          {t("field.accentClear")}
                        </button>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
          </Section>

          <Section title={t("editor.sections.media")} description={t("editor.sections.mediaHint")}>
            <div className="grid gap-4 sm:grid-cols-[repeat(2,minmax(0,140px))_minmax(0,1fr)_minmax(0,110px)]">
              {(
                [
                  { name: "coverImage", device: "desktop", label: t("media.cover"), aspect: "aspect-[3/4]" },
                  {
                    name: "coverImageMobile",
                    device: "mobile",
                    label: t("media.coverMobile"),
                    aspect: "aspect-[3/4]",
                    fallbackOf: "coverImage",
                  },
                  { name: "bannerImage", device: "desktop", label: t("media.banner"), aspect: "aspect-[16/7]" },
                  {
                    name: "bannerImageMobile",
                    device: "mobile",
                    label: t("media.bannerMobile"),
                    aspect: "aspect-[4/5]",
                    fallbackOf: "bannerImage",
                  },
                ] as const
              ).map((slot) => (
                <Controller
                  key={slot.name}
                  control={form.control}
                  name={slot.name}
                  render={({ field }) => (
                    <ImageSlot
                      label={slot.label}
                      device={slot.device}
                      value={field.value}
                      onChange={field.onChange}
                      aspectClass={slot.aspect}
                      fallback={"fallbackOf" in slot ? values[slot.fallbackOf] : undefined}
                    />
                  )}
                />
              ))}
            </div>
            <div className="mt-5">
              <span className="mb-1.5 block text-sm font-medium text-[#3F3F46]">{t("media.lookbook")}</span>
              <Controller
                control={form.control}
                name="gallery"
                render={({ field }) => <GalleryField value={field.value} onChange={field.onChange} />}
              />
            </div>
          </Section>

          <Section
            title={t("editor.sections.products")}
            description={t("editor.sections.productsHint")}
            aside={
              <Controller
                control={form.control}
                name="autoPushOosToBottom"
                render={({ field }) => (
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-[#3F3F46]">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="size-4 accent-[#18181B]"
                    />
                    {t("field.autoPushOos")}
                  </label>
                )}
              />
            }
          >
            <Controller
              control={form.control}
              name="products"
              render={({ field }) => (
                <CollectionProductsField
                  collectionId={saved.id}
                  value={field.value}
                  onChange={field.onChange}
                  productsById={productsById}
                  allProducts={products}
                  autoPushOosToBottom={values.autoPushOosToBottom}
                />
              )}
            />
            {errors.products?.message && <p className="mt-2 text-xs text-rose-700">{err(errors.products.message)}</p>}
          </Section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-[8rem] lg:self-start">
          <Section title={t("editor.sections.lifecycle")} aside={<CollectionNoticeHint notices={warnings} />}>
            <CollectionLifecyclePanel collection={saved} isDirty={isDirty} onChangeStatus={setStatusTarget} />
          </Section>

          <Section title={t("editor.sections.schedule")}>
            {/* Một cột: cột phải hẹp, hai ô cạnh nhau sẽ cắt chữ ngày */}
            <div className="grid gap-3">
              <Field label={t("field.launchAt")} hint={t("field.scheduleHint")}>
                <Controller
                  control={form.control}
                  name="launchAt"
                  render={({ field }) => (
                    <AdminDatePicker value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} />
                  )}
                />
              </Field>
              <Field label={t("field.endAt")} error={err(errors.endAt?.message)}>
                <Controller
                  control={form.control}
                  name="endAt"
                  render={({ field }) => (
                    <AdminDatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      // Hết mùa không thể trước ngày mở bán
                      min={values.launchAt || undefined}
                      invalid={Boolean(errors.endAt)}
                    />
                  )}
                />
              </Field>
            </div>
          </Section>

          {saved.showOnHomepage && saved.status !== "ARCHIVED" && (
            <p className="flex items-center gap-1.5 px-1 text-xs text-[#71717A]">
              <Star size={13} className="fill-[#18181B] text-[#18181B]" aria-hidden /> {t("homepageBadge")}
            </p>
          )}
        </aside>
      </div>

      {isPreviewing && (
        <CollectionPreviewDialog
          open
          onOpenChange={setIsPreviewing}
          values={values}
          status={saved.status}
          productsById={productsById}
        />
      )}
      {isSeoOpen && <CollectionSeoDialog open onOpenChange={setIsSeoOpen} form={form} slugLocked={locked} />}
      {statusTarget && (
        <ChangeCollectionStatusDialog
          collection={saved}
          target={statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          onChanged={handleStatusChanged}
        />
      )}
    </form>
  );
}
