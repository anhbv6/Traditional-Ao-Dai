/** Chủ đề câu hỏi — thứ tự ở đây là thứ tự hiển thị */
export const FAQ_TOPICS = ["sizing", "shipping", "materials", "refunds"] as const;

export type FaqTopicId = (typeof FAQ_TOPICS)[number];
export type CategoryId = "all" | FaqTopicId;

/** Danh sách câu hỏi (nội dung nằm ở `messages/<locale>/faqs.json` → `questions.<id>`) */
export const FAQ_ENTRIES = [
  { id: "q1", category: "sizing" },
  { id: "q2", category: "sizing" },
  { id: "q3", category: "shipping" },
  { id: "q4", category: "shipping" },
  { id: "q5", category: "materials" },
  { id: "q6", category: "materials" },
  { id: "q7", category: "refunds" },
  { id: "q8", category: "refunds" },
] as const satisfies ReadonlyArray<{ id: string; category: FaqTopicId }>;

export type FaqId = (typeof FAQ_ENTRIES)[number]["id"];

export interface FaqItem {
  id: FaqId;
  category: FaqTopicId;
  question: string;
  answer: string;
}
