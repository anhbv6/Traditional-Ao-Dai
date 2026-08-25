"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  trigger: (options: { open: boolean; toggle: () => void; close: () => void }) => ReactNode;
  children: (options: { close: () => void }) => ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openOnHover?: boolean;
  showArrow?: boolean;
  className?: string;
  positionerClassName?: string;
  contentClassName?: string;
  arrowClassName?: string;
  align?: "start" | "center" | "end";
}

export function Dropdown({
  trigger,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  openOnHover = true,
  showArrow = true,
  className,
  positionerClassName,
  contentClassName,
  arrowClassName,
  align = "end",
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const close = () => setOpen(false);
  const toggle = () => setOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!isControlled) {
          setInternalOpen(false);
        }

        onOpenChange?.(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isControlled, onOpenChange]);

  const alignmentClassName = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }[align];

  const arrowAlignmentClassName = {
    start: "left-4",
    center: "left-1/2 -translate-x-1/2",
    end: "right-4",
  }[align];

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={openOnHover ? () => setOpen(true) : undefined}
      onMouseLeave={openOnHover ? () => setOpen(false) : undefined}
    >
      {trigger({ open: isOpen, toggle, close })}

      <div
        className={cn(
          "absolute top-full z-50 pt-2 transition-all duration-200 ease-out",
          alignmentClassName,
          positionerClassName,
          isOpen
            ? "visible opacity-100 translate-y-0"
            : "invisible opacity-0 -translate-y-1 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "relative rounded-xl border border-[#E2D9D2] bg-white p-2 text-[#2A2525] shadow-xl",
            contentClassName
          )}
        >
          {showArrow && (
            <div
              className={cn(
                "absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t border-[#E2D9D2] bg-white",
                arrowAlignmentClassName,
                arrowClassName
              )}
              aria-hidden="true"
            />
          )}
          {children({ close })}
        </div>
      </div>
    </div>
  );
}

export default Dropdown;
