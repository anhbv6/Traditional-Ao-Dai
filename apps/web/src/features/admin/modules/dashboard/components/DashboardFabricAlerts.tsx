"use client";

import { EyeOff, PackageCheck, PackagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { type LowFabric } from "../types/dashboard.types";

interface DashboardFabricAlertsProps {
  fabrics: LowFabric[];
  isLoading?: boolean;
  hidingProductId?: string | null;
  onHideProduct: (productId: string) => void;
}

const formatMeters = (value: number) => value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

/**
 * C (phải). Cây vải còn dưới ngưỡng mét — ẩn nhanh sản phẩm trên web hoặc chuyển sang nhập thêm
 */
export function DashboardFabricAlerts({ fabrics, isLoading, hidingProductId, onHideProduct }: DashboardFabricAlertsProps) {
  const t = useTranslations("AdminPage.dashboard.fabric");

  return (
    <section className={cn(ADMIN_CARD_CLASS, "flex flex-col")}>
      <header className="flex items-center justify-between gap-3 border-b border-[#E4E4E7] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[#09090B]">{t("title")}</h2>
          <p className="mt-0.5 text-xs text-[#71717A]">{t("subtitle")}</p>
        </div>
        <Link
          href="/admin/inventory"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs font-medium text-[#3F3F46] transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B]"
        >
          <PackagePlus size={13} />
          {t("restock")}
        </Link>
      </header>

      {isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#F4F4F5]" />
          ))}
        </div>
      ) : fabrics.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-xs text-[#71717A]">
          <PackageCheck size={20} className="text-emerald-600" />
          {t("empty")}
        </div>
      ) : (
        <ul className="divide-y divide-[#F4F4F5]">
          {fabrics.map((fabric) => {
            const ratio = Math.min(100, (fabric.remainingMeters / fabric.threshold) * 100);
            const critical = fabric.remainingMeters < fabric.threshold / 2;
            return (
              <li key={fabric.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-[#09090B]">{fabric.name}</p>
                    <span className={cn("shrink-0 font-mono text-sm font-semibold", critical ? "text-rose-700" : "text-amber-700")}>
                      {t("remaining", { meters: formatMeters(fabric.remainingMeters) })}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#F4F4F5]">
                    <div className={cn("h-full", critical ? "bg-rose-500" : "bg-amber-500")} style={{ width: `${ratio}%` }} />
                  </div>
                  <p className="mt-1 truncate text-[11px] text-[#71717A]">
                    <span className="font-mono">{fabric.code}</span>
                    {fabric.product ? ` · ${fabric.product.name}` : ` · ${t("noProduct")}`}
                  </p>
                </div>

                {fabric.product ? (
                  fabric.product.isActive ? (
                    <button
                      type="button"
                      onClick={() => onHideProduct(fabric.product!.id)}
                      disabled={hidingProductId === fabric.product.id}
                      className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {hidingProductId === fabric.product.id ? <Spinner className="size-3.5" /> : <EyeOff size={13} />}
                      <span className="hidden sm:inline">{t("hideOnWeb")}</span>
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-md bg-[#F4F4F5] px-2 py-1 text-[11px] font-medium text-[#71717A]">{t("hidden")}</span>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
