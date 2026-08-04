export type CategoryId = "all" | "sizing" | "shipping" | "materials" | "refunds";

export interface FaqItem {
  id: string;
  category: CategoryId;
  question: string;
  answer: string;
}
