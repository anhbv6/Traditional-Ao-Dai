"use client";

import { useEffect, useMemo } from "react";
import { getArticleEngagementSeed, type NewsComment } from "../data/articleEngagement";
import { EMPTY_ENGAGEMENT, rehydrateNewsEngagement, useNewsEngagementStore } from "../store/newsEngagementStore";

/** Bình luận đã gộp phản hồi + lượt thích của người xem */
export interface ResolvedNewsComment extends NewsComment {
  likedByMe: boolean;
}

/**
 * Gộp số liệu mẫu của bài (mock) với tương tác của người xem (store):
 * lượt thích / không thích, điểm sao trung bình và danh sách bình luận.
 */
export function useArticleEngagement(articleId: string) {
  useEffect(() => {
    rehydrateNewsEngagement();
  }, []);

  const seed = useMemo(() => getArticleEngagementSeed(articleId), [articleId]);
  // Chọn đúng object đã lưu (tham chiếu ổn định) rồi mới gộp — selector trả object mới sẽ gây render lặp
  const entry = useNewsEngagementStore((state) => state.byArticle[articleId]) ?? EMPTY_ENGAGEMENT;
  const toggleVote = useNewsEngagementStore((state) => state.toggleVote);
  const rate = useNewsEngagementStore((state) => state.rate);
  const addComment = useNewsEngagementStore((state) => state.addComment);
  const addReply = useNewsEngagementStore((state) => state.addReply);
  const toggleCommentLike = useNewsEngagementStore((state) => state.toggleCommentLike);

  const comments = useMemo<ResolvedNewsComment[]>(
    () =>
      [...entry.comments, ...seed.comments].map((comment) => {
        const likedByMe = entry.likedCommentIds.includes(comment.id);
        return {
          ...comment,
          likes: comment.likes + (likedByMe ? 1 : 0),
          likedByMe,
          replies: [...(comment.replies ?? []), ...(entry.replies[comment.id] ?? [])],
        };
      }),
    [entry, seed.comments]
  );

  const ratingCount = seed.ratingCount + (entry.rating > 0 ? 1 : 0);
  const averageRating = (seed.ratingSum + entry.rating) / ratingCount;

  return {
    vote: entry.vote,
    likes: seed.likes + (entry.vote === "like" ? 1 : 0),
    dislikes: seed.dislikes + (entry.vote === "dislike" ? 1 : 0),
    myRating: entry.rating,
    averageRating,
    ratingCount,
    comments,
    toggleVote: (vote: "like" | "dislike") => toggleVote(articleId, vote),
    rate: (rating: number) => rate(articleId, rating),
    addComment: (comment: NewsComment) => addComment(articleId, comment),
    addReply: (commentId: string, reply: Parameters<typeof addReply>[2]) => addReply(articleId, commentId, reply),
    toggleCommentLike: (commentId: string) => toggleCommentLike(articleId, commentId),
  };
}

export type ArticleEngagement = ReturnType<typeof useArticleEngagement>;
