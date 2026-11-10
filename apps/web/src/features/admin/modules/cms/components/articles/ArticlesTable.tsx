"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, ExternalLink, EyeOff, ImageOff, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminDialog,
  AdminStatusText,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { deleteArticleAction, duplicateArticleAction, toggleArticlePublishAction } from "../../actions/cms.actions";
import { type AdminArticleRow } from "../../types/cms.types";
import { readingMinutes } from "../../utils/cmsRules";

/** Ảnh bìa nhỏ 4:3 (ảnh bài viết là ảnh ngang) — chưa có ảnh thì ô xám báo thiếu */
export function ArticleThumb({ src, className }: { src: string | null; className?: string }) {
  return (
    <span className={cn("grid aspect-[4/3] w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] text-[#A1A1AA]", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa do admin tải lên (Cloudinary / URL tùy ý), chỉ là ảnh nhỏ trong bảng
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <ImageOff size={16} aria-hidden />
      )}
    </span>
  );
}

/** Bảng bài viết: mỗi dòng tiêu đề + đường dẫn, trạng thái + ngày sửa, thời gian đọc + bản EN, tác giả; thao tác ở ⋯ */
export function ArticlesTable({ rows, emptyText }: { rows: AdminArticleRow[]; emptyText: string }) {
  const t = useTranslations("AdminPage.cms");
  const format = useFormatter();
  const notify = useNotify();
  const router = useRouter();
  const [deleting, setDeleting] = useState<AdminArticleRow | null>(null);

  const done = (message: string) => {
    notify.success(message);
    router.refresh();
  };
  const toggle = useMutation({
    mutationFn: (row: AdminArticleRow) => toggleArticlePublishAction({ articleId: row.id, isPublished: !row.isPublished }),
    onSuccess: (res) => (res.success ? done(res.data.isPublished ? t("toast.published") : t("toast.unpublished")) : notify.error(res.error, "ARTICLE_UPDATE_FAILED")),
    onError: () => notify.error("ARTICLE_UPDATE_FAILED"),
  });
  const duplicate = useMutation({
    mutationFn: (row: AdminArticleRow) => duplicateArticleAction({ articleId: row.id }),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "ARTICLE_CREATE_FAILED");
      notify.success(t("toast.duplicated"));
      router.push(`/admin/cms/articles/${res.data.id}`);
    },
    onError: () => notify.error("ARTICLE_CREATE_FAILED"),
  });
  const remove = useMutation({
    mutationFn: (row: AdminArticleRow) => deleteArticleAction({ articleId: row.id }),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "ARTICLE_DELETE_FAILED");
      setDeleting(null);
      done(t("toast.deleted"));
    },
    onError: () => notify.error("ARTICLE_DELETE_FAILED"),
  });
  const busy = toggle.isPending || duplicate.isPending;

  const menu = (row: AdminArticleRow): AppMenuEntry[] => [
    { key: "edit", label: t("articles.menu.edit"), icon: Pencil, href: `/admin/cms/articles/${row.id}` },
    ...(row.isPublished ? [{ key: "view", label: t("articles.menu.view"), icon: ExternalLink, href: `/news/${row.slug}` } satisfies AppMenuEntry] : []),
    {
      key: "toggle",
      label: row.isPublished ? t("articles.menu.unpublish") : t("articles.menu.publish"),
      description: row.isPublished ? t("articles.menu.unpublishHint") : undefined,
      icon: row.isPublished ? EyeOff : Send,
      disabled: busy,
      onSelect: () => toggle.mutate(row),
    },
    { key: "duplicate", label: t("articles.menu.duplicate"), icon: Copy, disabled: busy, onSelect: () => duplicate.mutate(row) },
    { type: "separator", key: "sep" },
    {
      key: "delete",
      label: t("articles.menu.delete"),
      description: row.isPublished ? t("articles.menu.deleteBlocked") : undefined,
      icon: Trash2,
      tone: "danger",
      disabled: row.isPublished,
      onSelect: () => setDeleting(row),
    },
  ];

  const titleCell = (row: AdminArticleRow) => (
    <div className="flex min-w-0 items-center gap-3">
      <ArticleThumb src={row.thumbnail} />
      <div className="min-w-0">
        <Link href={`/admin/cms/articles/${row.id}`} className="line-clamp-2 font-medium text-[#09090B] hover:underline">
          {row.title}
        </Link>
        <p className="mt-0.5 truncate font-mono text-2xs text-[#A1A1AA]">/news/{row.slug}</p>
      </div>
    </div>
  );

  const stateCell = (row: AdminArticleRow) => (
    <div className="whitespace-nowrap">
      <AdminStatusText tone={row.isPublished ? "success" : "neutral"}>{row.isPublished ? t("articles.published") : t("articles.draft")}</AdminStatusText>
      <p className="mt-0.5 text-xs text-[#71717A]">{t("articles.updated", { date: format.dateTime(new Date(row.updatedAt), { day: "2-digit", month: "2-digit", year: "numeric" }) })}</p>
    </div>
  );

  const readCell = (row: AdminArticleRow) => (
    <div className="whitespace-nowrap text-sm">
      <p className="text-[#3F3F46]">{t("articles.minutes", { count: readingMinutes(row.words) })}</p>
      <p className={cn("mt-0.5 text-xs", row.hasEnglish ? "text-[#71717A]" : "text-amber-700")}>{row.hasEnglish ? t("articles.hasEn") : t("articles.noEn")}</p>
    </div>
  );

  const columns: AdminTableColumn<AdminArticleRow>[] = [
    { key: "title", header: t("articles.column.title"), cell: titleCell },
    { key: "state", header: t("articles.column.state"), className: "w-40", cell: stateCell },
    { key: "read", header: t("articles.column.read"), className: "hidden w-32 @2xl:table-cell", cell: readCell },
    { key: "author", header: t("articles.column.author"), className: "hidden w-36 @3xl:table-cell", cell: (row) => <span className="truncate text-sm text-[#3F3F46]">{row.authorName ?? "—"}</span> },
  ];

  return (
    <>
      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        minWidth={560}
        actionsLabel={t("actions")}
        empty={emptyText}
        rowActions={(row) => (
          <AppMenu
            tone="admin"
            width={240}
            align="end"
            items={menu(row)}
            trigger={
              <button type="button" aria-label={t("articles.menu.label", { title: row.title })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                <MoreHorizontal size={18} />
              </button>
            }
          />
        )}
        mobileRow={(row) => (
          <div className="space-y-2.5">
            {titleCell(row)}
            <div className="flex items-start justify-between gap-3 pl-19 text-sm">
              {stateCell(row)}
              <div className="text-right">{readCell(row)}</div>
            </div>
          </div>
        )}
      />

      {deleting && (
        <AdminDialog
          open
          onOpenChange={(open) => !open && !remove.isPending && setDeleting(null)}
          icon={Trash2}
          tone="danger"
          title={t("articles.deleteDialog.title")}
          description={deleting.title}
          footer={
            <>
              <button type="button" onClick={() => setDeleting(null)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
                {t("cancel")}
              </button>
              <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(deleting)} className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}>
                {t("articles.menu.delete")}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#3F3F46]">{t("articles.deleteDialog.body")}</p>
        </AdminDialog>
      )}
    </>
  );
}
