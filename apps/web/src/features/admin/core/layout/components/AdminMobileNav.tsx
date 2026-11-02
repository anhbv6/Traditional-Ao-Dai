"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Drawer, DrawerCloseButton, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { AdminNavPanel } from "./AdminNavPanel";
import { type AdminHeaderProps } from "../types/header.types";

/** Menu dạng ngăn kéo cho màn nhỏ: cùng nội dung và kiểu thẻ nổi với sidebar desktop */
export function AdminMobileNav({ onOpenProfile, onLogout, ...props }: AdminHeaderProps) {
  const t = useTranslations("AdminPage.header");
  const [open, setOpen] = useState(false);

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger
        aria-label={t("openMenu")}
        className="grid size-9 cursor-pointer place-items-center rounded-lg text-[#09090B] transition-colors hover:bg-[#F4F4F5]"
      >
        <Menu size={18} />
      </DrawerTrigger>

      <DrawerContent
        direction="left"
        className="admin-shell w-[min(86vw,320px)] select-none border-0 bg-transparent p-3 shadow-none"
      >
        <DrawerTitle className="sr-only">{t("systemTitle")}</DrawerTitle>
        <DrawerCloseButton className="absolute right-5 top-6 size-8 rounded-lg text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]" />

        <AdminNavPanel
          {...props}
          accountVariant="drawer"
          onNavigate={() => setOpen(false)}
          onOpenProfile={() => {
            // Đóng ngăn kéo trước để dialog hồ sơ không nằm chồng lên
            setOpen(false);
            onOpenProfile();
          }}
          onLogout={() => {
            setOpen(false);
            onLogout();
          }}
        />
      </DrawerContent>
    </Drawer>
  );
}
