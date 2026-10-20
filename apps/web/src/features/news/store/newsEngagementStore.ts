"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type NewsComment, type NewsCommentReply } from "../data/articleEngagement";

export type ArticleVote = "like" | "dislike" | null;

/** Tương tác của CHÍNH người xem với một bài viết */
export interface ArticleEngagementEntry {
  vote: ArticleVote;
  /** 0 = chưa chấm */
  rating: number;
  /** Bình luận người xem tự đăng (mới nhất đứng đầu) */
  comments: NewsComment[];
  /** Phản hồi người xem gửi, theo id bình luận */
  replies: Record<string, NewsCommentReply[]>;
  likedCommentIds: string[];
}

export const EMPTY_ENGAGEMENT: ArticleEngagementEntry = {
  vote: null,
  rating: 0,
  comments: [],
  replies: {},
  likedCommentIds: [],
};

interface NewsEngagementState {
  byArticle: Record<string, ArticleEngagementEntry>;
  toggleVote: (articleId: string, vote: Exclude<ArticleVote, null>) => void;
  rate: (articleId: string, rating: number) => void;
  addComment: (articleId: string, comment: NewsComment) => void;
  addReply: (articleId: string, commentId: string, reply: NewsCommentReply) => void;
  toggleCommentLike: (articleId: string, commentId: string) => void;
}

const updateEntry = (
  state: NewsEngagementState,
  articleId: string,
  update: (entry: ArticleEngagementEntry) => Partial<ArticleEngagementEntry>
) => {
  const entry = state.byArticle[articleId] ?? EMPTY_ENGAGEMENT;
  return { byArticle: { ...state.byArticle, [articleId]: { ...entry, ...update(entry) } } };
};

/**
 * Thích / không thích, chấm sao và bình luận bài viết của người xem.
 * Chưa có API nên lưu localStorage (khách vãng lai vẫn thấy lại lựa chọn của mình khi quay lại bài).
 * `skipHydration` + `rehydrateNewsEngagement()` gọi phía client để tránh lệch hydration.
 */
export const useNewsEngagementStore = create<NewsEngagementState>()(
  persist(
    (set) => ({
      byArticle: {},

      toggleVote: (articleId, vote) =>
        set((state) => updateEntry(state, articleId, (entry) => ({ vote: entry.vote === vote ? null : vote }))),

      rate: (articleId, rating) => set((state) => updateEntry(state, articleId, () => ({ rating }))),

      addComment: (articleId, comment) =>
        set((state) => updateEntry(state, articleId, (entry) => ({ comments: [comment, ...entry.comments] }))),

      addReply: (articleId, commentId, reply) =>
        set((state) =>
          updateEntry(state, articleId, (entry) => ({
            replies: { ...entry.replies, [commentId]: [...(entry.replies[commentId] ?? []), reply] },
          }))
        ),

      toggleCommentLike: (articleId, commentId) =>
        set((state) =>
          updateEntry(state, articleId, (entry) => ({
            likedCommentIds: entry.likedCommentIds.includes(commentId)
              ? entry.likedCommentIds.filter((id) => id !== commentId)
              : [...entry.likedCommentIds, commentId],
          }))
        ),
    }),
    {
      name: "aodai-news-engagement",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ byArticle: state.byArticle }),
    }
  )
);

/** Nạp tương tác đã lưu từ localStorage (gọi phía client, gọi lại nhiều lần vẫn an toàn) */
export function rehydrateNewsEngagement() {
  if (!useNewsEngagementStore.persist.hasHydrated()) void useNewsEngagementStore.persist.rehydrate();
}
