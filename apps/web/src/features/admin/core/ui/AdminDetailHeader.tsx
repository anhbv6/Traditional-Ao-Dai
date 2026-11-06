"use client";

import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

interface AdminDetailHeaderProps {
  /** Màn danh sách để quay lại */
  backHref: string;
  backLabel: string;
  title: string;
  /** Ô icon trước tiêu đề (VD phân biệt loại đối tượng) */
  icon?: ReactNode;
  /** Nhãn trạng thái cạnh tiêu đề */
  badge?: ReactNode;
  /** Dòng phụ dưới tiêu đề (mã, slug, "chưa lưu"…) */
  subtitle?: ReactNode;
  /** Nút thao tác bên phải (xem trước, xóa, lưu…) */
  actions?: ReactNode;
}

/**
 * Thanh đầu DÙNG CHUNG cho mọi màn chi tiết admin: "← danh sách", tiêu đề + nhãn, dòng phụ, nút bên phải.
 * Ghim ngay từ đầu: kéo lên trùng lề trên của AdminPage (-mt) rồi bù bằng pt — dính dưới thanh menu
 * (56px + 1px viền) ở màn nhỏ, sát mép trên ở lg (admin không có header storefront) → cuộn không bị xê dịch.
 */
export function AdminDetailHeader({
  backHref,
  backLabel,
  title,
  icon,
  badge,
  subtitle,
  actions,
}: AdminDetailHeaderProps) {
  return (
    <div className="sticky top-[57px] z-30 -mx-4 -mt-5 border-b border-[#E4E4E7] bg-[#FAFAFA]/90 px-4 pb-3 pt-8 backdrop-blur sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-11 lg:top-0 lg:-mx-6 lg:-mt-3 lg:px-6 lg:pt-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Rộng tối thiểu để ở màn hẹp các nút xuống dòng thay vì ép tên bị cắt */}
        <div className="min-w-[min(100%,14rem)] flex-1">
          <Link
            href={backHref}
            // Liên kết quay về nhỏ hẳn (10px — ngoại lệ thang chữ, theo yêu cầu thiết kế) để tiêu đề nổi bật
            className="mb-1 inline-flex items-center gap-1 text-[10px] font-medium text-[#71717A] hover:text-[#09090B]"
          >
            <ArrowLeft size={11} aria-hidden /> {backLabel}
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            <h1 className="truncate text-3xl font-semibold tracking-tight text-[#09090B]">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-[#71717A]">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
