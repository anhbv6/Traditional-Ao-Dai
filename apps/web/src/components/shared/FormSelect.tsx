"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FormSelectOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  id?: string;
  label?: React.ReactNode;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  options: FormSelectOption[];
  startIcon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function FormSelect({
  id,
  label,
  placeholder,
  value,
  onValueChange,
  disabled,
  options,
  startIcon,
  error,
  containerClassName,
  labelClassName,
  triggerClassName,
  contentClassName,
}: FormSelectProps) {
  return (
    <div className={cn("relative space-y-1.5 flex flex-col", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block font-[family-name:var(--font-lora)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]",
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      <div className="relative w-full">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-[#706565]/60 z-10 pointer-events-none">
            {startIcon}
          </div>
        )}

        <Select
          value={value || undefined}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger
            id={id}
            className={cn(
              "!w-full !h-10 !rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-ring/30 hover:border-primary/30 shadow-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground data-placeholder:text-xs sm:data-placeholder:text-sm data-[open]:bg-white data-[popup-open]:bg-white",
              startIcon ? "!pl-9 !pr-3" : "!px-3",
              error ? "border-rose-400 focus-visible:border-rose-400" : "",
              triggerClassName
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent
            className={cn(
              "bg-white border border-[#E2D9D2] text-[#2A2525] shadow-lg rounded-xl overflow-hidden font-medium z-[100] max-h-60 overscroll-contain",
              contentClassName
            )}
          >
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="cursor-pointer text-xs font-medium data-[highlighted]:bg-[#800020]/10 data-[highlighted]:text-[#800020] data-[selected]:bg-[#800020] data-[selected]:text-white"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
