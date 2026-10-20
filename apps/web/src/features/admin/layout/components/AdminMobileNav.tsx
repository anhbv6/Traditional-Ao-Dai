"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Drawer, DrawerCloseButton, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { type AdminSubNavProps } from "../types";

/** Menu module dạng ngăn kéo bên trái cho màn nhỏ (thay cho thanh tab desktop) */
export function AdminMobileNav({ items }: AdminSubNavProps) {
  const t = useTranslations("AdminPage.header");
  const [open, setOpen] = useState(false);

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger
        aria-label={t("openMenu")}
        className="grid size-9 cursor-pointer place-items-center rounded-lg text-[#09090B] transition-colors hover:bg-[#F4F4F5] lg:hidden"
      >
        <Menu size={18} />
      </DrawerTrigger>

      <DrawerContent direction="left" className="admin-shell w-[min(84vw,300px)] border-[#E4E4E7] bg-white">
        <div className="flex h-14 items-center justify-between border-b border-[#E4E4E7] px-4">
          <DrawerTitle className="font-(family-name:--font-admin) text-sm font-semibold normal-case tracking-normal text-[#09090B]">
            {t("systemTitle")}
          </DrawerTitle>
          <DrawerCloseButton className="size-8 rounded-lg text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]" />
        </div>

        <nav aria-label={t("navigation")} className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {items.map(({ href, icon: Icon, label, active }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active ? "bg-[#18181B] text-white" : "text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
