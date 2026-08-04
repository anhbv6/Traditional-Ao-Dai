import { type FaqItem } from "../types/faqs.types";

/**
 * Placeholder API for FAQs list.
 * Note: Real questions are currently localized using next-intl translations.
 */
export const fetchFaqsDataPlaceholder = async (): Promise<FaqItem[]> => {
  return Promise.resolve([]);
};
