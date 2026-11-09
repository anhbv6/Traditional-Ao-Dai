import type { NextRequest } from "next/server";
import { routing } from "./routing";

type AppLocale = (typeof routing.locales)[number];

/** Cookie next-intl ghi khi người dùng đã từng chọn / vào một ngôn ngữ — tôn trọng lựa chọn này trước Accept-Language */
const LOCALE_COOKIE = "NEXT_LOCALE";

/** Ngôn ngữ dự phòng khi trình duyệt không dùng tiếng Việt hay tiếng Anh: khách quốc tế đọc tiếng Anh dễ hơn */
export const FALLBACK_LOCALE: AppLocale = "en";

const isAppLocale = (value: string | undefined): value is AppLocale =>
  !!value && (routing.locales as readonly string[]).includes(value);

/**
 * Chọn ngôn ngữ hiển thị cho URL chưa có tiền tố locale:
 * cookie NEXT_LOCALE hợp lệ → ngôn ngữ đầu tiên (theo trọng số q) trong Accept-Language thuộc vi / en → mặc định `en`.
 * Chỉ xét mã ngôn ngữ chính (`en-US` → `en`, `vi-VN` → `vi`).
 */
export function detectPreferredLocale(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isAppLocale(cookieLocale)) return cookieLocale;

  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { lang: tag.trim().toLowerCase().split("-")[0], q: Number.isNaN(q) ? 0 : q, index };
    })
    .filter((entry) => entry.lang && entry.q > 0)
    // Cùng trọng số thì giữ thứ tự trình duyệt gửi
    .sort((a, b) => b.q - a.q || a.index - b.index);

  return ranked.find((entry) => isAppLocale(entry.lang))?.lang as AppLocale | undefined ?? FALLBACK_LOCALE;
}
