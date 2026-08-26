"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FilterType } from "../types/dashboard.types";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  filter: FilterType;
  setFilter: (type: FilterType) => void;
  toastMsg: string | null;
  filterLabels: Record<FilterType, string>;
}

export function DashboardHeader({
  title,
  subtitle,
  filter,
  setFilter,
  toastMsg,
  filterLabels,
}: DashboardHeaderProps) {
  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-white border border-[#E4E4E7] px-6 py-3.5 shadow-md select-none"
          >
            <CheckCircle2 size={18} className="text-[#09090B] shrink-0" />
            <span className="text-xs font-semibold text-[#09090B] whitespace-nowrap">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title & Filter Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#09090B]">
            {title}
          </h1>
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
              className={cn(
                "px-4 py-2 text-xs font-semibold uppercase tracking-[0.5px] rounded-md transition-all duration-200 cursor-pointer",
                filter === type
                  ? "bg-[#18181B] text-white"
                  : "text-[#71717A] hover:text-[#09090B]"
              )}
            >
              {filterLabels[type]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
