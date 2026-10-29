"use client";

import { useEffect, useState } from "react";

/** Mép "đang đọc": mục có tiêu đề đã cuộn qua 30% chiều cao màn hình được coi là đang đọc */
const READING_LINE = 0.3;

/**
 * Scroll-spy cho mục lục: trả id của mục đang đọc — mục cuối cùng có mép trên đã qua vạch đọc;
 * cuộn chạm đáy trang thì chọn mục cuối (mục cuối thường ngắn, không bao giờ chạm vạch).
 * `ids` phải ổn định giữa các lần render (giữ bằng `useState`/`useMemo`) để không gắn lại listener.
 */
export function useActiveSection(ids: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      // Lấy phần tử ĐANG HIỆN theo id: Next giữ bản ẩn của trang vừa rời (Activity) nên id có thể bị trùng
      const elements = ids
        .map((id) => Array.from(document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)).find((el) => el.offsetHeight > 0))
        .filter((el): el is HTMLElement => Boolean(el));
      if (elements.length === 0) return;

      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const line = window.innerHeight * READING_LINE;
      const current = atBottom
        ? elements[elements.length - 1]
        : elements.findLast((element) => element.getBoundingClientRect().top <= line);
      setActiveId(current?.id ?? null);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids]);

  return activeId;
}
