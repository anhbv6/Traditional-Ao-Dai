"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

type CheckboxProps = Omit<CheckboxPrimitive.Root.Props, "className"> & {
  className?: string
}

function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-[var(--text-light)]/30 bg-white shadow-xs transition-all duration-200 outline-none cursor-pointer focus-visible:border-[var(--primary-color)] focus-visible:ring-3 focus-visible:ring-[var(--accent-color)]/30 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-[var(--primary-color)] data-checked:bg-[var(--primary-color)] data-checked:text-white hover:border-[var(--primary-color)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon className="stroke-[3px]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
