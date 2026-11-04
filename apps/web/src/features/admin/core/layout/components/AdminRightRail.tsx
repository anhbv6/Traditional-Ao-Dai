"use client";

import { AdminTodayNotes } from "./AdminTodayNotes";
import { AdminUserMenu } from "./AdminUserMenu";
import { type AdminUserMenuProps } from "../types/header.types";

/**
 * Cột phải của khu quản trị (từ `xl`), ghim theo chiều cao màn hình như AdminSidebar:
 * khối tài khoản ở góc trên, thẻ ghi chú việc hôm nay nằm ngay bên dưới.
 */
export function AdminRightRail(props: Omit<AdminUserMenuProps, "variant">) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col gap-3 p-3 pl-0 xl:flex">
      <AdminUserMenu variant="corner" {...props} />
      <div className="flex min-h-0 flex-1 items-start">
        <AdminTodayNotes />
      </div>
    </aside>
  );
}
