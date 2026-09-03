"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { type FilterType } from "../types/dashboard.types";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  filter: FilterType;
  setFilter: (type: FilterType) => void;
  filterLabels: Record<FilterType, string>;
  isLoading?: boolean;
}

export function DashboardHeader({
  title,
  subtitle,
  filter,
  setFilter,
  filterLabels,
  isLoading,
}: DashboardHeaderProps) {
  return (
    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#09090B]">
            {title}
          </h1>
          {isLoading && <Spinner className="size-4 text-zinc-500" />}
        </div>
        <p className="mt-1 text-xs text-[#71717A]">
          {subtitle}
        </p>
      </div>

      {/* Dashboard Filter Toggle */}
      <div className="flex bg-white border border-[#E4E4E7] p-1 rounded-lg gap-1 shadow-xs shrink-0 self-start md:self-center select-none">
        {(["today", "week", "month"] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            disabled={isLoading && filter === type}
            className={cn(
              "px-4 py-2 text-xs font-semibold uppercase tracking-[0.5px] rounded-md transition-all duration-200 cursor-pointer disabled:cursor-default",
              filter === type
                ? "bg-[#18181B] text-white shadow-2xs"
                : "text-[#71717A] hover:text-[#09090B]"
            )}
          >
            {filterLabels[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
