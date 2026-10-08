"use client";

import React, { useState, useTransition } from "react";
import { type AdminArticleItem, type AdminFaqItem } from "../types/cms.types";
import { toggleArticlePublishAction, toggleFaqActiveAction } from "../actions/cms.actions";
import {
  FileText,
  HelpCircle,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";

interface CmsManagerProps {
  initialArticles: AdminArticleItem[];
  initialFaqs: AdminFaqItem[];
}

export function CmsManager({ initialArticles, initialFaqs }: CmsManagerProps) {
  const [activeTab, setActiveTab] = useState<"articles" | "faqs">("articles");
  const [articles, setArticles] = useState<AdminArticleItem[]>(initialArticles);
  const [faqs, setFaqs] = useState<AdminFaqItem[]>(initialFaqs);
  const [isPending, startTransition] = useTransition();

  const handleToggleArticle = (articleId: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleArticlePublishAction(articleId, !current);
      if (res.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? { ...a, isPublished: !current } : a))
        );
      }
    });
  };

  const handleToggleFaq = (faqId: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleFaqActiveAction(faqId, !current);
      if (res.success) {
        setFaqs((prev) =>
          prev.map((f) => (f.id === faqId ? { ...f, isActive: !current } : f))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("articles")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "articles"
                ? "bg-[#18181B] text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <FileText size={14} /> Bài viết & Cẩm nang ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab("faqs")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "faqs"
                ? "bg-[#18181B] text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <HelpCircle size={14} /> Câu hỏi thường gặp FAQs ({faqs.length})
          </button>
        </div>

        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#18181B] text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
        >
          <Plus size={13} /> {activeTab === "articles" ? "Viết bài mới" : "Thêm câu hỏi"}
        </button>
      </div>

      {/* Articles List */}
      {activeTab === "articles" && (
        <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] bg-zinc-50/50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">Tiêu đề bài viết</th>
                <th className="py-3 px-4">Tác giả</th>
                <th className="py-3 px-4">Ngày đăng</th>
                <th className="py-3 px-4 text-right">Trạng thái xuất bản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-sm">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-500">
                    <FileText className="mx-auto size-8 text-zinc-300 mb-2" />
                    Chưa có bài viết nào.
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 line-clamp-1">{article.title}</div>
                      <div className="text-xs text-zinc-400 font-mono">/{article.slug}</div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 text-xs font-medium">
                      {article.authorName}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-mono text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} className="text-zinc-400" />
                        {new Date(article.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleArticle(article.id, article.isPublished)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          article.isPublished
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        {article.isPublished ? (
                          <>
                            <CheckCircle size={12} /> Đã đăng
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Bản nháp
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FAQs List */}
      {activeTab === "faqs" && (
        <div className="space-y-3">
          {faqs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-[#E4E4E7] text-zinc-500">
              <HelpCircle className="mx-auto size-8 text-zinc-300 mb-2" />
              Chưa có câu hỏi FAQ nào.
            </div>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs flex items-start justify-between gap-4">
                <div>
                  {faq.category && (
                    <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-bold text-zinc-600 mb-1.5 uppercase">
                      {faq.category}
                    </span>
                  )}
                  <h4 className="font-semibold text-sm text-zinc-900">{faq.question}</h4>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{faq.answer}</p>
                </div>

                <button
                  disabled={isPending}
                  onClick={() => handleToggleFaq(faq.id, faq.isActive)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 transition-colors cursor-pointer ${
                    faq.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-zinc-100 text-zinc-500 border-zinc-200"
                  }`}
                >
                  {faq.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {faq.isActive ? "Hiển thị" : "Ẩn"}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
