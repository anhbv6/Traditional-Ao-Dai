import type { NewsletterPayload } from "../validations/newsletter.validation";

/**
 * Đăng ký nhận Newsletter / VIP Club.
 * TODO: chưa có endpoint — thay phần mock bằng
 *   apiClient.post("/api/newsletter/subscribe", payload, { skipAuth: true })
 * khi BE hoàn thiện (BE nên trả mã KEY, vd. NEWSLETTER_ALREADY_SUBSCRIBED).
 */
export const subscribeNewsletterApi = async (payload: NewsletterPayload): Promise<void> => {
  void payload;
  /* Mock: giả lập độ trễ mạng */
  await new Promise((resolve) => setTimeout(resolve, 600));
};
