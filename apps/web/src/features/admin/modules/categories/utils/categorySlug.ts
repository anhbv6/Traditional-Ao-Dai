import { toSlug } from "@/features/admin/modules/products";

/** Từ đệm bỏ đi khi tạo đường dẫn gọn — không mang nghĩa phân loại */
const FILLER_WORDS = new Set(["va", "cho", "cua", "voi", "loai", "kieu", "dong", "mau", "the", "and", "for", "of"]);
const MAX_WORDS = 4;
const MAX_LENGTH = 40;

/**
 * Đường dẫn gọn từ tên loại sản phẩm: không dấu, bỏ từ đệm và từ lặp, tối đa 4 từ / 40 ký tự.
 * VD "Áo dài cưới / lễ hội cho cô dâu" → "ao-dai-cuoi-le".
 */
export function compactSlug(name: string): string {
  const words: string[] = [];
  for (const word of toSlug(name).split("-")) {
    if (!word || FILLER_WORDS.has(word) || words.includes(word)) continue;
    words.push(word);
    if (words.length === MAX_WORDS) break;
  }
  let slug = words.join("-");
  while (slug.length > MAX_LENGTH && slug.includes("-")) slug = slug.slice(0, slug.lastIndexOf("-"));
  return slug.slice(0, MAX_LENGTH);
}
