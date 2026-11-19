"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

export type AdminTabsVariant = "line" | "pill";

interface AdminTabsContextValue {
  variant: AdminTabsVariant;
}

const AdminTabsContext = createContext<AdminTabsContextValue>({ variant: "line" });

export interface AdminTabsProps extends TabsPrimitive.Root.Props {
  variant?: AdminTabsVariant;
}

/**
 * Thành phần Tabs chuẩn cho khu vực Admin:
 * - Hỗ trợ 2 kiểu hiển thị: `line` (gạch chân tối giản ở đầu thẻ) và `pill` (nút bấm viên thuốc bo góc).
 * - Tự động đồng bộ chuẩn màu và font chữ theo AGENTS.md §8 (nền `#FAFAFA`, chữ `#09090B`, phụ `#71717A`, active `#18181B`).
 * - Mặc định `keepMounted = true` ở AdminTabsContent để giữ nguyên trạng thái form và DOM khi chuyển tab.
 */
export function AdminTabs({
  variant = "line",
  className,
  orientation = "horizontal",
  ...props
}: AdminTabsProps) {
  return (
    <AdminTabsContext.Provider value={{ variant }}>
      <TabsPrimitive.Root
        data-orientation={orientation}
        className={(state) =>
          cn("flex flex-col gap-3", typeof className === "function" ? className(state) : className)
        }
        {...props}
      />
    </AdminTabsContext.Provider>
  );
}

export function AdminTabsList({ className, ...props }: TabsPrimitive.List.Props) {
  const { variant } = useContext(AdminTabsContext);
  return (
    <TabsPrimitive.List
      className={(state) =>
        cn(
          variant === "line"
            ? "flex h-auto w-full items-center justify-start gap-1 border-b border-[#E4E4E7] p-0"
            : "inline-flex h-9 items-center gap-1 rounded-lg border border-[#E4E4E7] bg-[#F4F4F5] p-1",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  );
}

export interface AdminTabsTriggerProps extends TabsPrimitive.Tab.Props {
  badge?: ReactNode;
}

export function AdminTabsTrigger({
  className,
  children,
  badge,
  ...props
}: AdminTabsTriggerProps) {
  const { variant } = useContext(AdminTabsContext);
  return (
    <TabsPrimitive.Tab
      className={(state) =>
        cn(
          "cursor-pointer outline-none transition-colors select-none text-[#71717A]",
          variant === "line"
            ? "-mb-px relative inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-body transition-colors sm:px-4 hover:text-[#09090B] data-active:border-[#18181B] data-active:font-semibold data-active:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15"
            : "inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium hover:bg-white/60 hover:text-[#09090B] data-active:bg-white data-active:text-[#09090B] data-active:font-semibold data-active:shadow-xs focus-visible:ring-2 focus-visible:ring-[#18181B]/15",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    >
      {children}
      {badge}
    </TabsPrimitive.Tab>
  );
}

export function AdminTabsContent({
  className,
  keepMounted = true,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      keepMounted={keepMounted}
      className={(state) =>
        cn("outline-none data-hidden:hidden", typeof className === "function" ? className(state) : className)
      }
      {...props}
    />
  );
}
