/** Văn bản mock theo hai ngôn ngữ (dữ liệu trả lời mẫu chưa đi qua next-intl) */
export interface LocalizedText {
  vi: string;
  en: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/** Luật trả lời mẫu: tin người dùng chứa một trong các từ khóa thì dùng câu trả lời tương ứng */
export interface AssistantReplyRule {
  keywords: string[];
  reply: LocalizedText;
}
