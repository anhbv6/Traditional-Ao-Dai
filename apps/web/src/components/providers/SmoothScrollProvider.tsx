"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import ClickSpark from "@/components/effects/ClickSpark";

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin");

  if (isAdmin) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <ClickSpark sparkColor="#E2A79E" sparkSize={9} sparkRadius={22} sparkCount={10}>
        {children}
      </ClickSpark>
    </ReactLenis>
  );
}
