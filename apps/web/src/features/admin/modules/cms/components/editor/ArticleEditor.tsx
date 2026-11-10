"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CircleCheck, CircleX, ExternalLink, Heading2, ImagePlus, Loader2, Quote, Sparkles, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { MAX_IMAGE_BYTES } from "@repo/shared";
import { useNotify } from "@/hooks/useNotify";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { uploadImageApi } from "@/features/upload";
import { toSlug } from "@/features/admin/modules/products";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
  AdminLangSwitch,
  AdminSegmentedControl,
  AdminStatusText,
  AdminTextArea,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { createArticleAction, updateArticleAction } from "../../actions/cms.actions";
import { type ArticleEditorData, type ArticleFormValues } from "../../types/cms.types";
import { ARTICLE_ISSUE_LEVEL, ARTICLE_LIMITS, articleIssues, countWords, parseContent, readingMinutes } from "../../utils/cmsRules";

function Card({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5", className)}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

/**
 * Soạn bài viết "Chuyện Của Lụa & Mây". Trái: tiêu đề, đường dẫn, mô tả ngắn, thân bài (định dạng tối giản ## / >, có xem
 * trước). Phải: ảnh bìa, kiểm tra trước khi đăng (chặn / nhắc — server kiểm tra lại bằng cùng hàm), xem trước Google,
 * mục lục suy từ tiêu đề mục. Công tắc VI / EN ở thanh đầu đổi cả ba ô chữ.
 */
export function ArticleEditor({ data }: { data: ArticleEditorData }) {
  const t = useTranslations("AdminPage.cms");
  const format = useFormatter();
  const notify = useNotify();
  const router = useRouter();
  const existing = data.article;
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<ArticleFormValues>({
    title: existing?.title ?? "",
    titleEn: existing?.titleEn ?? "",
    slug: existing?.slug ?? "",
    excerpt: existing?.excerpt ?? "",
    excerptEn: existing?.excerptEn ?? "",
    content: existing?.content ?? "",
    contentEn: existing?.contentEn ?? "",
    thumbnail: existing?.thumbnail ?? null,
    isPublished: existing?.isPublished ?? false,
  });
  const [saved, setSaved] = useState(values);
  const [lang, setLang] = useState<AdminContentLang>("vi");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [slugTouched, setSlugTouched] = useState(Boolean(existing));
  const [uploading, setUploading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const set = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const key = <F extends "title" | "excerpt" | "content">(field: F) => (lang === "vi" ? field : (`${field}En` as const));

  const issues = articleIssues(values, data.takenSlugs);
  const blocking = issues.filter((issue) => ARTICLE_ISSUE_LEVEL[issue] === "block");
  const words = countWords(values[key("content")]);
  const blocks = parseContent(values[key("content")]);
  const headings = blocks.filter((block) => block.type === "heading");

  const setTitle = (next: string) => {
    set(key("title"), next.slice(0, ARTICLE_LIMITS.title));
    // Bài mới: đường dẫn đi theo tiêu đề tiếng Việt cho tới khi người soạn tự sửa
    if (lang === "vi" && !slugTouched) set("slug", toSlug(next).slice(0, ARTICLE_LIMITS.slug));
  };

  const insert = (prefix: string) => {
    const area = contentRef.current;
    const field = key("content");
    const text = values[field];
    const at = area?.selectionStart ?? text.length;
    const before = text.slice(0, at).replace(/\s*$/, "");
    const next = `${before}${before ? "\n\n" : ""}${prefix}${text.slice(at).replace(/^\s*/, before ? "\n\n" : "")}`;
    set(field, next);
    requestAnimationFrame(() => {
      const cursor = before.length + (before ? 2 : 0) + prefix.length;
      area?.focus();
      area?.setSelectionRange(cursor, cursor);
    });
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify.error("ONLY_IMAGE_FILES_ALLOWED");
    if (file.size > MAX_IMAGE_BYTES) return notify.error("FILE_TOO_LARGE");
    setUploading(true);
    try {
      const res = await uploadImageApi(file, "articles");
      set("thumbnail", res.data.url);
    } catch (error) {
      notify.error(error, "IMAGE_UPLOAD_FAILED");
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: (next: ArticleFormValues) => (existing ? updateArticleAction({ articleId: existing.id, values: next }) : createArticleAction(next)),
    onSuccess: (res, next) => {
      if (!res.success) return notify.error(res.error, existing ? "ARTICLE_UPDATE_FAILED" : "ARTICLE_CREATE_FAILED");
      setSaved(next);
      setValues(next);
      setShowErrors(false);
      notify.success(next.isPublished && !saved.isPublished ? t("toast.published") : !next.isPublished && saved.isPublished ? t("toast.unpublished") : t("toast.articleSaved"));
      if (!existing) router.replace(`/admin/cms/articles/${res.data.id}`);
      else router.refresh();
    },
    onError: () => notify.error(existing ? "ARTICLE_UPDATE_FAILED" : "ARTICLE_CREATE_FAILED"),
  });

  /** publish: true = đăng, false = lưu nháp / gỡ, undefined = giữ trạng thái */
  const submit = (publish?: boolean) => {
    const next = { ...values, isPublished: publish ?? values.isPublished };
    setShowErrors(true);
    if (issues.includes("TITLE") || issues.includes("SLUG") || issues.includes("SLUG_TAKEN")) {
      setLang("vi");
      return notify.error(issues.includes("SLUG_TAKEN") ? "ARTICLE_SLUG_TAKEN" : "ARTICLE_SAVE_INVALID");
    }
    if (next.isPublished && blocking.length) return notify.error("ARTICLE_PUBLISH_INCOMPLETE");
    save.mutate(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const err = (issue: "TITLE" | "SLUG" | "SLUG_TAKEN" | "EXCERPT") => (showErrors && lang === "vi" && issues.includes(issue) ? t(`issue.${issue}`) : undefined);
  const excerptLength = values[key("excerpt")].trim().length;
  const subtitle = dirty
    ? t("unsaved")
    : existing
      ? t("editor.savedSubtitle", { author: existing.authorName ?? "—", date: format.dateTime(new Date(existing.updatedAt), { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) })
      : t("editor.newSubtitle");

  return (
    <form onSubmit={handleSubmit} noValidate className="contents">
      <AdminDetailHeader
        backHref="/admin/cms"
        backLabel={t("editor.back")}
        title={values.title || t("editor.newTitle")}
        badge={
          <span className="text-sm">
            <AdminStatusText tone={saved.isPublished ? "success" : "neutral"}>{saved.isPublished ? t("articles.published") : t("articles.draft")}</AdminStatusText>
          </span>
        }
        subtitle={<span className={cn(dirty && "text-amber-700")}>{subtitle}</span>}
        actions={
          <>
            <AdminLangSwitch
              value={lang}
              onChange={setLang}
              label={t("lang")}
              hint={t("editor.langHint")}
              status={{ en: !values.titleEn.trim() || !values.contentEn.trim() ? "missing" : undefined }}
              missingLabel={t("missing")}
            />
            {saved.isPublished && existing && (
              <Link href={`/news/${saved.slug}`} target="_blank" className={ADMIN_SECONDARY_BUTTON_CLASS}>
                <ExternalLink size={15} aria-hidden /> <span className="hidden sm:inline">{t("editor.view")}</span>
              </Link>
            )}
            {saved.isPublished ? (
              <>
                <button type="button" disabled={save.isPending} onClick={() => submit(false)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                  {t("editor.unpublish")}
                </button>
                <button type="submit" disabled={save.isPending || !dirty} className={ADMIN_PRIMARY_BUTTON_CLASS}>
                  {save.isPending ? t("saving") : t("save")}
                </button>
              </>
            ) : (
              <>
                <button type="button" disabled={save.isPending} onClick={() => submit(false)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                  {t("editor.saveDraft")}
                </button>
                <button type="button" disabled={save.isPending} onClick={() => submit(true)} className={ADMIN_PRIMARY_BUTTON_CLASS}>
                  {save.isPending ? t("saving") : t("editor.publish")}
                </button>
              </>
            )}
          </>
        }
      />

      <div className="@container">
        <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <Card title={t("editor.sections.main")}>
              <div className="space-y-4">
                <AdminTextField
                  key={`title-${lang}`}
                  required={lang === "vi"}
                  label={t("editor.field.title")}
                  value={values[key("title")]}
                  onValueChange={setTitle}
                  placeholder={lang === "vi" ? t("editor.placeholder.title") : values.title || t("editor.placeholder.title")}
                  error={err("TITLE")}
                  suffix={<span className="font-mono text-2xs text-[#A1A1AA]">{values[key("title")].length}/{ARTICLE_LIMITS.title}</span>}
                />
                <AdminTextField
                  required
                  label={t("editor.field.slug")}
                  hint={existing?.isPublished ? t("editor.hint.slugPublished") : t("editor.hint.slug")}
                  value={values.slug}
                  onValueChange={(next) => {
                    setSlugTouched(true);
                    set("slug", next.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, ARTICLE_LIMITS.slug));
                  }}
                  prefix={<span className="font-mono text-xs text-[#A1A1AA]">/news/</span>}
                  error={err("SLUG") ?? err("SLUG_TAKEN")}
                  inputClassName="font-mono text-sm"
                  suffix={
                    <AdminTooltip content={t("editor.slugFromTitle")}>
                      <button
                        type="button"
                        onClick={() => {
                          setSlugTouched(true);
                          set("slug", toSlug(values.title).slice(0, ARTICLE_LIMITS.slug));
                        }}
                        aria-label={t("editor.slugFromTitle")}
                        className="grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                      >
                        <Sparkles size={14} />
                      </button>
                    </AdminTooltip>
                  }
                />
                <div>
                  <AdminTextArea
                    key={`excerpt-${lang}`}
                    required={lang === "vi"}
                    label={t("editor.field.excerpt")}
                    hint={t("editor.hint.excerpt", { min: ARTICLE_LIMITS.excerptIdealMin, max: ARTICLE_LIMITS.excerptIdealMax })}
                    rows={3}
                    value={values[key("excerpt")]}
                    onChange={(event) => set(key("excerpt"), event.target.value.slice(0, ARTICLE_LIMITS.excerpt))}
                    placeholder={t("editor.placeholder.excerpt")}
                    error={err("EXCERPT")}
                  />
                  {/* Thước độ dài mô tả: vùng xanh là khoảng Google hiển thị trọn */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span aria-hidden className="relative h-1 flex-1 overflow-hidden rounded-full bg-[#F4F4F5]">
                      <span
                        className="absolute inset-y-0 bg-emerald-100"
                        style={{ left: `${(ARTICLE_LIMITS.excerptIdealMin / ARTICLE_LIMITS.excerpt) * 100}%`, width: `${((ARTICLE_LIMITS.excerptIdealMax - ARTICLE_LIMITS.excerptIdealMin) / ARTICLE_LIMITS.excerpt) * 100}%` }}
                      />
                      <span className={cn("absolute inset-y-0 left-0 rounded-full", excerptLength > ARTICLE_LIMITS.excerptIdealMax ? "bg-amber-500" : "bg-[#3F3F46]")} style={{ width: `${Math.min(100, (excerptLength / ARTICLE_LIMITS.excerpt) * 100)}%` }} />
                    </span>
                    <span className="font-mono text-2xs tabular-nums text-[#A1A1AA]">{excerptLength}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title={t("editor.sections.content")}
              aside={
                <AdminSegmentedControl
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "write", label: t("editor.write") },
                    { value: "preview", label: t("editor.previewMode") },
                  ]}
                />
              }
            >
              {mode === "write" ? (
                <>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => insert("## ")} className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "h-8 px-2.5 text-xs")}>
                      <Heading2 size={14} aria-hidden /> {t("editor.insertHeading")}
                    </button>
                    <button type="button" onClick={() => insert("> ")} className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "h-8 px-2.5 text-xs")}>
                      <Quote size={14} aria-hidden /> {t("editor.insertQuote")}
                    </button>
                    <span className="ml-auto text-xs text-[#71717A]">{t("editor.formatHint")}</span>
                  </div>
                  <textarea
                    ref={contentRef}
                    aria-label={t("editor.sections.content")}
                    value={values[key("content")]}
                    onChange={(event) => set(key("content"), event.target.value.slice(0, ARTICLE_LIMITS.content))}
                    placeholder={t("editor.placeholder.content")}
                    rows={20}
                    className="min-h-80 w-full resize-y rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 font-mono text-sm leading-relaxed text-[#09090B] outline-none transition-[border-color,box-shadow] placeholder:font-sans placeholder:text-[#A1A1AA] focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/8"
                  />
                </>
              ) : (
                <article className="min-h-80 rounded-xl border border-[#E4E4E7] bg-(--bg-main) px-5 py-5 text-(--text-main) sm:px-8">
                  {blocks.length === 0 ? (
                    <p className="py-16 text-center text-sm text-[#A1A1AA]">{t("editor.previewEmpty")}</p>
                  ) : (
                    <div className="mx-auto max-w-prose space-y-4">
                      {blocks.map((block, index) =>
                        block.type === "heading" ? (
                          <h3 key={index} className="pt-2 font-[family-name:var(--font-playfair)] text-xl font-semibold">
                            {block.text}
                          </h3>
                        ) : block.type === "quote" ? (
                          <blockquote key={index} className="border-l-2 border-(--primary-color) pl-4 italic text-(--text-light)">
                            {block.text}
                          </blockquote>
                        ) : (
                          <p key={index} className="text-body leading-relaxed">
                            {block.text}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </article>
              )}
              <p className="mt-2 flex justify-between text-xs text-[#71717A]">
                <span>{t("editor.words", { words, minutes: readingMinutes(words) })}</span>
                {words < ARTICLE_LIMITS.minPublishWords && <span className="text-amber-700">{t("editor.minWords", { count: ARTICLE_LIMITS.minPublishWords })}</span>}
              </p>
            </Card>
          </div>

          <aside className="grid min-w-0 items-start gap-5 @3xl:grid-cols-2 @5xl:sticky @5xl:top-28 @5xl:grid-cols-1">
            <Card title={t("editor.sections.cover")}>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-dashed border-[#D4D4D8] bg-[#FAFAFA]">
                {values.thumbnail ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh bìa do admin tải lên, URL tùy ý */}
                    <img src={values.thumbnail} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set("thumbnail", null)}
                      aria-label={t("editor.removeCover")}
                      className="absolute right-2 top-2 grid size-7 cursor-pointer place-items-center rounded-full bg-white/90 text-[#3F3F46] shadow-2xs hover:text-[#09090B]"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 text-sm text-[#71717A] hover:text-[#09090B]">
                    {uploading ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <ImagePlus size={20} aria-hidden />}
                    {uploading ? t("editor.uploading") : t("editor.uploadCover")}
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-[#71717A]">{t("editor.coverHint")}</p>
              {values.thumbnail && (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "mt-2 w-full")}>
                  {uploading ? t("editor.uploading") : t("editor.replaceCover")}
                </button>
              )}
            </Card>

            <Card
              title={t("editor.sections.check")}
              aside={
                <span className={cn("text-xs", blocking.length ? "text-rose-600" : issues.length ? "text-amber-700" : "text-emerald-700")}>
                  {blocking.length ? t("check.blocking", { count: blocking.length }) : issues.length ? t("check.warnings", { count: issues.length }) : t("check.ready")}
                </span>
              }
            >
              {issues.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-[#52525B]">
                  <CircleCheck size={16} className="text-emerald-600" aria-hidden /> {t("check.allGood")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {issues.map((issue) => (
                    <li key={issue} className="flex gap-2 text-sm text-[#3F3F46]">
                      {ARTICLE_ISSUE_LEVEL[issue] === "block" ? (
                        <CircleX size={16} className="mt-0.5 shrink-0 text-rose-600" aria-hidden />
                      ) : (
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                      )}
                      {t(`issue.${issue}`, { min: ARTICLE_LIMITS.minPublishWords })}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title={t("editor.sections.google")}>
              {/* Mô phỏng kết quả tìm kiếm — giữ kiểu chữ / màu của Google như quy chuẩn màn xem trước */}
              <div className="rounded-xl border border-[#E4E4E7] bg-white p-3.5 font-[Arial,sans-serif]">
                <p className="truncate text-xs text-[#202124]">tiemthiencanh · /news/{values.slug || "…"}</p>
                <p className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab]">{values[key("title")] || t("editor.placeholder.title")}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#4d5156]">{values[key("excerpt")] || t("editor.googleEmpty")}</p>
              </div>
            </Card>

            {headings.length > 0 && (
              <Card title={t("editor.sections.toc")}>
                <ol className="list-inside list-decimal space-y-1 text-sm text-[#3F3F46]">
                  {headings.map((heading, index) => (
                    <li key={index} className="truncate">
                      {heading.text}
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </form>
  );
}
