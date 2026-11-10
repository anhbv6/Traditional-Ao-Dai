"use client";

import { useState } from "react";
import { FileText, HelpCircle, Newspaper } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import { type CmsBoardData } from "../../types/cms.types";
import { CMS_FAQ_TOPICS, isFaqTopic, type CmsFaqTopic } from "../../utils/cmsRules";
import { ArticlesTable } from "../articles/ArticlesTable";
import { FaqDesk } from "../faqs/FaqDesk";

export type CmsTab = "articles" | "faqs";
type ArticleFilter = "ALL" | "PUBLISHED" | "DRAFT" | "NO_EN";
type TopicFilter = "ALL" | CmsFaqTopic | "NONE";

/**
 * Màn Cấu hình › Nội dung & FAQs: hai tab dùng chung đầu màn (bộ lọc + tìm kiếm + nút tạo đổi theo tab).
 * Bài viết là bảng → soạn ở màn riêng; FAQ là bàn soạn hai khung vì câu hỏi ngắn, cần sửa liên tục và xếp thứ tự.
 * Tab đang mở nằm trên URL (?tab=faqs) để quay lại đúng chỗ sau khi soạn bài.
 */
export function CmsBoard({ data, initialTab }: { data: CmsBoardData; initialTab: CmsTab }) {
  const t = useTranslations("AdminPage.cms");
  const tPage = useTranslations("AdminPage.pages.cms");
  const router = useRouter();
  const [tab, setTab] = useState<CmsTab>(initialTab);
  const [search, setSearch] = useState("");
  const [articleFilter, setArticleFilter] = useState<ArticleFilter>("ALL");
  const [topic, setTopic] = useState<TopicFilter>("ALL");

  const switchTab = (next: CmsTab) => {
    setTab(next);
    setSearch("");
    router.replace(next === "faqs" ? "/admin/cms?tab=faqs" : "/admin/cms", { scroll: false });
  };

  const keyword = search.trim().toLowerCase();
  const articles = data.articles.filter(
    (article) =>
      (!keyword || `${article.title} ${article.slug} ${article.titleEn ?? ""}`.toLowerCase().includes(keyword)) &&
      (articleFilter === "ALL" ||
        (articleFilter === "PUBLISHED" ? article.isPublished : articleFilter === "DRAFT" ? !article.isPublished : !article.hasEnglish))
  );
  const topicCount = (value: TopicFilter) =>
    value === "ALL" ? data.faqs.length : value === "NONE" ? data.faqs.filter((faq) => !isFaqTopic(faq.category)).length : data.faqs.filter((faq) => faq.category === value).length;

  const counts = { articles: data.articles.length, faqs: data.faqs.length };

  return (
    <>
      <AdminListPanel
        icon={FileText}
        title={tPage("title")}
        description={tPage("description")}
        filters={
          tab === "articles" ? (
            <AdminFilterSelect<ArticleFilter>
              label={t("filter.label")}
              value={articleFilter}
              onChange={setArticleFilter}
              options={(["ALL", "PUBLISHED", "DRAFT", "NO_EN"] as const).map((value) => ({ value, label: t(`filter.${value}`) }))}
            />
          ) : (
            <AdminFilterSelect<TopicFilter>
              label={t("filter.topic")}
              value={topic}
              onChange={setTopic}
              options={(["ALL", ...CMS_FAQ_TOPICS, ...(topicCount("NONE") ? ["NONE" as const] : [])] as TopicFilter[]).map((value) => ({
                value,
                label: `${value === "ALL" ? t("filter.ALL") : value === "NONE" ? t("topics.none") : t(`topics.${value}`)} · ${topicCount(value)}`,
              }))}
            />
          )
        }
        search={{ value: search, onChange: setSearch, placeholder: tab === "articles" ? t("articles.search") : t("faqs.search") }}
        action={tab === "articles" ? { label: t("articles.create"), onClick: () => router.push("/admin/cms/articles/new") } : undefined}
      />

      <div role="tablist" aria-label={t("tabsLabel")} className="flex gap-1 border-b border-[#E4E4E7]">
        {(
          [
            ["articles", Newspaper],
            ["faqs", HelpCircle],
          ] as const
        ).map(([value, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => switchTab(value)}
            className={cn(
              "-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-body transition-colors sm:px-4",
              tab === value ? "border-[#18181B] font-semibold text-[#09090B]" : "border-transparent text-[#71717A] hover:text-[#09090B]"
            )}
          >
            <Icon size={16} aria-hidden />
            {t(`tab.${value}`)}
            <span className="font-mono text-xs font-normal tabular-nums text-[#71717A]">{counts[value]}</span>
          </button>
        ))}
      </div>

      {tab === "articles" ? (
        <ArticlesTable rows={articles} emptyText={data.articles.length === 0 ? t("articles.empty") : t("articles.noMatch")} />
      ) : (
        <FaqDesk faqs={data.faqs} search={search} topic={topic} />
      )}

      <p className="px-1 text-xs text-[#A1A1AA]">{t("storefrontNote")}</p>
    </>
  );
}
