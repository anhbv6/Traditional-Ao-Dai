"use client";

import { useState } from "react";
import { AlertTriangle, CircleX, CreditCard, Truck } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminPageHeader,
} from "@/features/admin/core/ui";
import { type ShippingPaymentData, type ShippingPaymentSettings } from "../../types/shippingPayment.types";
import { SHOP_TIME_ZONE, settingsIssues, type SettingsIssue } from "../../utils/shippingRules";
import { PaymentTab } from "../payment/PaymentTab";
import { ShippingTab } from "../shipping/ShippingTab";
import { OrderSimulator } from "../simulator/OrderSimulator";

type Tab = "shipping" | "payment";

/** Vấn đề cấu hình thuộc tab nào — để chấm báo trên tab và nút "Xem" nhảy đúng chỗ */
const ISSUE_TARGET: Record<SettingsIssue["kind"], { tab: Tab; anchor: string }> = {
  UNASSIGNED: { tab: "shipping", anchor: "zones" },
  DUPLICATE: { tab: "shipping", anchor: "zones" },
  ZONE_EMPTY: { tab: "shipping", anchor: "zones" },
  ETA_INVALID: { tab: "shipping", anchor: "zones" },
  ZONE_CARRIER_OFF: { tab: "shipping", anchor: "carriers" },
  CUTOFF_INVALID: { tab: "shipping", anchor: "fulfillment" },
  NO_METHOD: { tab: "payment", anchor: "methods" },
  NO_TAILORED_METHOD: { tab: "payment", anchor: "methods" },
  DEPOSIT_RANGE: { tab: "payment", anchor: "methods" },
  COD_BELOW_DEPOSIT: { tab: "payment", anchor: "methods" },
  BANK_INCOMPLETE: { tab: "payment", anchor: "bank" },
};

/**
 * Màn Cấu hình › Vận chuyển & thanh toán. Không chia đều: dải "cần sửa" trên cùng (chỉ khi có), hai tab theo hai nửa
 * nghiệp vụ, và bộ "Thử tính đơn" luôn chạy trên cấu hình đang soạn để thấy ngay hệ quả của từng thay đổi.
 * Thanh lưu chỉ hiện khi có thay đổi. Dữ liệu mock — lưu chỉ đổi state ở client.
 */
export function ShippingPaymentBoard({ data }: { data: ShippingPaymentData }) {
  const t = useTranslations("AdminPage.shippingPayment");
  const tPage = useTranslations("AdminPage.pages.shippingPayment");
  const format = useFormatter();
  const notify = useNotify();
  const [saved, setSaved] = useState(data.settings);
  const [settings, setSettings] = useState(data.settings);
  const [savedMeta, setSavedMeta] = useState({ at: data.updatedAt, by: data.updatedBy });
  const [tab, setTab] = useState<Tab>("shipping");

  const update = (change: (current: ShippingPaymentSettings) => ShippingPaymentSettings) => setSettings((current) => change(current));
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const issues = settingsIssues(settings, data.provinces);
  const blocking = issues.filter((issue) => issue.level === "block");
  const tabIssues = (value: Tab) => issues.filter((issue) => ISSUE_TARGET[issue.kind].tab === value);

  const save = () => {
    if (blocking.length) {
      notify.error("SHIPPING_PAYMENT_INVALID");
      return;
    }
    setSaved(settings);
    setSavedMeta({ at: new Date().toISOString(), by: t("you") });
    notify.success(t("toast.saved"));
  };

  const jump = (issue: SettingsIssue) => {
    const target = ISSUE_TARGET[issue.kind];
    setTab(target.tab);
    // Đợi tab mới render rồi mới cuộn tới thẻ
    requestAnimationFrame(() => document.getElementById(target.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const issueText = (issue: SettingsIssue) => {
    switch (issue.kind) {
      case "UNASSIGNED":
        return t("issue.UNASSIGNED", { count: issue.provinces.length, names: issue.provinces.map((province) => province.name).join(", ") });
      case "DUPLICATE":
        return t("issue.DUPLICATE", { province: issue.province.name, zones: issue.zones.join(", ") });
      case "ZONE_EMPTY":
      case "ETA_INVALID":
        return t(`issue.${issue.kind}`, { zone: issue.zone.name });
      case "ZONE_CARRIER_OFF":
        return t("issue.ZONE_CARRIER_OFF", { zone: issue.zone.name, carrier: issue.carrier });
      default:
        return t(`issue.${issue.kind}`);
    }
  };

  return (
    <>
      <AdminPageHeader
        icon={Truck}
        eyebrow={t("eyebrow")}
        title={tPage("title")}
        description={tPage("description")}
        meta={
          <span>
            {t("lastSaved", {
              by: savedMeta.by,
              date: format.dateTime(new Date(savedMeta.at), { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: SHOP_TIME_ZONE }),
            })}
          </span>
        }
      />

      {issues.length > 0 && (
        <section className={cn(ADMIN_CARD_CLASS, "px-4 py-3 sm:px-5", blocking.length && "border-rose-200")}>
          <p className={cn("mb-2 text-sm font-medium", blocking.length ? "text-rose-700" : "text-amber-800")}>
            {blocking.length ? t("issue.titleBlock", { count: blocking.length }) : t("issue.titleWarn", { count: issues.length })}
          </p>
          <ul className="space-y-1.5">
            {issues.map((issue, index) => (
              <li key={`${issue.kind}-${index}`} className="flex items-start gap-2 text-sm">
                {issue.level === "block" ? (
                  <CircleX size={15} className="mt-0.5 shrink-0 text-rose-600" aria-hidden />
                ) : (
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                )}
                <span className="min-w-0 flex-1 text-[#3F3F46]">{issueText(issue)}</span>
                <button type="button" onClick={() => jump(issue)} className="shrink-0 cursor-pointer text-xs font-medium text-[#09090B] underline-offset-2 hover:underline">
                  {t("issue.go")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Điểm ngắt theo bề rộng vùng nội dung (khung admin có thêm cột phải) */}
      <div className="@container">
        <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="@container min-w-0 space-y-5">
            <div role="tablist" aria-label={t("tabsLabel")} className="flex gap-1 border-b border-[#E4E4E7]">
              {(
                [
                  ["shipping", Truck],
                  ["payment", CreditCard],
                ] as const
              ).map(([value, Icon]) => {
                const count = tabIssues(value).length;
                const hasBlock = tabIssues(value).some((issue) => issue.level === "block");
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    onClick={() => setTab(value)}
                    className={cn(
                      "-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-body transition-colors sm:px-4",
                      tab === value ? "border-[#18181B] font-semibold text-[#09090B]" : "border-transparent text-[#71717A] hover:text-[#09090B]"
                    )}
                  >
                    <Icon size={16} aria-hidden />
                    {t(`tab.${value}`)}
                    {count > 0 && (
                      <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-2xs text-white", hasBlock ? "bg-rose-600" : "bg-amber-500")}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {tab === "shipping" ? <ShippingTab settings={settings} provinces={data.provinces} update={update} /> : <PaymentTab data={data} settings={settings} update={update} />}
          </div>

          <OrderSimulator settings={settings} provinces={data.provinces} now={data.now} className="@5xl:sticky @5xl:top-6" />
        </div>
      </div>

      <p className="px-1 text-xs text-[#A1A1AA]">{t("mockNote")}</p>

      {/* Thanh lưu: chỉ hiện khi có thay đổi, dính đáy vùng nội dung */}
      {dirty && (
        <div className="sticky bottom-4 z-20">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3 rounded-2xl border border-[#E4E4E7] bg-white/95 px-4 py-3 shadow-[0_16px_40px_-20px_rgba(9,9,11,0.45)] backdrop-blur">
            <span className="mr-auto text-sm text-[#3F3F46]">
              {blocking.length ? <span className="text-rose-700">{t("bar.blocked", { count: blocking.length })}</span> : t("bar.unsaved")}
            </span>
            <button type="button" onClick={() => setSettings(saved)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
              {t("bar.discard")}
            </button>
            <button type="button" onClick={save} disabled={blocking.length > 0} className={ADMIN_PRIMARY_BUTTON_CLASS}>
              {t("bar.save")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
