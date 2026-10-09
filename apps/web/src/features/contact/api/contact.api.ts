import type { ContactFormValues } from "../types/contact.types";

/**
 * Gửi lời nhắn tư vấn — hiện là mock (Backend chưa có endpoint liên hệ).
 * Khi có API thật, thay bằng `apiClient.post(...)`.
 */
export const sendContactMessage = async (data: ContactFormValues) => {
  void data;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
};
