"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode } from "react";
import "lenis/dist/lenis.css";
import ClickSpark from "@/components/ClickSpark";

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <ClickSpark sparkColor="#E2A79E" sparkSize={9} sparkRadius={22} sparkCount={10}>
        {children}
      </ClickSpark>
    </ReactLenis>
  );
}
