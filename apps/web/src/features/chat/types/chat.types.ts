/** Kênh chat: với cửa hàng (admin / nhân viên) hoặc trợ lý AI */
export type ChatChannel = "shop" | "ai";

export type ChatSender = "me" | "agent";

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  content: string;
  /** Thời điểm gửi (ISO) — tin mẫu ban đầu không có */
  sentAt?: string;
}

/** Nội dung song ngữ cho dữ liệu mẫu */
export interface LocalizedText {
  vi: string;
  en: string;
}

/** Luật trả lời mẫu: tin của khách chứa một trong các từ khóa -> trả câu tương ứng */
export interface ChatReplyRule {
  keywords: string[];
  reply: LocalizedText;
}
