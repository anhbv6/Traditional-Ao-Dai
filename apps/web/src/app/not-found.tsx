import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '404 — AODAI',
};

/**
 * 404 dự phòng NGOÀI phạm vi /[locale] (proxy luôn gắn locale nên hiếm khi tới đây).
 * Root layout chỉ trả `children` nên file này phải tự dựng <html>/<body> + nạp globals.css.
 * Không có NextIntl provider → song ngữ cố định; trang 404 đầy đủ (có hiệu ứng, đã dịch) nằm ở
 * `app/[locale]/(store)/not-found.tsx`.
 */
export default function RootNotFound() {
  return (
    <html lang="vi">
      <body className="grid min-h-screen place-items-center bg-[var(--bg-main)] px-5 text-center text-[var(--text-main)]">
        <main className="flex max-w-md flex-col items-center">
          <p className="font-[family-name:var(--font-playfair)] text-[6rem] font-semibold leading-none text-[var(--primary-ink)]">404</p>
          <span aria-hidden="true" className="mt-4 flex items-center gap-2 text-[var(--accent-color)]">
            <span className="h-px w-10 bg-current opacity-60" />
            <span className="size-1.5 rotate-45 border border-current" />
            <span className="h-px w-10 bg-current opacity-60" />
          </span>
          <h1 className="mt-6 text-xl font-semibold">Không tìm thấy trang · Page not found</h1>
          {/* next/link (không cần router của next-intl): proxy tự chuyển "/" về đúng ngôn ngữ */}
          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center bg-[var(--primary-color)] px-8 text-xs font-semibold uppercase tracking-[2px] text-white transition-colors hover:bg-[var(--bg-wine)]"
          >
            Về trang chủ · Home
          </Link>
        </main>
      </body>
    </html>
  );
}
