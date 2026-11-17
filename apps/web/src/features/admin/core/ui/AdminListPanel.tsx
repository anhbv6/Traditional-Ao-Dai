"use client";

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { findAdminNavGroupInfo } from "../layout/utils/navigation";
import { AdminPageHeader } from "./AdminPage";
import { AdminSearchInput } from "./AdminSearchInput";

export interface AdminListPanelProps {
  icon: LucideIcon;
  /** Nhãn nhóm phía trên tiêu đề — nếu không truyền, tự động tra theo URL menu */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Thông tin tóm tắt hiển thị bên phải ở phần header (tương tự AdminPageHeader) */
  meta?: ReactNode;
  /** Nút thao tác ở phần header */
  actions?: ReactNode;
  /** Bộ lọc bên trái (thường là các AdminFilterSelect) */
  filters?: ReactNode;
  search?: { value: string; onChange: (value: string) => void; placeholder: string };
  /** Nút tạo mới đặt cạnh ô tìm kiếm */
  action?: { label: string; onClick: () => void };
}

/**
 * Khối đầu màn danh sách admin:
 * - Header chuẩn AdminPageHeader kiểu màn Vận chuyển & thanh toán (eyebrow + icon, tiêu đề, mô tả, đường kẻ viền dưới).
 * - Thanh công cụ lọc & tìm kiếm riêng biệt bên dưới trong card trắng sạch sẽ.
 */
export function AdminListPanel({
  icon: Icon,
  eyebrow,
  title,
  description,
  meta,
  actions,
  filters,
  search,
  action,
}: AdminListPanelProps) {
  const pathname = usePathname();
  const tNav = useTranslations("AdminPage.nav");

  let resolvedEyebrow = eyebrow;
  if (!resolvedEyebrow && pathname) {
    const info = findAdminNavGroupInfo(pathname);
    if (info?.groupKey) {
      resolvedEyebrow = tNav(`groups.${info.groupKey}`);
    } else if (info?.leafKey) {
      resolvedEyebrow = tNav(info.leafKey);
    }
  }

  const hasToolbar = Boolean(filters || search || action);

  return (
    <>
      <AdminPageHeader
        icon={Icon}
        eyebrow={resolvedEyebrow}
        title={title}
        description={description}
        meta={meta}
        actions={actions}
      />

      {hasToolbar && (
        <section>
          <div className="flex flex-wrap items-center gap-3">
            {filters && <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">{filters}</div>}

            {/* Cụm tìm kiếm + nút tạo luôn dạt phải; thiếu chỗ thì tự xuống dòng */}
            {(search || action) && (
              <div className="flex min-w-[280px] flex-1 items-center justify-end gap-2">
                {search && (
                  <AdminSearchInput
                    value={search.value}
                    onChange={search.onChange}
                    placeholder={search.placeholder}
                    className="flex-1 sm:max-w-72"
                  />
                )}
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
            )}
          </div>
        </section>
      )}
    </>
  );
}
