"use client";

import { usePathname } from "@/i18n/routing";
import { ReactNode } from "react";

interface OnlyOnHomeProps {
  children: ReactNode;
}

export function OnlyOnHome({ children }: OnlyOnHomeProps) {
  const pathname = usePathname();
  
  if (pathname !== "/") {
    return null;
  }
  
  return <>{children}</>;
}
