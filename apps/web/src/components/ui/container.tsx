import React, { type ComponentPropsWithoutRef, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps<T extends ElementType = "div"> {
  as?: T;
  children: React.ReactNode;
  className?: string;
}

export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: ContainerProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ContainerProps<T>>) {
  const Component = as || "div";
  return (
    <Component
      className={cn(
        "mx-auto w-full max-w-[1440px] bg-[#FAF7F5] px-5 py-5 sm:px-8 sm:py-12 lg:px-10",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
