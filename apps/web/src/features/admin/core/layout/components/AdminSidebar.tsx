"use client";

import { AdminNavPanel } from "./AdminNavPanel";
import { type AdminHeaderProps } from "../types/header.types";

/** Menu trái của khu quản trị (từ `lg` trở lên): thẻ nổi ghim theo chiều cao màn hình. Màn nhỏ dùng AdminHeader + AdminMobileNav */
export function AdminSidebar(props: AdminHeaderProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 select-none p-3 pr-0 lg:block">
      <AdminNavPanel {...props} />
    </aside>
  );
}
