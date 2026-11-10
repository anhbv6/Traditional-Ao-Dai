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
  AdminField,
  AdminLangSwitch,
  AdminTextArea,
  AdminTextField,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { saveCollectionAction } from "../../actions/collections.actions";
import {
  COLLECTION_TEXT_LIMITS,
  saveCollectionSchema,
  type SaveCollectionValues,
} from "../../schemas/collections.schemas";
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
import { GalleryField, ImageSlot, MediaGroup } from "./CollectionImageFields";
import { CollectionLifecyclePanel } from "./CollectionLifecyclePanel";
import { CollectionAdvancedAction, CollectionAdvancedOptions } from "./CollectionAdvancedOptions";
import { CollectionNoticeHint, type CollectionNotice } from "./CollectionNoticeHint";
import { CollectionProductsField } from "./CollectionProductsField";
import { CollectionProgressDock } from "./CollectionProgressDock";

const CollectionPreviewDialog = dynamic(() =>
  import("./CollectionPreviewDialog").then((m) => m.CollectionPreviewDialog)
);
const CollectionSeoDialog = dynamic(() => import("./CollectionSeoDialog").then((m) => m.CollectionSeoDialog));
const ChangeCollectionStatusDialog = dynamic(() =>
  import("../shared/ChangeCollectionStatusDialog").then((m) => m.ChangeCollectionStatusDialog)
);

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
    // @container: phần đầu thẻ co giãn theo độ rộng thẻ (cột chính hẹp lại ở iPad / khi mở panel bên phải)
    <section className={cn(ADMIN_CARD_CLASS, "@container p-4 sm:p-5")}>
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

  // Nhãn "đang nằm trên trang chủ" — hiện ở cột phải (PC) và trong popover Tiến trình (iPad / điện thoại)
  const homepageBadge =
    saved.showOnHomepage && saved.status !== "ARCHIVED" ? (
      <p className="flex items-center gap-1.5 px-1 text-xs text-[#71717A]">
        <Star size={13} className="fill-[#18181B] text-[#18181B]" aria-hidden /> {t("homepageBadge")}
      </p>
    ) : null;

  // SEO nằm trong dialog nên lỗi ở đó không nhìn thấy trên form — bấm lưu mà lỗi ở SEO thì mở dialog ra
  const langHasError = (lang: ContentLang, source: FieldErrors<SaveCollectionValues> = errors) =>
    Object.values(LANG_FIELDS[lang]).some((name) => source[name]);
  const seoError = Boolean(
    errors.slug || errors.seoTitle || errors.seoTitleEn || errors.seoDescription || errors.seoDescriptionEn
  );
  const onInvalid = (invalid: FieldErrors<SaveCollectionValues>) => {
    if (invalid.slug || invalid.seoTitle || invalid.seoTitleEn || invalid.seoDescription || invalid.seoDescriptionEn) {
      setIsSeoOpen(true);
    } else if (!langHasError(contentLang, invalid)) {
      // Lỗi nằm ở ngôn ngữ đang ẩn thì chuyển sang ngôn ngữ đó để thấy ô bị lỗi
      const other: ContentLang = contentLang === "vi" ? "en" : "vi";
      if (langHasError(other, invalid)) setContentLang(other);
    }
    // Luôn báo bằng toast: có lỗi nằm ở chỗ không nhìn thấy (bảng Tùy chọn, ảnh...) thì bấm lưu không được "im lặng"
    const firstMessage = Object.values(invalid).find(
      (fieldError): fieldError is { message: string } => typeof fieldError?.message === "string"
    )?.message;
    notify.error(firstMessage, "VALIDATION_ERROR");
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
            {/* Không xem trước trên điện thoại: màn quá hẹp để mô phỏng trang khách (chỉ iPad / PC) */}
            <button
              type="button"
              onClick={() => setIsPreviewing(true)}
              className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "max-sm:hidden")}
            >
              <Eye size={15} aria-hidden /> {t("editor.preview")}
            </button>
            <button type="submit" disabled={!isDirty || isSaving} className={ADMIN_PRIMARY_BUTTON_CLASS}>
              {isSaving ? t("processing") : t("editor.save")}
            </button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Section
            title={t("editor.sections.info")}
            description={t("editor.sections.infoHint")}
            aside={
              // Một hàng: thẻ hẹp → trải hết chiều rộng dưới tiêu đề (Tùy chọn trái, VI / EN phải); thẻ rộng → cạnh tiêu đề
              <div className="flex w-full items-center justify-between gap-2 @lg:w-auto @lg:justify-end">
                {/* Ngôn ngữ chỉ áp dụng cho thẻ này: hai ngôn ngữ dùng CHUNG một bộ trường (LANG_FIELDS) nên form luôn giống
                    hệt nhau; đổi ngôn ngữ thì gắn lại form theo tên trường của ngôn ngữ đó */}
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
                    <AdminTextField
                      type="number"
                      label={t("field.homepageOrder")}
                      hint={t("field.homepageOrderHint")}
                      size="sm"
                      min={0}
                      max={99}
                      error={err(errors.homepageOrder?.message)}
                      {...form.register("homepageOrder", { valueAsNumber: true })}
                      fieldClassName="w-24"
                    />
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
                <AdminLangSwitch
                  value={contentLang}
                  onChange={setContentLang}
                  label={t("editor.langTabs.label")}
                  hint={t("editor.sections.englishHint")}
                  missingLabel={t("editor.langTabs.untranslated")}
                  status={{
                    vi: langHasError("vi") || errors.code ? "error" : undefined,
                    en: langHasError("en") ? "error" : values.nameEn ? undefined : "missing",
                  }}
                />
              </div>
            }
          >
            <div key={contentLang} role="tabpanel" className="grid gap-4 sm:grid-cols-2">
              <AdminTextField
                {...form.register(langFields.name)}
                required={!isEnglish}
                className="sm:col-span-2"
                label={t("field.name")}
                maxLength={COLLECTION_TEXT_LIMITS.name}
                error={err(errors[langFields.name]?.message)}
                shakeKey={form.formState.submitCount}
                placeholder={t(`field.placeholders.${contentLang}.name`)}
              />
              <AdminTextField
                {...form.register(langFields.season)}
                label={t("field.season")}
                hint={t("field.seasonHint")}
                maxLength={COLLECTION_TEXT_LIMITS.season}
                error={err(errors[langFields.season]?.message)}
                placeholder={t(`field.placeholders.${contentLang}.season`)}
              />
              <AdminTextField
                {...form.register("code")}
                disabled={locked}
                label={t("field.code")}
                hint={locked ? t("field.codeLocked") : t("field.codeHint")}
                error={err(errors.code?.message)}
                shakeKey={form.formState.submitCount}
                placeholder={t("field.codePlaceholder")}
                inputClassName="font-mono uppercase tracking-wider"
                suffix={locked ? <Lock size={13} className="text-[#A1A1AA]" aria-hidden /> : undefined}
              />
              <AdminTextField
                {...form.register(langFields.tagline)}
                className="sm:col-span-2"
                label={t("field.tagline")}
                maxLength={COLLECTION_TEXT_LIMITS.tagline}
                error={err(errors[langFields.tagline]?.message)}
                placeholder={t(`field.placeholders.${contentLang}.tagline`)}
              />
              <AdminTextArea
                {...form.register(langFields.description)}
                className="sm:col-span-2"
                label={t("field.description")}
                rows={3}
                maxLength={COLLECTION_TEXT_LIMITS.description}
                error={err(errors[langFields.description]?.message)}
                placeholder={t(`field.placeholders.${contentLang}.description`)}
              />
              <AdminTextArea
                {...form.register(langFields.story)}
                className="sm:col-span-2"
                label={t("editor.sections.story")}
                hint={t("editor.sections.storyHint")}
                rows={5}
                maxLength={COLLECTION_TEXT_LIMITS.story}
                error={err(errors[langFields.story]?.message)}
                placeholder={t(`field.placeholders.${contentLang}.story`)}
              />
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
            <div className="@container mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
              <h3 className="mb-3 text-body font-semibold text-[#09090B]">{t("editor.sections.schedule")}</h3>
              <div className="grid gap-4 @md:grid-cols-2">
                <AdminField label={t("field.launchAt")} hint={t("field.scheduleHint")}>
                  <Controller
                    control={form.control}
                    name="launchAt"
                    render={({ field }) => (
                      <AdminDatePicker value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} />
                    )}
                  />
                </AdminField>
                <AdminField label={t("field.endAt")} error={err(errors.endAt?.message)}>
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
                </AdminField>
              </div>
            </div>
          </Section>

          <Section title={t("editor.sections.media")} description={t("editor.sections.mediaHint")}>
            {/*
              Bố cục theo độ rộng THẺ (container query), không theo màn hình: cột chính hẹp lại khi mở panel bên phải.
              Hẹp: ảnh bìa và banner xếp chồng; rộng (@2xl): hai nhóm nằm cạnh nhau.
            */}
            <div className="@container">
              <div className="grid gap-6 @2xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <MediaGroup title={t("media.cover")} ratio="3:4">
                  <div className="grid max-w-80 grid-cols-2 gap-3">
                    <Controller
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <ImageSlot device="desktop" value={field.value} onChange={field.onChange} aspectClass="aspect-[3/4]" />
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="coverImageMobile"
                      render={({ field }) => (
                        <ImageSlot
                          device="mobile"
                          value={field.value}
                          onChange={field.onChange}
                          aspectClass="aspect-[3/4]"
                          fallback={values.coverImage}
                        />
                      )}
                    />
                  </div>
                </MediaGroup>

                <MediaGroup title={t("media.banner")} ratio="16:7 · 4:5">
                  {/* Bản điện thoại 4:5 chiếm ~30% để cao gần bằng bản máy tính 16:7 */}
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(5.75rem,30%)] items-start gap-3">
                    <Controller
                      control={form.control}
                      name="bannerImage"
                      render={({ field }) => (
                        <ImageSlot device="desktop" value={field.value} onChange={field.onChange} aspectClass="aspect-[16/7]" />
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="bannerImageMobile"
                      render={({ field }) => (
                        <ImageSlot
                          device="mobile"
                          value={field.value}
                          onChange={field.onChange}
                          aspectClass="aspect-[4/5]"
                          fallback={values.bannerImage}
                        />
                      )}
                    />
                  </div>
                </MediaGroup>
              </div>
            </div>

            <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
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

        <aside className="hidden space-y-5 xl:sticky xl:top-[8rem] xl:block xl:self-start">
          <Section title={t("editor.sections.lifecycle")} aside={<CollectionNoticeHint notices={warnings} />}>
            <CollectionLifecyclePanel collection={saved} isDirty={isDirty} onChangeStatus={setStatusTarget} />
          </Section>
          {homepageBadge}
        </aside>
      </div>

      {/* iPad / điện thoại: thẻ Tiến trình chuyển vào nút nổi cạnh nút trợ lý AI */}
      <CollectionProgressDock
        status={saved.status}
        tone={warnings.some((w) => w.tone === "warn") ? "warn" : warnings.length > 0 ? "info" : "ok"}
        title={t("editor.sections.lifecycle")}
        aside={<CollectionNoticeHint notices={warnings} />}
      >
        {(close) => (
          <div className="space-y-4">
            <CollectionLifecyclePanel
              collection={saved}
              isDirty={isDirty}
              onChangeStatus={(target) => {
                close();
                setStatusTarget(target);
              }}
            />
            {homepageBadge}
          </div>
        )}
      </CollectionProgressDock>

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
