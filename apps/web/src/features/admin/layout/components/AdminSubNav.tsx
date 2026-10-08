"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { type AdminSubNavProps } from "../types";

export function AdminSubNav({ items }: AdminSubNavProps) {
  return (
    <div className="bg-zinc-50/80 border-t border-zinc-200/80 px-5 sm:px-8 lg:px-12 py-2 flex items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              item.active
                ? "bg-zinc-900 text-white shadow-2xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
            }`}
          >
            <Icon size={13} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
