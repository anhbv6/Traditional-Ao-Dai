import { type Locale } from "@repo/shared";
import { type MockProduct } from "../data/mockProducts";

/** Số ký tự tối thiểu để bắt đầu gợi ý (tránh gợi ý tràn lan khi mới gõ 1 chữ) */
export const MIN_SEARCH_LENGTH = 2;

/** Từ khóa ẩn cho hình thức mua — khách hay gõ "may đo" / "có sẵn" thay vì tên sản phẩm */
const PURCHASE_KEYWORDS: Record<MockProduct["purchaseType"], string> = {
  ready: "có sẵn hàng sẵn ready to wear",
  custom: "may đo theo số đo custom tailor bespoke",
};

/**
 * Bỏ dấu tiếng Việt + chữ thường, giữ nguyên độ dài theo từng ký tự (1 ký tự gốc -> 1 ký tự chuẩn hóa)
 * để có thể dùng chỉ số của chuỗi chuẩn hóa tô đậm đúng vị trí trên chuỗi gốc.
 */
function normalizeChar(char: string): string {
  if (char === "đ" || char === "Đ") return "d";
  const stripped = char.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return stripped.length === 1 ? stripped : char.toLowerCase();
}

export function normalizeSearchText(value: string): string {
  return Array.from(value.normalize("NFC"), normalizeChar).join("");
}

/** Tách từ khóa thành các từ đã chuẩn hóa (bỏ khoảng trắng thừa) */
export function tokenizeQuery(query: string): string[] {
  return normalizeSearchText(query).split(/\s+/).filter(Boolean);
}

/** Toàn bộ nội dung có thể tìm của một sản phẩm (cả hai ngôn ngữ, chất liệu, danh mục, màu, hình thức mua) */
function buildHaystack(product: MockProduct): string {
  return normalizeSearchText(
    [
      product.id,
      product.name.vi,
      product.name.en,
      product.description.vi,
      product.description.en,
      product.material,
      product.category,
      product.colors.map((color) => color.name).join(" "),
      PURCHASE_KEYWORDS[product.purchaseType],
    ].join(" ")
  );
}

/**
 * Điểm liên quan (0 = không khớp). Mọi từ khóa phải xuất hiện ở đâu đó trong sản phẩm;
 * khớp ở tên được ưu tiên: tên bắt đầu bằng cụm từ > tên chứa cụm từ > tên chứa đủ các từ > khớp ở thông tin khác.
 */
export function scoreProduct(product: MockProduct, query: string, locale: Locale): number {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 1;

  const haystack = buildHaystack(product);
  if (!tokens.every((token) => haystack.includes(token))) return 0;

  const phrase = tokens.join(" ");
  const name = normalizeSearchText(product.name[locale]);
  if (name.startsWith(phrase)) return 100;
  if (name.includes(phrase)) return 70;
  if (tokens.every((token) => name.includes(token))) return 40;
  return 10;
}

/** Lọc + xếp hạng theo độ liên quan (cùng điểm thì sản phẩm bán chạy hơn đứng trước) */
export function searchProducts(products: MockProduct[], query: string, locale: Locale): MockProduct[] {
  return products
    .map((product) => ({ product, score: scoreProduct(product, query, locale) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.product.popularity - a.product.popularity)
    .map((entry) => entry.product);
}

/**
 * Chia chuỗi thành các đoạn để tô đậm phần khớp từ khóa (không phân biệt dấu / hoa thường).
 * Ví dụ: highlight("Áo Dài Gấm", "ao dai") -> [{ text: "Áo Dài", match: true }, { text: " Gấm", match: false }]
 */
export function getHighlightParts(text: string, query: string): Array<{ text: string; match: boolean }> {
  const source = Array.from(text.normalize("NFC"));
  const normalized = source.map(normalizeChar).join("");
  const marks = new Array<boolean>(source.length).fill(false);

  for (const token of tokenizeQuery(query)) {
    let from = normalized.indexOf(token);
    while (from !== -1) {
      for (let i = from; i < from + token.length; i += 1) marks[i] = true;
      from = normalized.indexOf(token, from + token.length);
    }
  }

  const parts: Array<{ text: string; match: boolean }> = [];
  source.forEach((char, index) => {
    const last = parts[parts.length - 1];
    if (last && last.match === marks[index]) last.text += char;
    else parts.push({ text: char, match: marks[index] });
  });
  return parts;
}
