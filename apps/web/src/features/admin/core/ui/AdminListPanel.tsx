import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "./AdminPage";
import { AdminSearchInput } from "./AdminSearchInput";

interface AdminListPanelProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Bộ lọc bên trái (thường là các AdminFilterSelect) */
  filters?: ReactNode;
  search: { value: string; onChange: (value: string) => void; placeholder: string };
  /** Nút tạo mới đặt cạnh ô tìm kiếm */
  action?: { label: string; onClick: () => void };
}

/**
 * Khối đầu màn danh sách admin: icon + tiêu đề + mô tả, nét đứt, rồi hàng bộ lọc (trái) và cụm tìm kiếm + nút tạo (phải).
 * Thay cho AdminPageHeader + thanh lọc rời ở các màn danh sách để mọi màn cùng một khuôn.
 */
export function AdminListPanel({ icon: Icon, title, description, filters, search, action }: AdminListPanelProps) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[#E4E4E7] text-[#52525B]">
          <Icon size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[#09090B]">{title}</h1>
          {description && <p className="mt-1 text-sm text-[#71717A]">{description}</p>}
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-[#E4E4E7]" aria-hidden />

      <div className="flex flex-wrap items-center gap-3">
        {filters && <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">{filters}</div>}

        {/* Cụm tìm kiếm + nút tạo luôn dạt phải; thiếu chỗ (có cột ghi chú) thì tự xuống dòng */}
        <div className="flex min-w-[280px] flex-1 items-center justify-end gap-2">
          <AdminSearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
            className="flex-1 sm:max-w-72"
          />
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-[#E4E4E7] bg-white px-3.5 text-sm font-medium text-[#09090B] transition-colors hover:bg-[#FAFAFA]"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
